from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from typing import Optional
from database import get_db
import models
import auth_utils
import plan_limits
import secrets
import smtplib
import os
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from datetime import datetime, timedelta, timezone

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


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str


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
    plan = plan_limits.normalize_plan(current_user.plan)
    return {
        "id":        current_user.id,
        "email":     current_user.email,
        "full_name": current_user.full_name,
        "company":   current_user.company,
        "job_title": current_user.job_title,
        "phone":     current_user.phone,
        "plan":      plan,
        "limits":    plan_limits.get_limits_for_plan(plan),
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


# ── Forgot Password ────────────────────────────────────────────────────────────

RESET_TOKEN_EXPIRE_MINUTES = 30


def send_reset_email(to_email: str, reset_link: str):
    smtp_email    = os.getenv("SMTP_EMAIL", "")
    smtp_password = os.getenv("SMTP_PASSWORD", "")
    smtp_host     = os.getenv("SMTP_HOST", "smtp.gmail.com")
    smtp_port     = int(os.getenv("SMTP_PORT", "587"))
    frontend_url  = os.getenv("FRONTEND_URL", "http://localhost:3000")

    if not smtp_email or not smtp_password:
        # Fallback: print to terminal if SMTP not configured
        print(f"\n{'='*60}")
        print(f"PASSWORD RESET LINK for {to_email}:")
        print(reset_link)
        print(f"(Configure SMTP_EMAIL and SMTP_PASSWORD in .env to send real emails)")
        print(f"{'='*60}\n")
        return

    # Build a clean HTML email
    html = f"""
    <div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;background:#f9f9f9;border-radius:10px;overflow:hidden;">
      <div style="background:linear-gradient(135deg,#4f8cff,#7c5cfc);padding:32px;text-align:center;">
        <h1 style="color:#fff;margin:0;font-size:24px;">TalentAlign AI</h1>
      </div>
      <div style="padding:32px;background:#fff;">
        <h2 style="color:#1a1a2e;margin-top:0;">Reset your password</h2>
        <p style="color:#555;font-size:15px;line-height:1.6;">
          We received a request to reset your password. Click the button below to set a new one.
          This link expires in <strong>30 minutes</strong>.
        </p>
        <div style="text-align:center;margin:32px 0;">
          <a href="{reset_link}"
             style="background:linear-gradient(135deg,#4f8cff,#7c5cfc);color:#fff;padding:14px 32px;
                    border-radius:8px;text-decoration:none;font-weight:bold;font-size:15px;display:inline-block;">
            Reset Password
          </a>
        </div>
        <p style="color:#888;font-size:13px;">
          If you didn't request this, you can safely ignore this email — your password won't change.
        </p>
        <p style="color:#aaa;font-size:12px;margin-top:24px;border-top:1px solid #eee;padding-top:16px;">
          Or copy this link into your browser:<br/>
          <a href="{reset_link}" style="color:#4f8cff;word-break:break-all;">{reset_link}</a>
        </p>
      </div>
    </div>
    """

    msg = MIMEMultipart("alternative")
    msg["Subject"] = "Reset your TalentAlign AI password"
    msg["From"]    = f"TalentAlign AI <{smtp_email}>"
    msg["To"]      = to_email
    msg.attach(MIMEText(html, "html"))

    try:
        with smtplib.SMTP(smtp_host, smtp_port) as server:
            server.ehlo()
            server.starttls()
            server.login(smtp_email, smtp_password)
            server.sendmail(smtp_email, to_email, msg.as_string())
        print(f"✅ Password reset email sent to {to_email}")
    except Exception as e:
        print(f"❌ Failed to send email: {e}")
        raise HTTPException(status_code=500, detail="Failed to send reset email. Check your SMTP settings in .env")


@router.post("/forgot-password")
def forgot_password(body: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """Always returns 200 so attackers can't enumerate registered emails."""
    user = db.query(models.User).filter(models.User.email == body.email).first()

    if user:
        # Invalidate any existing unused tokens for this user
        db.query(models.PasswordResetToken).filter(
            models.PasswordResetToken.user_id == user.id,
            models.PasswordResetToken.used == False,
        ).update({"used": True})
        db.commit()

        raw_token = secrets.token_urlsafe(32)
        expires   = datetime.now(timezone.utc) + timedelta(minutes=RESET_TOKEN_EXPIRE_MINUTES)

        reset_token = models.PasswordResetToken(
            user_id    = user.id,
            token      = raw_token,
            expires_at = expires,
        )
        db.add(reset_token)
        db.commit()

        frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
        reset_link   = f"{frontend_url}/reset-password?token={raw_token}"
        send_reset_email(user.email, reset_link)

    return {"message": "If that email is registered, a reset link has been sent."}


# ── Reset Password ─────────────────────────────────────────────────────────────

@router.post("/reset-password")
def reset_password(body: ResetPasswordRequest, db: Session = Depends(get_db)):
    if len(body.new_password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters.")

    record = db.query(models.PasswordResetToken).filter(
        models.PasswordResetToken.token == body.token,
        models.PasswordResetToken.used  == False,
    ).first()

    if not record:
        raise HTTPException(status_code=400, detail="Invalid or already-used reset link.")

    now = datetime.now(timezone.utc)
    expires = record.expires_at
    # Make expires_at timezone-aware if it isn't
    if expires.tzinfo is None:
        expires = expires.replace(tzinfo=timezone.utc)

    if now > expires:
        raise HTTPException(status_code=400, detail="This reset link has expired. Please request a new one.")

    user = db.query(models.User).filter(models.User.id == record.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    user.hashed_password = auth_utils.hash_password(body.new_password)
    record.used = True
    db.commit()

    return {"message": "Password updated successfully. You can now log in."}


# ── Validate Reset Token ───────────────────────────────────────────────────────

@router.get("/validate-reset-token")
def validate_reset_token(token: str, db: Session = Depends(get_db)):
    """Used by the frontend to check if a token is still valid before showing the form."""
    record = db.query(models.PasswordResetToken).filter(
        models.PasswordResetToken.token == token,
        models.PasswordResetToken.used  == False,
    ).first()

    if not record:
        raise HTTPException(status_code=400, detail="Invalid or already-used reset link.")

    now     = datetime.now(timezone.utc)
    expires = record.expires_at
    if expires.tzinfo is None:
        expires = expires.replace(tzinfo=timezone.utc)

    if now > expires:
        raise HTTPException(status_code=400, detail="This reset link has expired.")

    return {"valid": True, "email": record.user.email}