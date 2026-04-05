import React, { useEffect, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import api from "../services/api";
import Navbar from "../components/Navbar";
import "./Results.css";

const ScoreBar = ({ value, color }) => (
  <div className="score-bar-wrap">
    <div className="score-bar-fill" style={{ width: `${Math.round(value * 100)}%`, background: color }} />
    <span className="score-bar-pct">{Math.round(value * 100)}%</span>
  </div>
);

const STATUS_OPTIONS = [
  { value: "new",         label: "New",           color: "#64748b", bg: "#f1f5f9" },
  { value: "shortlisted", label: "✅ Shortlisted", color: "#15803d", bg: "#dcfce7" },
  { value: "on_hold",     label: "⏸ On Hold",     color: "#d97706", bg: "#fef3c7" },
  { value: "rejected",    label: "❌ Rejected",    color: "#dc2626", bg: "#fee2e2" },
];

const QUESTION_COLORS = {
  "Technical Skills": { bg: "#eff6ff", color: "#1d4ed8" },
  "Missing Skills":   { bg: "#fef2f2", color: "#dc2626" },
  "Experience":       { bg: "#f0fdf4", color: "#15803d" },
  "Behavioral":       { bg: "#fdf4ff", color: "#7c3aed" },
  "Problem Solving":  { bg: "#fff7ed", color: "#d97706" },
};

// ── Email Modal (existing) ─────────────────────────────────────────────────────
const EmailModal = ({ candidate, projectTitle, onClose, projectId }) => {
  const defaultSubject = `Regarding Your Application — ${projectTitle}`;
  const defaultBody =
`Dear ${candidate.name || "Candidate"},

Thank you for applying for the ${projectTitle} position.

We have reviewed your profile and are pleased to inform you that you have been shortlisted for the next round of our selection process.

We will be in touch shortly with further details regarding the next steps.

Best regards,
TalentAlign Recruitment Team`;

  const [subject, setSubject] = useState(defaultSubject);
  const [body,    setBody]    = useState(defaultBody);
  const [sending, setSending] = useState(false);
  const [sent,    setSent]    = useState(false);
  const [error,   setError]   = useState("");

  const handleSend = async () => {
    setSending(true);
    setError("");
    try {
      await api.post(
        `/projects/${projectId}/candidates/${candidate.candidate_id}/send-email`,
        { to_email: candidate.email, to_name: candidate.name || "Candidate", subject, body }
      );
      setSent(true);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to send email. Check your SMTP settings.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2>✉️ Send Email</h2>
            <p>To: <strong>{candidate.name}</strong> — {candidate.email}</p>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {sent ? (
          <div className="modal-success">
            <div className="modal-success-icon">✅</div>
            <h3>Email Sent!</h3>
            <p>Your email was successfully delivered to <strong>{candidate.email}</strong></p>
            <button className="btn-modal-primary" onClick={onClose}>Close</button>
          </div>
        ) : (
          <>
            {error && <div className="modal-error">{error}</div>}
            <div className="modal-body">
              <label className="modal-label">Subject</label>
              <input className="modal-input" value={subject} onChange={(e) => setSubject(e.target.value)} />
              <label className="modal-label">Message</label>
              <textarea className="modal-textarea" value={body} onChange={(e) => setBody(e.target.value)} rows={12} />
            </div>
            <div className="modal-footer">
              <button className="btn-modal-cancel" onClick={onClose}>Cancel</button>
              <button
                className="btn-modal-primary"
                onClick={handleSend}
                disabled={sending || !subject.trim() || !body.trim()}
              >
                {sending ? "Sending..." : "✉️ Send Email"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// ── Interview Questions Modal (NEW) ────────────────────────────────────────────
const InterviewModal = ({ candidate, questions, loading, onClose }) => (
  <div className="modal-overlay" onClick={onClose}>
    <div className="modal-box" onClick={(e) => e.stopPropagation()}>
      <div className="modal-header">
        <div>
          <h2>🎯 Interview Questions</h2>
          <p>For: <strong>{candidate.name || candidate.resume_filename}</strong></p>
        </div>
        <button className="modal-close" onClick={onClose}>✕</button>
      </div>

      {loading ? (
        <div className="modal-loading">
          <div className="spinner" />
          <p>AI is generating targeted questions...</p>
        </div>
      ) : (
        <div className="questions-list">
          {questions.map((q, i) => {
            const style = QUESTION_COLORS[q.category] || { bg: "#f8fafc", color: "#374151" };
            return (
              <div key={i} className="question-item">
                <div className="question-header">
                  <span className="question-category" style={{ background: style.bg, color: style.color }}>
                    {q.category}
                  </span>
                  <span className="question-number">Q{i + 1}</span>
                </div>
                <p className="question-text">{q.question}</p>
                {q.reason && <p className="question-reason">💡 {q.reason}</p>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  </div>
);

// ── LinkedIn Post Modal ───────────────────────────────────────────────────────
const LinkedInModal = ({ post, loading, onClose, onRegenerate }) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(post);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box linkedin-modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2>🔗 LinkedIn Post Generator</h2>
            <p>AI-generated hiring post — edit before sharing</p>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {loading ? (
          <div className="modal-loading">
            <div className="spinner" />
            <p>AI is crafting your LinkedIn post...</p>
          </div>
        ) : (
          <>
            <div className="modal-body">
              <div className="linkedin-preview-label">
                <span className="linkedin-dot" />
                Preview
              </div>
              <textarea
                className="modal-textarea linkedin-textarea"
                value={post}
                readOnly
                rows={12}
              />
            </div>
            <div className="modal-footer">
              <button className="btn-modal-cancel" onClick={onRegenerate}>
                🔄 Regenerate
              </button>
              <button className="btn-linkedin-copy" onClick={handleCopy}>
                {copied ? "✅ Copied!" : "📋 Copy to Clipboard"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// ── Main Results Component ─────────────────────────────────────────────────────
const Results = () => {
  const { projectId } = useParams();
  const location      = useLocation();
  const navigate      = useNavigate();

  const [data,              setData]              = useState(null);
  const [loading,           setLoading]           = useState(true);
  const [expanded,          setExpanded]          = useState(null);
  const [activeTab,         setActiveTab]         = useState({});
  const [notes,             setNotes]             = useState({});
  const [savingNote,        setSavingNote]        = useState({});
  const [candidateStatuses, setCandidateStatuses] = useState({});
  const [emailModal,        setEmailModal]        = useState(null);

  // ── Interview Questions state ──
  const [interviewModal,   setInterviewModal]   = useState(null);
  const [questions,        setQuestions]        = useState([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);

  // ── Re-screen state ──
  const [showRescreen,  setShowRescreen]  = useState(false);
  const [rescreenFile,  setRescreenFile]  = useState(null);
  const [rescreening,   setRescreening]   = useState(false);
  const [rescreenError, setRescreenError] = useState("");

  // ── LinkedIn Post state ──
  const [showLinkedIn,   setShowLinkedIn]   = useState(false);
  const [linkedInPost,   setLinkedInPost]   = useState("");
  const [loadingLinkedIn, setLoadingLinkedIn] = useState(false);

  useEffect(() => {
    if (location.state?.results) {
      initData(location.state.results);
      setLoading(false);
    } else {
      api.get(`/projects/${projectId}/results`)
        .then((res) => initData(res.data))
        .finally(() => setLoading(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const initData = (d) => {
    setData(d);
    const initialNotes    = {};
    const initialStatuses = {};
    (d.results || []).forEach((c) => {
      initialNotes[c.candidate_id]    = c.recruiter_note || "";
      initialStatuses[c.candidate_id] = c.status || "new";
    });
    setNotes(initialNotes);
    setCandidateStatuses(initialStatuses);
  };

  const toggleExpand  = (id)      => setExpanded(expanded === id ? null : id);
  const setTab        = (id, tab) => setActiveTab((prev) => ({ ...prev, [id]: tab }));
  const getTab        = (id)      => activeTab[id] || "summary";
  const scoreColor    = (s)       => s >= 0.75 ? "#16a34a" : s >= 0.50 ? "#d97706" : "#dc2626";

  const saveNote = async (candidateId) => {
    setSavingNote((prev) => ({ ...prev, [candidateId]: true }));
    try {
      await api.patch(`/projects/${projectId}/candidates/${candidateId}`, {
        recruiter_note: notes[candidateId],
      });
    } finally {
      setSavingNote((prev) => ({ ...prev, [candidateId]: false }));
    }
  };

  const updateStatus = async (candidateId, status) => {
    setCandidateStatuses((prev) => ({ ...prev, [candidateId]: status }));
    await api.patch(`/projects/${projectId}/candidates/${candidateId}`, { status });
  };

  const getStatusStyle = (status) => {
    const s = STATUS_OPTIONS.find((o) => o.value === status) || STATUS_OPTIONS[0];
    return { color: s.color, background: s.bg };
  };

  // ── Generate Interview Questions (shortlisted only) ────────────────────────
  const handleGenerateQuestions = async (candidate) => {
    setInterviewModal(candidate);
    setQuestions([]);
    setLoadingQuestions(true);
    try {
      const res = await api.post(
        `/projects/${projectId}/candidates/${candidate.candidate_id}/interview-questions`
      );
      setQuestions(res.data.questions || []);
    } catch (err) {
      const msg = err.response?.data?.detail || "Failed to generate questions.";
      setQuestions([{ category: "Error", question: msg, reason: "" }]);
    } finally {
      setLoadingQuestions(false);
    }
  };

  // ── Re-screen with New JD ──────────────────────────────────────────────────
  const handleRescreen = async () => {
    if (!rescreenFile) { setRescreenError("Please select a new JD PDF."); return; }
    if (!rescreenFile.name.toLowerCase().endsWith(".pdf")) {
      setRescreenError("File must be a PDF."); return;
    }
    setRescreenError("");
    setRescreening(true);
    try {
      const formData = new FormData();
      formData.append("jd_file", rescreenFile);
      const res = await api.post(
        `/projects/${projectId}/rescreen`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      initData(res.data);
      setShowRescreen(false);
      setRescreenFile(null);
      alert("✅ Re-screening complete! Results updated with new JD.");
    } catch (err) {
      setRescreenError(err.response?.data?.detail || "Re-screening failed.");
    } finally {
      setRescreening(false);
    }
  };

  // ── Generate LinkedIn Post ──────────────────────────────────────────────────
  const handleGenerateLinkedIn = async () => {
    setShowLinkedIn(true);
    setLinkedInPost("");
    setLoadingLinkedIn(true);
    try {
      const res = await api.post(`/projects/${projectId}/linkedin-post`);
      setLinkedInPost(res.data.post || "");
    } catch (err) {
      setLinkedInPost(err.response?.data?.detail || "Failed to generate post.");
    } finally {
      setLoadingLinkedIn(false);
    }
  };

  return (
    <div className="results-page">
      <Navbar />
      <div className="results-content">

        {loading && (
          <div className="results-loading">
            <div className="spinner" />
            <p>Loading results...</p>
          </div>
        )}

        {data && (
          <>
            {/* Header */}
            <div className="results-header">
              <div>
                <h1>{data.title}</h1>
                <p>{data.total_candidates} candidates ranked by AI match score</p>
              </div>
              <div className="results-header-actions">
                {/* Re-screen button */}
                <button className="btn-rescreen" onClick={() => setShowRescreen(!showRescreen)}>
                  🔄 Re-screen with New JD
                </button>
                {/* LinkedIn Post button */}
                <button className="btn-linkedin" onClick={handleGenerateLinkedIn}>
                  🔗 LinkedIn Post
                </button>
                <button className="btn-back" onClick={() => navigate("/dashboard")}>← Dashboard</button>
              </div>
            </div>

            {/* Re-screen panel */}
            {showRescreen && (
              <div className="rescreen-panel">
                <h3>🔄 Re-screen with New Job Description</h3>
                <p>
                  Upload a new JD PDF. All <strong>{data.total_candidates} existing candidates</strong> will
                  be re-scored. No need to re-upload resumes.
                </p>
                {rescreenError && <div className="rescreen-error">{rescreenError}</div>}
                <div className="rescreen-form">
                  <label className="rescreen-file-label">
                    {rescreenFile ? `✅ ${rescreenFile.name}` : "Choose new JD PDF"}
                    <input type="file" accept=".pdf" onChange={(e) => setRescreenFile(e.target.files[0])} hidden />
                  </label>
                  <button
                    className="btn-rescreen-submit"
                    onClick={handleRescreen}
                    disabled={rescreening || !rescreenFile}
                  >
                    {rescreening ? "Re-screening... Please wait" : "Start Re-screening →"}
                  </button>
                  <button className="btn-rescreen-cancel" onClick={() => setShowRescreen(false)}>
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* JD Panel */}
            {data.jd_structure && (
              <div className="jd-panel">
                <h3>📋 Job Requirements</h3>
                <div className="jd-grid">
                  <div className="jd-item">
                    <span className="jd-label">Experience</span>
                    <span className="jd-value">
                      {data.jd_structure.required_experience_years > 0
                        ? `${data.jd_structure.required_experience_years}+ years`
                        : "Not specified"}
                    </span>
                  </div>
                  <div className="jd-item">
                    <span className="jd-label">Education</span>
                    <span className="jd-value">{data.jd_structure.required_education || "Not specified"}</span>
                  </div>
                  <div className="jd-item jd-item-full">
                    <span className="jd-label">Required Skills</span>
                    <div className="tags-wrap">
                      {(data.jd_structure.required_skills || []).map((s) => (
                        <span key={s} className="tag-blue">{s}</span>
                      ))}
                    </div>
                  </div>
                  {(data.jd_structure.nice_to_have_skills || []).length > 0 && (
                    <div className="jd-item jd-item-full">
                      <span className="jd-label">Nice to Have</span>
                      <div className="tags-wrap">
                        {data.jd_structure.nice_to_have_skills.map((s) => (
                          <span key={s} className="tag-gray">{s}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {data.results.length === 0 ? (
              <div className="no-results">No candidates processed yet.</div>
            ) : (
              <div className="table-wrap">
                <table className="results-table">
                  <thead>
                    <tr>
                      <th>Rank</th>
                      <th>Candidate</th>
                      <th>Overall</th>
                      <th>Skills</th>
                      <th>Experience</th>
                      <th>Education</th>
                      <th>Matched</th>
                      <th>Missing</th>
                      <th>Status</th>
                      <th>Email</th>
                      <th>Interview Q</th>
                      <th>Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.results.map((c, i) => (
                      <React.Fragment key={c.candidate_id}>
                        <tr className={i === 0 ? "row-top" : ""}>

                          <td className="td-rank">{i === 0 ? "🏆" : `#${i + 1}`}</td>

                          <td className="td-name">
                            <div className="cand-name">{c.name || c.resume_filename}</div>
                            {c.email && <div className="cand-email">{c.email}</div>}
                            {c.phone && <div className="cand-email">{c.phone}</div>}
                          </td>

                          <td className="td-overall">
                            <span style={{ color: scoreColor(c.overall_score), fontWeight: 800, fontSize: 18 }}>
                              {Math.round(c.overall_score * 100)}%
                            </span>
                          </td>

                          <td><ScoreBar value={c.skills_score}     color="#2563eb" /></td>
                          <td><ScoreBar value={c.experience_score} color="#7c3aed" /></td>
                          <td><ScoreBar value={c.education_score}  color="#0891b2" /></td>

                          <td className="td-tags">
                            {c.matched_skills.slice(0, 3).map((s) => (
                              <span key={s} className="tag-green">{s}</span>
                            ))}
                            {c.matched_skills.length > 3 && (
                              <span className="tag-more">+{c.matched_skills.length - 3}</span>
                            )}
                          </td>

                          <td className="td-tags">
                            {c.missing_skills.slice(0, 2).map((s) => (
                              <span key={s} className="tag-red">{s}</span>
                            ))}
                            {c.missing_skills.length > 2 && (
                              <span className="tag-more">+{c.missing_skills.length - 2}</span>
                            )}
                          </td>

                          {/* Status */}
                          <td>
                            <select
                              className="status-select"
                              value={candidateStatuses[c.candidate_id] || "new"}
                              onChange={(e) => updateStatus(c.candidate_id, e.target.value)}
                              style={getStatusStyle(candidateStatuses[c.candidate_id])}
                            >
                              {STATUS_OPTIONS.map((o) => (
                                <option key={o.value} value={o.value}>{o.label}</option>
                              ))}
                            </select>
                          </td>

                          {/* Email (existing) */}
                          <td>
                            {c.email ? (
                              <button
                                className="btn-email"
                                onClick={() => setEmailModal(c)}
                                title={`Send email to ${c.email}`}
                              >
                                ✉️ Send
                              </button>
                            ) : (
                              <span style={{ color: "var(--text3)", fontSize: 12 }}>—</span>
                            )}
                          </td>

                          {/* Interview Questions (shortlisted only) */}
                          <td>
                            {candidateStatuses[c.candidate_id] === "shortlisted" ? (
                              <button
                                className="btn-interview"
                                onClick={() => handleGenerateQuestions(c)}
                                title="Generate interview questions"
                              >
                                🎯 Questions
                              </button>
                            ) : (
                              <span className="interview-locked" title="Mark as Shortlisted to generate questions">
                                🔒 Shortlist first
                              </span>
                            )}
                          </td>

                          {/* Details */}
                          <td>
                            <button className="btn-expand" onClick={() => toggleExpand(c.candidate_id)}>
                              {expanded === c.candidate_id ? "▲ Hide" : "▼ View"}
                            </button>
                          </td>

                        </tr>

                        {/* Expanded Row */}
                        {expanded === c.candidate_id && (
                          <tr className="row-explanation">
                            <td colSpan={12}>
                              <div className="explanation-box">
                                <div className="detail-tabs">
                                  {["summary", "skills", "experience", "education", "projects", "notes"].map((tab) => (
                                    <button
                                      key={tab}
                                      className={`detail-tab ${getTab(c.candidate_id) === tab ? "active" : ""}`}
                                      onClick={() => setTab(c.candidate_id, tab)}
                                    >
                                      {tab === "notes" ? "📝 Notes" : tab.charAt(0).toUpperCase() + tab.slice(1)}
                                    </button>
                                  ))}
                                </div>

                                {getTab(c.candidate_id) === "summary" && (
                                  <div className="tab-content">
                                    <strong>AI Recruiter Summary</strong>
                                    <p>{c.explanation}</p>
                                  </div>
                                )}
                                {getTab(c.candidate_id) === "skills" && (
                                  <div className="tab-content">
                                    <div className="all-skills-row">
                                      <div>
                                        <strong>All Extracted Skills</strong>
                                        <div className="tags-wrap">
                                          {(c.extracted_skills || []).map((s) => (
                                            <span key={s} className="tag-blue">{s}</span>
                                          ))}
                                        </div>
                                      </div>
                                      <div>
                                        <strong>✅ Matched</strong>
                                        <div className="tags-wrap">
                                          {c.matched_skills.map((s) => (
                                            <span key={s} className="tag-green">{s}</span>
                                          ))}
                                        </div>
                                      </div>
                                      <div>
                                        <strong>❌ Missing</strong>
                                        <div className="tags-wrap">
                                          {c.missing_skills.map((s) => (
                                            <span key={s} className="tag-red">{s}</span>
                                          ))}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                )}
                                {getTab(c.candidate_id) === "experience" && (
                                  <div className="tab-content">
                                    <strong>Total Experience: {c.experience_years || 0} years</strong>
                                    <div className="work-history">
                                      {(c.work_history || []).length === 0 ? (
                                        <p>No work history extracted.</p>
                                      ) : (
                                        c.work_history.map((w, idx) => (
                                          <div key={idx} className="work-item">
                                            <div className="work-role">{w.role}</div>
                                            <div className="work-company">{w.company} · {w.duration}</div>
                                          </div>
                                        ))
                                      )}
                                    </div>
                                  </div>
                                )}
                                {getTab(c.candidate_id) === "education" && (
                                  <div className="tab-content">
                                    <div className="edu-block">
                                      <div className="edu-degree">
                                        {c.education_degree || "Degree not found"}
                                        {c.education_field ? ` in ${c.education_field}` : ""}
                                      </div>
                                      <div className="edu-university">{c.education_university || ""}</div>
                                    </div>
                                  </div>
                                )}
                                {getTab(c.candidate_id) === "projects" && (
                                  <div className="tab-content">
                                    {(c.projects_list || []).length === 0 ? (
                                      <p>No projects extracted.</p>
                                    ) : (
                                      <ul className="projects-list">
                                        {c.projects_list.map((p, idx) => (
                                          <li key={idx}>{p}</li>
                                        ))}
                                      </ul>
                                    )}
                                  </div>
                                )}
                                {getTab(c.candidate_id) === "notes" && (
                                  <div className="tab-content">
                                    <strong>Recruiter Notes</strong>
                                    <p className="notes-hint">Private notes visible only to you.</p>
                                    <textarea
                                      className="notes-textarea"
                                      placeholder='Add your notes — "Called, interested", "Salary too high"...'
                                      value={notes[c.candidate_id] || ""}
                                      onChange={(e) => setNotes((prev) => ({ ...prev, [c.candidate_id]: e.target.value }))}
                                      rows={4}
                                    />
                                    <button
                                      className="btn-save-note"
                                      onClick={() => saveNote(c.candidate_id)}
                                      disabled={savingNote[c.candidate_id]}
                                    >
                                      {savingNote[c.candidate_id] ? "Saving..." : "💾 Save Note"}
                                    </button>
                                    {notes[c.candidate_id] && (
                                      <div className="note-preview">
                                        <span>📝</span> {notes[c.candidate_id]}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}

                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

      </div>

      {/* Email Modal (existing) */}
      {emailModal && (
        <EmailModal
          candidate={emailModal}
          projectTitle={data?.title || ""}
          projectId={projectId}
          onClose={() => setEmailModal(null)}
        />
      )}

      {/* Interview Questions Modal (new) */}
      {interviewModal && (
        <InterviewModal
          candidate={interviewModal}
          questions={questions}
          loading={loadingQuestions}
          onClose={() => { setInterviewModal(null); setQuestions([]); }}
        />
      )}

      {/* LinkedIn Post Modal */}
      {showLinkedIn && (
        <LinkedInModal
          post={linkedInPost}
          loading={loadingLinkedIn}
          onClose={() => setShowLinkedIn(false)}
          onRegenerate={handleGenerateLinkedIn}
        />
      )}

    </div>
  );
};

export default Results;
