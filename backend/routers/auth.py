from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from typing import Optional
from database import get_db
import models
import auth_utils

router = APIRouter()


# ── Schemas ───────────────────────────────────────────────────────────────────

class SignupRequest(BaseModel):
    email:     EmailStr
    password:  str
    full_name: str = ""
    company:   Optional[str] = None
    job_title: Optional[str] = None
    phone:     Optional[str] = None


class TokenResponse(BaseModel):
    access_token: str
    token_type:   str = "bearer"


class UpdatePlanRequest(BaseModel):
    plan: str   # 'free', 'pro', 'premium'


# ── Signup ────────────────────────────────────────────────────────────────────

@router.post("/signup", response_model=TokenResponse)
def signup(body: SignupRequest, db: Session = Depends(get_db)):
    existing = db.query(models.User).filter(models.User.email == body.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    user = models.User(
        email           = body.email,
        hashed_password = auth_utils.hash_password(body.password),
        full_name       = body.full_name,
        company         = body.company,
        job_title       = body.job_title,
        phone           = body.phone,
        plan            = "free",   # default plan on signup
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = auth_utils.create_access_token({"sub": str(user.id)})
    return {"access_token": token}


# ── Login ─────────────────────────────────────────────────────────────────────

@router.post("/login", response_model=TokenResponse)
def login(form: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == form.username).first()
    if not user or not auth_utils.verify_password(form.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
    token = auth_utils.create_access_token({"sub": str(user.id)})
    return {"access_token": token}


# ── Me ────────────────────────────────────────────────────────────────────────

@router.get("/me")
def me(current_user: models.User = Depends(auth_utils.get_current_user)):
    return {
        "id":        current_user.id,
        "email":     current_user.email,
        "full_name": current_user.full_name,
        "company":   current_user.company,
        "job_title": current_user.job_title,
        "phone":     current_user.phone,
        "plan":      current_user.plan or "free",   # ← NEW
    }


# ── Update Plan ───────────────────────────────────────────────────────────────

@router.post("/update-plan")
def update_plan(
    body: UpdatePlanRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth_utils.get_current_user),
):
    valid_plans = ["free", "pro", "premium"]
    if body.plan not in valid_plans:
        raise HTTPException(status_code=400, detail=f"Invalid plan. Must be one of {valid_plans}")

    current_user.plan = body.plan
    db.commit()
    db.refresh(current_user)

    return {
        "message": f"Plan updated to {body.plan}",
        "plan":    current_user.plan,
    }
