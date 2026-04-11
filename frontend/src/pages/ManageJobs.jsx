import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import api from "../services/api";
import { getUpgradeMessage } from "../utils/planGate";
import UpgradeModal from "../components/UpgradeModal";
import "./ManageJobs.css";

const EMPLOYMENT_TYPES = ["Full-time", "Part-time", "Contract", "Internship"];
const FRONTEND_URL = window.location.origin;

const emptyForm = {
  title: "", description: "", required_skills: "",
  experience_required: "", education_required: "",
  location: "", employment_type: "Full-time",
};

const ManageJobs = () => {
  const navigate = useNavigate();
  const [jobs,      setJobs]      = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [showForm,  setShowForm]  = useState(false);
  const [editJob,   setEditJob]   = useState(null); // null = create, obj = edit
  const [form,      setForm]      = useState(emptyForm);
  const [saving,    setSaving]    = useState(false);
  const [errMsg,    setErrMsg]    = useState("");
  const [apps,      setApps]      = useState({}); // jobId -> applications[]
  const [viewApps,  setViewApps]  = useState(null); // jobId being viewed
  const [copied,    setCopied]    = useState(null);
  const [upgradeMsg, setUpgradeMsg] = useState("");

  useEffect(() => { fetchJobs(); }, []);

  async function fetchJobs() {
    setLoading(true);
    try {
      const res = await api.get("/jobs/my");
      setJobs(res.data);
    } catch { setJobs([]); }
    finally { setLoading(false); }
  }

  async function fetchApps(jobId) {
    if (apps[jobId]) { setViewApps(jobId); return; }
    try {
      const res = await api.get(`/jobs/${jobId}/applications`);
      setApps((p) => ({ ...p, [jobId]: res.data }));
      setViewApps(jobId);
    } catch { setApps((p) => ({ ...p, [jobId]: [] })); setViewApps(jobId); }
  }

  function openCreate() {
    setEditJob(null); setForm(emptyForm); setErrMsg(""); setShowForm(true);
  }

  function openEdit(job) {
    setEditJob(job);
    setForm({
      title: job.title, description: job.description,
      required_skills: (job.required_skills || []).join(", "),
      experience_required: job.experience_required || "",
      education_required: job.education_required || "",
      location: job.location || "", employment_type: job.employment_type || "Full-time",
    });
    setErrMsg(""); setShowForm(true);
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true); setErrMsg("");
    const payload = {
      ...form,
      required_skills: form.required_skills.split(",").map((s) => s.trim()).filter(Boolean),
    };
    try {
      if (editJob) {
        await api.patch(`/jobs/${editJob.id}`, payload);
      } else {
        await api.post("/jobs/", payload);
      }
      setShowForm(false);
      fetchJobs();
    } catch (err) {
      const upgradeMessage = getUpgradeMessage(err);
      if (upgradeMessage) {
        setUpgradeMsg(upgradeMessage);
      }
      setErrMsg(upgradeMessage || err.response?.data?.detail || "Failed to save job posting.");
    } finally { setSaving(false); }
  }

  async function handleToggle(jobId) {
    await api.patch(`/jobs/${jobId}/toggle`);
    fetchJobs();
  }

  async function handleDelete(jobId) {
    if (!window.confirm("Delete this job posting? Applications will also be deleted.")) return;
    await api.delete(`/jobs/${jobId}`);
    fetchJobs();
  }

  async function handleAppStatus(jobId, appId, status) {
    await api.patch(`/jobs/${jobId}/applications/${appId}?status=${status}`);
    const res = await api.get(`/jobs/${jobId}/applications`);
    setApps((p) => ({ ...p, [jobId]: res.data }));
  }

  function copyLink(jobId) {
    navigator.clipboard.writeText(`${FRONTEND_URL}/jobs/${jobId}`);
    setCopied(jobId);
    setTimeout(() => setCopied(null), 2000);
  }

  const APP_STATUS_COLORS = {
    new: { bg: "rgba(99,140,255,0.1)", color: "var(--accent)" },
    reviewing: { bg: "rgba(251,191,36,0.1)", color: "var(--warning)" },
    shortlisted: { bg: "rgba(52,211,153,0.1)", color: "var(--accent3)" },
    rejected: { bg: "rgba(248,113,113,0.1)", color: "var(--danger)" },
  };

  return (
    <>
      <Navbar />
      <div className="mj-page">
        <div className="mj-content">

          {/* Header */}
          <div className="mj-header">
            <div>
              <h1>Job Postings</h1>
              <p>Create and manage open positions. Share links with candidates via recommendation emails.</p>
            </div>
            <button className="mj-btn-primary" onClick={openCreate}>+ New Job Posting</button>
          </div>

          {/* Form */}
          {showForm && (
            <div className="mj-form-card">
              <h2>{editJob ? "Edit Job Posting" : "New Job Posting"}</h2>
              {errMsg && <div className="mj-error">{errMsg}</div>}
              <form className="mj-form" onSubmit={handleSave}>
                <div className="mj-form-row">
                  <div className="mj-form-group">
                    <label>Job Title *</label>
                    <input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                      placeholder="e.g. Frontend Developer" required />
                  </div>
                  <div className="mj-form-group">
                    <label>Employment Type</label>
                    <select value={form.employment_type} onChange={(e) => setForm((p) => ({ ...p, employment_type: e.target.value }))}>
                      {EMPLOYMENT_TYPES.map((t) => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                </div>
                <div className="mj-form-group">
                  <label>Job Description *</label>
                  <textarea value={form.description} rows={5}
                    onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                    placeholder="Describe the role, responsibilities, team culture…" required />
                </div>
                <div className="mj-form-group">
                  <label>Required Skills <span className="mj-hint-text">(comma-separated)</span></label>
                  <input value={form.required_skills}
                    onChange={(e) => setForm((p) => ({ ...p, required_skills: e.target.value }))}
                    placeholder="React, Node.js, SQL, Python" />
                </div>
                <div className="mj-form-row">
                  <div className="mj-form-group">
                    <label>Experience Required</label>
                    <input value={form.experience_required}
                      onChange={(e) => setForm((p) => ({ ...p, experience_required: e.target.value }))}
                      placeholder="e.g. 2+ years of frontend development" />
                  </div>
                  <div className="mj-form-group">
                    <label>Education Required</label>
                    <input value={form.education_required}
                      onChange={(e) => setForm((p) => ({ ...p, education_required: e.target.value }))}
                      placeholder="e.g. B.Tech in Computer Science" />
                  </div>
                </div>
                <div className="mj-form-group">
                  <label>Location</label>
                  <input value={form.location}
                    onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))}
                    placeholder="e.g. Bangalore, India / Remote" />
                </div>
                <div className="mj-form-actions">
                  <button type="button" className="mj-btn-outline" onClick={() => setShowForm(false)}>Cancel</button>
                  <button type="submit" className="mj-btn-primary" disabled={saving}>
                    {saving ? "Saving…" : editJob ? "Update Posting" : "Create Posting"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Jobs list */}
          {loading ? (
            <div className="mj-loading"><div className="mj-spinner" /><p>Loading job postings…</p></div>
          ) : jobs.length === 0 ? (
            <div className="mj-empty">
              <div className="mj-empty-icon">📋</div>
              <h3>No job postings yet</h3>
              <p>Create your first job posting to start sending candidates apply links via recommendation emails.</p>
              <button className="mj-btn-primary" onClick={openCreate}>Create First Posting</button>
            </div>
          ) : (
            <div className="mj-jobs-list">
              {jobs.map((job) => (
                <div key={job.id} className={`mj-job-card ${!job.is_active ? "mj-job-inactive" : ""}`}>
                  <div className="mj-job-card-top">
                    <div className="mj-job-info">
                      <div className="mj-job-title-row">
                        <h3>{job.title}</h3>
                        <span className={`mj-status-badge ${job.is_active ? "mj-active" : "mj-inactive"}`}>
                          {job.is_active ? "● Active" : "○ Inactive"}
                        </span>
                      </div>
                      <div className="mj-job-meta">
                        <span>💼 {job.employment_type}</span>
                        {job.location && <span>📍 {job.location}</span>}
                        <span>📅 {new Date(job.created_at).toLocaleDateString()}</span>
                      </div>
                      <p className="mj-job-desc-preview">{job.description.slice(0, 120)}…</p>
                      <div className="mj-job-skills">
                        {(job.required_skills || []).slice(0, 6).map((s) => (
                          <span key={s} className="mj-skill-chip">{s}</span>
                        ))}
                        {(job.required_skills || []).length > 6 && (
                          <span className="mj-skill-more">+{job.required_skills.length - 6}</span>
                        )}
                      </div>

                      {/* Apply link */}
                      <div className="mj-link-row">
                        <span className="mj-link-label">Apply link:</span>
                        <code className="mj-link-text">{FRONTEND_URL}/jobs/{job.id}</code>
                        <button className="mj-btn-copy" onClick={() => copyLink(job.id)}>
                          {copied === job.id ? "✅ Copied!" : "📋 Copy"}
                        </button>
                      </div>
                    </div>

                    <div className="mj-job-actions">
                      <button className="mj-btn-sm mj-btn-apps" onClick={() => fetchApps(job.id)}>
                        📥 Applications
                      </button>
                      <button className="mj-btn-sm" onClick={() => openEdit(job)}>✏️ Edit</button>
                      <button className="mj-btn-sm" onClick={() => handleToggle(job.id)}>
                        {job.is_active ? "⏸ Pause" : "▶ Activate"}
                      </button>
                      <button className="mj-btn-sm mj-btn-delete" onClick={() => handleDelete(job.id)}>🗑 Delete</button>
                    </div>
                  </div>

                  {/* Applications panel */}
                  {viewApps === job.id && (
                    <div className="mj-apps-panel">
                      <div className="mj-apps-header">
                        <h4>Applications ({(apps[job.id] || []).length})</h4>
                        <button className="mj-btn-sm" onClick={() => setViewApps(null)}>✕ Close</button>
                      </div>
                      {(apps[job.id] || []).length === 0 ? (
                        <p className="mj-apps-empty">No applications yet.</p>
                      ) : (
                        <div className="mj-apps-table-wrap">
                          <table className="mj-apps-table">
                            <thead>
                              <tr><th>Name</th><th>Email</th><th>Phone</th><th>Message</th><th>Applied</th><th>Status</th></tr>
                            </thead>
                            <tbody>
                              {(apps[job.id] || []).map((app) => (
                                <tr key={app.id}>
                                  <td><strong>{app.applicant_name}</strong></td>
                                  <td className="mj-td-email">{app.applicant_email}</td>
                                  <td>{app.applicant_phone || "—"}</td>
                                  <td className="mj-td-msg">{app.cover_message ? app.cover_message.slice(0, 60) + "…" : "—"}</td>
                                  <td>{new Date(app.applied_at).toLocaleDateString()}</td>
                                  <td>
                                    <select
                                      className="mj-app-status-select"
                                      value={app.status}
                                      onChange={(e) => handleAppStatus(job.id, app.id, e.target.value)}
                                      style={APP_STATUS_COLORS[app.status] || {}}
                                    >
                                      <option value="new">New</option>
                                      <option value="reviewing">Reviewing</option>
                                      <option value="shortlisted">Shortlisted</option>
                                      <option value="rejected">Rejected</option>
                                    </select>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <UpgradeModal open={!!upgradeMsg} message={upgradeMsg} onClose={() => setUpgradeMsg("")} />
    </>
  );
};

export default ManageJobs;
