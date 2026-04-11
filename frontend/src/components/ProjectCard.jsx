import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import "./ProjectCard.css";

const ProjectCard = ({ project, onDeleted }) => {
  const navigate = useNavigate();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [renameVal, setRenameVal] = useState(project.title);
  const [savingName, setSavingName] = useState(false);
  const [title, setTitle] = useState(project.title);

  const handleRename = async () => {
    const trimmed = renameVal.trim();
    if (!trimmed || trimmed === title) {
      setRenaming(false);
      return;
    }
    setSavingName(true);
    try {
      await api.patch(`/projects/${project.id}/rename`, { title: trimmed });
      setTitle(trimmed);
      setRenaming(false);
    } catch {
      alert("Failed to rename project.");
    } finally {
      setSavingName(false);
    }
  };

  const formatDate = (dateStr) =>
    new Date(dateStr).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  const count = project.candidate_count ?? 0;

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/projects/${project.id}`);
      onDeleted && onDeleted(project.id);
    } catch (err) {
      alert("Failed to delete project. Please try again.");
    } finally {
      setDeleting(false);
      setConfirming(false);
    }
  };

  return (
    <div className="project-card">
      <div className="project-card-accent" />

      <div className="project-card-body">
        <div className="project-card-header">
          <div className="project-icon">💼</div>
          <div className="project-meta">
            {renaming ? (
              <div className="rename-row">
                <input
                  className="rename-input"
                  value={renameVal}
                  onChange={(e) => setRenameVal(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleRename();
                    if (e.key === "Escape") {
                      setRenaming(false);
                      setRenameVal(title);
                    }
                  }}
                  autoFocus
                />
                <button className="btn-rename-save" onClick={handleRename} disabled={savingName}>
                  {savingName ? "…" : "✓"}
                </button>
                <button
                  className="btn-rename-cancel"
                  onClick={() => {
                    setRenaming(false);
                    setRenameVal(title);
                  }}
                >
                  ✕
                </button>
              </div>
            ) : (
              <div className="title-row">
                <h3>{title}</h3>
                <button
                  className="btn-rename-trigger"
                  title="Rename project"
                  onClick={() => {
                    setRenaming(true);
                    setRenameVal(title);
                  }}
                >
                  ✏️
                </button>
              </div>
            )}
            <span className="project-date">📅 {formatDate(project.created_at)}</span>
          </div>
          {!confirming && (
            <button
              className="btn-delete-project"
              title="Delete project"
              onClick={() => setConfirming(true)}
            >
              🗑️
            </button>
          )}
        </div>

        {confirming && (
          <div className="delete-confirm-banner">
            <span>Delete and save to history?</span>
            <div className="delete-confirm-actions">
              <button className="btn-confirm-yes" onClick={handleDelete} disabled={deleting}>
                {deleting ? "Deleting…" : "Yes, delete"}
              </button>
              <button className="btn-confirm-no" onClick={() => setConfirming(false)}>
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="project-stats-row">
          <div className="project-stat">
            <span className="project-stat-number">{count}</span>
            <span className="project-stat-label">Candidates</span>
          </div>
          <div className="project-stat-divider" />
          <div className="project-stat">
            <span
              className="project-stat-number"
              style={{ color: count > 0 ? "#16a34a" : "#94a3b8" }}
            >
              {count > 0 ? "✓ Done" : "Pending"}
            </span>
            <span className="project-stat-label">Status</span>
          </div>
        </div>

        <div className="project-actions">
          <button className="btn-upload" onClick={() => navigate(`/projects/${project.id}/upload`)}>
            ↑ Upload Resumes
          </button>
          <button
            className="btn-results"
            onClick={() => navigate(`/projects/${project.id}/results`)}
            disabled={count === 0}
          >
            View Results →
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProjectCard;
