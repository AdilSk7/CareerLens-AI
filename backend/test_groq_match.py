import os
from dotenv import load_dotenv
import asyncio
from groq import Groq

load_dotenv()
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

prompt = """You are an expert AI recruiter evaluating a candidate's fit for a role.
CANDIDATE SKILLS & EXPERIENCE (JSON):
{"skills": ["Python", "Docker"]}
TARGET JOB DESCRIPTION (key excerpt):
Software Engineer. Required: Python, Git, Docker, Kubernetes.
INSTRUCTIONS:
- Return ONLY valid JSON matching exactly this structure:
{"required_skills": [], "exact_matches": [], "related_matches": [], "missing_skills": [], "recommendations": []}
"""

def test():
    try:
        completion = client.chat.completions.create(
            model=os.getenv("GROQ_MODEL"),
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"},
            temperature=0.2,
        )
        print("Success (JSON Mode):", completion.choices[0].message.content)
    except Exception as e:
        print("Error (JSON Mode):", str(e))

    try:
        completion = client.chat.completions.create(
            model=os.getenv("GROQ_MODEL"),
            messages=[{"role": "user", "content": prompt}],
            temperature=0.2,
        )
        print("Success (No JSON Mode):", completion.choices[0].message.content)
    except Exception as e:
        print("Error (No JSON Mode):", str(e))

test()
