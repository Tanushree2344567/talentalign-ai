import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./Navbar.css";

// Apply theme to <html> element
function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem("theme", theme);
}

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem("theme");
    return saved !== "light"; // default dark
  });

  useEffect(() => {
    applyTheme(isDark ? "dark" : "light");
  }, [isDark]);

  const toggleTheme = () => {
    setIsDark((prev) => !prev);
  };

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    navigate("/login");
  };

  const isActive = (path) => location.pathname.startsWith(path);

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
      </div>

      <div className="navbar-right">
        {/* Theme toggle */}
        <button className="theme-toggle" onClick={toggleTheme} title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}>
          <div className={`theme-track ${!isDark ? "theme-track-light" : ""}`}>
            <div className="theme-thumb">
              {isDark ? "🌙" : "☀️"}
            </div>
          </div>
        </button>

        {/* Profile avatar button */}
        <button
          className={`navbar-profile-btn ${isActive("/profile") ? "active" : ""}`}
          onClick={() => navigate("/profile")}
          title="My Profile"
        >
          👤
        </button>

        <button className="navbar-logout" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
