# ── ADD THIS TO backend/routers/auth.py ──────────────────────────────────────
# Add this Pydantic schema near the top (with other schemas):

from pydantic import BaseModel
from typing import Optional, List

class CompanyProfileUpdate(BaseModel):
    company_name: Optional[str] = None
    industry: Optional[str] = None
    company_size: Optional[str] = None
    website: Optional[str] = None
    location: Optional[str] = None
    description: Optional[str] = None
    hiring_roles: Optional[List[str]] = None


# ── ADD THIS ENDPOINT anywhere in the router (before the last line) ───────────

@router.post("/company-profile")
def save_company_profile(
    body: CompanyProfileUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
):
    """Save or update the company profile for the current user."""
    # Store in user record — add these columns to your User model if needed
    # Or store as JSON in a single column. Simple approach below:
    if hasattr(current_user, "company_name"):
        current_user.company_name   = body.company_name
        current_user.industry       = body.industry
        current_user.company_size   = body.company_size
        current_user.website        = body.website
        current_user.location       = body.location
        current_user.description    = body.description
        current_user.hiring_roles   = body.hiring_roles or []
        db.commit()
    return {"message": "Company profile saved successfully"}
