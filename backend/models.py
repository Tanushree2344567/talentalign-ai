from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, JSON, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base


class User(Base):
    __tablename__ = "users"
    id              = Column(Integer, primary_key=True, index=True)
    email           = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name       = Column(String)
    company         = Column(String)
    job_title       = Column(String)
    phone           = Column(String)
    plan            = Column(String, default="free")
    created_at      = Column(DateTime(timezone=True), server_default=func.now())
    projects        = relationship("Project", back_populates="owner")
    support_tickets = relationship("SupportTicket", back_populates="user")
    project_history = relationship("ProjectHistory", back_populates="owner")
    job_postings    = relationship("JobPosting", back_populates="owner")


class Project(Base):
    __tablename__ = "projects"
    id                           = Column(Integer, primary_key=True, index=True)
    title                        = Column(String, nullable=False)
    owner_id                     = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at                   = Column(DateTime(timezone=True), server_default=func.now())
    jd_required_skills           = Column(JSON, default=[])
    jd_required_experience_years = Column(Float, default=0.0)
    jd_required_education        = Column(String, default="")
    jd_nice_to_have_skills       = Column(JSON, default=[])
    owner      = relationship("User", back_populates="projects")
    candidates = relationship("Candidate", back_populates="project", cascade="all, delete")


class Candidate(Base):
    __tablename__ = "candidates"
    id               = Column(Integer, primary_key=True, index=True)
    project_id       = Column(Integer, ForeignKey("projects.id"), nullable=False)
    resume_filename  = Column(String)
    name             = Column(String)
    email            = Column(String)
    phone            = Column(String)
    skills_score     = Column(Float, default=0.0)
    experience_score = Column(Float, default=0.0)
    education_score  = Column(Float, default=0.0)
    overall_score    = Column(Float, default=0.0)
    matched_skills   = Column(JSON, default=[])
    missing_skills   = Column(JSON, default=[])
    extracted_skills = Column(JSON, default=[])
    experience_years = Column(Float, default=0.0)
    work_history     = Column(JSON, default=[]  )
    education_degree     = Column(String, default="")
    education_field      = Column(String, default="")
    education_university = Column(String, default="")
    projects_list    = Column(JSON, default=[])
    explanation      = Column(Text)
    recruiter_note   = Column(Text, default="")
    status           = Column(String, default="new")
    project = relationship("Project", back_populates="candidates")


class ProjectHistory(Base):
    __tablename__ = "project_history"
    id                           = Column(Integer, primary_key=True, index=True)
    owner_id                     = Column(Integer, ForeignKey("users.id"), nullable=False)
    original_project_id          = Column(Integer, nullable=True)
    title                        = Column(String, nullable=False)
    created_at                   = Column(DateTime(timezone=True), nullable=True)
    deleted_at                   = Column(DateTime(timezone=True), server_default=func.now())
    candidate_count              = Column(Integer, default=0)
    jd_required_skills           = Column(JSON, default=[])
    jd_required_experience_years = Column(Float, default=0.0)
    jd_required_education        = Column(String, default="")
    jd_nice_to_have_skills       = Column(JSON, default=[])
    candidates_snapshot          = Column(JSON, default=[])
    owner = relationship("User", back_populates="project_history")


class SupportTicket(Base):
    __tablename__ = "support_tickets"
    id          = Column(Integer, primary_key=True, index=True)
    user_id     = Column(Integer, ForeignKey("users.id"), nullable=False)
    title       = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    status      = Column(String, default="open")
    priority    = Column(String, default="medium")
    created_at  = Column(DateTime(timezone=True), server_default=func.now())
    updated_at  = Column(DateTime(timezone=True), onupdate=func.now())
    user     = relationship("User", back_populates="support_tickets")
    messages = relationship("TicketMessage", back_populates="ticket", cascade="all, delete")


class TicketMessage(Base):
    __tablename__ = "ticket_messages"
    id         = Column(Integer, primary_key=True, index=True)
    ticket_id  = Column(Integer, ForeignKey("support_tickets.id"), nullable=False)
    role       = Column(String, nullable=False)
    content    = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    ticket = relationship("SupportTicket", back_populates="messages")


# ── NEW: Job Postings ──────────────────────────────────────────────────────────

class JobPosting(Base):
    __tablename__ = "job_postings"
    id                  = Column(Integer, primary_key=True, index=True)
    owner_id            = Column(Integer, ForeignKey("users.id"), nullable=False)
    title               = Column(String, nullable=False)
    description         = Column(Text, nullable=False)
    required_skills     = Column(JSON, default=[])
    experience_required = Column(String, default="")
    education_required  = Column(String, default="")
    location            = Column(String, default="")
    employment_type     = Column(String, default="Full-time")
    company_name        = Column(String, default="")
    is_active           = Column(Boolean, default=True)
    created_at          = Column(DateTime(timezone=True), server_default=func.now())
    owner        = relationship("User", back_populates="job_postings")
    applications = relationship("JobApplication", back_populates="job", cascade="all, delete")


class JobApplication(Base):
    __tablename__ = "job_applications"
    id              = Column(Integer, primary_key=True, index=True)
    job_id          = Column(Integer, ForeignKey("job_postings.id"), nullable=False)
    applicant_name  = Column(String, nullable=False)
    applicant_email = Column(String, nullable=False)
    applicant_phone = Column(String, default="")
    cover_message   = Column(Text, default="")
    status          = Column(String, default="new")   # new, reviewing, shortlisted, rejected
    applied_at      = Column(DateTime(timezone=True), server_default=func.now())
    job = relationship("JobPosting", back_populates="applications")

class PasswordResetToken(Base):
    __tablename__ = "password_reset_tokens"
    id         = Column(Integer, primary_key=True, index=True)
    user_id    = Column(Integer, ForeignKey("users.id"), nullable=False)
    token      = Column(String, unique=True, nullable=False, index=True)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    used       = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    user = relationship("User")

