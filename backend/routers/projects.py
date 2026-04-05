from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from database import get_db
import models
import auth_utils
import analyzer
import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv

load_dotenv()

router = APIRouter()


# ── Pydantic schemas ──────────────────────────────────────────────────────────

class ProjectCreate(BaseModel):
    title: str

class ProjectOut(BaseModel):
    id: int
    title: str
    created_at: str
    candidate_count: int
    class Config:
        from_attributes = True

class WorkHistoryItem(BaseModel):
    company: Optional[str]
    role: Optional[str]
    duration: Optional[str]

class CandidateOut(BaseModel):
    candidate_id: int
    name: Optional[str]
    email: Optional[str]
    phone: Optional[str]
    resume_filename: str
    skills_score: float
    experience_score: float
    education_score: float
    overall_score: float
    matched_skills: List[str]
    missing_skills: List[str]
    extracted_skills: Optional[List[str]]
    experience_years: Optional[float]
    education_degree: Optional[str]
    education_field: Optional[str]
    education_university: Optional[str]
    work_history: Optional[List[dict]]
    projects_list: Optional[List[str]]
    explanation: Optional[str]
    recruiter_note: Optional[str]
    status: Optional[str]

class JDStructureOut(BaseModel):
    required_skills: Optional[List[str]]
    required_experience_years: Optional[float]
    required_education: Optional[str]
    nice_to_have_skills: Optional[List[str]]

class ResultsOut(BaseModel):
    project_id: int
    title: str
    total_candidates: int
    jd_structure: Optional[JDStructureOut]
    results: List[CandidateOut]

class CandidateUpdate(BaseModel):
    recruiter_note: Optional[str] = None
    status: Optional[str] = None

class SendEmailRequest(BaseModel):
    to_email: str
    to_name: str
    subject: str
    body: str


# ── Routes ────────────────────────────────────────────────────────────────────

@router.get("/", response_model=List[ProjectOut])
def list_projects(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth_utils.get_current_user),
):
    projects = (
        db.query(models.Project)
        .filter(models.Project.owner_id == current_user.id)
        .order_by(models.Project.created_at.desc())
        .all()
    )
    return [
        {
            "id": p.id,
            "title": p.title,
            "created_at": p.created_at.isoformat(),
            "candidate_count": len(p.candidates),
        }
        for p in projects
    ]


@router.post("/", response_model=ProjectOut)
def create_project(
    body: ProjectCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth_utils.get_current_user),
):
    project = models.Project(title=body.title, owner_id=current_user.id)
    db.add(project)
    db.commit()
    db.refresh(project)
    return {
        "id": project.id,
        "title": project.title,
        "created_at": project.created_at.isoformat(),
        "candidate_count": 0,
    }


@router.get("/{project_id}/results", response_model=ResultsOut)
def get_results(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth_utils.get_current_user),
):
    project = _get_project_or_404(project_id, current_user.id, db)
    candidates = (
        db.query(models.Candidate)
        .filter(models.Candidate.project_id == project_id)
        .order_by(models.Candidate.overall_score.desc())
        .all()
    )
    return {
        "project_id": project.id,
        "title": project.title,
        "total_candidates": len(candidates),
        "jd_structure": {
            "required_skills": project.jd_required_skills or [],
            "required_experience_years": project.jd_required_experience_years or 0.0,
            "required_education": project.jd_required_education or "",
            "nice_to_have_skills": project.jd_nice_to_have_skills or [],
        },
        "results": [_candidate_to_dict(c) for c in candidates],
    }


