import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../services/api";
import "./Auth.css";

const Signup = () => {
  const navigate = useNavigate();

  const [fullName,  setFullName]  = useState("");
  const [email,     setEmail]     = useState("");
  const [password,  setPassword]  = useState("");
  const [company,   setCompany]   = useState("");
  const [jobTitle,  setJobTitle]  = useState("");
  const [phone,     setPhone]     = useState("");
  const [error,     setError]     = useState("");
  const [loading,   setLoading]   = useState(false);

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api.post("/auth/signup", {
        email,
        password,
        full_name: fullName,
        company:   company   || null,
        job_title: jobTitle  || null,
        phone:     phone     || null,
      });

      // Save token
      localStorage.setItem("access_token", res.data.access_token);

      // Mark that choose-plan should show (first time only)
      localStorage.setItem("show_choose_plan", "true");

      // Go to choose-plan page
      navigate("/choose-plan");

    } catch (err) {
      setError(err.response?.data?.detail || "Registration failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">

      {/* Left panel */}
      <div className="auth-split-left">
        <div className="auth-left-content">
          <div className="auth-left-logo">
            <div className="auth-left-logo-mark">TA</div>
            <span className="auth-left-logo-text">TalentAlign <em>AI</em></span>
          </div>
          <div className="auth-left-tagline">
            Join thousands of<br /><span>smarter recruiters.</span>
          </div>
          <p className="auth-left-sub">
            Free to use. No credit card. Start screening resumes with AI in under 2 minutes.
          </p>
          <div className="auth-left-features">
            {[
              ["🚀", "Get started in under 2 minutes"],
              ["🆓", "100% free to use"],
              ["🔒", "Secure JWT authentication"],
              ["🤖", "GPT-4 powered analysis"],
            ].map(([icon, text], i) => (
              <div className="auth-feature-item" key={i}>
                <div className="auth-feature-dot">{icon}</div>{text}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="auth-split-right">
        <div className="auth-card">
          <div className="auth-card-logo">
            <div className="auth-card-logo-mark">TA</div>
            <span className="auth-card-logo-text">TalentAlign AI</span>
          </div>
          <h2>Create account</h2>
          <p className="auth-card-sub">Start screening resumes with AI today</p>

          <form onSubmit={handleSignup} className="auth-form">
            {error && <div className="auth-error">{error}</div>}

            <div className="form-group">
              <label>Full Name <span className="required">*</span></label>
              <input type="text" placeholder="Jane Smith" value={fullName}
                onChange={(e) => setFullName(e.target.value)} required />
            </div>

            <div className="form-group">
              <label>Email address <span className="required">*</span></label>
              <input type="email" placeholder="recruiter@company.com" value={email}
                onChange={(e) => setEmail(e.target.value)} required />
            </div>

            <div className="form-group">
              <label>Password <span className="required">*</span></label>
              <input type="password" placeholder="Create a strong password" value={password}
                onChange={(e) => setPassword(e.target.value)} required />
            </div>

            <div className="form-group">
              <label>Company Name <span className="required">*</span></label>
              <input type="text" placeholder="e.g. Infosys, TCS, Wipro" value={company}
                onChange={(e) => setCompany(e.target.value)} required />
            </div>

            <div className="form-group">
              <label>Job Title <span className="required">*</span></label>
              <input type="text" placeholder="e.g. HR Manager, Recruiter" value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)} required />
            </div>

            <div className="form-group">
              <label>Phone Number <span className="optional">(optional)</span></label>
              <input type="tel" placeholder="e.g. +91 98765 43210" value={phone}
                onChange={(e) => setPhone(e.target.value)} />
            </div>

            <button type="submit" className="auth-submit-btn" disabled={loading}>
              {loading ? "Creating account…" : "Create Account →"}
            </button>

            <p className="auth-switch">
              Already have an account? <Link to="/login">Sign in</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Signup;
