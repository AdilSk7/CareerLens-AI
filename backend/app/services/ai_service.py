"""
ai_service.py — CareerLens AI business logic.

All prompt construction, Pydantic validation, and deterministic scoring live here.
Provider-specific HTTP calls are delegated to llm_client.call_llm().

NOTE: We do NOT inject model_json_schema() into prompts because the $defs/$ref
      structure it generates confuses many LLMs. Instead we embed clean hand-written
      JSON examples so the model knows exactly what shape to return.
"""

import json
from fastapi import HTTPException
from app.schemas.ai_schemas import (
    ResumeAnalysis, JobMatchAnalysis,
    InterviewQuestionResponse, InterviewEvaluationResponse,
    CoverLetterResponse, RoadmapResponse, ProjectRecommendationsResponse, ChatResponse,
    SkillGapAnalysis, TailoredResumeResponse
)
from app.services.llm_client import call_llm


def _slim_resume(r: dict) -> dict:
    """Return only the fields the interviewer actually needs.
    Strips large sections (education details, extracurriculars, category_scores, etc.)
    to keep prompt size within the model's safe JSON-mode context window.
    """
    return {
        "programming_languages": r.get("programming_languages", []),
        "frameworks":            r.get("frameworks", []),
        "tools":                 r.get("tools", []),
        "technical_skills":     r.get("technical_skills", []),
        "ai_ml_technologies":   r.get("ai_ml_technologies", []),
        "certifications":        r.get("certifications", []),
        "work_experience": [
            {"role": e.get("role"), "company": e.get("company"), "duration": e.get("duration"),
             "responsibilities": e.get("responsibilities", [])[:3]}
            for e in r.get("work_experience", [])[:3]
        ],
        "projects": [
            {"name": p.get("name"), "technologies": p.get("technologies", [])}
            for p in r.get("projects", [])[:4]
        ],
        "education": [
            {"degree": e.get("degree")}
            for e in r.get("education", [])
        ],
        "suggested_job_roles": r.get("suggested_job_roles", []),
    }


def _trunc(text: str, max_chars: int) -> str:
    """Hard-truncate a string to avoid token overflow."""
    return text[:max_chars] + "..." if len(text) > max_chars else text


# ── Resume Analysis ────────────────────────────────────────────────────────────

# Human-readable example so the LLM understands the required shape.
_RESUME_EXAMPLE = """{
  "professional_summary": "2-3 sentence overview of the candidate.",
  "technical_skills": ["Low-Level Design", "SOLID Principles"],
  "soft_skills": ["Communication", "Problem Solving"],
  "programming_languages": ["Python", "Java"],
  "web_technologies": ["HTML5", "CSS3", "REST APIs"],
  "frameworks": ["React.js", "Django"],
  "tools": ["Git", "Docker", "Postman"],
  "ai_ml_technologies": ["CNN", "PyTorch"],
  "certifications": ["AWS Certified Cloud Practitioner"],
  "education": [
    {"degree": "B.S. Computer Science", "institution": "MIT", "year": "2023"}
  ],
  "work_experience": [
    {
      "role": "Software Engineer Intern",
      "company": "Google",
      "duration": "Jun 2022 - Aug 2022",
      "responsibilities": ["Built REST APIs", "Improved pipeline efficiency by 30%"]
    }
  ],
  "extracurricular_activities": [
    {
      "role": "Marketing Member",
      "organization": "IEEE Club",
      "duration": "2021 - 2023",
      "description": ["Organised tech events", "Managed social media"]
    }
  ],
  "projects": [
    {
      "name": "CareerLens AI",
      "description": "AI-powered resume analysis SaaS.",
      "technologies": ["React", "FastAPI", "Firebase"]
    }
  ],
  "strengths": ["Strong Python skills", "Good project portfolio"],
  "areas_for_improvement": ["Add measurable impact to bullets"],
  "suggested_job_roles": ["Backend Engineer", "ML Engineer"],
  "category_scores": {
    "skills_score": 80,
    "experience_score": 70,
    "education_score": 85,
    "projects_score": 75,
    "keywords_score": 78,
    "formatting_score": 82
  }
}"""