@router.post("/{project_id}/upload", response_model=ResultsOut)
async def upload_and_analyze(
    project_id: int,
    jd_file: UploadFile = File(...),
    resumes_zip: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth_utils.get_current_user),
):
    project = _get_project_or_404(project_id, current_user.id, db)

    jd_bytes = await jd_file.read()
    zip_bytes = await resumes_zip.read()

    try:
        jd_structure, results = analyzer.process_upload(jd_bytes, zip_bytes)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

    project.jd_required_skills = jd_structure.get("required_skills", [])
    project.jd_required_experience_years = jd_structure.get("required_experience_years", 0.0)
    project.jd_required_education = jd_structure.get("required_education", "")
    project.jd_nice_to_have_skills = jd_structure.get("nice_to_have_skills", [])

    db.query(models.Candidate).filter(models.Candidate.project_id == project_id).delete()

    saved = []
    for r in results:
        candidate = models.Candidate(
            project_id=project_id,
            resume_filename=r.get("resume_filename", ""),
            name=r.get("name"),
            email=r.get("email"),
            phone=r.get("phone"),
            skills_score=r.get("skills_score", 0.0),
            experience_score=r.get("experience_score", 0.0),
            education_score=r.get("education_score", 0.0),
            overall_score=r.get("overall_score", 0.0),
            matched_skills=r.get("matched_skills", []),
            missing_skills=r.get("missing_skills", []),
            extracted_skills=r.get("extracted_skills", []),
            experience_years=r.get("experience_years", 0.0),
            education_degree=r.get("education_degree"),
            education_field=r.get("education_field"),
            education_university=r.get("education_university"),
            work_history=r.get("work_history", []),
            projects_list=r.get("projects_list", []),
            explanation=r.get("explanation"),
        )
        db.add(candidate)
        db.flush()
        saved.append(candidate)

    db.commit()
    for c in saved:
        db.refresh(c)

    return {
        "project_id": project.id,
        "title": project.title,
        "total_candidates": len(saved),
        "jd_structure": {
            "required_skills": project.jd_required_skills or [],
            "required_experience_years": project.jd_required_experience_years or 0.0,
            "required_education": project.jd_required_education or "",
            "nice_to_have_skills": project.jd_nice_to_have_skills or [],
        },
        "results": [_candidate_to_dict(c) for c in saved],
    }


@router.patch("/{project_id}/candidates/{candidate_id}")
def update_candidate(
    project_id: int,
    candidate_id: int,
    body: CandidateUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth_utils.get_current_user),
):
    _get_project_or_404(project_id, current_user.id, db)
    candidate = db.query(models.Candidate).filter(
        models.Candidate.id == candidate_id,
        models.Candidate.project_id == project_id,
    ).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")

    if body.recruiter_note is not None:
        candidate.recruiter_note = body.recruiter_note
    if body.status is not None:
        valid = ["new", "shortlisted", "rejected", "on_hold"]
        if body.status not in valid:
            raise HTTPException(status_code=400, detail=f"Status must be one of {valid}")
        candidate.status = body.status

    db.commit()
    db.refresh(candidate)
    return _candidate_to_dict(candidate)


# ── Email Route ───────────────────────────────────────────────────────────────

@router.post("/{project_id}/candidates/{candidate_id}/send-email")
def send_email_to_candidate(
    project_id: int,
    candidate_id: int,
    body: SendEmailRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth_utils.get_current_user),
):
    _get_project_or_404(project_id, current_user.id, db)

    candidate = db.query(models.Candidate).filter(
        models.Candidate.id == candidate_id,
        models.Candidate.project_id == project_id,
    ).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
    if not candidate.email:
        raise HTTPException(status_code=400, detail="Candidate has no email address")

    # Load SMTP config from .env
    smtp_email    = os.getenv("SMTP_EMAIL", "")
    smtp_password = os.getenv("SMTP_PASSWORD", "")
    smtp_host     = os.getenv("SMTP_HOST", "smtp.gmail.com")
    smtp_port     = int(os.getenv("SMTP_PORT", "587"))

    if not smtp_email or not smtp_password:
        raise HTTPException(
            status_code=500,
            detail="Email not configured. Add SMTP_EMAIL and SMTP_PASSWORD to your .env file."
        )

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = body.subject
        msg["From"]    = smtp_email
        msg["To"]      = body.to_email

        # Plain text version
        text_part = MIMEText(body.body, "plain")

        # HTML version — nice formatted email
        html_body = body.body.replace("\n", "<br>")
        html_content = f"""
        <html><body style="font-family: Arial, sans-serif; color: #1e293b; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #2563eb, #1d4ed8); padding: 24px; border-radius: 12px 12px 0 0;">
            <h2 style="color: white; margin: 0;">TalentAlign AI</h2>
            <p style="color: rgba(255,255,255,0.8); margin: 4px 0 0;">Recruitment Notification</p>
          </div>
          <div style="background: white; padding: 28px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px;">
            <p>Dear {body.to_name},</p>
            <div style="line-height: 1.7;">{html_body}</div>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;">
            <p style="font-size: 12px; color: #94a3b8;">
              This email was sent via TalentAlign AI Recruitment Platform.<br>
              Please do not reply to this email.
            </p>
          </div>
        </body></html>
        """
        html_part = MIMEText(html_content, "html")

        msg.attach(text_part)
        msg.attach(html_part)

        with smtplib.SMTP(smtp_host, smtp_port) as server:
            server.starttls()
            server.login(smtp_email, smtp_password)
            server.sendmail(smtp_email, body.to_email, msg.as_string())

        return {"message": f"Email sent successfully to {body.to_email}"}

    except smtplib.SMTPAuthenticationError:
        raise HTTPException(status_code=401, detail="SMTP authentication failed. Check your email/password in .env")
    except smtplib.SMTPException as e:
        raise HTTPException(status_code=500, detail=f"Failed to send email: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")

