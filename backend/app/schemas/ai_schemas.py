from pydantic import BaseModel, Field
from typing import List, Optional

class EducationItem(BaseModel):
    degree: str = Field(description="The degree or certification obtained, e.g., 'B.S. Computer Science'. Return 'Not specified' if missing.")
    institution: str = Field(description="The name of the educational institution. Return 'Not specified' if missing.")
    year: str = Field(description="The year or duration of the education. Return 'Not specified' if missing.")

class WorkExperienceItem(BaseModel):
    role: str = Field(description="The job title or role held. Return 'Not specified' if missing.")
    company: str = Field(description="The name of the company or organization. Return 'Not specified' if missing.")
    duration: str = Field(description="The duration of employment. Return 'Not specified' if missing.")
    responsibilities: List[str] = Field(default_factory=list, description="A list of bullet points detailing the responsibilities and achievements.")

class ProjectItem(BaseModel):
    name: str = Field(description="The name of the project. Return 'Not specified' if missing.")
    description: str = Field(description="A brief description of what the project is and what it does. Return 'Not specified' if missing.")
    technologies: List[str] = Field(default_factory=list, description="A list of technologies used in the project.")

class ExtracurricularItem(BaseModel):
    role: str = Field(description="The role or title held (e.g. Marketing Member).")
    organization: str = Field(description="The club, society, or organization.")
    duration: str = Field(description="The duration of involvement.")
    description: List[str] = Field(default_factory=list, description="A list of activities or responsibilities undertaken.")

class CategoryScores(BaseModel):
    skills_score: int = Field(description="Score from 0-100 assessing the strength and relevance of technical and soft skills.")
    experience_score: int = Field(description="Score from 0-100 assessing the depth, impact, and relevance of work experience.")
    education_score: int = Field(description="Score from 0-100 assessing the educational background.")
    projects_score: int = Field(description="Score from 0-100 assessing the complexity and relevance of projects.")
    keywords_score: int = Field(description="Score from 0-100 assessing the presence of industry-standard ATS keywords.")
    formatting_score: int = Field(description="Score from 0-100 assessing the structural organization and readability of the text.")

class ResumeAnalysis(BaseModel):
    professional_summary: str = Field(description="A professionally written 2-3 sentence overview of the candidate's entire resume.")
    technical_skills: List[str] = Field(default_factory=list, description="Specific technical concepts and non-tool skills (e.g., Low-Level Design, SOLID Principles, Design Patterns, Agile). Do not put frameworks/tools here.")
    soft_skills: List[str] = Field(default_factory=list, description="A list of soft skills EXPLICITLY present or clearly described. DO NOT invent soft skills.")
    programming_languages: List[str] = Field(default_factory=list, description="A list of programming languages mentioned anywhere in the resume.")
    web_technologies: List[str] = Field(default_factory=list, description="Web technologies mentioned (e.g., HTML5, CSS3, JavaScript, REST APIs).")
    frameworks: List[str] = Field(default_factory=list, description="Software frameworks mentioned (e.g. React.js, Django, Spring Boot).")
    tools: List[str] = Field(default_factory=list, description="Software tools mentioned (e.g. Git, GitHub, Docker, Postman).")
    ai_ml_technologies: List[str] = Field(default_factory=list, description="AI/ML specific technologies, models, or algorithms (e.g. CNN, VGG16, GridSearchCV, PyTorch, Regression Modeling).")
    certifications: List[str] = Field(default_factory=list, description="A list of explicit certifications, licenses, or credentials obtained (e.g. AWS Certified Cloud Practitioner).")
    education: List[EducationItem] = Field(default_factory=list, description="A structured list of the candidate's educational background.")
    work_experience: List[WorkExperienceItem] = Field(default_factory=list, description="STRICTLY professional, paid employment or official internships ONLY. If it is a club, student society, volunteer, or 'Member' role, it DOES NOT belong here.")
    extracurricular_activities: List[ExtracurricularItem] = Field(default_factory=list, description="Must include ALL roles from sections like 'Extracurriculars', 'Activities', or 'Volunteer'. Example: 'Marketing Member', 'V-Guide'.")
    projects: List[ProjectItem] = Field(default_factory=list, description="A structured list of the candidate's projects.")
    strengths: List[str] = Field(default_factory=list, description="A list of the candidate's strongest points based on the resume content.")
    areas_for_improvement: List[str] = Field(default_factory=list, description="A list of constructive, professional suggestions for improving the resume.")
    suggested_job_roles: List[str] = Field(default_factory=list, description="A list of 3-5 job roles the candidate is highly suited for based on the resume.")
    category_scores: CategoryScores = Field(description="Individual scoring categories, each out of 100.")

class JobMatchRequest(BaseModel):
    job_description: str

class JobMatchAnalysis(BaseModel):
    required_skills: List[str] = Field(default_factory=list, description="A comprehensive list of all skills, tools, and technologies explicitly required or strongly preferred in the job description.")
    exact_matches: List[str] = Field(default_factory=list, description="Skills explicitly present identically in both the resume and the job description.")
    related_matches: List[str] = Field(default_factory=list, description="Skills that indirectly satisfy a requirement. (e.g. MongoDB satisfies NoSQL, or AWS Certification satisfies AWS experience).")
    missing_skills: List[str] = Field(default_factory=list, description="Important skills required by the job description that are NOT found on the candidate's resume.")
    recommendations: List[str] = Field(default_factory=list, description="Actionable, professional advice for the candidate on how to tailor their resume or upskill for this specific role.")

