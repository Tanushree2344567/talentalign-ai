"""
Public Jobs Router — no auth required for candidates to view/apply.
HR (authenticated) manages job postings.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from typing import List, Optional
from database import get_db
import models
import auth_utils
import plan_limits

router = APIRouter()


# ── Schemas ───────────────────────────────────────────────────────────────────

class JobPostingCreate(BaseModel):
    title: str
    description: str
    required_skills: List[str] = []
    experience_required: str = ""
    education_required: str = ""
    location: str = ""
    employment_type: str = "Full-time"  # Full-time, Part-time, Contract, Internship

class JobPostingOut(BaseModel):
    id: int
    title: str
    description: str
    required_skills: List[str]
    experience_required: str
    education_required: str
    location: str
    employment_type: str
    company_name: str
    is_active: bool
    created_at: str
    class Config:
        from_attributes = True

class JobApplicationCreate(BaseModel):
    applicant_name: str
    applicant_email: EmailStr
    applicant_phone: str = ""
    cover_message: str = ""

class JobApplicationOut(BaseModel):
    id: int
    job_id: int
    job_title: str
    applicant_name: str
    applicant_email: str
    applicant_phone: str
    cover_message: str
    status: str
    applied_at: str


# ── HR: Manage job postings (auth required) ───────────────────────────────────

@router.post("/", response_model=JobPostingOut)
def create_job_posting(
    body: JobPostingCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth_utils.get_current_user),
):
    plan = plan_limits.normalize_plan(current_user.plan)
    existing_jobs = db.query(models.JobPosting).filter(models.JobPosting.owner_id == current_user.id).count()
    plan_limits.enforce_numeric_limit(plan, existing_jobs, "max_job_postings", "job postings")

    job = models.JobPosting(
        owner_id=current_user.id,
        title=body.title,
        description=body.description,
        required_skills=body.required_skills,
        experience_required=body.experience_required,
        education_required=body.education_required,
        location=body.location,
        employment_type=body.employment_type,
        company_name=current_user.company or "TalentAlign Company",
    )
    db.add(job)
    db.commit()
    db.refresh(job)
    return _job_to_dict(job)


@router.get("/my", response_model=List[JobPostingOut])
def list_my_job_postings(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth_utils.get_current_user),
):
    jobs = (
        db.query(models.JobPosting)
        .filter(models.JobPosting.owner_id == current_user.id)
        .order_by(models.JobPosting.created_at.desc())
        .all()
    )
    return [_job_to_dict(j) for j in jobs]


@router.patch("/{job_id}", response_model=JobPostingOut)
def update_job_posting(
    job_id: int,
    body: JobPostingCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth_utils.get_current_user),
):
    job = _get_job_or_404(job_id, current_user.id, db)
    for field, val in body.dict(exclude_unset=True).items():
        setattr(job, field, val)
    db.commit()
    db.refresh(job)
    return _job_to_dict(job)


@router.delete("/{job_id}")
def delete_job_posting(
    job_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth_utils.get_current_user),
):
    job = _get_job_or_404(job_id, current_user.id, db)
    db.delete(job)
    db.commit()
    return {"message": "Job posting deleted"}


@router.patch("/{job_id}/toggle")
def toggle_job_active(
    job_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth_utils.get_current_user),
):
    job = _get_job_or_404(job_id, current_user.id, db)
    job.is_active = not job.is_active
    db.commit()
    db.refresh(job)
    return _job_to_dict(job)


@router.get("/{job_id}/applications", response_model=List[JobApplicationOut])
def get_job_applications(
    job_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth_utils.get_current_user),
):
    _get_job_or_404(job_id, current_user.id, db)
    apps = (
        db.query(models.JobApplication)
        .filter(models.JobApplication.job_id == job_id)
        .order_by(models.JobApplication.applied_at.desc())
        .all()
    )
    return [_app_to_dict(a) for a in apps]


@router.patch("/{job_id}/applications/{app_id}")
def update_application_status(
    job_id: int,
    app_id: int,
    status: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth_utils.get_current_user),
):
    _get_job_or_404(job_id, current_user.id, db)
    app = db.query(models.JobApplication).filter(
        models.JobApplication.id == app_id,
        models.JobApplication.job_id == job_id,
    ).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    valid = ["new", "reviewing", "shortlisted", "rejected"]
    if status not in valid:
        raise HTTPException(status_code=400, detail=f"Status must be one of {valid}")
    app.status = status
    db.commit()
    return _app_to_dict(app)


# ── PUBLIC: Candidates browse & apply (NO auth required) ─────────────────────

@router.get("/public/all", response_model=List[JobPostingOut])
def list_public_jobs(db: Session = Depends(get_db)):
    """Public endpoint — candidates can browse all active job postings."""
    jobs = (
        db.query(models.JobPosting)
        .filter(models.JobPosting.is_active == True)
        .order_by(models.JobPosting.created_at.desc())
        .all()
    )
    return [_job_to_dict(j) for j in jobs]


@router.get("/public/{job_id}", response_model=JobPostingOut)
def get_public_job(job_id: int, db: Session = Depends(get_db)):
    """Public endpoint — view a single job posting."""
    job = db.query(models.JobPosting).filter(
        models.JobPosting.id == job_id,
        models.JobPosting.is_active == True,
    ).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job posting not found or no longer active")
    return _job_to_dict(job)


@router.post("/public/{job_id}/apply", response_model=JobApplicationOut)
def apply_for_job(
    job_id: int,
    body: JobApplicationCreate,
    db: Session = Depends(get_db),
):
    """Public endpoint — candidate submits an application."""
    job = db.query(models.JobPosting).filter(
        models.JobPosting.id == job_id,
        models.JobPosting.is_active == True,
    ).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job posting not found or no longer active")

    # Check for duplicate application
    existing = db.query(models.JobApplication).filter(
        models.JobApplication.job_id == job_id,
        models.JobApplication.applicant_email == body.applicant_email,
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="You have already applied for this position")

    app = models.JobApplication(
        job_id=job_id,
        applicant_name=body.applicant_name,
        applicant_email=body.applicant_email,
        applicant_phone=body.applicant_phone,
        cover_message=body.cover_message,
    )
    db.add(app)
    db.commit()
    db.refresh(app)
    return _app_to_dict(app)


# ── Helpers ───────────────────────────────────────────────────────────────────

def _job_to_dict(j: models.JobPosting) -> dict:
    return {
        "id": j.id,
        "title": j.title,
        "description": j.description,
        "required_skills": j.required_skills or [],
        "experience_required": j.experience_required or "",
        "education_required": j.education_required or "",
        "location": j.location or "",
        "employment_type": j.employment_type or "Full-time",
        "company_name": j.company_name or "",
        "is_active": j.is_active,
        "created_at": j.created_at.isoformat() if j.created_at else "",
    }

def _app_to_dict(a: models.JobApplication) -> dict:
    return {
        "id": a.id,
        "job_id": a.job_id,
        "job_title": a.job.title if a.job else "",
        "applicant_name": a.applicant_name,
        "applicant_email": a.applicant_email,
        "applicant_phone": a.applicant_phone or "",
        "cover_message": a.cover_message or "",
        "status": a.status,
        "applied_at": a.applied_at.isoformat() if a.applied_at else "",
    }

def _get_job_or_404(job_id: int, user_id: int, db: Session) -> models.JobPosting:
    job = db.query(models.JobPosting).filter(
        models.JobPosting.id == job_id,
        models.JobPosting.owner_id == user_id,
    ).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job posting not found")
    return job
