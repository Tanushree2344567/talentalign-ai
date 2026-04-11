import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import Navbar from "../components/Navbar";
import ProjectCard from "../components/ProjectCard";
import DashboardCharts from "../components/DashboardCharts";
import "./Dashboard.css";

const Dashboard = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/projects/")
      .then((res) => setProjects(res.data))
      .finally(() => setLoading(false));
  }, []);

  const handleProjectDeleted = (deletedId) => {
    setProjects((prev) => prev.filter((p) => p.id !== deletedId));
  };

  const totalCandidates = projects.reduce((sum, p) => sum + (p.candidate_count || 0), 0);
  const activeProjects = projects.length;

  return (
    <div className="dashboard-page">
      <Navbar />
      <div className="dashboard-content">

        {/* Hero Header */}
        <div className="dashboard-hero">
          <div className="dashboard-hero-text">
            <h1>Welcome back 👋</h1>
            <p>Manage your job openings and rank candidates with AI</p>
          </div>
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <button className="btn-history" onClick={() => navigate("/history")}>
              🕓 History
            </button>
            <button className="btn-create" onClick={() => navigate("/projects/new")}>
              + New Project
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="stats-row">
          <div className="stat-card">
            <div className="stat-card-icon" style={{ background: "#eff6ff" }}>📁</div>
            <div>
              <div className="stat-card-number">{activeProjects}</div>
              <div className="stat-card-label">Total Projects</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-card-icon" style={{ background: "#f0fdf4" }}>👥</div>
            <div>
              <div className="stat-card-number">{totalCandidates}</div>
              <div className="stat-card-label">Candidates Analyzed</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-card-icon" style={{ background: "#fdf4ff" }}>🤖</div>
            <div>
              <div className="stat-card-number">AI</div>
              <div className="stat-card-label">Powered Screening</div>
            </div>
          </div>
          <div className="stat-card stat-card-cta" onClick={() => navigate("/support/tickets")}>
            <div className="stat-card-icon" style={{ background: "#fff7ed" }}>🎫</div>
            <div>
              <div className="stat-card-number">Support</div>
              <div className="stat-card-label">View my tickets →</div>
            </div>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="dashboard-loading">
            <div className="spinner" />
            <p>Loading projects...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && projects.length === 0 && (
          <div className="dashboard-empty">
            <div className="empty-illustration">
              <div className="empty-circle">📋</div>
            </div>
            <h3>No projects yet</h3>
            <p>Create your first job project to start screening candidates with AI.</p>
            <button className="btn-create" onClick={() => navigate("/projects/new")}>
              + Create First Project
            </button>
          </div>
        )}

        {/* Projects Grid */}
        {!loading && projects.length > 0 && (
          <>
            <div className="section-title">
              <h2>Your Projects</h2>
              <span className="section-count">{projects.length} project{projects.length !== 1 ? "s" : ""}</span>
            </div>
            <div className="projects-grid">
              {projects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onDeleted={handleProjectDeleted}
                />
              ))}
            </div>

            {/* Analytics Charts */}
            <DashboardCharts projects={projects} />
          </>
        )}

      </div>
    </div>
  );
};

export default Dashboard;