async def analyze_resume_text(text: str) -> dict:
    system_instruction = (
        "You are an objective, precise, and highly analytical Applicant Tracking System (ATS).\n"
        "Your task is to analyze the provided resume text and extract the requested fields.\n\n"
        "CRITICAL INSTRUCTIONS:\n"
        "- ONLY use information explicitly present in the provided resume text.\n"
        "- NEVER invent, hallucinate, or infer any experience, education, skills, companies, or other facts.\n"
        "- Extract technologies hidden within project descriptions, work experience bullet points, "
        "certifications, and education sections.\n"
        "- STRICT CLASSIFICATION RULES:\n"
        "  - Only classify entries under professional employment/internships as Work Experience.\n"
        "  - Extracurriculars, Activities, Leadership, Clubs, and Student Organizations MUST go "
        "under extracurricular_activities.\n"
        "  - If there is no professional/paid work experience, return an empty work_experience array [].\n"
        "- Do NOT force every category to contain values, EXCEPT for 'category_scores', 'strengths', and 'areas_for_improvement'.\n"
        "- YOU MUST ALWAYS populate 'category_scores' with realistic integer scores (0-100) based on the resume quality.\n"
        "- YOU MUST ALWAYS provide at least one string in 'strengths' and 'areas_for_improvement'.\n"
        "- Output must be purely raw JSON matching the structure shown. No markdown code blocks.\n\n"
        "Return JSON matching EXACTLY this structure:\n"
        + _RESUME_EXAMPLE
    )

    prompt = f"Analyze the following resume text and return JSON:\n\n{text}"

    try:
        raw_json = await call_llm(
            prompt=prompt,
            system_instruction=system_instruction,
        )

        validated = ResumeAnalysis.model_validate_json(raw_json)
        result = validated.model_dump()

        # ── Deterministic ATS score (Python, not AI) ──────────────────────────
        scores = result.get("category_scores", {})
        result["overall_score"] = round(
            scores.get("skills_score",     0) * 0.25 +
            scores.get("experience_score", 0) * 0.20 +
            scores.get("education_score",  0) * 0.10 +
            scores.get("projects_score",   0) * 0.15 +
            scores.get("keywords_score",   0) * 0.20 +
            scores.get("formatting_score", 0) * 0.10
        )

        return result

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"AI analysis failed to process resume: {str(e)}"
        )


# ── Job Match ──────────────────────────────────────────────────────────────────

_JOB_MATCH_EXAMPLE = """{
  "required_skills": ["Python", "AWS", "REST APIs", "Docker"],
  "exact_matches": ["Python", "Docker"],
  "related_matches": ["AWS (via AWS Certified Cloud Practitioner certification)"],
  "missing_skills": ["Kubernetes"],
  "recommendations": [
    "Add Kubernetes experience through a side project.",
    "Highlight your REST API projects in the experience section."
  ]
}"""

async def analyze_job_match(resume_analysis_dict: dict, job_desc: str) -> dict:
    slim = _slim_resume(resume_analysis_dict)
    safe_jd = _trunc(job_desc, 2500) # Slightly larger limit for JD comparison

    prompt = f"""You are an expert AI recruiter evaluating a candidate's fit for a role.

CANDIDATE SKILLS & EXPERIENCE (JSON):
{json.dumps(slim, indent=2)}

TARGET JOB DESCRIPTION (key excerpt):
{safe_jd}

INSTRUCTIONS:
- Extract ALL explicitly required and strongly preferred skills/tools/technologies from the JD into "required_skills".
- Compare each required skill against the candidate's data.
- "exact_matches": Technology/skill EXPLICITLY present in BOTH the resume AND the JD (same term).
- "related_matches": Resume technology that REASONABLY satisfies a JD requirement but is not identical.
  * Examples: "AWS Certified Cloud Practitioner" satisfies "AWS"; "MongoDB" satisfies "NoSQL".
- "missing_skills": Genuinely absent from the resume, not covered by any related technology.
- "recommendations": 2-4 actionable, professional tips for the candidate.
- NEVER classify a skill as "missing" if a related technology or certification covers it.

Return ONLY valid JSON matching this structure EXACTLY:
{_JOB_MATCH_EXAMPLE}
"""

    try:
        raw_json = await call_llm(prompt=prompt)

        validated = JobMatchAnalysis.model_validate_json(raw_json)
        result = validated.model_dump()

        # ── Deterministic match % (Python, not AI) ─────────────────────────────
        required = len(result.get("required_skills", []))
        exact    = len(result.get("exact_matches",   []))
        related  = len(result.get("related_matches", []))

        if required == 0:
            pct = 100 if (exact > 0 or related > 0) else 0
        else:
            pct = round(((exact + related * 0.5) / required) * 100)

        result["match_percentage"] = min(pct, 100)
        return result

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Job match analysis failed: {str(e)}"
        )


