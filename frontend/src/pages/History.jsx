import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import Navbar from "../components/Navbar";
import "./History.css";

// ── Reused from Results ────────────────────────────────────────────────────────
const ScoreBar = ({ value, color }) => (
  <div className="score-bar-wrap">
    <div className="score-bar-fill" style={{ width: `${Math.round(value * 100)}%`, background: color }} />
    <span className="score-bar-pct">{Math.round(value * 100)}%</span>
  </div>
);

const STATUS_STYLES = {
  new:         { color: "#64748b", background: "#f1f5f9" },
  shortlisted: { color: "#15803d", background: "#dcfce7" },
  on_hold:     { color: "#d97706", background: "#fef3c7" },
  rejected:    { color: "#dc2626", background: "#fee2e2" },
};

const SORT_OPTIONS = [
  { value: "deleted_desc",    label: "Recently Deleted" },
  { value: "deleted_asc",     label: "Oldest Deleted" },
  { value: "created_desc",    label: "Recently Created" },
  { value: "created_asc",     label: "Oldest Created" },
  { value: "candidates_desc", label: "Most Candidates" },
  { value: "candidates_asc",  label: "Fewest Candidates" },
  { value: "title_asc",       label: "Title A → Z" },
  { value: "title_desc",      label: "Title Z → A" },
];

