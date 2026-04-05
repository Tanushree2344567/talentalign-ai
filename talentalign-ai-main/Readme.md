# TalentAlign AI — Backend

FastAPI backend for resume analysis and scoring. Uses **Google Gemini** (free tier) for AI analysis — no credit card needed.

## Stack
- **FastAPI** — web framework
- **SQLite** — database (zero setup, file-based)
- **pdfplumber** — PDF text extraction
- **Google Gemini 1.5 Flash** — AI analysis (free)
- **JWT** — authentication

## Setup

### 1. Get your OpenAI API key
Go to https://platform.openai.com/api-keys and create a key

### 2. Clone and set up environment
```bash
git clone <your-repo-url>
cd talentalign-backend

python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

pip install -r requirements.txt
```

### 3. Create your .env file
```bash
 0b1b34f (Updated README to OpenAI API)
# Edit .env and paste your OpenAI API key
OPENAI_API_KEY=your_key_here
```

### 4. Run the server
```bash
uvicorn main:app --reload
```

API is now live at http://localhost:8000
Interactive docs at http://localhost:8000/docs

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | /auth/signup | Register a new user |
| POST | /auth/login | Login, get JWT token |
| GET | /projects/ | List your projects |
| POST | /projects/ | Create a new project |
| POST | /projects/{id}/upload | Upload JD + resumes ZIP → AI analysis |
| GET | /projects/{id}/results | Get saved results |

## How the analysis works
1. JD PDF → extract text with pdfplumber
2. ZIP → extract all resume PDFs → extract text
3. Each resume is sent to Gemini with a structured prompt
4. Gemini returns skills_score, experience_score, education_score, matched/missing skills, explanation
5. Overall score = skills×0.4 + experience×0.4 + education×0.2
6. Results sorted by overall_score and saved to SQLite
