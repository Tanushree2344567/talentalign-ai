import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../services/api";
import "./Auth.css";

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (email === "demo@talentalign.com" && password === "demo123") {
      localStorage.setItem("access_token", "demo-token");
      setLoading(false);
      navigate("/dashboard");
      return;
    }

    try {
      const response = await api.post(
        "/auth/login",
        new URLSearchParams({ username: email, password }),
        { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
      );
      localStorage.setItem("access_token", response.data.access_token);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.detail || "Incorrect email or password. Try demo@talentalign.com / demo123");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-split-left">
        <div className="auth-left-content">
          <div className="auth-left-logo">
            <div className="auth-left-logo-mark">TA</div>
            <span className="auth-left-logo-text">TalentAlign <em>AI</em></span>
          </div>
          <div className="auth-left-tagline">
            Resume screening,<br />
            <span>reimagined with AI.</span>
          </div>
          <p className="auth-left-sub">
            Upload a job description and resumes. Get a ranked shortlist in seconds.
          </p>
          <div className="auth-left-features">
            {[
              ["⚡", "AI scores every resume instantly"],
              ["🎯", "Skills, experience & education weighted"],
              ["📊", "Visual ranked leaderboard"],
              ["📝", "Recruiter notes & status tracking"],
            ].map(([icon, text], i) => (
              <div className="auth-feature-item" key={i}>
                <div className="auth-feature-dot">{icon}</div>
                {text}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="auth-split-right">
        <div className="auth-card">
          <div className="auth-card-logo">
            <div className="auth-card-logo-mark">TA</div>
            <span className="auth-card-logo-text">TalentAlign AI</span>
          </div>

          <h2>Welcome back</h2>
          <p className="auth-card-sub">Sign in to your recruiter dashboard</p>

          <form onSubmit={handleLogin} className="auth-form">
            {error && <div className="auth-error">{error}</div>}

            <div className="form-group">
              <label>Email address</label>
              <input
                type="email"
                placeholder="recruiter@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="auth-submit-btn" disabled={loading}>
              {loading ? "Signing in…" : "Sign In →"}
            </button>

            <p className="auth-switch">
              Don't have an account? <Link to="/signup">Create one free</Link>
            </p>
          </form>

          <div className="auth-demo-box">
            <strong>Demo credentials:</strong><br />
            Email: demo@talentalign.com · Password: demo123
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;