# ── Interview Question Generation ──────────────────────────────────────────────

_QUESTION_EXAMPLE = """{
  "question": "How would you design a rate-limiting system for a high-traffic REST API?"
}"""

async def generate_interview_question(
    resume_analysis_dict: dict,
    job_desc: str,
    mode: str,
    history: list,
) -> str:
    slim = _slim_resume(resume_analysis_dict)
    prompt = f"""You are a Professional Technical Interviewer — strict but constructive.
You are conducting a '{mode}' interview.

CANDIDATE SKILLS & EXPERIENCE (JSON):
{json.dumps(slim, indent=2)}

TARGET JOB DESCRIPTION (key excerpt):
{_trunc(job_desc, 800)}

PREVIOUS QUESTIONS ASKED (do NOT repeat these):
{json.dumps(history[-6:])}

INSTRUCTIONS:
- Ask ONE realistic, challenging interview question.
- Make it completely different from all previous questions listed above.
- Technical mode: focus on architecture, coding, or technical problem solving related to their skills.
- HR/Behavioral mode: focus on conflict, leadership, agile experience, or past projects.
- Project-Based: deep-dive into a specific project from their resume.
- Mixed: choose freely.
- DO NOT include the answer. Only the question.

Return ONLY valid JSON matching this structure EXACTLY:
{_QUESTION_EXAMPLE}
"""

    try:
        raw_json = await call_llm(prompt=prompt)
        validated = InterviewQuestionResponse.model_validate_json(raw_json)
        return validated.question

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate question: {str(e)}"
        )


# ── Interview Answer Evaluation ────────────────────────────────────────────────

_EVALUATION_EXAMPLE = """{
  "scores": {
    "relevance": 7,
    "technical_accuracy": 6,
    "completeness": 5,
    "communication": 8,
    "clarity": 7
  },
  "good_points": [
    "Correctly identified REST as the API pattern.",
    "Mentioned rate limiting using token bucket algorithm."
  ],
  "missing_points": [
    "Did not mention caching strategies like Redis.",
    "No discussion of horizontal scaling."
  ],
  "better_approach": "A strong answer would describe the endpoint design, authentication via JWT, rate limiting using a sliding window or token bucket, horizontal scaling with Kubernetes, and monitoring via Prometheus + Grafana.",
  "follow_up_question": "Can you elaborate on how you would configure Redis to act as the caching layer for this system?"
}"""

async def evaluate_interview_answer(
    resume_analysis_dict: dict,
    job_desc: str,
    question: str,
    transcript: str,
) -> dict:
    slim = _slim_resume(resume_analysis_dict)
    # Truncate long inputs so we stay within the model's safe context window
    safe_transcript = _trunc(transcript, 2000)
    safe_jd        = _trunc(job_desc, 600)

    prompt = f"""You are a Professional Technical Interviewer evaluating a candidate's answer.

CANDIDATE SKILLS & EXPERIENCE (JSON):
{json.dumps(slim, indent=2)}

TARGET JOB DESCRIPTION (key excerpt):
{safe_jd}

QUESTION ASKED:
"{question}"

CANDIDATE'S ANSWER:
"{safe_transcript}"

INSTRUCTIONS:
- Score each category strictly on a scale of 0 to 10 (integers only).
- relevance: Did they actually answer the question asked?
- technical_accuracy: Were their technical claims correct?
- completeness: Did they cover edge cases and all major aspects?
- communication: Was their answer well-structured and logical?
- clarity: Was it concise and free of filler content?
- good_points: 2-4 specific things they did well.
- missing_points: 2-4 specific things they missed or got wrong.
- better_approach: One paragraph showing what a strong answer would include.
- follow_up_question: If their answer is extremely brief, missing critical components, or warrants a deeper dive based on the missing points, generate ONE challenging follow-up question here. Otherwise, return null.
- Penalize technically incorrect claims. Avoid generic praise.

Return ONLY valid JSON matching this structure EXACTLY:
{_EVALUATION_EXAMPLE}
"""

    try:
        raw_json = await call_llm(prompt=prompt)

        validated = InterviewEvaluationResponse.model_validate_json(raw_json)
        result = validated.model_dump()

        # ── Deterministic overall score (Python, not AI) ───────────────────────
        s = result["scores"]
        result["overall_score"] = round(
            0.25 * s["relevance"] +
            0.30 * s["technical_accuracy"] +
            0.20 * s["completeness"] +
            0.15 * s["communication"] +
            0.10 * s["clarity"],
            1
        )

        return result

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to evaluate answer: {str(e)}"
        )

