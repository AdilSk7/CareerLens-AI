import asyncio
from app.services.ai_service import analyze_job_match
import sys
import traceback

async def test():
    dummy_resume = {
        "programming_languages": ["Python", "Java", "JavaScript"],
        "frameworks": ["Django", "React"],
        "tools": ["Git", "Docker", "Kubernetes"],
        "work_experience": [
            {"role": "Software Engineer", "company": "Tech Corp", "responsibilities": ["Developed REST APIs", "Configured CI/CD"]}
        ],
        "education": [{"degree": "B.S. Computer Science"}]
    }

    dummy_jd = """
    Software Engineer
    Required: Python, Java, or JavaScript. SQL, Git, Docker, Kubernetes, CI/CD. REST APIs.
    """

    print("Running analyze_job_match...")
    try:
        result = await analyze_job_match(dummy_resume, dummy_jd)
        print("Success:", result)
    except Exception as e:
        print("Failed:", str(e))
        traceback.print_exc()

asyncio.run(test())
