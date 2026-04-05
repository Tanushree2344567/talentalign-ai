import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import Navbar from "../components/Navbar";
import "./CreateProject.css";

const CreateProject = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!title.trim()) { setError("Please enter a project title."); return; }
    setError("");
    setLoading(true);
    try {
      // Try real backend first
      const response = await api.post("/projects/", { title });
      navigate(`/projects/${response.data.id}/upload`);
    } catch (err) {
      // Demo mode — simulate project creation
      if (localStorage.getItem("access_token") === "demo-token") {
        navigate(`/projects/1/upload`);
        return;
      }
      setError(err.response?.data?.detail || "Failed to create project.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-page">
      <Navbar />
      <div className="create-content">
        <div className="create-card">

          <button className="back-btn" onClick={() => navigate("/dashboard")}>
            ← Back to Dashboard
          </button>

          <h1>Create New Job Project</h1>
          <p>Enter a title for the job opening. You'll upload the JD and resumes next.</p>

          {error && <div className="create-error">{error}</div>}

          <form onSubmit={handleCreate}>
            <div className="form-group">
              <label>Job Title</label>
              <input
                type="text"
                placeholder="e.g. Senior Software Engineer – Bangalore"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                autoFocus
              />
              <span className="input-hint">Be specific — include role, level, and location.</span>
            </div>

            <div className="create-actions">
              <button type="button" className="btn-cancel" onClick={() => navigate("/dashboard")}>
                Cancel
              </button>
              <button type="submit" className="btn-submit" disabled={loading}>
                {loading ? "Creating..." : "Create Project →"}
              </button>
            </div>
          </form>

          <div className="create-steps">
            <h4>What happens next?</h4>
            <ol>
              <li>Upload your Job Description PDF</li>
              <li>Upload a ZIP file of all candidate resume PDFs</li>
              <li>AI scores and ranks every candidate automatically</li>
            </ol>
          </div>

        </div>
      </div>
    </div>
  );
};

export default CreateProject;
