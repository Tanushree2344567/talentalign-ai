"""
Resume analysis engine with structured feature extraction.
Uses OpenAI GPT-4o-mini for AI analysis and feature extraction.
"""

import os
import re
import json
import zipfile
import io
import pdfplumber
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()


# ── Text Helpers ──────────────────────────────────────────────────────────────

def preprocess_text(text: str) -> str:
    """Clean and normalize extracted text."""
    # Remove non-UTF8 characters
    text = text.encode("utf-8", errors="ignore").decode("utf-8")
    # Collapse multiple whitespace/newlines
    text = re.sub(r'\s+', ' ', text)
    # Remove special unicode bullets/symbols
    text = re.sub(r'[^\x00-\x7F]+', ' ', text)
    return text.strip()


def extract_text_from_pdf_bytes(pdf_bytes: bytes) -> str:
    """Extract and clean all text from a PDF given as raw bytes."""
    text = ""
    try:
        with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
    except Exception as e:
        text = f"[Could not extract text: {e}]"
    return preprocess_text(text)


def extract_pdfs_from_zip(zip_bytes: bytes) -> dict:
    """
    Given a ZIP file as bytes, return a dict of {filename: pdf_bytes}
    for every PDF file found inside (ignoring non-PDFs).
    """
    result = {}
    with zipfile.ZipFile(io.BytesIO(zip_bytes)) as zf:
        for name in zf.namelist():
            if name.endswith("/") or "__MACOSX" in name:
                continue
            if name.lower().endswith(".pdf"):
                filename = os.path.basename(name)
                result[filename] = zf.read(name)
    return result


# ── JD Parser ─────────────────────────────────────────────────────────────────

def parse_job_description(jd_text: str) -> dict:
    """
    Extract structured fields from a Job Description using OpenAI.
    Returns required skills, experience, education, role summary.
    """
    api_key = os.getenv("OPENAI_API_KEY", "")
    if not api_key:
        raise ValueError("OPENAI_API_KEY environment variable is not set.")

    client = OpenAI(api_key=api_key)

    prompt = f"""
You are an expert HR analyst. Extract structured information from this job description.

JOB DESCRIPTION:
{jd_text[:3000]}

Return ONLY a valid JSON object (no markdown, no backticks) with exactly these fields:
{{
  "role_summary": "1-2 sentence summary of the role",
  "required_skills": ["list", "of", "must-have", "technical", "skills"],
  "preferred_skills": ["list", "of", "nice-to-have", "skills"],
  "required_experience": "e.g. 3-5 years of backend development",
  "required_education": "e.g. B.Tech/B.E. in Computer Science or related field"
}}
"""

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.2,
    )
    raw = response.choices[0].message.content.strip()
    raw = re.sub(r"^```(?:json)?\s*", "", raw)
    raw = re.sub(r"\s*```$", "", raw)
    return json.loads(raw)


# ── Resume Parser ─────────────────────────────────────────────────────────────

def extract_resume_features(resume_text: str, resume_filename: str) -> dict:
    """
    Extract structured features from a single resume using OpenAI.
    Returns name, email, phone, skills, experience, education, work history, projects.
    """
    api_key = os.getenv("OPENAI_API_KEY", "")
    client = OpenAI(api_key=api_key)

    prompt = f"""
You are an expert resume parser. Extract structured information from this resume.

RESUME ({resume_filename}):
{resume_text[:3000]}

Return ONLY a valid JSON object (no markdown, no backticks) with exactly these fields:
{{
  "name": "Full name or Unknown",
  "email": "email or empty string",
  "phone": "phone number or empty string",
  "extracted_skills": ["all", "technical", "skills", "found", "in", "resume"],
  "years_of_experience": <float — total years of work experience, 0.0 if fresher>,
  "education_degree": "highest degree e.g. B.Tech, M.Tech, BCA, MCA",
  "education_field": "field of study e.g. Computer Science, IT, Electronics",
  "education_university": "university or college name or empty string",
  "work_history": [
    {{"company": "Company Name", "role": "Job Title", "duration": "e.g. 2 years 3 months"}}
  ],
  "projects_list": ["Project Name 1", "Project Name 2"]
}}
"""

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.2,
    )
    raw = response.choices[0].message.content.strip()
    raw = re.sub(r"^```(?:json)?\s*", "", raw)
    raw = re.sub(r"\s*```$", "", raw)
    return json.loads(raw)


# ── Scorer ────────────────────────────────────────────────────────────────────