# ── ADD THESE TWO ENDPOINTS at the BOTTOM of backend/routers/projects.py ──────
# Place them BEFORE the _candidate_to_dict and _get_project_or_404 helper functions


# ─── Interview Question Generator (Shortlisted candidates only) ───────────────

@router.post("/{project_id}/candidates/{candidate_id}/interview-questions")
def generate_interview_questions(
    project_id:   int,
    candidate_id: int,
    db:           Session = Depends(get_db),
    current_user: models.User = Depends(auth_utils.get_current_user),
):
    """
    Generates targeted interview questions for a shortlisted candidate.
    Only works if candidate status is 'shortlisted'.
    """
    import os, re, json
    from openai import OpenAI

    project = _get_project_or_404(project_id, current_user.id, db)

    candidate = db.query(models.Candidate).filter(
        models.Candidate.id == candidate_id,
        models.Candidate.project_id == project_id,
    ).first()

    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")

    # Only for shortlisted candidates
    if candidate.status != "shortlisted":
        raise HTTPException(
            status_code=400,
            detail="Interview questions can only be generated for shortlisted candidates. Please mark the candidate as Shortlisted first."
        )

    api_key = os.getenv("OPENAI_API_KEY", "")
    if not api_key:
        raise HTTPException(status_code=500, detail="OpenAI API key not configured")

    client = OpenAI(api_key=api_key)

    prompt = f"""
You are an experienced technical recruiter preparing interview questions.

JOB REQUIREMENTS:
- Required Skills: {project.jd_required_skills or []}
- Required Experience: {project.jd_required_experience_years or 0} years
- Required Education: {project.jd_required_education or "Not specified"}

CANDIDATE PROFILE:
- Name: {candidate.name or "Candidate"}
- Skills they HAVE: {candidate.matched_skills or []}
- Skills they are MISSING: {candidate.missing_skills or []}
- Years of Experience: {candidate.experience_years or 0}
- Education: {candidate.education_degree or ""} in {candidate.education_field or ""}
- Work History: {candidate.work_history or []}

Generate exactly 7 targeted interview questions for this shortlisted candidate.
Focus on:
1. Verifying their matched skills in depth
2. Probing their missing skills — can they learn quickly?
3. Experience-based questions from their work history
4. Behavioral questions relevant to the role
5. Problem solving questions specific to the job requirements

Return ONLY a valid JSON array (no markdown, no backticks):
[
  {{
    "category": "Technical Skills",
    "question": "Your question here?",
    "reason": "Why this question is relevant (one line)"
  }}
]

Categories to use: Technical Skills, Missing Skills, Experience, Behavioral, Problem Solving
"""

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.4,
    )

    raw = response.choices[0].message.content.strip()
    raw = re.sub(r"^```(?:json)?\s*", "", raw)
    raw = re.sub(r"\s*```$", "", raw)
    questions = json.loads(raw)

    return {
        "candidate_name": candidate.name or candidate.resume_filename,
        "questions":      questions,
    }


# ─── Re-screen with New JD ────────────────────────────────────────────────────

