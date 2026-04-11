import React, { useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import "./Auth.css";

const ForgotPassword = () => {
  const [email, setEmail]       = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.post("/auth/forgot-password", { email });
      setSubmitted(true);
    } catch (err) {
      setError(err.response?.data?.detail || "Something went wrong. Please try again.");
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
            Forgot your<br />
            <span>password?</span>
          </div>
          <p className="auth-left-sub">
            No worries — it happens to the best of us. Enter your email and we'll send you a secure reset link.
          </p>
          <div className="auth-left-features">
            {[
              ["🔒", "Secure token — expires in 30 minutes"],
              ["📧", "Sent to your registered email"],
              ["🔑", "Set a brand new password"],
              ["✅", "Back to recruiting in seconds"],
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

          {submitted ? (
            <div className="fp-success">
              <div className="fp-success-icon">📬</div>
              <h2>Check your inbox</h2>
              <p className="auth-card-sub" style={{ marginBottom: 0 }}>
                If <strong>{email}</strong> is registered, a password reset link is on its way. Check your spam folder if you don't see it within a minute.
              </p>
              <div className="fp-success-note">
                The link expires in <strong>30 minutes</strong>.
              </div>
              <Link to="/login" className="auth-submit-btn" style={{ display: "block", textAlign: "center", textDecoration: "none", marginTop: 24 }}>
                ← Back to Sign In
              </Link>
            </div>
          ) : (
            <>
              <h2>Reset password</h2>
              <p className="auth-card-sub">We'll email you a link to reset your password.</p>

              <form onSubmit={handleSubmit} className="auth-form">
                {error && <div className="auth-error">{error}</div>}

                <div className="form-group">
                  <label>Email address</label>
                  <input
                    type="email"
                    placeholder="recruiter@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoFocus
                  />
                </div>

                <button type="submit" className="auth-submit-btn" disabled={loading}>
                  {loading ? "Sending…" : "Send Reset Link →"}
                </button>

                <p className="auth-switch">
                  Remembered it? <Link to="/login">Sign in</Link>
                </p>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;