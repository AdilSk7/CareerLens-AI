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

## 🚀 Local Development Setup

To run CareerLens AI on your local machine, you will need to set up both the Backend and Frontend environments.

### 1. Backend Setup

The backend handles all AI communication, PDF parsing, and Firestore database operations.

```bash
cd backend

# Create a virtual environment and activate it
python -m venv venv
# On Windows:
venv\Scripts\activate
# On Mac/Linux:
source venv/bin/activate

# Install strictly pinned requirements
pip install -r requirements.txt
```

**Environment Variables (`backend/.env`)**
Create a `.env` file in the `backend` folder and add the following:
```env
# AI Provider configuration ('groq' or 'gemini')
AI_PROVIDER=groq
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=llama-3.1-70b-versatile  # or your preferred model

GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-1.5-flash

# Firebase Admin SDK absolute path or relative path
FIREBASE_CREDENTIALS_PATH=firebase-service-account.json

# Allowed origin for CORS (Local development)
FRONTEND_URL=http://localhost:5173
```
*Note: Make sure to drop your `firebase-service-account.json` file inside the `backend` directory so FastAPI can connect to your Firestore database.*

**Run the Backend Server**
```bash
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```
The backend will be available at `http://localhost:8000`.

### 2. Frontend Setup

The frontend provides the responsive user interface built on top of Vite and TailwindCSS.

```bash
cd frontend

# Install Node dependencies
npm install 
# or yarn install
```

**Environment Variables (`frontend/.env`)**
Create a `.env` file in the `frontend` folder and add your Firebase Client configuration:
```env
VITE_API_BASE_URL=http://127.0.0.1:8000

VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

**Run the Frontend Development Server**
```bash
npm run dev
```
The frontend will be available at `http://localhost:5173`.

---

## 🌍 Production Deployment

CareerLens AI utilizes a robust split-deployment topology perfectly suited for separating static UI rendering from heavy Python PDF/AI processing.

### Backend (Render)
1. Link your GitHub repository to Render as a **Web Service**.
2. **Build Command**: `pip install -r backend/requirements.txt`
3. **Start Command**: `gunicorn -k uvicorn.workers.UvicornWorker -w 1 backend.app.main:app`
4. Set the Root Directory to `backend/`.
5. Under `Environment Variables`, configure all your keys, and set `FRONTEND_URL` to your Vercel URL.
6. Under `Secret Files`, strictly upload your `firebase-service-account.json`.

### Frontend (Vercel)
1. Link your GitHub repository to Vercel.
2. Ensure the Framework Preset is explicitly detected as **Vite**.
3. Set the Root Directory to `frontend`.
4. Ensure `VITE_API_BASE_URL` points to your newly deployed Render application URL (e.g., `https://careerlens-ai-sd5x.onrender.com`).
5. Populate all the `VITE_FIREBASE_*` credentials.
6. Hit **Deploy**!

---

## 📝 License
This project is proprietary.
