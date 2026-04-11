import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../services/api";
import "./Navbar.css";

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem("theme", theme);
}

const PLAN_BADGES = {
  free:    { label: "Free",    color: "#64748b", bg: "#f1f5f9" },
  pro:     { label: "Pro",     color: "#7c3aed", bg: "#fdf4ff" },
  premium: { label: "Premium", color: "#d97706", bg: "#fff7ed" },
};

const Navbar = () => {
  const navigate  = useNavigate();
  const location  = useLocation();
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem("theme");
    return saved !== "light";
  });
  const [userPlan, setUserPlan] = useState(
    localStorage.getItem("user_plan") || "free"
  );

  useEffect(() => {
    applyTheme(isDark ? "dark" : "light");
  }, [isDark]);

  // Fetch plan from backend when navbar loads
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) return;
    api.get("/auth/me")
      .then((res) => {
        const plan = res.data.plan || "free";
        setUserPlan(plan);
        localStorage.setItem("user_plan", plan);
      })
      .catch(() => {});
  }, []);

  const toggleTheme  = () => setIsDark((prev) => !prev);
  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user_plan");
    localStorage.removeItem("plan_chosen");
    navigate("/login");
  };
  const isActive = (path) => location.pathname.startsWith(path);

  const badge = PLAN_BADGES[userPlan] || PLAN_BADGES.free;

  return (
    <nav className="navbar">
      <div className="navbar-brand" onClick={() => navigate("/dashboard")}>
        <div className="navbar-logo">TA</div>
        <span>TalentAlign AI</span>
      </div>

      <div className="navbar-links">
        <span
          className={`navbar-link ${isActive("/dashboard") ? "active" : ""}`}
          onClick={() => navigate("/dashboard")}
        >
          🏠 Dashboard
        </span>
        <span
          className={`navbar-link ${isActive("/support") ? "active" : ""}`}
          onClick={() => navigate("/support/tickets")}
        >
          🎫 Support
        </span>
        <span
          className={`navbar-link ${isActive("/manage-jobs") ? "active" : ""}`}
          onClick={() => navigate("/manage-jobs")}
        >
          💼 Jobs
        </span>
        <span className="navbar-link navbar-plan-status" title={`Your current plan: ${badge.label}`}>
          Plan
          <span
            className="navbar-plan-badge"
            style={{ background: badge.bg, color: badge.color }}
          >
            {badge.label}
          </span>
        </span>
      </div>

      <div className="navbar-right">
        {/* Theme toggle */}
        <button className="theme-toggle" onClick={toggleTheme}
          title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}>
          <div className={`theme-track ${!isDark ? "theme-track-light" : ""}`}>
            <div className="theme-thumb">{isDark ? "🌙" : "☀️"}</div>
          </div>
        </button>

        {/* Profile */}
        <button
          className={`navbar-profile-btn ${isActive("/profile") ? "active" : ""}`}
          onClick={() => navigate("/profile")}
          title="My Profile"
        >
          👤
        </button>

        {/* Upgrade button — hidden for premium users */}
        {userPlan !== "premium" && (
          <button
            className="navbar-upgrade-btn"
            onClick={() => navigate("/choose-plan")}
            title="Upgrade your plan"
          >
            ⚡ Upgrade
          </button>
        )}

        <button className="navbar-logout" onClick={handleLogout}>Logout</button>
      </div>
    </nav>
  );
};

export default Navbar;
