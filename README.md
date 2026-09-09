# 💼 CareerLens AI

**CareerLens AI** is an advanced, AI-powered career coaching and resume optimization platform. It bridges the gap between candidates and their target jobs by providing deep, ATS-level resume parsing, skill gap analysis, dynamically generated cover letters, and mock interview preparations tailored to specific job descriptions.

![CareerLens AI](https://img.shields.io/badge/Status-Production_Ready-success)
![Frontend](https://img.shields.io/badge/Frontend-React_%2B_Vite-blue)
![Backend](https://img.shields.io/badge/Backend-FastAPI-green)
![AI](https://img.shields.io/badge/AI-Groq_%7C_Gemini-orange)

## ✨ Core Features

- 📄 **Deep ATS Resume Parsing**: Upload a PDF resume and Instantly extract heavily normalized metadata including skills, nested experience bullets, projects, and education.
- 🎯 **Job Description Matching**: Paste a target job description and get a highly deterministic ATS compatibility score, including exact matches and highlighted skill gaps.
- 🛣️ **Custom Career Roadmaps**: Generates progressive, timeline-based learning journeys to bridge identified missing skills.
- 📝 **AI Cover Letter Generator**: Writes highly tailored, evidence-backed cover letters by correlating your actual resume metrics to the specific job description without hallucinating.
- 🎤 **Dynamic Mock Interviews**: Simulates technical, behavioral, or project-based interviews by querying your unique career profile, and evaluates your responses strictly via AI feedback.

## 🛠️ Technology Stack

**Frontend (Vercel)**
- React 18, Vite, TypeScript
- Tailwind CSS
- Firebase Authentication

**Backend (Render)**
- Python 3.11, FastAPI, Uvicorn/Gunicorn
- `pymupdf` for rapid PDF extraction
- **AI Integration**: Groq API (Llama 3) & Google Gemini Integration for high-speed deterministic JSON processing.
- **Database**: Firebase Firestore (NoSQL) for highly scalable structured data storage.

---

## 🧠 How It Works

1. **Upload & Parse**: When a user drops a resume PDF, the backend instantly streams it to PyMuPDF for lightning-fast text extraction.
2. **AI Inference**: The extracted text is dispatched to Groq (or Gemini) alongside strict JSON-enforced prompts, identifying technologies, soft skills, and exact years of experience, even if they are buried in complex paragraphs.
3. **Storage & Sync**: The heavily structured JSON response is saved to Firebase Firestore. The frontend seamlessly listens to this data, populating rich, interactive dashboards in a fraction of a second.
4. **Targeted Job Matching**: If the user pastes a target job description, the AI performs a bidirectional semantic comparison, outputting exact alignment metrics heavily sought after by real-world ATS software.
5. **Interview Engine**: Utilizing the structured resume layout, the Mock Interview engine acts as a hiring manager, generating and evaluating real-time responses to highly personalized behavioral questions.

---

## 📝 License
This project is proprietary.
