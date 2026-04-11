import React, { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import api from "../services/api";
import "./Auth.css";

const ResetPassword = () => {
  const [searchParams]          = useSearchParams();
  const navigate                = useNavigate();
  const token                   = searchParams.get("token") || "";

  const [tokenValid, setTokenValid]   = useState(null); // null = checking
  const [tokenEmail, setTokenEmail]   = useState("");
  const [password, setPassword]       = useState("");
  const [confirm, setConfirm]         = useState("");
  const [showPass, setShowPass]       = useState(false);
  const [error, setError]             = useState("");
  const [loading, setLoading]         = useState(false);
  const [done, setDone]               = useState(false);

  // Validate token on mount
  useEffect(() => {
    if (!token) {
      setTokenValid(false);
      return;
    }
    api.get(`/auth/validate-reset-token?token=${encodeURIComponent(token)}`)
      .then((res) => {
        setTokenValid(true);
        setTokenEmail(res.data.email || "");
      })
      .catch(() => setTokenValid(false));
  }, [token]);

  const passwordStrength = (pw) => {
    if (!pw) return null;
    let score = 0;
    if (pw.length >= 8)  score++;
    if (pw.length >= 12) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    if (score <= 1) return { label: "Weak", color: "#ef4444", width: "25%" };
    if (score <= 2) return { label: "Fair", color: "#f59e0b", width: "50%" };
    if (score <= 3) return { label: "Good", color: "#3b82f6", width: "75%" };
    return { label: "Strong", color: "#10b981", width: "100%" };
  };

  const strength = passwordStrength(password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      return setError("Password must be at least 8 characters.");
    }
    if (password !== confirm) {
      return setError("Passwords don't match.");
    }

    setLoading(true);
    try {
      await api.post("/auth/reset-password", { token, new_password: password });
      setDone(true);
      setTimeout(() => navigate("/login"), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── Loading state ──────────────────────────────────────────────────────────
  if (tokenValid === null) {
    return (
      <div className="auth-page">
        <div className="auth-split-right" style={{ margin: "auto" }}>
          <div className="auth-card" style={{ textAlign: "center" }}>
            <div style={{ fontSize: 32, marginBottom: 16 }}>⏳</div>
            <p className="auth-card-sub">Validating your reset link…</p>
          </div>
        </div>
      </div>
    );
  }

  // ── Invalid / expired token ────────────────────────────────────────────────
  if (!tokenValid) {
    return (
      <div className="auth-page">
        <div className="auth-split-right" style={{ margin: "auto" }}>
          <div className="auth-card" style={{ textAlign: "center" }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>🔗</div>
            <h2>Link expired</h2>
            <p className="auth-card-sub" style={{ marginBottom: 24 }}>
              This password reset link is invalid or has expired. Reset links are only valid for 30 minutes.
            </p>
            <Link to="/forgot-password" className="auth-submit-btn" style={{ display: "block", textDecoration: "none", textAlign: "center" }}>
              Request a New Link →
            </Link>
            <p className="auth-switch" style={{ marginTop: 16 }}>
              <Link to="/login">← Back to Sign In</Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── Success state ──────────────────────────────────────────────────────────
  if (done) {
    return (
      <div className="auth-page">
        <div className="auth-split-right" style={{ margin: "auto" }}>
          <div className="auth-card" style={{ textAlign: "center" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
            <h2>Password updated!</h2>
            <p className="auth-card-sub">
              Your password has been reset successfully. Redirecting you to the sign-in page…
            </p>
            <Link to="/login" className="auth-submit-btn" style={{ display: "block", textDecoration: "none", textAlign: "center", marginTop: 24 }}>
              Sign In Now →
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Main form ──────────────────────────────────────────────────────────────
  return (
    <div className="auth-page">
      <div className="auth-split-left">
        <div className="auth-left-content">
          <div className="auth-left-logo">
            <div className="auth-left-logo-mark">TA</div>
            <span className="auth-left-logo-text">TalentAlign <em>AI</em></span>
          </div>
          <div className="auth-left-tagline">
            Set your<br />
            <span>new password</span>
          </div>
          <p className="auth-left-sub">
            Choose something strong and memorable. A good password has at least 12 characters, uppercase, numbers, and a symbol.
          </p>
          <div className="auth-left-features">
            {[
              ["🔑", "Min. 8 characters"],
              ["🔠", "Mix of upper & lowercase"],
              ["🔢", "Include numbers"],
              ["✨", "Special characters help"],
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

          <h2>New password</h2>
          <p className="auth-card-sub">
            {tokenEmail ? <>Resetting for <strong>{tokenEmail}</strong></> : "Create your new password below."}
          </p>

          <form onSubmit={handleSubmit} className="auth-form">
            {error && <div className="auth-error">{error}</div>}

            <div className="form-group">
              <label>New password</label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPass ? "text" : "password"}
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoFocus
                  style={{ width: "100%", boxSizing: "border-box", paddingRight: 44 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  style={{
                    position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                    background: "none", border: "none", cursor: "pointer", color: "var(--text3)",
                    fontSize: 16, padding: 0,
                  }}
                  aria-label={showPass ? "Hide password" : "Show password"}
                >
                  {showPass ? "🙈" : "👁️"}
                </button>
              </div>

              {/* Strength meter */}
              {strength && (
                <div style={{ marginTop: 8 }}>
                  <div style={{ height: 4, borderRadius: 99, background: "var(--border)", overflow: "hidden" }}>
                    <div style={{
                      height: "100%", width: strength.width,
                      background: strength.color,
                      transition: "width 0.3s, background 0.3s",
                      borderRadius: 99,
                    }} />
                  </div>
                  <span style={{ fontSize: 11, color: strength.color, fontWeight: 600 }}>
                    {strength.label}
                  </span>
                </div>
              )}
            </div>

            <div className="form-group">
              <label>Confirm new password</label>
              <input
                type={showPass ? "text" : "password"}
                placeholder="Repeat your password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                style={confirm && confirm !== password ? { borderColor: "#ef4444" } : {}}
              />
              {confirm && confirm !== password && (
                <span style={{ fontSize: 12, color: "#ef4444" }}>Passwords don't match</span>
              )}
            </div>

            <button
              type="submit"
              className="auth-submit-btn"
              disabled={loading || !password || !confirm}
            >
              {loading ? "Updating…" : "Set New Password →"}
            </button>

            <p className="auth-switch">
              <Link to="/login">← Back to Sign In</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