@router.post("/{project_id}/rescreen")
async def rescreen_with_new_jd(
    project_id:   int,
    jd_file:      UploadFile = File(...),
    db:           Session = Depends(get_db),
    current_user: models.User = Depends(auth_utils.get_current_user),
):
    """
    Re-scores all existing candidates in a project against a new JD.
    No need to re-upload resumes.
    """
    project = _get_project_or_404(project_id, current_user.id, db)

    candidates = db.query(models.Candidate).filter(
        models.Candidate.project_id == project_id
    ).all()

    if not candidates:
        raise HTTPException(
            status_code=400,
            detail="No candidates found. Please upload resumes first."
        )

    jd_bytes = await jd_file.read()
    jd_text  = analyzer.extract_text_from_pdf_bytes(jd_bytes)

    if not jd_text:
        raise HTTPException(status_code=400, detail="Could not extract text from JD PDF.")

    try:
        jd_features = analyzer.parse_job_description(jd_text)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Could not parse JD: {str(e)}")

    # Update project JD structure with new JD
    project.jd_required_skills           = jd_features.get("required_skills", [])
    project.jd_required_experience_years = jd_features.get("required_experience_years", 0.0)
    project.jd_required_education        = jd_features.get("required_education", "")
    project.jd_nice_to_have_skills       = jd_features.get("preferred_skills", [])

    # Re-score each candidate using their saved extracted skills
    saved = []
    for candidate in candidates:
        try:
            # Build resume features from stored data
            resume_features = {
                "name":               candidate.name or "",
                "email":              candidate.email or "",
                "phone":              candidate.phone or "",
                "extracted_skills":   candidate.extracted_skills or [],
                "years_of_experience": candidate.experience_years or 0.0,
                "education_degree":   candidate.education_degree or "",
                "education_field":    candidate.education_field or "",
                "education_university": candidate.education_university or "",
                "work_history":       candidate.work_history or [],
                "projects_list":      candidate.projects_list or [],
            }

            # Score against NEW JD
            scores = analyzer.score_candidate(
                resume_features,
                jd_features,
                candidate.resume_filename
            )

            # Update scores in DB
            candidate.skills_score     = scores.get("skills_score", 0.0)
            candidate.experience_score = scores.get("experience_score", 0.0)
            candidate.education_score  = scores.get("education_score", 0.0)
            candidate.overall_score    = scores.get("overall_score", 0.0)
            candidate.matched_skills   = scores.get("matched_skills", [])
            candidate.missing_skills   = scores.get("missing_skills", [])
            candidate.explanation      = scores.get("explanation", "")

            saved.append(candidate)

        except Exception as e:
            print(f"Re-screen failed for {candidate.resume_filename}: {e}")
            continue

    db.commit()
    for c in saved:
        db.refresh(c)

    saved.sort(key=lambda x: x.overall_score, reverse=True)

    return {
        "project_id":       project.id,
        "title":            project.title,
        "total_candidates": len(saved),
        "jd_structure": {
            "required_skills":           project.jd_required_skills or [],
            "required_experience_years": project.jd_required_experience_years or 0.0,
            "required_education":        project.jd_required_education or "",
            "nice_to_have_skills":       project.jd_nice_to_have_skills or [],
        },
        "results": [_candidate_to_dict(c) for c in saved],
    }



# ── Delete Project (saves snapshot to history first) ─────────────────────────

@router.delete("/{project_id}", status_code=200)
def delete_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth_utils.get_current_user),
):
    project = _get_project_or_404(project_id, current_user.id, db)

    candidates = (
        db.query(models.Candidate)
        .filter(models.Candidate.project_id == project_id)
        .order_by(models.Candidate.overall_score.desc())
        .all()
    )

    # Save a full snapshot into history before deleting
    history_entry = models.ProjectHistory(
        owner_id=current_user.id,
        original_project_id=project.id,
        title=project.title,
        created_at=project.created_at,
        candidate_count=len(candidates),
        jd_required_skills=project.jd_required_skills or [],
        jd_required_experience_years=project.jd_required_experience_years or 0.0,
        jd_required_education=project.jd_required_education or "",
        jd_nice_to_have_skills=project.jd_nice_to_have_skills or [],
        candidates_snapshot=[_candidate_to_dict(c) for c in candidates],
    )
    db.add(history_entry)

    # Now delete project (cascade deletes candidates)
    db.delete(project)
    db.commit()

    return {"message": "Project deleted and saved to history"}


# ── History endpoints ─────────────────────────────────────────────────────────

class HistoryOut(BaseModel):
    id: int
    original_project_id: Optional[int]
    title: str
    created_at: Optional[str]
    deleted_at: str
    candidate_count: int
    jd_required_skills: Optional[List[str]]
    jd_required_experience_years: Optional[float]
    jd_required_education: Optional[str]
    jd_nice_to_have_skills: Optional[List[str]]

    class Config:
        from_attributes = True


@router.get("/history/all", response_model=List[HistoryOut])
def list_history(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth_utils.get_current_user),
):
    entries = (
        db.query(models.ProjectHistory)
        .filter(models.ProjectHistory.owner_id == current_user.id)
        .order_by(models.ProjectHistory.deleted_at.desc())
        .all()
    )
    return [
        {
            "id": e.id,
            "original_project_id": e.original_project_id,
            "title": e.title,
            "created_at": e.created_at.isoformat() if e.created_at else None,
            "deleted_at": e.deleted_at.isoformat(),
            "candidate_count": e.candidate_count,
            "jd_required_skills": e.jd_required_skills or [],
            "jd_required_experience_years": e.jd_required_experience_years or 0.0,
            "jd_required_education": e.jd_required_education or "",
            "jd_nice_to_have_skills": e.jd_nice_to_have_skills or [],
        }
        for e in entries
    ]