class InterviewQuestionRequest(BaseModel):
    job_description: str
    mode: str = Field(description="The interview mode (Technical, HR / Behavioral, Project-Based, Mixed)")
    question_history: List[str] = Field(default_factory=list, description="List of previous questions to avoid repetition.")

class InterviewQuestionResponse(BaseModel):
    question: str = Field(description="The generated interview question.")

class InterviewEvaluationRequest(BaseModel):
    question: str
    transcript: str
    job_description: str # For context

class InterviewEvaluationScores(BaseModel):
    relevance: int = Field(description="Score 0-10 on answering the actual question asked.")
    technical_accuracy: int = Field(description="Score 0-10 on technically correct claims and appropriate architecture.")
    completeness: int = Field(description="Score 0-10 on covering edge cases and all aspects of the question.")
    communication: int = Field(description="Score 0-10 on structure, logic flow, and clarity of thought.")
    clarity: int = Field(description="Score 0-10 on conciseness and lack of filler words.")

class InterviewEvaluationResponse(BaseModel):
    scores: InterviewEvaluationScores = Field(description="Granular scores out of 10.")
    good_points: List[str] = Field(default_factory=list, description="What the candidate answered well.")
    missing_points: List[str] = Field(default_factory=list, description="What the candidate missed or got wrong.")
    better_approach: str = Field(description="A concise, comprehensive example of a stronger answer.")
    follow_up_question: Optional[str] = Field(None, description="If the answer misses critical points or warrants a deep-dive, ask ONE follow-up question here. Otherwise null.")
    # Note: overall_score is calculated in Python deterministically, not generated by Gemini.

class CoverLetterRequest(BaseModel):
    job_description: str
    company_name: str
    job_title: str
    tone: str = "Professional"

class CoverLetterResponse(BaseModel):
    cover_letter: str = Field(description="The complete written cover letter tailored to the target job and candidate resume.")

class RoadmapRequest(BaseModel):
    target_role: str
    timeframe: str = Field(description="e.g. 3 months, 6 months, 12 months")

class RoadmapMilestone(BaseModel):
    phase: str = Field(description="e.g. Month 1, Months 2-3, Phase 1")
    focus: str = Field(description="High-level focus for this phase")
    actions: List[str] = Field(default_factory=list, description="Specific actionable steps, learning goals, or mini-projects")
    resources: List[str] = Field(default_factory=list, description="Suggested technologies, topics, or certificates to focus on")

class RoadmapResponse(BaseModel):
    milestones: List[RoadmapMilestone] = Field(description="Chronological milestones addressing the provided gaps to reach the target role.")

class ProjectRecommendationItem(BaseModel):
    title: str = Field(description="Name of the theoretical project")
    difficulty: str = Field(description="Difficulty level, e.g. Beginner, Intermediate, Advanced")
    technologies: List[str] = Field(default_factory=list, description="Stack or tools to use")
    description: str = Field(description="Brief overview of what to build and why")
    expected_outcome: str = Field(description="What the final product structurally looks like")
    portfolio_value: str = Field(description="How this specifically addresses a skill gap identified on their resume")

class ProjectRequest(BaseModel):
    target_domain: str = Field(description="Target job title or industry domain")

class ProjectRecommendationsResponse(BaseModel):
    projects: List[ProjectRecommendationItem] = Field(description="Tailored project configurations meant for skill acquisition.")

class SkillGapItem(BaseModel):
    skill: str
    status: str = Field(description="Must be exactly 'missing' or 'needs_improvement'")
    priority: str = Field(description="Priority level: 'high', 'medium', or 'low'")
    reason: str = Field(description="Brief explanation of why this is required for the target role")
    prerequisites: List[str] = Field(default_factory=list, description="Skills that must be learned before this one")

class SkillGapAnalysis(BaseModel):
    existing_skills: List[str] = Field(default_factory=list, description="Skills explicitly found on the resume that match the role requirements")
    missing_skills: List[SkillGapItem] = Field(default_factory=list)

class CareerProfile(BaseModel):
    resume_skills: List[str] = Field(default_factory=list)
    projects: List[str] = Field(default_factory=list)
    education: List[str] = Field(default_factory=list)
    certifications: List[str] = Field(default_factory=list)
    target_role: str = ""
    skill_gaps: List[SkillGapItem] = Field(default_factory=list)
    roadmap: Optional[dict] = None
    recommended_projects: Optional[list] = None
    applications: Optional[List[dict]] = Field(default_factory=list, description="Currently tracked job applications")
class ChatRequest(BaseModel):
    message: str = Field(description="The latest message from the user")

class ChatResponse(BaseModel):
    reply: str = Field(description="The response from the AI career coach")

class ApplicationCreate(BaseModel):
    company_name: str
    job_title: str
    job_description: str
    status: str = "Saved"
    job_url: str = ""
    notes: str = ""
    resume_id: str = ""

class ApplicationUpdate(BaseModel):
    company_name: Optional[str] = None
    job_title: Optional[str] = None
    job_description: Optional[str] = None
    status: Optional[str] = None
    job_url: Optional[str] = None
    notes: Optional[str] = None
    resume_id: Optional[str] = None

class TailoredResumeResponse(BaseModel):
    tailored_resume: str = Field(description="The tailored resume in Markdown format")
    matched_skills: List[str] = Field(default_factory=list, description="Skills present in both resume and job description")
    missing_skills: List[str] = Field(default_factory=list, description="Skills required by job but genuinely missing from resume")
    keyword_matches: List[str] = Field(default_factory=list, description="ATS keywords aligned")
    improvement_summary: List[str] = Field(default_factory=list, description="Summary of how the resume was tweaked")
    warnings: List[str] = Field(default_factory=list, description="Any gaps or issues the candidate must address")