# ── Cover Letter Generation ────────────────────────────────────────────────────

_COVER_LETTER_EXAMPLE = """{
  "cover_letter": "Dear Hiring Manager,\\n\\nI am writing to express my interest in the Software Engineer position at [Company]. With my background in Python..."
}"""

async def generate_cover_letter(
    resume_analysis_dict: dict,
    job_desc: str,
    company_name: str,
    job_title: str,
    tone: str
) -> str:
    slim = _slim_resume(resume_analysis_dict)
    safe_jd = _trunc(job_desc, 2500)

    prompt = f"""You are an Expert Career Coach and Professional Writer.
Your task is to write a highly tailored cover letter for a candidate based strictly on their resume and the target job description.

CANDIDATE SKILLS & EXPERIENCE (JSON):
{json.dumps(slim, indent=2)}

TARGET JOB / COMPANY:
Title: {job_title}
Company: {company_name}

TARGET JOB DESCRIPTION (key excerpt):
{safe_jd}

STRICT INSTRUCTIONS:
1. NO HALLUCINATION: Never invent companies, responsibilities, technologies, achievements, certifications, metrics, or years of experience. Every claim must be strictly traceable to the parsed JSON resume. DO NOT overstate experience.
2. EVIDENCE-BASED MAPPING (CRITICAL): Follow this reasoning path internally: 
   Job Description → identify exact core requirements → find matching concrete evidence (metrics/projects) from the Resume → write a concise personalized letter demonstrating alignment.
3. MEASURABLE RESULTS OVER SKILL-LISTS: Avoid simply repeating the resume's skills section. Instead, focus strictly on the 2–3 strongest achievements prioritizing measurable results (e.g., 1M+ users, 60% deployment-time reduction, 40% API performance improvement) if they appear in the resume and align with the JD.
4. NO GENERIC FLUFF: Completely avoid generic phrasing like "My technical capabilities are validated...", "I am well-prepared to contribute...", or "deep experience". 
   - BAD CONCLUSION: "With my foundation in Java, I am well-prepared to contribute..."
   - GOOD EVIDENCE CONCLUSION: "My experience building AWS-based microservices and improving application performance has prepared me to contribute to scalable cloud applications at [Company]."
5. CURRENT ROLES: Pay deep attention to the "duration" field in work experience. If a duration implies "Present" or "Current", refer to it correctly (e.g., "In my current role at X..."). If past, use "In my previous role...".
6. TONE, LENGTH & STRUCTURE: Write in a '{tone}' tone. Keep the letter strictly between **250-350 words**. 
   Format must be exactly:
   - "Dear Hiring Manager,"
   - 3-4 focused, concise paragraphs heavily grounded in evidence.
   - "Sincerely,"
7. NAME & PLACEHOLDERS: Do NOT fabricate a candidate name, even if asked. Leave your signature strictly as "Sincerely," with NO name following it. Do NOT include placeholders like [Your Name] or [Address].
8. TARGET VARIABLES: If `{company_name}` or `{job_title}` is provided, use them exactly.

Output ONLY valid JSON matching this exact structure:

{_COVER_LETTER_EXAMPLE}
"""

    try:
        raw_json = await call_llm(prompt=prompt)
        validated = CoverLetterResponse.model_validate_json(raw_json)
        return validated.cover_letter

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate cover letter: {str(e)}"
        )

# ── Unified Skill-Gap Engine (Phase 8) ──────────────────────────────────────────

_SKILL_GAP_EXAMPLE = """{
  "existing_skills": ["Java", "SQL", "HTML5", "CSS3", "JavaScript"],
  "missing_skills": [
    {
      "skill": "Spring Boot",
      "status": "missing",
      "priority": "high",
      "reason": "Core requirement for modern Java Full Stack roles",
      "prerequisites": ["Java", "REST APIs"]
    }
  ]
}"""

