import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import "./ProjectCard.css";

const ProjectCard = ({ project, onDeleted }) => {
  const navigate = useNavigate();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const formatDate = (dateStr) =>
    new Date(dateStr).toLocaleDateString("en-IN", {
      day: "numeric", month: "short", year: "numeric",
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
      {/* Top accent bar */}
      <div className="project-card-accent" />

      <div className="project-card-body">
        <div className="project-card-header">
          <div className="project-icon">💼</div>
          <div className="project-meta">
            <h3>{project.title}</h3>
            <span className="project-date">📅 {formatDate(project.created_at)}</span>
          </div>
          {/* Delete button top-right */}
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

        {/* Inline delete confirmation */}
        {confirming && (
          <div className="delete-confirm-banner">
            <span>Delete and save to history?</span>
            <div className="delete-confirm-actions">
              <button
                className="btn-confirm-yes"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? "Deleting…" : "Yes, delete"}
              </button>
              <button
                className="btn-confirm-no"
                onClick={() => setConfirming(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Stats */}
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

        {/* Actions */}
        <div className="project-actions">
          <button
            className="btn-upload"
            onClick={() => navigate(`/projects/${project.id}/upload`)}
          >
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