def score_candidate(resume_features: dict, jd_features: dict, resume_filename: str) -> dict:
    """
    Score a candidate against the JD using OpenAI.
    Uses structured features from both resume and JD for accurate scoring.
    """
    api_key = os.getenv("OPENAI_API_KEY", "")
    client = OpenAI(api_key=api_key)

    prompt = f"""
You are an expert technical recruiter. Score this candidate against the job requirements.

JOB REQUIREMENTS:
- Role: {jd_features.get('role_summary', '')}
- Required Skills: {jd_features.get('required_skills', [])}
- Preferred Skills: {jd_features.get('preferred_skills', [])}
- Required Experience: {jd_features.get('required_experience', '')}
- Required Education: {jd_features.get('required_education', '')}

CANDIDATE PROFILE:
- Name: {resume_features.get('name', '')}
- Skills: {resume_features.get('extracted_skills', [])}
- Years of Experience: {resume_features.get('years_of_experience', 0)}
- Education: {resume_features.get('education_degree', '')} in {resume_features.get('education_field', '')} from {resume_features.get('education_university', '')}
- Work History: {resume_features.get('work_history', [])}

Return ONLY a valid JSON object (no markdown, no backticks) with exactly these fields:
{{
  "skills_score": <float 0.0 to 1.0>,
  "experience_score": <float 0.0 to 1.0>,
  "education_score": <float 0.0 to 1.0>,
  "matched_skills": ["skills present in both candidate and JD requirements"],
  "missing_skills": ["required skills missing from candidate"],
  "explanation": "2-3 sentence recruiter summary with specific details"
}}

Scoring guidelines:
- skills_score: % of required skills candidate has. 1.0 = all required skills present.
- experience_score: Compare required vs actual years/type. 1.0 = meets or exceeds.
- education_score: 1.0 = perfect match, 0.8 = related field, 0.6 = different field with experience, 0.5 = no degree but strong experience. If JD has no education requirement give 0.8.
- Be fair and objective. Do not inflate scores.
"""

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.2,
    )
    raw = response.choices[0].message.content.strip()
    raw = re.sub(r"^```(?:json)?\s*", "", raw)
    raw = re.sub(r"\s*```$", "", raw)
    result = json.loads(raw)

    # Weighted overall score
    result["overall_score"] = round(
        result["skills_score"] * 0.4
        + result["experience_score"] * 0.4
        + result["education_score"] * 0.2,
        2,
    )
    result["resume_filename"] = resume_filename
    return result


# ── Main Entry Point ──────────────────────────────────────────────────────────

def process_upload(jd_bytes: bytes, zip_bytes: bytes) -> tuple:
    """
    Main entry point called by the API route.
    Returns (jd_features, candidate_results)
    """
    jd_text = extract_text_from_pdf_bytes(jd_bytes)
    if not jd_text:
        raise ValueError("Could not extract text from the Job Description PDF.")

    resume_files = extract_pdfs_from_zip(zip_bytes)
    if not resume_files:
        raise ValueError("No PDF files found in the uploaded ZIP.")

    # Step 1: Parse JD into structured format
    try:
        jd_features = parse_job_description(jd_text)
    except Exception as e:
        raise ValueError(f"Could not parse job description: {str(e)}")

    # Step 2: Process each resume
    results = []
    for filename, pdf_bytes in resume_files.items():
        resume_text = extract_text_from_pdf_bytes(pdf_bytes)
        if not resume_text:
            continue
        try:
            # Extract structured features from resume
            resume_features = extract_resume_features(resume_text, filename)
            # Score candidate against JD
            scores = score_candidate(resume_features, jd_features, filename)
            # Merge everything
            combined = {**resume_features, **scores}
            results.append(combined)
        except Exception as e:
            results.append({
                "name": filename,
                "email": "",
                "phone": "",
                "resume_filename": filename,
                "extracted_skills": [],
                "years_of_experience": 0.0,
                "education_degree": "",
                "education_field": "",
                "education_university": "",
                "work_history": [],
                "projects_list": [],
                "skills_score": 0.0,
                "experience_score": 0.0,
                "education_score": 0.0,
                "overall_score": 0.0,
                "matched_skills": [],
                "missing_skills": [],
                "explanation": f"Could not analyze this resume: {str(e)}",
            })

    # Sort best match first
    results.sort(key=lambda x: x["overall_score"], reverse=True)
    for i, r in enumerate(results):
        r["candidate_id"] = i + 1

    return jd_features, results