async def analyze_skill_gaps(
    resume_analysis_dict: dict,
    target_role: str
) -> dict:
    slim = _slim_resume(resume_analysis_dict)
    prompt = f"""You are a precise Technical Validator and Career Coach.
    
CANDIDATE SKILLS & EXPERIENCE (JSON):
{json.dumps(slim, indent=2)}

TARGET ROLE / DOMAIN: {target_role}

INSTRUCTIONS:
1. Analyze the candidate's existing skills vs the expected skills for the target role.
2. Target Role Interpretation Rule: Treat the user's selected target role as the exact career category requested, not as a specific technology stack. Do not infer a technology specialization solely from technologies already present in the resume. For broad roles, identify relevant industry-standard skill ecosystems, compare them against the candidate's existing skills, and determine the most suitable learning path. Never silently convert a broad target role into a specialized role like 'Java Backend Developer'.
3. 'existing_skills' MUST ONLY contain technologies explicitly mentioned in the resume (including within projects or experience). DO NOT invent, hallucinate, or infer skills. If it's not documented, it's missing.
4. 'missing_skills' must contain structured gaps that are expected for the role but absent from the resume. If multiple technology paths are viable, present the strongest recommended path and briefly explain why in the 'reason' field.
5. For 'missing_skills', configure a strict prerequisite chain (e.g., must learn Java before Spring Boot).

Return ONLY valid JSON matching this exact structure:
{_SKILL_GAP_EXAMPLE}
"""
    try:
        raw_json = await call_llm(prompt=prompt)
        validated = SkillGapAnalysis.model_validate_json(raw_json)
        return validated.model_dump()
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to analyze skill gaps: {str(e)}"
        )

# ── Career Roadmap Generation (Phase 8) ────────────────────────────────────────

_ROADMAP_EXAMPLE = """{
  "milestones": [
    {
      "phase": "Months 1-2",
      "focus": "Orchestration & Infrastructure",
      "actions": ["Deploy a sample Microservice to a local K8s cluster", "Read designing data intensive applications"],
      "resources": ["Kubernetes official docs", "Docker"]
    }
  ]
}"""

async def generate_career_roadmap(
    target_role: str,
    timeframe: str,
    skill_gaps: list
) -> dict:
    prompt = f"""You are an Expert Career Coach and Technical Mentor.
    
TARGET ROLE: {target_role}
DESIRED TIMEFRAME: {timeframe}

IDENTIFIED SKILL GAPS:
{json.dumps(skill_gaps, indent=2)}

INSTRUCTIONS:
1. Generate a structured chronological roadmap fitting the {timeframe} timeframe that addresses the provided skill gaps EXACTLY.
2. DO NOT teach skills the user already knows unless they are being upgraded to an advanced level.
3. The roadmap MUST have a logical progression respecting prerequisites (e.g. Month 1: foundational gaps, Month 2: intermediate, Month 3: advanced technologies).
4. Provide actionable, extremely specific milestones (e.g., "Build a React app using functional components, state, and React Router" instead of "Learn React").

Return ONLY valid JSON matching this exact structure:
{_ROADMAP_EXAMPLE}
"""
    try:
        raw_json = await call_llm(prompt=prompt)
        validated = RoadmapResponse.model_validate_json(raw_json)
        return validated.model_dump()
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate roadmap: {str(e)}"
        )

# ── Project Recommendations (Phase 8) ──────────────────────────────────────────

_PROJECT_EXAMPLE = """{
  "projects": [
    {
      "title": "Expense Tracker Dashboard",
      "difficulty": "Intermediate",
      "technologies": ["React", "FastAPI"],
      "description": "Build a responsive web app to track personal expenses.",
      "expected_outcome": "A full-stack application with user auth.",
      "portfolio_value": "Demonstrates practical knowledge to close the React gap."
    }
  ]
}"""

async def generate_project_recommendations(
    target_domain: str,
    skill_gaps: list
) -> dict:
    prompt = f"""You are an Expert Technical Mentor.
    
TARGET DOMAIN / ROLE: {target_domain}

IDENTIFIED SKILL GAPS:
{json.dumps(skill_gaps, indent=2)}

INSTRUCTIONS:
1. Recommend 2 to 3 tailored portfolio projects specifically designed to bridge the provided 'missing_skills'.
2. The project difficulty MUST be progressive based on gaps (Beginner -> Intermediate -> Advanced). Do not recommend advanced projects before foundational gaps are closed.
3. Explain exactly WHY the project is recommended (e.g. "Your resume demonstrates Java, but lacks Spring Boot and Docker. This project solves those gaps.").
4. Do NOT recommend technologies unrelated to the selected domain.

Return ONLY valid JSON matching this exact structure:
{_PROJECT_EXAMPLE}
"""
    try:
        raw_json = await call_llm(prompt=prompt)
        validated = ProjectRecommendationsResponse.model_validate_json(raw_json)
        return validated.model_dump()
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate projects: {str(e)}"
        )