@router.get("/history/{history_id}/results")
def get_history_results(
    history_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth_utils.get_current_user),
):
    entry = (
        db.query(models.ProjectHistory)
        .filter(
            models.ProjectHistory.id == history_id,
            models.ProjectHistory.owner_id == current_user.id,
        )
        .first()
    )
    if not entry:
        raise HTTPException(status_code=404, detail="History entry not found")
    return {
        "history_id": entry.id,
        "original_project_id": entry.original_project_id,
        "title": entry.title,
        "created_at": entry.created_at.isoformat() if entry.created_at else None,
        "deleted_at": entry.deleted_at.isoformat(),
        "total_candidates": entry.candidate_count,
        "jd_structure": {
            "required_skills": entry.jd_required_skills or [],
            "required_experience_years": entry.jd_required_experience_years or 0.0,
            "required_education": entry.jd_required_education or "",
            "nice_to_have_skills": entry.jd_nice_to_have_skills or [],
        },
        "results": entry.candidates_snapshot or [],
    }


@router.delete("/history/{history_id}", status_code=200)
def delete_history_entry(
    history_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth_utils.get_current_user),
):
    entry = (
        db.query(models.ProjectHistory)
        .filter(
            models.ProjectHistory.id == history_id,
            models.ProjectHistory.owner_id == current_user.id,
        )
        .first()
    )
    if not entry:
        raise HTTPException(status_code=404, detail="History entry not found")
    db.delete(entry)
    db.commit()
    return {"message": "History entry permanently deleted"}




# ── LinkedIn Post Generator ───────────────────────────────────────────────────

@router.post("/{project_id}/linkedin-post")
def generate_linkedin_post(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth_utils.get_current_user),
):
    """Generates an AI LinkedIn hiring post based on the project JD structure."""
    import re
    from openai import OpenAI

    project = _get_project_or_404(project_id, current_user.id, db)

    if not project.jd_required_skills:
        raise HTTPException(
            status_code=400,
            detail="No job description found. Please upload a JD first."
        )

    api_key = os.getenv("OPENAI_API_KEY", "")
    if not api_key:
        raise HTTPException(status_code=500, detail="OpenAI API key not configured")

    client = OpenAI(api_key=api_key)

    prompt = f"""
You are a professional recruiter writing a LinkedIn job post to attract top talent.

JOB DETAILS:
- Role: {project.title}
- Required Skills: {project.jd_required_skills or []}
- Nice to Have Skills: {project.jd_nice_to_have_skills or []}
- Required Education: {project.jd_required_education or "Not specified"}
- Required Experience: {project.jd_required_experience_years or 0} years

Write an engaging, professional LinkedIn post that:
1. Starts with a compelling hook (emoji + excitement)
2. Briefly describes the opportunity and team culture
3. Lists key requirements (skills, education)
4. Has a clear call to action (apply/DM)
5. Ends with 4-5 relevant hashtags
6. Is between 150-250 words total
7. Uses emojis naturally but not excessively
8. Feels authentic and human, not like a boring job listing

Return ONLY the post text. No quotes, no JSON, no markdown — just the raw LinkedIn post.
"""

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.7,
    )

    post_text = response.choices[0].message.content.strip()
    return {"post": post_text, "role": project.title}

# ── Helpers ───────────────────────────────────────────────────────────────────

def _candidate_to_dict(c: models.Candidate) -> dict:
    return {
        "candidate_id": c.id,
        "name": c.name,
        "email": c.email,
        "phone": c.phone,
        "resume_filename": c.resume_filename,
        "skills_score": c.skills_score,
        "experience_score": c.experience_score,
        "education_score": c.education_score,
        "overall_score": c.overall_score,
        "matched_skills": c.matched_skills or [],
        "missing_skills": c.missing_skills or [],
        "extracted_skills": c.extracted_skills or [],
        "experience_years": c.experience_years or 0.0,
        "education_degree": c.education_degree or "",
        "education_field": c.education_field or "",
        "education_university": c.education_university or "",
        "work_history": c.work_history or [],
        "projects_list": c.projects_list or [],
        "explanation": c.explanation,
        "recruiter_note": c.recruiter_note or "",
        "status": c.status or "new",
    }


def _get_project_or_404(project_id: int, user_id: int, db: Session) -> models.Project:
    project = (
        db.query(models.Project)
        .filter(models.Project.id == project_id, models.Project.owner_id == user_id)
        .first()
    )
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project