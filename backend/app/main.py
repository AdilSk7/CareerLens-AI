import os
import json
import asyncio
import uuid
import shutil
from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import Dict, Any

from app.core.security import verify_token
from app.services.pdf_service import extract_text_from_pdf_path
from app.services.ai_service import (
    analyze_resume_text, analyze_job_match,
    generate_interview_question, evaluate_interview_answer,
    generate_cover_letter, generate_career_roadmap, generate_project_recommendations,
    chat_with_resume_context, analyze_skill_gaps, tailor_resume_for_job
)
from app.services.document_parser import extract_job_description
from app.schemas.ai_schemas import (
    JobMatchRequest, InterviewQuestionRequest, InterviewEvaluationRequest,
    CoverLetterRequest, RoadmapRequest, ProjectRequest, ChatRequest,
    ApplicationCreate, ApplicationUpdate
)
from datetime import datetime
import firebase_admin
from firebase_admin import credentials, firestore as admin_firestore

app = FastAPI(title="CareerLens AI Backend")

import re as _re

# Read allowed origin from environment variable (set on Render)
# Falls back to localhost for local development
_frontend_url = os.environ.get("FRONTEND_URL", "")
_allowed_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]
if _frontend_url:
    _allowed_origins.append(_frontend_url)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        os.environ.get("FRONTEND_URL", ""),
    ],
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure uploads directory exists
UPLOAD_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Mount static files for viewing PDFs
app.mount("/api/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

@app.get("/api/health")
def health_check():
    return {"status": "healthy"}

@app.post("/api/resume/process")
async def process_resume(request: Request, file: UploadFile = File(...), token_data: dict = Depends(verify_token)):
    user_id = token_data.get("uid")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid User ID in token")

    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")

    # Read file to check size
    content = await file.read()
    max_size_bytes = 5 * 1024 * 1024
    if len(content) > max_size_bytes:
        raise HTTPException(status_code=400, detail="File too large. Maximum size is 5MB.")

    # Create user-specific upload directory
    user_upload_dir = os.path.join(UPLOAD_DIR, user_id)
    os.makedirs(user_upload_dir, exist_ok=True)

    # Save file locally
    safe_filename = f"{int(datetime.now().timestamp())}_{file.filename}"
    file_path = os.path.join(user_upload_dir, safe_filename)
    
    with open(file_path, "wb") as f:
        f.write(content)

    # Generate local URL bridging to our static mount
    # Frontend uses this to render the externalLink button
    base_url = str(request.base_url).rstrip("/")
    local_url = f"{base_url}/api/uploads/{user_id}/{safe_filename}"

    try:
        # Extract text using local pdf path
        extracted_text = await extract_text_from_pdf_path(file_path)
        
        # Store metadata in Firestore
        try:
            db = admin_firestore.client()
            resume_data = {
                "userId": user_id,
                "fileName": file.filename,
                "fileUrl": local_url,  # Local backend link
                "fileSize": len(content),
                "uploadedAt": datetime.utcnow().isoformat() + "Z",
                "status": "processed",
                "extractionLength": len(extracted_text)
            }
            
            doc_ref = db.collection("resumes").document()
            resume_data["id"] = doc_ref.id
            doc_ref.set(resume_data)
            
            return {"status": "success", "data": resume_data}
            
        except Exception as db_e:
            print(f"Firestore Error: {db_e}")
            raise HTTPException(status_code=500, detail="Failed to save resume metadata to database.")
            
    except ValueError as ve:
        # Clean up corrupted file
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        print(f"Unknown processing error: {e}")
        raise HTTPException(status_code=500, detail="An internal error occurred during processing.")

@app.post("/api/job-description/extract")
async def extract_jd_file(file: UploadFile = File(...), token_data: dict = Depends(verify_token)):
    user_id = token_data.get("uid")
    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")
        
    # Allowed extensions validation
    allowed_exts = ['.pdf', '.docx', '.pptx', '.txt']
    ext = os.path.splitext(file.filename.lower())[1]
    if ext not in allowed_exts:
        raise HTTPException(status_code=400, detail=f"Unsupported file type. Allowed: {', '.join(allowed_exts)}")
        
    # Size check (10MB)
    content = await file.read()
    if len(content) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large. Maximum size is 10MB.")
        
    user_upload_dir = os.path.join(UPLOAD_DIR, user_id)
    os.makedirs(user_upload_dir, exist_ok=True)
    temp_path = os.path.join(user_upload_dir, f"jdtemp_{int(datetime.now().timestamp())}{ext}")
    
    with open(temp_path, "wb") as f:
        f.write(content)
        
    try:
        extraction_result = await extract_job_description(temp_path, file.filename)
        return {"status": "success", "data": extraction_result}
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        print(f"Extraction error: {e}")
        raise HTTPException(status_code=500, detail="An internal error occurred during extraction.")
    finally:
        # Cleanup temp JD file
        if os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except:
                pass

@app.post("/api/resume/{doc_id}/analyze")
async def analyze_resume(doc_id: str, token_data: dict = Depends(verify_token)):
    user_id = token_data.get("uid")
    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")
        
    db = admin_firestore.client()
    doc_ref = db.collection("resumes").document(doc_id)
    doc_snap = doc_ref.get()
    
    if not doc_snap.exists:
        raise HTTPException(status_code=404, detail="Resume not found")
        
    data = doc_snap.to_dict()
    if data.get("userId") != user_id:
        raise HTTPException(status_code=403, detail="Forbidden")
        
    # Find local file
    file_url = data.get("fileUrl", "")
    if "/api/uploads/" in file_url:
        relative_path = file_url.split("/api/uploads/")[-1]
    else:
        raise HTTPException(status_code=400, detail="Invalid file URL format.")
    local_target = os.path.join(UPLOAD_DIR, os.path.normpath(relative_path))
    
    if not os.path.exists(local_target):
        raise HTTPException(status_code=404, detail="Local PDF file not found to analyze.")
        
    try:
        # Re-extract text (fast local operation)
        text = await extract_text_from_pdf_path(local_target)
        if not text.strip():
            raise HTTPException(status_code=400, detail="Could not extract text from PDF.")
            
        # Run via LLM provider (configured in .env)
        analysis_data = await analyze_resume_text(text)
        
        # Save analysis to existing document
        doc_ref.update({
            "analysis": analysis_data,
            "status": "analyzed"
        })
        
        # Merge updated data in response
        data["analysis"] = analysis_data
        data["status"] = "analyzed"
        
        return {"status": "success", "data": data}
        
    except Exception as e:
        print(f"Error during AI analysis pipeline: {e}")
        doc_ref.update({"status": "failed_analysis"})
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

@app.post("/api/resume/{doc_id}/match")
async def match_resume_to_job(doc_id: str, request: JobMatchRequest, token_data: dict = Depends(verify_token)):
    user_id = token_data.get("uid")
    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")
        
    db = admin_firestore.client()
    doc_ref = db.collection("resumes").document(doc_id)
    doc_snap = doc_ref.get()
    
    if not doc_snap.exists:
        raise HTTPException(status_code=404, detail="Resume not found")
        
    data = doc_snap.to_dict()
    if data.get("userId") != user_id:
        raise HTTPException(status_code=403, detail="Forbidden")
        
    if "analysis" not in data:
        raise HTTPException(status_code=400, detail="Resume must be analyzed by AI before matching against a job.")
        
    try:
        match_result = await analyze_job_match(data["analysis"], request.job_description)
        return {"status": "success", "data": match_result}
    except Exception as e:
        print(f"Error during job matching: {e}")
        raise HTTPException(status_code=500, detail=f"Job matching failed: {str(e)}")

@app.post("/api/resume/{doc_id}/interview/question")
async def get_interview_question(doc_id: str, request: InterviewQuestionRequest, token_data: dict = Depends(verify_token)):
    user_id = token_data.get("uid")
    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")
        
    db = admin_firestore.client()
    doc_ref = db.collection("resumes").document(doc_id)
    doc_snap = doc_ref.get()
    
    if not doc_snap.exists:
        raise HTTPException(status_code=404, detail="Resume not found")
        
    data = doc_snap.to_dict()
    if data.get("userId") != user_id:
        raise HTTPException(status_code=403, detail="Forbidden")
        
    if "analysis" not in data:
        raise HTTPException(status_code=400, detail="Resume must be analyzed by AI first.")
        
    try:
        question = await generate_interview_question(
            resume_analysis_dict=data["analysis"],
            job_desc=request.job_description,
            mode=request.mode,
            history=request.question_history
        )
        return {"status": "success", "data": {"question": question}}
    except Exception as e:
        print(f"Error generating question: {e}")
        raise HTTPException(status_code=500, detail=f"Question generation failed: {str(e)}")

@app.post("/api/resume/{doc_id}/interview/evaluate")
async def evaluate_answer(doc_id: str, request: InterviewEvaluationRequest, token_data: dict = Depends(verify_token)):
    user_id = token_data.get("uid")
    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")
        
    db = admin_firestore.client()
    doc_ref = db.collection("resumes").document(doc_id)
    doc_snap = doc_ref.get()
    
    if not doc_snap.exists:
        raise HTTPException(status_code=404, detail="Resume not found")
        
    data = doc_snap.to_dict()
    if data.get("userId") != user_id:
        raise HTTPException(status_code=403, detail="Forbidden")
        
    if "analysis" not in data:
        raise HTTPException(status_code=400, detail="Resume must be analyzed by AI first.")
        
    try:
        evaluation = await evaluate_interview_answer(
            resume_analysis_dict=data["analysis"],
            job_desc=request.job_description,
            question=request.question,
            transcript=request.transcript
        )
        return {"status": "success", "data": evaluation}
    except Exception as e:
        print(f"Error evaluating answer: {e}")
        raise HTTPException(status_code=500, detail=f"Answer evaluation failed: {str(e)}")

@app.get("/api/resumes")
async def get_resumes(token_data: dict = Depends(verify_token)):
    user_id = token_data.get("uid")
    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")
        
    try:
        db = admin_firestore.client()
        docs = db.collection("resumes").where("userId", "==", user_id).stream()
        
        results = []
        for doc in docs:
            item = doc.to_dict()
            item["id"] = doc.id
            results.append(item)
            
        return {"status": "success", "data": results}
    except Exception as e:
        print(f"Error fetching resumes: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch resumes")

@app.delete("/api/resume/{doc_id}")
async def delete_resume(doc_id: str, token_data: dict = Depends(verify_token)):
    user_id = token_data.get("uid")
    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")
        
    db = admin_firestore.client()
    doc_ref = db.collection("resumes").document(doc_id)
    doc_snap = doc_ref.get()
    
    if not doc_snap.exists:
        raise HTTPException(status_code=404, detail="Resume not found")
        
    data = doc_snap.to_dict()
    if data.get("userId") != user_id:
        raise HTTPException(status_code=403, detail="Forbidden")
        
    # Delete from Firestore
    doc_ref.delete()
    
    # Try to delete local file
    file_url = data.get("fileUrl", "")
    if "/api/uploads/" in file_url:
        relative_path = file_url.split("/api/uploads/")[-1]
        local_target = os.path.join(UPLOAD_DIR, os.path.normpath(relative_path))
        if os.path.exists(local_target) and user_id in local_target:
            try:
                os.remove(local_target)
            except Exception as e:
                print(f"Failed to delete local file: {e}")
                
    return {"status": "success"}

@app.post("/api/resume/{resume_id}/cover-letter")
async def api_generate_cover_letter(
    resume_id: str,
    req: CoverLetterRequest,
    token_data: dict = Depends(verify_token)
):
    user_id = token_data.get("uid")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token")

    try:
        db = admin_firestore.client()
        resume_ref = db.collection("resumes").document(resume_id)
        doc = resume_ref.get()
        
        if not doc.exists:
            raise HTTPException(status_code=404, detail="Resume not found")
        
        doc_data = doc.to_dict()
        if doc_data.get("userId") != user_id:
            raise HTTPException(status_code=403, detail="Not authorized to access this resume")
            
        analysis = doc_data.get("analysis")
        if not analysis:
            raise HTTPException(status_code=400, detail="Resume analysis missing. Analyze the resume first.")

        # Generate cover letter
        cover_letter = await generate_cover_letter(
            resume_analysis_dict=analysis,
            job_desc=req.job_description,
            company_name=req.company_name,
            job_title=req.job_title,
            tone=req.tone
        )
        
        return {"status": "success", "data": {"cover_letter": cover_letter}}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error generating cover letter: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/resume/{resume_id}/roadmap")
async def api_generate_roadmap(
    resume_id: str,
    req: RoadmapRequest,
    token_data: dict = Depends(verify_token)
):
    user_id = token_data.get("uid")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token")

    try:
        db = admin_firestore.client()
        resume_ref = db.collection("resumes").document(resume_id)
        doc = resume_ref.get()
        
        if not doc.exists:
            raise HTTPException(status_code=404, detail="Resume not found")
        
        doc_data = doc.to_dict()
        if doc_data.get("userId") != user_id:
            raise HTTPException(status_code=403, detail="Not authorized to access this resume")
            
        analysis = doc_data.get("analysis")
        if not analysis:
            raise HTTPException(status_code=400, detail="Resume analysis missing. Analyze the resume first.")

        # 1. Extract unified skill gaps
        gaps_analysis = await analyze_skill_gaps(
            resume_analysis_dict=analysis,
            target_role=req.target_role
        )
        skill_gaps = gaps_analysis.get("missing_skills", [])

        # 2. Generate custom roadmap addressing those gaps
        roadmap_data = await generate_career_roadmap(
            target_role=req.target_role,
            timeframe=req.timeframe,
            skill_gaps=skill_gaps
        )
        
        # 2b. Transform the simple string actions into trackable tasks with UUIDs
        if "milestones" in roadmap_data:
            for m in roadmap_data["milestones"]:
                m["milestone_id"] = str(uuid.uuid4())
                old_actions = m.get("actions", [])
                
                tasks = []
                for action in old_actions:
                    tasks.append({
                        "task_id": str(uuid.uuid4()),
                        "description": action,
                        "completed": False,
                        "completed_at": None
                    })
                m["tasks"] = tasks
                # Optionally keep "actions" roughly as string format or delete it
                if "actions" in m:
                    del m["actions"]
        
        # 3. Add gaps back into the response payload so UI can render them
        roadmap_data["skill_gaps"] = skill_gaps
        
        # 4. Save to Firestore for chat integration
        resume_ref.update({
            "target_role": req.target_role,
            "skill_gaps": skill_gaps,
            "roadmap": roadmap_data
        })
        
        return {"status": "success", "data": roadmap_data}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error generating roadmap: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

class TaskUpdateRequest(BaseModel):
    completed: bool

@app.patch("/api/resume/{resume_id}/roadmap/tasks/{task_id}")
async def update_roadmap_task(
    resume_id: str,
    task_id: str,
    req: TaskUpdateRequest,
    token_data: dict = Depends(verify_token)
):
    user_id = token_data.get("uid")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token")

    try:
        db = admin_firestore.client()
        resume_ref = db.collection("resumes").document(resume_id)
        doc = resume_ref.get()
        
        if not doc.exists:
            raise HTTPException(status_code=404, detail="Resume not found")
            
        doc_data = doc.to_dict()
        if doc_data.get("userId") != user_id:
            raise HTTPException(status_code=403, detail="Not authorized to access this resume")
            
        roadmap = doc_data.get("roadmap")
        if not roadmap or "milestones" not in roadmap:
            raise HTTPException(status_code=404, detail="Roadmap not found")
            
        task_found = False
        for m in roadmap.get("milestones", []):
            for t in m.get("tasks", []):
                if t.get("task_id") == task_id:
                    t["completed"] = req.completed
                    t["completed_at"] = datetime.utcnow().isoformat() if req.completed else None
                    task_found = True
                    break
            if task_found:
                break
                
        if not task_found:
            raise HTTPException(status_code=404, detail="Task not found in roadmap")
            
        resume_ref.update({"roadmap": roadmap})
        return {"status": "success", "task_id": task_id, "completed": req.completed}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error updating roadmap task: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/resume/{resume_id}/projects")
async def api_generate_projects(
    resume_id: str,
    req: ProjectRequest,
    token_data: dict = Depends(verify_token)
):
    user_id = token_data.get("uid")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token")

    try:
        db = admin_firestore.client()
        resume_ref = db.collection("resumes").document(resume_id)
        doc = resume_ref.get()
        
        if not doc.exists:
            raise HTTPException(status_code=404, detail="Resume not found")
        
        doc_data = doc.to_dict()
        if doc_data.get("userId") != user_id:
            raise HTTPException(status_code=403, detail="Not authorized to access this resume")
            
        analysis = doc_data.get("analysis")
        if not analysis:
            raise HTTPException(status_code=400, detail="Resume analysis missing. Analyze the resume first.")

        # 1. Extract unified skill gaps
        gaps_analysis = await analyze_skill_gaps(
            resume_analysis_dict=analysis,
            target_role=req.target_domain
        )
        skill_gaps = gaps_analysis.get("missing_skills", [])

        # 2. Recommend progressive projects based on gaps
        projects_data = await generate_project_recommendations(
            target_domain=req.target_domain,
            skill_gaps=skill_gaps
        )
        
        # 3. Pass skill gaps back for UI
        projects_data["skill_gaps"] = skill_gaps
        
        # 4. Save to Firestore for chat integration
        resume_ref.update({
            "target_role": req.target_domain,
            "skill_gaps": skill_gaps,
            "recommended_projects": projects_data
        })
        
        return {"status": "success", "data": projects_data}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error generating projects: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/resume/{resume_id}/chat")
async def api_chat_with_coach(
    resume_id: str,
    req: ChatRequest,
    token_data: dict = Depends(verify_token)
):
    user_id = token_data.get("uid")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token")

    try:
        db = admin_firestore.client()
        resume_ref = db.collection("resumes").document(resume_id)
        doc = resume_ref.get()
        
        if not doc.exists:
            raise HTTPException(status_code=404, detail="Resume not found")
        
        doc_data = doc.to_dict()
        if doc_data.get("userId") != user_id:
            raise HTTPException(status_code=403, detail="Not authorized to access this resume")
            
        analysis = doc_data.get("analysis")
        if not analysis:
            raise HTTPException(status_code=400, detail="Resume analysis missing. Analyze the resume first.")

        # 1. Fetch History from subcollection
        chat_ref = resume_ref.collection("chats")
        history_docs = chat_ref.order_by("timestamp").limit(20).stream()
        
        history = []
        for h in history_docs:
            d = h.to_dict()
            history.append({
                "role": d.get("role"),
                "content": d.get("content")
            })

        # 2. Add current user message to db immediately
        user_msg = {
            "role": "user",
            "content": req.message,
            "timestamp": datetime.utcnow().timestamp()
        }
        chat_ref.add(user_msg)

        # 3. Construct unified career profile from DB document
        
        # Fetch applications to hydrate chat profile
        apps_docs = db.collection("users").document(user_id).collection("applications").limit(10).stream()
        tracked_apps = [doc.to_dict() for doc in apps_docs]

        career_profile = {
            "resume_skills": analysis.get("technical_skills", []) + analysis.get("programming_languages", []) + analysis.get("frameworks", []),
            "projects": [p.get("name") for p in analysis.get("projects", [])],
            "education": [e.get("degree") for e in analysis.get("education", [])],
            "certifications": analysis.get("certifications", []),
            "target_role": doc_data.get("target_role", "Not specified yet"),
            "skill_gaps": doc_data.get("skill_gaps", []),
            "roadmap": doc_data.get("roadmap", None),
            "recommended_projects": doc_data.get("recommended_projects", None),
            "applications": tracked_apps
        }

        # 4. Generate Reply
        reply_text = await chat_with_resume_context(
            career_profile=career_profile,
            message_history=history,
            current_message=req.message
        )
        
        # 5. Save AI reply to db
        ai_msg = {
            "role": "assistant",
            "content": reply_text,
            "timestamp": datetime.utcnow().timestamp()
        }
        chat_ref.add(ai_msg)

        return {"status": "success", "data": {"reply": reply_text}}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error executing chat: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/resume/{resume_id}/chat")
async def api_get_chat_history(
    resume_id: str,
    token_data: dict = Depends(verify_token)
):
    user_id = token_data.get("uid")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token")
        
    try:
        db = admin_firestore.client()
        resume_ref = db.collection("resumes").document(resume_id)
        doc = resume_ref.get()
        
        if not doc.exists or doc.to_dict().get("userId") != user_id:
            raise HTTPException(status_code=403, detail="Forbidden")
            
        chat_ref = resume_ref.collection("chats").order_by("timestamp").stream()
        
        history = []
        for h in chat_ref:
            h_data = h.to_dict()
            h_data["id"] = h.id
            history.append(h_data)
            
        return {"status": "success", "data": history}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ==========================================
# APPLICATIONS ENDPOINTS (PHASE 9)
# ==========================================

@app.post("/api/applications")
async def create_application(req: ApplicationCreate, token_data: dict = Depends(verify_token)):
    user_id = token_data.get("uid")
    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    db = admin_firestore.client()
    doc_ref = db.collection("users").document(user_id).collection("applications").document()
    
    app_data = req.model_dump()
    app_data["createdAt"] = datetime.utcnow().isoformat() + "Z"
    app_data["updatedAt"] = app_data["createdAt"]
    app_data["id"] = doc_ref.id
    
    doc_ref.set(app_data)
    return {"status": "success", "data": app_data}

@app.get("/api/applications")
async def get_applications(token_data: dict = Depends(verify_token)):
    user_id = token_data.get("uid")
    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")
        
    db = admin_firestore.client()
    docs = db.collection("users").document(user_id).collection("applications").order_by("createdAt", direction=admin_firestore.Query.DESCENDING).stream()
    
    results = [doc.to_dict() for doc in docs]
    return {"status": "success", "data": results}

@app.put("/api/applications/{app_id}")
async def update_application(app_id: str, req: ApplicationUpdate, token_data: dict = Depends(verify_token)):
    user_id = token_data.get("uid")
    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")
        
    db = admin_firestore.client()
    doc_ref = db.collection("users").document(user_id).collection("applications").document(app_id)
    doc = doc_ref.get()
    
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Application not found")
        
    update_data = {k: v for k, v in req.model_dump().items() if v is not None}
    update_data["updatedAt"] = datetime.utcnow().isoformat() + "Z"
    
    doc_ref.update(update_data)
    
    updated_doc = doc_ref.get().to_dict()
    return {"status": "success", "data": updated_doc}

@app.delete("/api/applications/{app_id}")
async def delete_application(app_id: str, token_data: dict = Depends(verify_token)):
    user_id = token_data.get("uid")
    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")
        
    db = admin_firestore.client()
    doc_ref = db.collection("users").document(user_id).collection("applications").document(app_id)
    doc = doc_ref.get()
    
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Application not found")
        
    doc_ref.delete()
    return {"status": "success"}

@app.post("/api/applications/{app_id}/tailor-resume")
async def api_tailor_resume(app_id: str, token_data: dict = Depends(verify_token)):
    user_id = token_data.get("uid")
    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")
        
    db = admin_firestore.client()
    app_ref = db.collection("users").document(user_id).collection("applications").document(app_id)
    app_doc = app_ref.get()
    
    if not app_doc.exists:
        raise HTTPException(status_code=404, detail="Application not found")
        
    app_data = app_doc.to_dict()
    if not app_data.get("resume_id"):
        raise HTTPException(status_code=400, detail="No resume selected for this application")
        
    resume_ref = db.collection("resumes").document(app_data.get("resume_id"))
    resume_doc = resume_ref.get()
    
    if not resume_doc.exists or resume_doc.to_dict().get("userId") != user_id:
        raise HTTPException(status_code=400, detail="Selected resume not found or unauthorized")
        
    resume_data = resume_doc.to_dict()
    analysis = resume_data.get("analysis")
    if not analysis:
        raise HTTPException(status_code=400, detail="Resume has not been analyzed yet")
        
    # Phase 8 unified context
    career_profile = {
        "skill_gaps": resume_data.get("skill_gaps", [])
    }
    
    tailored_result = await tailor_resume_for_job(
        resume_analysis_dict=analysis,
        job_title=app_data.get("job_title", ""),
        job_description=app_data.get("job_description", ""),
        career_profile=career_profile
    )
    
    # Save the tailored result directly into the application document
    app_ref.update({
        "tailored_resume_data": tailored_result,
        "updatedAt": datetime.utcnow().isoformat() + "Z"
    })
    
    return {"status": "success", "data": tailored_result}



# ==========================================
# PHASE 10: ANALYTICS ENDPOINTS
# ==========================================
@app.get("/api/analytics/overview")
async def get_analytics_overview(token_data: dict = Depends(verify_token)):
    user_id = token_data.get("uid")
    if not user_id:
         raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid User ID")
    
    db = admin_firestore.client()
    
    # 1. Get Applications
    apps_stream = db.collection("users").document(user_id).collection("applications").stream()
    apps = [doc.to_dict() for doc in apps_stream]
    total_apps = len(apps)
    
    offers = len([app for app in apps if str(app.get("status", "")).lower() == "offer"])
    job_interviews = len([app for app in apps if str(app.get("status", "")).lower() in ["interviewing", "offer", "rejected (interview)"]])
    rejections = len([app for app in apps if "reject" in str(app.get("status", "")).lower()])
    
    # 2. Get Mock Interviews
    mock_sessions_stream = db.collection("interviewSessions").where("userId", "==", user_id).stream()
    mock_sessions = [doc.to_dict() for doc in mock_sessions_stream]
    total_mock_sessions = len(mock_sessions)
    
    # 3. Calculation
    app_to_interview_rate = "N/A"
    if total_apps > 0:
        c = round((job_interviews / total_apps * 100), 1)
        if c.is_integer(): c = int(c)
        app_to_interview_rate = f"{c}%"
        
    app_to_offer_rate = "N/A"
    if total_apps > 0:
        c = round((offers / total_apps * 100), 1)
        if c.is_integer(): c = int(c)
        app_to_offer_rate = f"{c}%"
        
    interview_to_offer_rate = "N/A"
    if job_interviews > 0:
        c = round((offers / job_interviews * 100), 1)
        if c.is_integer(): c = int(c)
        interview_to_offer_rate = f"{c}%"
    
    # avg mock score
    avg_mock_score = 0
    if total_mock_sessions > 0:
        avg_mock_score = round(sum(i.get("averageScore", 0) for i in mock_sessions) / total_mock_sessions, 1)

    return {
        "status": "success",
        "data": {
            "applications": total_apps,
            "mockSessions": total_mock_sessions,
            "jobInterviews": job_interviews,
            "offers": offers,
            "rejections": rejections,
            "appToInterviewConversion": app_to_interview_rate,
            "appToOfferConversion": app_to_offer_rate,
            "interviewToOfferConversion": interview_to_offer_rate,
            "averageMockScore": avg_mock_score if total_mock_sessions > 0 else "N/A"
        }
    }

@app.get("/api/analytics/progress")
async def get_analytics_progress(token_data: dict = Depends(verify_token)):
    user_id = token_data.get("uid")
    if not user_id:
         raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid User ID")
         
    db = admin_firestore.client()
    
    # 1. Fetch Resumes for ATS Score & Shared Context
    resumes_stream = db.collection("resumes").where("userId", "==", user_id).stream()
    resumes = [doc.to_dict() | {"id": doc.id} for doc in resumes_stream]
    resumes.sort(key=lambda x: x.get("uploadedAt", "")) # sorted oldest to newest
    
    ats_progress = []
    for idx, r in enumerate(resumes):
        if "analysis" in r and r["analysis"] and r["analysis"].get("overall_score") is not None:
            analysis = r["analysis"]
            score = analysis.get("overall_score")
            ats_progress.append({
                "name": f"Ver {len(ats_progress)+1}",
                "atsScore": score,
                "date": str(r.get("uploadedAt", "")).split("T")[0] if "T" in str(r.get("uploadedAt", "")) else ""
            })
            
    current_ats = ats_progress[-1]["atsScore"] if ats_progress else None
    previous_ats = ats_progress[-2]["atsScore"] if len(ats_progress) > 1 else None
    ats_improvement = (current_ats - previous_ats) if current_ats is not None and previous_ats is not None else None
    
    # 2. Extract Master Shared Career Context from Resumes (Newest first)
    skill_gaps = []
    target_role = None
    roadmap_progress = None
    
    for r in reversed(resumes): # search newest to oldest
        if "target_role" in r and r["target_role"]:
            target_role = r["target_role"]
            
            if "skill_gaps" in r:
                missing = r.get("skill_gaps", [])
                
                for s in missing:
                    if isinstance(s, dict):
                        status_val = s.get("status", "Missing / To Learn")
                        skill_gaps.append({
                            "name": s.get("skill", s.get("name", str(s))),
                            "status": status_val.title() if isinstance(status_val, str) else "Missing / To Learn",
                            "progress": s.get("progress")
                        })
                    else:
                        skill_gaps.append({"name": str(s), "status": "Missing / To Learn", "progress": None})
                    
            if "roadmap" in r and r["roadmap"]:
                roadmap = r.get("roadmap", {})
                milestones = roadmap.get("milestones", [])
                
                total_tasks = 0
                completed_tasks = 0
                months_progress = []
                
                for m_idx, m in enumerate(milestones):
                    tasks = m.get("tasks", [])
                    total_m_tasks = len(tasks)
                    comp_m_tasks = sum(1 for t in tasks if t.get("completed"))
                    
                    total_tasks += total_m_tasks
                    completed_tasks += comp_m_tasks
                    
                    m_pct = round((comp_m_tasks / total_m_tasks * 100)) if total_m_tasks > 0 else 0
                    months_progress.append({
                        "name": m.get("phase", f"Phase {m_idx + 1}"),
                        "total": total_m_tasks,
                        "completed": comp_m_tasks,
                        "percentage": m_pct
                    })
                
                if total_tasks > 0:
                    c_pct = round((completed_tasks / total_tasks * 100))
                    roadmap_progress = {
                        "total": total_tasks,
                        "completed": completed_tasks,
                        "percentage": c_pct,
                        "months": months_progress
                    }
                    
            break # Stop at the first valid context found

    # 3. Interview Score Progression
    interviews_stream = db.collection("interviewSessions").where("userId", "==", user_id).stream()
    interviews = [doc.to_dict() | {"id": doc.id} for doc in interviews_stream]
    interviews.sort(key=lambda x: x.get("completedAt", ""))
    
    interview_progress = []
    for i, intv in enumerate(interviews):
        interview_progress.append({
            "name": f"Mock #{i+1}",
            "score": intv.get("averageScore", 0),
            "date": str(intv.get("completedAt", "")).split("T")[0] if "T" in str(intv.get("completedAt", "")) else ""
        })
                
    return {
        "status": "success",
        "data": {
            "atsProgress": ats_progress,
            "interviewProgress": interview_progress,
            "skillGaps": skill_gaps,
            "targetRole": target_role,
            "roadmapProgress": roadmap_progress,
            "currentAts": current_ats,
            "previousAts": previous_ats,
            "atsImprovement": ats_improvement
        }
    }

class AnalyticsInsightsRequest(BaseModel):
    metrics: dict

@app.post("/api/analytics/ai-insights")
async def generate_analytics_insights(request: AnalyticsInsightsRequest, token_data: dict = Depends(verify_token)):
    user_id = token_data.get("uid")
    if not user_id:
         raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid User ID")
         
    metrics = request.metrics
    from app.services.llm_client import call_llm
    
    prompt = f"""
    You are an expert AI Career Coach. 
    Analyze the following deterministic metrics generated about the user's career application process:
    {metrics}
    
    Important Constraints:
    - Return a JSON object with exactly two keys: "insight" and "next_actions".
    - "insight": A 3-sentence paragraph describing their strongest area and biggest opportunity based on data.
    - "next_actions": A list of 5 string actionable recommendations (e.g., "Apply to more X", "Practice Y").
    - DO NOT invent any metrics, fake numbers, or fake skills. Use their actual data.
    - DISTINGUISH BETWEEN `jobInterviews` and `mockSessions`. Never mistake mock sessions for real job interviews.
    - If `jobInterviews` is 0 but `mockSessions` > 0, tell them they are preparing well but need to get real interviews.
    - If they have very few applications or interviews (e.g. less than 5), explicitly state in the insight that the sample size is currently small so this should not yet be treated as a reliable long-term trend, but still offer guidance.
    - If they have 0 applications, tell them to start applying.
    - Focus heavily on their actual Target Role and documented Skill Gaps if present.
    """
    
    try:
        response_text = await call_llm(prompt, "You are a direct data analyzer. Return only pure JSON in the requested format.")
        import json
        if "```" in response_text:
            response_text = response_text.replace("```json", "").replace("```", "").strip()
        result = json.loads(response_text)
        return {"status": "success", "data": result}
    except Exception as e:
        print(f"Error generating AI Insights: {e}")
        return {"status": "success", "data": {"insight": "Keep applying and practicing to unlock more insights. AI Insights are currently unavailable.", "next_actions": ["Upload a new resume", "Add a new application"]}}