# ── AI Career Coach Chat (Phase 8) ─────────────────────────────────────────────

_CHAT_EXAMPLE = """{
  "reply": "Based on your background in React and the lack of backend technologies, I highly recommend..."
}"""

async def chat_with_resume_context(
    career_profile: dict,
    message_history: list,
    current_message: str
) -> str:
    
    # Format message history dynamically
    history_str = ""
    for msg in message_history[-10:]: # keep the last 10 turns
        role = msg.get("role", "user").upper()
        content = msg.get("content", "")
        history_str += f"{role}: {content}\\n\\n"
        
    prompt = f"""You are an Expert AI Career Coach mentoring a technical candidate.
You are having a direct conversation with the candidate.

SHARED CAREER PROFILE (Resume, Target Context, Roadmaps, Projects):
{json.dumps(career_profile, indent=2)}

CHAT HISTORY:
{history_str}

USER'S LATEST MESSAGE:
{current_message}

INSTRUCTIONS:
1. Respond to the user's latest message directly as a helpful career coach.
2. Ground your advice ENTIRELY on their provided career profile and specific skill gaps.
3. **NEVER HALLUCINATE SKILLS**. If they ask about a skill/project they don't have, explicitly reply: "I don't see this in your current resume."
4. Maintain context. If they ask "Why?", they are referring to the previous recommendation from the chat history.
5. Do not give generic advice if specific advice can be tailored to their roadmap/projects.

Return ONLY valid JSON matching this exact structure:
{_CHAT_EXAMPLE}
"""
    try:
        raw_json = await call_llm(prompt=prompt)
        validated = ChatResponse.model_validate_json(raw_json)
        return validated.reply
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate chat response: {str(e)}"
        )

# ── AI Resume Tailor (Phase 9) ────────────────────────────────────────────────

_TAILOR_EXAMPLE = """{
  "tailored_resume": "# John Doe\\n\\nProfessional React Developer...",
  "matched_skills": ["React", "JavaScript"],
  "missing_skills": ["TypeScript", "Redux"],
  "keyword_matches": ["Frontend", "SPA"],
  "improvement_summary": ["Rephrased bullet points to highlight React components."],
  "warnings": ["You lack TypeScript which is explicitly requested."]
}"""

async def tailor_resume_for_job(
    resume_analysis_dict: dict,
    job_title: str,
    job_description: str,
    career_profile: dict = None
) -> dict:
    slim = _slim_resume(resume_analysis_dict)
    
    # Optionally incorporate previous gaps
    gaps_context = ""
    if career_profile and career_profile.get("skill_gaps"):
        gaps_context = f"\nKNOWN SKILL GAPS:\n{json.dumps(career_profile.get('skill_gaps'), indent=2)}\n"

    prompt = f"""You are an Expert Resume Writer and ATS Optimizer.
    
CANDIDATE'S ORIGINAL RESUME (JSON):
{json.dumps(slim, indent=2)}

TARGET JOB TITLE: {job_title}
TARGET JOB DESCRIPTION:
{job_description}
{gaps_context}
INSTRUCTIONS:
1. Rewrite the candidate's professional summary, experience bullets, and projects to better match the Target Job Description. Return the result in Markdown format.
2. STRICT ANTI-HALLUCINATION: ONLY use information actually present in the user's original resume. DO NOT invent or assume new skills, experience, projects, or metrics!
3. If the job asks for a technology NOT in the resume, identify it as a 'missing_skill'. DO NOT sneak it into the tailored resume.
4. Reorder bullet points and sections to push the most relevant existing experience to the top.
5. Improve ATS keyword alignment ONLY for the technologies and methodologies they actually claim.

Return ONLY valid JSON matching this exact structure:
{_TAILOR_EXAMPLE}
"""
    try:
        raw_json = await call_llm(prompt=prompt)
        validated = TailoredResumeResponse.model_validate_json(raw_json)
        return validated.model_dump()
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to tailor resume: {str(e)}"
        )
