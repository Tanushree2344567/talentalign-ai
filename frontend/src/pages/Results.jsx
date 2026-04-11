import React, { useEffect, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import api from "../services/api";
import Navbar from "../components/Navbar";
import { getUpgradeMessage } from "../utils/planGate";
import UpgradeModal from "../components/UpgradeModal";
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
const EmailModal = ({ candidate, projectTitle, onClose, projectId, onUpgrade }) => {
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
      const upgradeMessage = getUpgradeMessage(err);
      if (upgradeMessage) onUpgrade?.(upgradeMessage);
      setError(upgradeMessage || err.response?.data?.detail || "Failed to send email. Check your SMTP settings.");
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

// ── Job Recommendation Modal ──────────────────────────────────────────────────
const JobRecommendModal = ({ candidate, projectTitle, projectId, onClose, onUpgrade }) => {
  const [step, setStep]           = React.useState("input"); // input | loading | preview | sent | error
  const [otherRoles, setOtherRoles] = React.useState("");
  const [recs, setRecs]           = React.useState(null);
  const [sending, setSending]     = React.useState(false);
  const [editBody, setEditBody]   = React.useState("");
  const [editSubject, setEditSubject] = React.useState("");
  const [errorMsg, setErrorMsg]   = React.useState("");

  const handleGenerate = async () => {
    if (!otherRoles.trim()) return;
    setStep("loading");
    try {
      const res = await api.post(
        `/projects/${projectId}/candidates/${candidate.candidate_id}/job-recommendations`,
        { other_roles: otherRoles.trim() }
      );
      setRecs(res.data);
      setEditSubject(res.data.email_subject);
      setEditBody(res.data.email_body);
      setStep("preview");
    } catch (err) {
      const upgradeMessage = getUpgradeMessage(err);
      if (upgradeMessage) onUpgrade?.(upgradeMessage);
      setErrorMsg(upgradeMessage || err.response?.data?.detail || "Failed to generate recommendations.");
      setStep("error");
    }
  };

  const handleSend = async () => {
    setSending(true);
    try {
      await api.post(
        `/projects/${projectId}/candidates/${candidate.candidate_id}/send-email`,
        {
          to_email: candidate.email,
          to_name: candidate.name || "Candidate",
          subject: editSubject,
          body: editBody,
        }
      );
      setStep("sent");
    } catch (err) {
      const upgradeMessage = getUpgradeMessage(err);
      if (upgradeMessage) onUpgrade?.(upgradeMessage);
      setErrorMsg(upgradeMessage || err.response?.data?.detail || "Failed to send email.");
      setStep("error");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box jobrec-modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2>💼 Job Recommendations</h2>
            <p>For: <strong>{candidate.name || candidate.resume_filename}</strong>{candidate.email ? ` — ${candidate.email}` : ""}</p>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {/* Step 1: Input other roles */}
        {step === "input" && (
          <>
            <div className="modal-body">
              <div className="jobrec-info-box">
                <span className="jobrec-info-icon">🎯</span>
                <div>
                  <div className="jobrec-info-title">How this works</div>
                  <div className="jobrec-info-desc">
                    AI matches <strong>{candidate.name || "this candidate"}'s</strong> skills to your
                    active job postings and generates a personalised email with direct apply links.
                    The candidate clicks the link and applies on your platform — no account needed.
                  </div>
                </div>
              </div>

              <div className="jobrec-skills-preview">
                <span className="jobrec-skills-label">Candidate's skills</span>
                <div className="tags-wrap">
                  {(candidate.extracted_skills || []).slice(0, 10).map((s) => (
                    <span key={s} className="tag-blue">{s}</span>
                  ))}
                  {(candidate.extracted_skills || []).length > 10 && (
                    <span className="tag-more">+{candidate.extracted_skills.length - 10}</span>
                  )}
                </div>
              </div>

              <label className="modal-label">
                Additional roles <span style={{fontSize:"11px",color:"var(--text3)",fontWeight:400}}>(optional — will merge with your active job postings)</span>
              </label>
              <textarea
                className="modal-textarea"
                rows={4}
               placeholder={`e.g.
Frontend Developer
Data Analyst
QA Engineer
DevOps Engineer`}
                value={otherRoles}
                onChange={(e) => setOtherRoles(e.target.value)}
              />
              <p className="jobrec-hint">Enter one role per line. AI will match and recommend the best fit.</p>
            </div>
            <div className="modal-footer">
              <button className="btn-modal-cancel" onClick={onClose}>Cancel</button>
              <button
                className="btn-modal-primary"
                onClick={handleGenerate}
                disabled={!otherRoles.trim()}
              >
                ✨ Generate Recommendations
              </button>
            </div>
          </>
        )}

        {/* Step 2: Loading */}
        {step === "loading" && (
          <div className="modal-loading">
            <div className="spinner" />
            <p>AI is matching skills to open roles…</p>
          </div>
        )}

        {/* Step 3: Preview & edit email */}
        {step === "preview" && recs && (
          <>
            <div className="modal-body">
              {/* Recommended roles */}
              <div className="jobrec-roles-section">
                <span className="modal-label">Recommended roles ({recs.recommended_roles?.length || 0} matched)</span>
                <div className="jobrec-roles-list">
                  {(recs.recommended_roles || []).map((r, i) => (
                    <div key={i} className="jobrec-role-item">
                      <div className="jobrec-role-header">
                        <span className="jobrec-role-name">{r.role}</span>
                        <span className="jobrec-role-match">{r.match_score}% match</span>
                      </div>
                      <div className="jobrec-role-reason">{r.reason}</div>
                      <div className="tags-wrap">
                        {(r.matching_skills || []).map((s) => (
                          <span key={s} className="tag-green">{s}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Editable email */}
              {candidate.email ? (
                <>
                  <span className="modal-label">Email subject</span>
                  <input
                    className="modal-input"
                    value={editSubject}
                    onChange={(e) => setEditSubject(e.target.value)}
                  />
                  <span className="modal-label">Email body (editable)</span>
                  <textarea
                    className="modal-textarea"
                    rows={10}
                    value={editBody}
                    onChange={(e) => setEditBody(e.target.value)}
                  />
                </>
              ) : (
                <div className="jobrec-no-email-warn">
                  ⚠️ No email address extracted for this candidate. Cannot send email automatically.
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn-modal-cancel" onClick={() => setStep("input")}>← Back</button>
              {candidate.email && (
                <button
                  className="btn-modal-primary btn-jobrec-send"
                  onClick={handleSend}
                  disabled={sending || !editSubject.trim() || !editBody.trim()}
                >
                  {sending ? "Sending…" : "📧 Send Recommendation Email"}
                </button>
              )}
            </div>
          </>
        )}

        {/* Step 4: Sent */}
        {step === "sent" && (
          <div className="modal-success">
            <div className="modal-success-icon">✅</div>
            <h3>Email Sent!</h3>
            <p>Job recommendations delivered to <strong>{candidate.email}</strong></p>
            <button className="btn-modal-primary" onClick={onClose}>Done</button>
          </div>
        )}

        {/* Step 5: Error */}
        {step === "error" && (
          <div className="modal-success">
            <div className="modal-success-icon">❌</div>
            <h3>Something went wrong</h3>
            <p>{errorMsg}</p>
            <button className="btn-modal-primary" onClick={() => setStep("input")}>Try Again</button>
          </div>
        )}
      </div>
    </div>
  );
};

const ITEMS_PER_PAGE = 10;

// ── PlanGate: full blur overlay — use only in expanded sections ──────────────
const PlanGate = ({ allowed, requiredPlan, children }) => {
  const navigate = useNavigate();
  if (allowed) return children;
  return (
    <div className="plan-gate-wrap">
      <div className="plan-gate-blur">{children}</div>
      <div className="plan-gate-overlay">
        <span className="plan-gate-icon">🔒</span>
        <p className="plan-gate-label">{requiredPlan} Plan feature</p>
        <button className="plan-gate-btn" onClick={() => navigate("/choose-plan")}>
          ⚡ Upgrade to {requiredPlan}
        </button>
      </div>
    </div>
  );
};

// ── LockedCell: compact lock chip for table cells ─────────────────────────────
const LockedCell = ({ requiredPlan }) => {
  const navigate = useNavigate();
  return (
    <button className="locked-cell-chip" onClick={() => navigate("/choose-plan")}
      title={`${requiredPlan} plan required`}>
      🔒 {requiredPlan}
    </button>
  );
};

// ── Candidate row (used with filter + pagination) ────────────────────────────
const CandidateRow = ({
  c,
  globalIdx,
  expanded,
  getTab,
  setTab,
  toggleExpand,
  candidateStatuses,
  updateStatus,
  getStatusStyle,
  scoreColor,
  setEmailModal,
  handleGenerateQuestions,
  setJobRecModal,
  notes,
  setNotes,
  saveNote,
  savingNote,
  isPro,
  isPremium,
}) => (
  <>
    <tr className={globalIdx === 0 ? "row-top" : ""}>
      <td className="td-rank">{globalIdx === 0 ? "🏆" : `#${globalIdx + 1}`}</td>
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
      <td><ScoreBar value={c.skills_score} color="#2563eb" /></td>
      <td><ScoreBar value={c.experience_score} color="#7c3aed" /></td>
      <td><ScoreBar value={c.education_score} color="#0891b2" /></td>
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
      <td>
        {isPro ? (
          c.email ? (
            <button className="btn-email" onClick={() => setEmailModal(c)}
              title={`Send email to ${c.email}`}>✉️ Send</button>
          ) : (
            <span style={{ color: "var(--text3)", fontSize: 12 }}>—</span>
          )
        ) : (
          <LockedCell requiredPlan="Pro" />
        )}
      </td>
      <td>
        {isPro ? (
          candidateStatuses[c.candidate_id] === "shortlisted" ? (
            <button className="btn-interview" onClick={() => handleGenerateQuestions(c)}
              title="Generate interview questions">🎯 Questions</button>
          ) : (
            <span className="interview-locked" title="Mark as Shortlisted first">
              🔒 Shortlist first
            </span>
          )
        ) : (
          <LockedCell requiredPlan="Pro" />
        )}
      </td>
      <td>
        {isPremium ? (
          candidateStatuses[c.candidate_id] === "rejected" ? (
            <button className="btn-jobrec" onClick={() => setJobRecModal(c)}
              title="Recommend alternative roles">💼 Recommend</button>
          ) : (
            <span className="jobrec-locked" title="Mark as Rejected first">—</span>
          )
        ) : (
          <LockedCell requiredPlan="Premium" />
        )}
      </td>
      <td>
        <button className="btn-expand" onClick={() => toggleExpand(c.candidate_id)}>
          {expanded === c.candidate_id ? "▲ Hide" : "▼ View"}
        </button>
      </td>
    </tr>
    {expanded === c.candidate_id && (
      <tr className="row-explanation">
        <td colSpan={13}>
          <PlanGate allowed={isPro} requiredPlan="Pro">
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
          </PlanGate>
        </td>
      </tr>
    )}
  </>
);

const Pagination = ({ total, perPage, current, onChange }) => {
  if (total <= perPage) return null;
  const totalPages = Math.ceil(total / perPage);
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1)
    .filter((pg) => pg === 1 || pg === totalPages || Math.abs(pg - current) <= 1)
    .reduce((acc, pg, i, arr) => {
      if (i > 0 && pg - arr[i - 1] > 1) acc.push("...");
      acc.push(pg);
      return acc;
    }, []);
  const start = (current - 1) * perPage + 1;
  const end = Math.min(current * perPage, total);
  return (
    <div className="pagination-wrap">
      <span className="pagination-info">
        Showing {start}–{end} of {total} candidates
      </span>
      <div className="pagination-btns">
        <button type="button" className="pg-btn" onClick={() => onChange(1)} disabled={current === 1}>«</button>
        <button type="button" className="pg-btn" onClick={() => onChange(current - 1)} disabled={current === 1}>‹ Prev</button>
        {pages.map((pg, idx) =>
          pg === "..." ? (
            <span key={`e-${idx}`} className="pg-ellipsis">…</span>
          ) : (
            <button
              type="button"
              key={pg}
              className={`pg-btn ${current === pg ? "pg-btn-active" : ""}`}
              onClick={() => onChange(pg)}
            >
              {pg}
            </button>
          )
        )}
        <button type="button" className="pg-btn" onClick={() => onChange(current + 1)} disabled={current === totalPages}>Next ›</button>
        <button type="button" className="pg-btn" onClick={() => onChange(totalPages)} disabled={current === totalPages}>»</button>
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

  // ── Job Recommendation state ──
  const [jobRecModal, setJobRecModal] = useState(null);

  // ── LinkedIn Post state ──
  const [showLinkedIn,   setShowLinkedIn]   = useState(false);
  const [linkedInPost,   setLinkedInPost]   = useState("");
  const [loadingLinkedIn, setLoadingLinkedIn] = useState(false);
  const [upgradeMsg, setUpgradeMsg] = useState("");

  const [currentPage, setCurrentPage] = useState(1);

  // ── Plan gating ──
  const userPlan = localStorage.getItem("user_plan") || "free";
  const isPro     = userPlan === "pro" || userPlan === "premium";
  const isPremium = userPlan === "premium";
  const [minScore, setMinScore] = useState(0);
  const [filterSkill,  setFilterSkill]  = useState("all");
  const [filterExp, setFilterExp] = useState("all");
  const [projectTitle, setProjectTitle] = useState(null);
  const [renaming, setRenaming] = useState(false);
  const [renameVal, setRenameVal] = useState("");
  const [savingRename, setSavingRename] = useState(false);

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
    setCurrentPage(1);
    setProjectTitle(null);
    const initialNotes    = {};
    const initialStatuses = {};
    (d.results || []).forEach((c) => {
      initialNotes[c.candidate_id]    = c.recruiter_note || "";
      initialStatuses[c.candidate_id] = c.status || "new";
    });
    setNotes(initialNotes);
    setCandidateStatuses(initialStatuses);
  };

  // Collect all unique skills from JD required skills for the skill filter
  const jdSkills = data?.jd_structure?.required_skills || [];

  const filteredResults = (data?.results || []).filter((c) => {
    if (Math.round(c.overall_score * 100) < minScore) return false;
    if (filterSkill !== "all") {
      // Check if candidate has this skill in their matched OR extracted skills
      const allSkills = [
        ...(c.matched_skills || []),
        ...(c.extracted_skills || []),
      ].map((s) => s.toLowerCase());
      if (!allSkills.includes(filterSkill.toLowerCase())) return false;
    }
    if (filterExp !== "all") {
      const yrs = c.experience_years || 0;
      if (filterExp === "0-2" && yrs > 2) return false;
      if (filterExp === "2-5" && (yrs < 2 || yrs > 5)) return false;
      if (filterExp === "5+" && yrs < 5) return false;
    }
    return true;
  });

  const resetFilters = () => {
    setMinScore(0);
    setFilterSkill("all");
    setFilterExp("all");
    setCurrentPage(1);
  };
  const isFiltered = minScore > 0 || filterSkill !== "all" || filterExp !== "all";

  const startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
  const pageItems = filteredResults.slice(startIdx, startIdx + ITEMS_PER_PAGE);

  const startRename = () => {
    setRenameVal(projectTitle ?? data?.title ?? "");
    setRenaming(true);
  };
  const cancelRename = () => setRenaming(false);
  const saveRename = async () => {
    const trimmed = renameVal.trim();
    if (!trimmed) return;
    setSavingRename(true);
    try {
      await api.patch(`/projects/${projectId}/rename`, { title: trimmed });
      setProjectTitle(trimmed);
      setRenaming(false);
    } catch {
      alert("Failed to rename project.");
    } finally {
      setSavingRename(false);
    }
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
      const msg = getUpgradeMessage(err) || err.response?.data?.detail || "Failed to generate questions.";
      if (getUpgradeMessage(err)) setUpgradeMsg(msg);
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
      const upgradeMessage = getUpgradeMessage(err);
      if (upgradeMessage) setUpgradeMsg(upgradeMessage);
      setRescreenError(upgradeMessage || err.response?.data?.detail || "Re-screening failed.");
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
      const upgradeMessage = getUpgradeMessage(err);
      if (upgradeMessage) setUpgradeMsg(upgradeMessage);
      setLinkedInPost(upgradeMessage || err.response?.data?.detail || "Failed to generate post.");
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
                {renaming ? (
                  <div className="rename-inline">
                    <input
                      className="rename-inline-input"
                      value={renameVal}
                      onChange={(e) => setRenameVal(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") saveRename();
                        if (e.key === "Escape") cancelRename();
                      }}
                      autoFocus
                    />
                    <button type="button" className="btn-rename-confirm" onClick={saveRename} disabled={savingRename}>
                      {savingRename ? "…" : "✓"}
                    </button>
                    <button type="button" className="btn-rename-cancel-inline" onClick={cancelRename}>✕</button>
                  </div>
                ) : (
                  <div className="title-with-edit">
                    <h1>{projectTitle ?? data.title}</h1>
                    <button type="button" className="btn-rename-trigger-inline" onClick={startRename} title="Rename project">✏️</button>
                  </div>
                )}
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
              <>
                <div className="filter-bar">
                  <div className="filter-bar-top">
                    <span className="filter-bar-title">🔍 Filter candidates</span>
                    {isFiltered && (
                      <button type="button" className="filter-reset-btn" onClick={resetFilters}>✕ Reset filters</button>
                    )}
                  </div>
                  <div className="filter-controls">
                    <div className="filter-group filter-group--wide">
                      <div className="filter-label-row">
                        <span className="filter-label">Minimum score</span>
                        <span className="filter-score-badge">{minScore}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="5"
                        value={minScore}
                        onChange={(e) => {
                          setMinScore(Number(e.target.value));
                          setCurrentPage(1);
                        }}
                        className="filter-slider"
                      />
                      <div className="filter-slider-labels"><span>0%</span><span>100%</span></div>
                    </div>
                    <div className="filter-group">
                      <label className="filter-label" htmlFor="filter-skill">Must-have Skill</label>
                      <select
                        id="filter-skill"
                        className="filter-select"
                        value={filterSkill}
                        onChange={(e) => {
                          setFilterSkill(e.target.value);
                          setCurrentPage(1);
                        }}
                      >
                        <option value="all">Any skill</option>
                        {jdSkills.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                    <div className="filter-group">
                      <label className="filter-label" htmlFor="filter-exp">Experience</label>
                      <select
                        id="filter-exp"
                        className="filter-select"
                        value={filterExp}
                        onChange={(e) => {
                          setFilterExp(e.target.value);
                          setCurrentPage(1);
                        }}
                      >
                        <option value="all">Any experience</option>
                        <option value="0-2">0–2 years (fresher)</option>
                        <option value="2-5">2–5 years (mid)</option>
                        <option value="5+">5+ years (senior)</option>
                      </select>
                    </div>
                  </div>
                  <div className="filter-count">
                    Showing <strong>{filteredResults.length}</strong> of <strong>{data.results.length}</strong> candidates
                    {isFiltered && filteredResults.length === 0 && (
                      <span className="filter-no-match"> — No candidates match your filters</span>
                    )}
                  </div>
                </div>
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
                      <th>Job Rec</th>
                      <th>Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredResults.length === 0 ? (
                      <tr>
                        <td colSpan={13} style={{ textAlign: "center", padding: "40px", color: "var(--text3)" }}>
                          No candidates match your filters. Try adjusting or resetting them.
                        </td>
                      </tr>
                    ) : (
                      pageItems.map((c, idx) => (
                        <CandidateRow
                          key={c.candidate_id}
                          c={c}
                          globalIdx={startIdx + idx}
                          expanded={expanded}
                          getTab={getTab}
                          setTab={setTab}
                          toggleExpand={toggleExpand}
                          candidateStatuses={candidateStatuses}
                          updateStatus={updateStatus}
                          getStatusStyle={getStatusStyle}
                          scoreColor={scoreColor}
                          setEmailModal={setEmailModal}
                          handleGenerateQuestions={handleGenerateQuestions}
                          setJobRecModal={setJobRecModal}
                          notes={notes}
                          setNotes={setNotes}
                          saveNote={saveNote}
                          savingNote={savingNote}
                          isPro={isPro}
                          isPremium={isPremium}
                        />
                      ))
                    )}
                  </tbody>
                </table>
                </div>
                <Pagination
                  total={filteredResults.length}
                  perPage={ITEMS_PER_PAGE}
                  current={currentPage}
                  onChange={setCurrentPage}
                />
              </>
            )}
          </>
        )}

      </div>

      {/* Email Modal (existing) */}
      {emailModal && (
        <EmailModal
          candidate={emailModal}
          projectTitle={projectTitle ?? data?.title ?? ""}
          projectId={projectId}
          onClose={() => setEmailModal(null)}
          onUpgrade={setUpgradeMsg}
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

      {/* Job Recommendation Modal */}
      {jobRecModal && (
        <JobRecommendModal
          candidate={jobRecModal}
          projectTitle={projectTitle ?? data?.title ?? ""}
          projectId={projectId}
          onClose={() => setJobRecModal(null)}
          onUpgrade={setUpgradeMsg}
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

      <UpgradeModal open={!!upgradeMsg} message={upgradeMsg} onClose={() => setUpgradeMsg("")} />

    </div>
  );
};

export default Results;