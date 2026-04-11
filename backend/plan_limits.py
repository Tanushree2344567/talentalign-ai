from fastapi import HTTPException


PLAN_LIMITS = {
    "free": {
        "max_projects": 5,
        "max_job_postings": 2,
        "can_send_email": False,
        "can_generate_interview_questions": False,
        "can_rescreen": False,
        "can_generate_linkedin_post": False,
        "can_job_recommendations": False,
        "can_view_candidate_details": False,  # education, experience, projects tabs
    },
    "pro": {
        "max_projects": 20,
        "max_job_postings": 15,
        "can_send_email": True,
        "can_generate_interview_questions": True,
        "can_rescreen": True,
        "can_generate_linkedin_post": True,
        "can_job_recommendations": False,      # Job Recommendations = Premium only
        "can_view_candidate_details": True,
    },
    "premium": {
        "max_projects": 999,
        "max_job_postings": 999,
        "can_send_email": True,
        "can_generate_interview_questions": True,
        "can_rescreen": True,
        "can_generate_linkedin_post": True,
        "can_job_recommendations": True,
        "can_view_candidate_details": True,
    },
}


UPGRADE_PATH = {
    "free": "pro",
    "pro": "premium",
    "premium": "premium",
}


def normalize_plan(plan: str) -> str:
    if plan in PLAN_LIMITS:
        return plan
    return "free"


def get_limits_for_plan(plan: str) -> dict:
    return PLAN_LIMITS[normalize_plan(plan)]


def get_next_plan(plan: str) -> str:
    return UPGRADE_PATH.get(normalize_plan(plan), "pro")


def _raise_upgrade_required(message: str, current_plan: str):
    next_plan = get_next_plan(current_plan)
    raise HTTPException(
        status_code=403,
        detail={
            "code": "UPGRADE_REQUIRED",
            "message": message,
            "current_plan": normalize_plan(current_plan),
            "upgrade_to": next_plan,
        },
    )


def enforce_feature_access(current_plan: str, feature_key: str, feature_name: str):
    limits = get_limits_for_plan(current_plan)
    if limits.get(feature_key):
        return
    _raise_upgrade_required(
        f"{feature_name} is not available on your {normalize_plan(current_plan).title()} plan. Upgrade to continue.",
        current_plan,
    )


def enforce_numeric_limit(
    current_plan: str,
    current_count: int,
    limit_key: str,
    resource_label: str,
):
    limits = get_limits_for_plan(current_plan)
    limit = limits.get(limit_key, 0)
    if current_count < limit:
        return
    _raise_upgrade_required(
        f"You have reached the {resource_label} limit ({limit}) on your {normalize_plan(current_plan).title()} plan.",
        current_plan,
    )