// ── Candidate detail tabs (read-only mirror of Results) ───────────────────────
const CandidateDetail = ({ c }) => {
  const [tab, setTab] = useState("summary");
  const TABS = ["summary", "skills", "experience", "education", "projects", "notes"];

  return (
    <div className="explanation-box">
      <div className="detail-tabs">
        {TABS.map((t) => (
          <button
            key={t}
            className={`detail-tab ${tab === t ? "active" : ""}`}
            onClick={() => setTab(t)}
          >
            {t === "notes" ? "📝 Notes" : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {tab === "summary" && (
        <div className="tab-content">
          <strong>AI Recruiter Summary</strong>
          <p>{c.explanation || "No summary available."}</p>
        </div>
      )}

      {tab === "skills" && (
        <div className="tab-content">
          <div className="all-skills-row">
            <div>
              <strong>All Extracted Skills</strong>
              <div className="tags-wrap">
                {(c.extracted_skills || []).map((s) => <span key={s} className="tag-blue">{s}</span>)}
                {!c.extracted_skills?.length && <span className="no-data">None extracted</span>}
              </div>
            </div>
            <div>
              <strong>✅ Matched</strong>
              <div className="tags-wrap">
                {(c.matched_skills || []).map((s) => <span key={s} className="tag-green">{s}</span>)}
                {!c.matched_skills?.length && <span className="no-data">None</span>}
              </div>
            </div>
            <div>
              <strong>❌ Missing</strong>
              <div className="tags-wrap">
                {(c.missing_skills || []).map((s) => <span key={s} className="tag-red">{s}</span>)}
                {!c.missing_skills?.length && <span className="no-data">None</span>}
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === "experience" && (
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

      {tab === "education" && (
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

      {tab === "projects" && (
        <div className="tab-content">
          {(c.projects_list || []).length === 0 ? (
            <p>No projects extracted.</p>
          ) : (
            <ul className="projects-list">
              {c.projects_list.map((p, idx) => <li key={idx}>{p}</li>)}
            </ul>
          )}
        </div>
      )}

      {tab === "notes" && (
        <div className="tab-content">
          <strong>Recruiter Notes</strong>
          <p className="notes-hint">Notes saved at the time this project was deleted.</p>
          {c.recruiter_note ? (
            <div className="note-preview"><span>📝</span> {c.recruiter_note}</div>
          ) : (
            <p className="no-data">No notes were saved for this candidate.</p>
          )}
        </div>
      )}
    </div>
  );
};

// ── Main History Component ─────────────────────────────────────────────────────
const History = () => {
  const navigate = useNavigate();

  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  // search / filter / sort
  const [search,             setSearch]             = useState("");
  const [sortBy,             setSortBy]             = useState("deleted_desc");
  const [filterMinCandidates, setFilterMinCandidates] = useState("");
  const [filterSkill,        setFilterSkill]        = useState("");
  const [filterDateFrom,     setFilterDateFrom]     = useState("");
  const [filterDateTo,       setFilterDateTo]       = useState("");
  const [filtersOpen,        setFiltersOpen]        = useState(false);

  // expand / candidate cache
  const [expandedEntry,      setExpandedEntry]      = useState(null);   // history card expanded
  const [candidateData,      setCandidateData]      = useState({});
  const [loadingCandidates,  setLoadingCandidates]  = useState({});
  const [expandedCandidate,  setExpandedCandidate]  = useState(null);   // row-level expand
  const [confirmDelete,      setConfirmDelete]      = useState(null);

  useEffect(() => {
    api.get("/projects/history/all")
      .then((res) => setEntries(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // all unique skills for filter dropdown
  const allSkills = useMemo(() => {
    const set = new Set();
    entries.forEach((e) => (e.jd_required_skills || []).forEach((s) => set.add(s.toLowerCase())));
    return Array.from(set).sort();
  }, [entries]);

  // filtered + sorted list
  const filtered = useMemo(() => {
    let list = [...entries];
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (e) => e.title.toLowerCase().includes(q) ||
               (e.jd_required_skills || []).some((s) => s.toLowerCase().includes(q))
      );
    }
    if (filterMinCandidates !== "") {
      const min = parseInt(filterMinCandidates, 10);
      if (!isNaN(min)) list = list.filter((e) => e.candidate_count >= min);
    }
    if (filterSkill) {
      list = list.filter((e) =>
        (e.jd_required_skills || []).some((s) => s.toLowerCase() === filterSkill.toLowerCase())
      );
    }
    if (filterDateFrom) {
      const from = new Date(filterDateFrom);
      list = list.filter((e) => new Date(e.deleted_at) >= from);
    }
    if (filterDateTo) {
      const to = new Date(filterDateTo);
      to.setHours(23, 59, 59, 999);
      list = list.filter((e) => new Date(e.deleted_at) <= to);
    }
    list.sort((a, b) => {
      switch (sortBy) {
        case "deleted_asc":     return new Date(a.deleted_at) - new Date(b.deleted_at);
        case "deleted_desc":    return new Date(b.deleted_at) - new Date(a.deleted_at);
        case "created_asc":     return new Date(a.created_at || 0) - new Date(b.created_at || 0);
        case "created_desc":    return new Date(b.created_at || 0) - new Date(a.created_at || 0);
        case "candidates_asc":  return a.candidate_count - b.candidate_count;
        case "candidates_desc": return b.candidate_count - a.candidate_count;
        case "title_asc":       return a.title.localeCompare(b.title);
        case "title_desc":      return b.title.localeCompare(a.title);
        default:                return 0;
      }
    });
    return list;
  }, [entries, search, sortBy, filterMinCandidates, filterSkill, filterDateFrom, filterDateTo]);

  const activeFilterCount = [
    filterMinCandidates !== "", filterSkill !== "",
    filterDateFrom !== "",      filterDateTo !== "",
  ].filter(Boolean).length;

  const clearAllFilters = () => {
    setSearch(""); setSortBy("deleted_desc");
    setFilterMinCandidates(""); setFilterSkill("");
    setFilterDateFrom(""); setFilterDateTo("");
  };

  const formatDate = (d) =>
    d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—";
  const formatDateTime = (d) =>
    d ? new Date(d).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";
  const scoreColor = (s) => s >= 0.75 ? "#16a34a" : s >= 0.50 ? "#d97706" : "#dc2626";
  // history snapshot stores scores as 0-100, not 0-1
  const scoreColorPct = (s) => s >= 75 ? "#16a34a" : s >= 50 ? "#d97706" : "#dc2626";

  const toggleEntry = async (entry) => {
    if (expandedEntry === entry.id) { setExpandedEntry(null); return; }
    setExpandedEntry(entry.id);
    setExpandedCandidate(null);
    if (!candidateData[entry.id]) {
      setLoadingCandidates((prev) => ({ ...prev, [entry.id]: true }));
      try {
        const res = await api.get(`/projects/history/${entry.id}/results`);
        setCandidateData((prev) => ({ ...prev, [entry.id]: res.data }));
      } catch {
        setCandidateData((prev) => ({ ...prev, [entry.id]: null }));
      } finally {
        setLoadingCandidates((prev) => ({ ...prev, [entry.id]: false }));
      }
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/projects/history/${id}`);
      setEntries((prev) => prev.filter((e) => e.id !== id));
      if (expandedEntry === id) setExpandedEntry(null);
    } catch { alert("Failed to delete history entry."); }
    finally { setConfirmDelete(null); }
  };

  // ── render ─────────────────────────────────────────────────────────────────
  return (
    <div className="history-page">
      <Navbar />
      <div className="history-content">

        {/* Hero */}
        <div className="history-hero">
          <button className="btn-back" onClick={() => navigate("/dashboard")}>← Dashboard</button>
          <div className="history-hero-text">
            <h1>🕓 Project History</h1>
            <p>Deleted projects are fully preserved here — all candidate data, scores, notes, and JD details.</p>
          </div>
        </div>

        {/* Search + sort bar */}
        {!loading && entries.length > 0 && (
          <div className="search-bar-row">
            <div className="search-input-wrap">
              <span className="search-icon">🔍</span>
              <input
                className="search-input"
                type="text"
                placeholder="Search by project title or skill…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && <button className="search-clear" onClick={() => setSearch("")}>✕</button>}
            </div>
            <select className="sort-select" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <button
              className={`btn-filters ${filtersOpen ? "active" : ""} ${activeFilterCount > 0 ? "has-filters" : ""}`}
              onClick={() => setFiltersOpen((v) => !v)}
            >
              ⚙️ Filters {activeFilterCount > 0 && <span className="filter-badge">{activeFilterCount}</span>}
            </button>
            {(search || activeFilterCount > 0) && (
              <button className="btn-clear-all" onClick={clearAllFilters}>Clear all</button>
            )}
          </div>
        )}

        {/* Filter panel */}
        {filtersOpen && !loading && entries.length > 0 && (
          <div className="filter-panel">
            <div className="filter-group">
              <label>Min. candidates</label>
              <input type="number" min="0" placeholder="e.g. 5" value={filterMinCandidates}
                onChange={(e) => setFilterMinCandidates(e.target.value)} className="filter-input filter-input-sm" />
            </div>
            <div className="filter-group">
              <label>Required skill</label>
              <select className="filter-input" value={filterSkill} onChange={(e) => setFilterSkill(e.target.value)}>
                <option value="">All skills</option>
                {allSkills.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="filter-group">
              <label>Deleted from</label>
              <input type="date" className="filter-input" value={filterDateFrom}
                onChange={(e) => setFilterDateFrom(e.target.value)} />
            </div>
            <div className="filter-group">
              <label>Deleted to</label>
              <input type="date" className="filter-input" value={filterDateTo}
                onChange={(e) => setFilterDateTo(e.target.value)} />
            </div>
          </div>
        )}

        {/* Results count */}
        {!loading && entries.length > 0 && (
          <div className="results-summary">
            Showing <strong>{filtered.length}</strong> of <strong>{entries.length}</strong> entries
            {filtered.length !== entries.length && <span className="filtered-label"> (filtered)</span>}
          </div>
        )}

        {loading && <div className="history-loading"><div className="spinner" /><p>Loading history…</p></div>}

        {!loading && entries.length === 0 && (
          <div className="history-empty">
            <div className="empty-icon">📂</div>
            <h3>No history yet</h3>
            <p>When you delete a project it will appear here with all candidate data preserved.</p>
          </div>
        )}

        {!loading && entries.length > 0 && filtered.length === 0 && (
          <div className="history-empty">
            <div className="empty-icon">🔍</div>
            <h3>No results found</h3>
            <p>Try adjusting your search or filters.</p>
            <button className="btn-clear-all standalone" onClick={clearAllFilters}>Clear all filters</button>
          </div>
        )}

        {/* History list */}
        {!loading && filtered.length > 0 && (
          <div className="history-list">
            {filtered.map((entry) => (
              <div key={entry.id} className="history-card">

                {/* Card header row */}
                <div className="history-card-header">
                  <div className="history-card-info">
                    <div className="history-card-title">
                      <span className="history-icon">💼</span>
                      <h3>{highlightMatch(entry.title, search)}</h3>
                      <span className="history-badge">
                        {entry.candidate_count} candidate{entry.candidate_count !== 1 ? "s" : ""}
                      </span>
                    </div>
                    <div className="history-card-dates">
                      <span>📅 Created: {formatDate(entry.created_at)}</span>
                      <span className="separator">·</span>
                      <span>🗑️ Deleted: {formatDateTime(entry.deleted_at)}</span>
                    </div>
                    {entry.jd_required_skills?.length > 0 && (
                      <div className="history-skills-row">
                        {entry.jd_required_skills.slice(0, 6).map((s, i) => (
                          <span key={i} className={`skill-chip ${
                            filterSkill && s.toLowerCase() === filterSkill.toLowerCase() ? "skill-chip-active" :
                            search && s.toLowerCase().includes(search.toLowerCase()) ? "skill-chip-match" : ""
                          }`}>{s}</span>
                        ))}
                        {entry.jd_required_skills.length > 6 && (
                          <span className="skill-chip skill-chip-more">+{entry.jd_required_skills.length - 6} more</span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="history-card-actions">
                    <button className="btn-expand" onClick={() => toggleEntry(entry)}>
                      {expandedEntry === entry.id ? "▲ Hide Details" : "▼ View Details"}
                    </button>
                    {confirmDelete === entry.id ? (
                      <div className="inline-confirm">
                        <span>Permanently delete?</span>
                        <button className="btn-confirm-yes" onClick={() => handleDelete(entry.id)}>Yes</button>
                        <button className="btn-confirm-no" onClick={() => setConfirmDelete(null)}>No</button>
                      </div>
                    ) : (
                      <button className="btn-history-delete" onClick={() => setConfirmDelete(entry.id)}>
                        🗑️ Delete
                      </button>
                    )}
                  </div>
                </div>

                {/* ── Expanded full-detail view ── */}
                {expandedEntry === entry.id && (
                  <div className="history-results">

                    {loadingCandidates[entry.id] && (
                      <div className="results-loading"><div className="spinner" /> Loading…</div>
                    )}
                    {!loadingCandidates[entry.id] && candidateData[entry.id] === null && (
                      <p className="results-error">Could not load candidate data.</p>
                    )}

                    {!loadingCandidates[entry.id] && candidateData[entry.id] && (() => {
                      const d = candidateData[entry.id];
                      return (
                        <>
                          {/* JD Requirements panel — identical to Results page */}
                          {d.jd_structure && (
                            <div className="jd-panel">
                              <h3>📋 Job Requirements</h3>
                              <div className="jd-grid">
                                <div className="jd-item">
                                  <span className="jd-label">Experience</span>
                                  <span className="jd-value">
                                    {d.jd_structure.required_experience_years > 0
                                      ? `${d.jd_structure.required_experience_years}+ years`
                                      : "Not specified"}
                                  </span>
                                </div>
                                <div className="jd-item">
                                  <span className="jd-label">Education</span>
                                  <span className="jd-value">{d.jd_structure.required_education || "Not specified"}</span>
                                </div>
                                <div className="jd-item jd-item-full">
                                  <span className="jd-label">Required Skills</span>
                                  <div className="tags-wrap">
                                    {(d.jd_structure.required_skills || []).map((s) => (
                                      <span key={s} className="tag-blue">{s}</span>
                                    ))}
                                  </div>
                                </div>
                                {(d.jd_structure.nice_to_have_skills || []).length > 0 && (
                                  <div className="jd-item jd-item-full">
                                    <span className="jd-label">Nice to Have</span>
                                    <div className="tags-wrap">
                                      {d.jd_structure.nice_to_have_skills.map((s) => (
                                        <span key={s} className="tag-gray">{s}</span>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Candidates table — mirrors Results page exactly */}
                          {d.results.length === 0 ? (
                            <p className="results-empty">No candidates were analysed for this project.</p>
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
                                    <th>Details</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {d.results.map((c, i) => {
                                    // snapshot stores scores as 0–100; ScoreBar expects 0–1
                                    const toFrac = (v) => (v > 1 ? v / 100 : v);
                                    const statusStyle = STATUS_STYLES[c.status] || STATUS_STYLES.new;
                                    const candKey = c.candidate_id ?? i;

                                    return (
                                      <React.Fragment key={candKey}>
                                        <tr className={i === 0 ? "row-top" : ""}>
                                          <td className="td-rank">{i === 0 ? "🏆" : `#${i + 1}`}</td>

                                          <td className="td-name">
                                            <div className="cand-name">{c.name || c.resume_filename}</div>
                                            {c.email && <div className="cand-email">{c.email}</div>}
                                            {c.phone && <div className="cand-email">{c.phone}</div>}
                                          </td>

                                          <td className="td-overall">
                                            <span style={{ color: scoreColorPct(c.overall_score), fontWeight: 800, fontSize: 18 }}>
                                              {Math.round(c.overall_score > 1 ? c.overall_score : c.overall_score * 100)}%
                                            </span>
                                          </td>

                                          <td><ScoreBar value={toFrac(c.skills_score)}     color="#2563eb" /></td>
                                          <td><ScoreBar value={toFrac(c.experience_score)} color="#7c3aed" /></td>
                                          <td><ScoreBar value={toFrac(c.education_score)}  color="#0891b2" /></td>

                                          <td className="td-tags">
                                            {(c.matched_skills || []).slice(0, 3).map((s) => (
                                              <span key={s} className="tag-green">{s}</span>
                                            ))}
                                            {(c.matched_skills || []).length > 3 && (
                                              <span className="tag-more">+{c.matched_skills.length - 3}</span>
                                            )}
                                          </td>

                                          <td className="td-tags">
                                            {(c.missing_skills || []).slice(0, 2).map((s) => (
                                              <span key={s} className="tag-red">{s}</span>
                                            ))}
                                            {(c.missing_skills || []).length > 2 && (
                                              <span className="tag-more">+{c.missing_skills.length - 2}</span>
                                            )}
                                          </td>

                                          <td>
                                            <span className="status-badge-readonly" style={statusStyle}>
                                              {c.status || "new"}
                                            </span>
                                          </td>

                                          <td>
                                            <button
                                              className="btn-expand"
                                              onClick={() =>
                                                setExpandedCandidate(expandedCandidate === candKey ? null : candKey)
                                              }
                                            >
                                              {expandedCandidate === candKey ? "▲ Hide" : "▼ View"}
                                            </button>
                                          </td>
                                        </tr>

                                        {/* Tabbed detail row */}
                                        {expandedCandidate === candKey && (
                                          <tr className="row-explanation">
                                            <td colSpan={10}>
                                              <CandidateDetail c={c} />
                                            </td>
                                          </tr>
                                        )}
                                      </React.Fragment>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

function highlightMatch(text, query) {
  if (!query.trim()) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="search-highlight">{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </>
  );
}

export default History;
