import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./JobBoard.css";

const API = process.env.REACT_APP_API_URL || "http://localhost:8000";

// ── Single Job Apply Page ─────────────────────────────────────────────────────
const JobApplyPage = ({ jobId }) => {
  const navigate = useNavigate();
  const [job,       setJob]       = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [notFound,  setNotFound]  = useState(false);
  const [step,      setStep]      = useState("view"); // view | apply | success | error
  const [errMsg,    setErrMsg]    = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    applicant_name: "", applicant_email: "",
    applicant_phone: "", cover_message: "",
  });

  useEffect(() => {
    fetch(`${API}/jobs/public/${jobId}`)
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then(setJob)
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [jobId]);

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.applicant_name.trim() || !form.applicant_email.trim()) return;
    setSubmitting(true);
    setErrMsg("");
    try {
      const res = await fetch(`${API}/jobs/public/${jobId}/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Application failed");
      setStep("success");
    } catch (err) {
      setErrMsg(err.message);
      setStep("error");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="jb-page">
      <div className="jb-loading"><div className="jb-spinner" /><p>Loading job details…</p></div>
    </div>
  );

  if (notFound) return (
    <div className="jb-page">
      <div className="jb-not-found">
        <div className="jb-not-found-icon">🔍</div>
        <h2>Job not found</h2>
        <p>This position may no longer be active or the link may have expired.</p>
        <button className="jb-btn-primary" onClick={() => navigate("/jobs")}>Browse All Jobs</button>
      </div>
    </div>
  );

  if (step === "success") return (
    <div className="jb-page">
      <div className="jb-success-card">
        <div className="jb-success-icon">🎉</div>
        <h2>Application Submitted!</h2>
        <p>Thank you <strong>{form.applicant_name}</strong>! Your application for <strong>{job.title}</strong> has been received.</p>
        <p className="jb-success-sub">The recruitment team will review your application and get back to you at <strong>{form.applicant_email}</strong>.</p>
        <button className="jb-btn-primary" onClick={() => navigate("/jobs")}>Browse More Jobs</button>
      </div>
    </div>
  );

  return (
    <div className="jb-page">
      {/* Header */}
      <div className="jb-header">
        <div className="jb-logo" onClick={() => navigate("/jobs")}>
          <div className="jb-logo-mark">TA</div>
          <span className="jb-logo-text">TalentAlign AI</span>
        </div>
        <button className="jb-btn-outline" onClick={() => navigate("/jobs")}>← All Jobs</button>
      </div>

      <div className="jb-content">
        {/* Job detail card */}
        <div className="jb-detail-card">
          <div className="jb-detail-header">
            <div>
              <h1 className="jb-detail-title">{job.title}</h1>
              <div className="jb-detail-meta">
                <span className="jb-meta-chip">🏢 {job.company_name}</span>
                {job.location && <span className="jb-meta-chip">📍 {job.location}</span>}
                <span className="jb-meta-chip">💼 {job.employment_type}</span>
              </div>
            </div>
            {step === "view" && (
              <button className="jb-btn-primary jb-btn-apply" onClick={() => setStep("apply")}>
                Apply Now →
              </button>
            )}
          </div>

          <div className="jb-detail-body">
            <div className="jb-section">
              <h3>About this role</h3>
              <p className="jb-description">{job.description}</p>
            </div>

            {(job.required_skills || []).length > 0 && (
              <div className="jb-section">
                <h3>Required Skills</h3>
                <div className="jb-skills-wrap">
                  {job.required_skills.map((s) => (
                    <span key={s} className="jb-skill-chip">{s}</span>
                  ))}
                </div>
              </div>
            )}

            <div className="jb-requirements-grid">
              {job.experience_required && (
                <div className="jb-req-item">
                  <span className="jb-req-label">Experience</span>
                  <span className="jb-req-value">{job.experience_required}</span>
                </div>
              )}
              {job.education_required && (
                <div className="jb-req-item">
                  <span className="jb-req-label">Education</span>
                  <span className="jb-req-value">{job.education_required}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Application form */}
        {step === "apply" && (
          <div className="jb-apply-card">
            <h2 className="jb-apply-title">Apply for {job.title}</h2>
            <p className="jb-apply-sub">at {job.company_name}</p>

            {errMsg && <div className="jb-error">{errMsg}</div>}

            <form className="jb-form" onSubmit={handleSubmit}>
              <div className="jb-form-row">
                <div className="jb-form-group">
                  <label>Full Name <span className="jb-required">*</span></label>
                  <input name="applicant_name" value={form.applicant_name}
                    onChange={handleChange} placeholder="Your full name" required />
                </div>
                <div className="jb-form-group">
                  <label>Email Address <span className="jb-required">*</span></label>
                  <input name="applicant_email" type="email" value={form.applicant_email}
                    onChange={handleChange} placeholder="your@email.com" required />
                </div>
              </div>
              <div className="jb-form-group">
                <label>Phone Number <span className="jb-optional">(optional)</span></label>
                <input name="applicant_phone" value={form.applicant_phone}
                  onChange={handleChange} placeholder="+91 98765 43210" />
              </div>
              <div className="jb-form-group">
                <label>Cover Message <span className="jb-optional">(optional)</span></label>
                <textarea name="cover_message" value={form.cover_message}
                  onChange={handleChange} rows={5}
                  placeholder="Tell us why you're a great fit for this role…" />
              </div>
              <div className="jb-form-actions">
                <button type="button" className="jb-btn-outline" onClick={() => setStep("view")}>
                  ← Back
                </button>
                <button type="submit" className="jb-btn-primary" disabled={submitting}>
                  {submitting ? "Submitting…" : "Submit Application →"}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

// ── Public Job Board (all jobs listing) ──────────────────────────────────────
const JobBoardList = () => {
  const navigate = useNavigate();
  const [jobs,    setJobs]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState("");

  useEffect(() => {
    fetch(`${API}/jobs/public/all`)
      .then((r) => r.json())
      .then(setJobs)
      .catch(() => setJobs([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = jobs.filter((j) =>
    j.title.toLowerCase().includes(search.toLowerCase()) ||
    j.company_name.toLowerCase().includes(search.toLowerCase()) ||
    (j.required_skills || []).some((s) => s.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="jb-page">
      <div className="jb-header">
        <div className="jb-logo">
          <div className="jb-logo-mark">TA</div>
          <span className="jb-logo-text">TalentAlign AI</span>
        </div>
        <button className="jb-btn-outline" onClick={() => navigate("/login")}>HR Login</button>
      </div>

      <div className="jb-content jb-list-content">
        <div className="jb-list-hero">
          <h1>Open Positions</h1>
          <p>Find your next opportunity. Apply directly — no account needed.</p>
          <div className="jb-search-wrap">
            <span className="jb-search-icon">🔍</span>
            <input
              className="jb-search-input"
              placeholder="Search by role, company or skill…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="jb-loading"><div className="jb-spinner" /><p>Loading jobs…</p></div>
        ) : filtered.length === 0 ? (
          <div className="jb-empty">
            <div className="jb-empty-icon">📭</div>
            <h3>{search ? "No jobs match your search" : "No open positions right now"}</h3>
            <p>{search ? "Try a different keyword." : "Check back soon!"}</p>
          </div>
        ) : (
          <div className="jb-jobs-grid">
            {filtered.map((job) => (
              <div key={job.id} className="jb-job-card" onClick={() => navigate(`/jobs/${job.id}`)}>
                <div className="jb-job-card-header">
                  <div className="jb-job-icon">{job.employment_type === "Internship" ? "🎓" : "💼"}</div>
                  <span className="jb-job-type-badge">{job.employment_type}</span>
                </div>
                <h3 className="jb-job-title">{job.title}</h3>
                <p className="jb-job-company">🏢 {job.company_name}</p>
                {job.location && <p className="jb-job-location">📍 {job.location}</p>}
                <p className="jb-job-desc">{job.description.slice(0, 100)}…</p>
                <div className="jb-job-skills">
                  {(job.required_skills || []).slice(0, 4).map((s) => (
                    <span key={s} className="jb-skill-chip-sm">{s}</span>
                  ))}
                  {(job.required_skills || []).length > 4 && (
                    <span className="jb-skill-more">+{job.required_skills.length - 4}</span>
                  )}
                </div>
                <button className="jb-card-apply-btn">Apply Now →</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ── Router wrapper ─────────────────────────────────────────────────────────────
const JobBoard = () => {
  const { jobId } = useParams();
  return jobId ? <JobApplyPage jobId={jobId} /> : <JobBoardList />;
};

export default JobBoard;
