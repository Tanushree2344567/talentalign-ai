import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import "./Profile.css";

const API = process.env.REACT_APP_API_URL || "http://localhost:8000";

function getInitials(name, email) {
  if (name && name.trim()) {
    return name.trim().split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  }
  return email ? email[0].toUpperCase() : "?";
}

const Profile = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("access_token");

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Profile form
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState(null); // {type: "success"|"error", text}

  // Password form
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg, setPwMsg] = useState(null);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    fetchMe();
    // eslint-disable-next-line
  }, []);

  async function fetchMe() {
    setLoading(true);
    try {
      const res = await fetch(`${API}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setUser(data);
      setFullName(data.full_name || "");
      setEmail(data.email || "");
    } catch {
      navigate("/login");
    } finally {
      setLoading(false);
    }
  }

  async function handleProfileSave(e) {
    e.preventDefault();
    setProfileSaving(true);
    setProfileMsg(null);
    try {
      const res = await fetch(`${API}/auth/me`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ full_name: fullName, email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to update profile");
      setUser(data);
      setProfileMsg({ type: "success", text: "Profile updated successfully!" });
    } catch (err) {
      setProfileMsg({ type: "error", text: err.message });
    } finally {
      setProfileSaving(false);
    }
  }

  async function handlePasswordSave(e) {
    e.preventDefault();
    setPwMsg(null);
    if (newPassword !== confirmPassword) {
      setPwMsg({ type: "error", text: "New passwords don't match" });
      return;
    }
    if (newPassword.length < 6) {
      setPwMsg({ type: "error", text: "Password must be at least 6 characters" });
      return;
    }
    setPwSaving(true);
    try {
      const res = await fetch(`${API}/auth/me/password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to update password");
      setPwMsg({ type: "success", text: "Password changed successfully!" });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setPwMsg({ type: "error", text: err.message });
    } finally {
      setPwSaving(false);
    }
  }

  const profileDirty =
    user && (fullName !== (user.full_name || "") || email !== user.email);

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="profile-page">
          <div className="profile-loading">
            <div className="spinner" />
            <span>Loading profile…</span>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="profile-page">
        <div className="profile-content">

          {/* ── Header ── */}
          <div className="profile-header">
            <div>
              <h1>My Profile</h1>
              <p>Manage your account information and password</p>
            </div>
          </div>

          <div className="profile-grid">

            {/* ── Left: Avatar + meta ── */}
            <div className="profile-sidebar">
              <div className="profile-avatar-card">
                <div className="profile-avatar">
                  {getInitials(user.full_name, user.email)}
                </div>
                <div className="profile-avatar-name">
                  {user.full_name || "No name set"}
                </div>
                <div className="profile-avatar-email">{user.email}</div>
                {user.created_at && (
                  <div className="profile-avatar-since">
                    Member since{" "}
                    {new Date(user.created_at).toLocaleDateString("en-US", {
                      month: "long",
                      year: "numeric",
                    })}
                  </div>
                )}
              </div>

              <div className="profile-stats-card">
                <div className="profile-stat">
                  <span className="profile-stat-icon">🗂️</span>
                  <span className="profile-stat-label">Account ID</span>
                  <span className="profile-stat-value">#{user.id}</span>
                </div>
                <div className="profile-stat-divider" />
                <div className="profile-stat">
                  <span className="profile-stat-icon">🔐</span>
                  <span className="profile-stat-label">Auth</span>
                  <span className="profile-stat-value">JWT</span>
                </div>
              </div>
            </div>

            {/* ── Right: Forms ── */}
            <div className="profile-forms">

              {/* Profile Info */}
              <div className="profile-card">
                <div className="profile-card-header">
                  <div className="profile-card-title">
                    <span className="profile-card-icon">👤</span>
                    <div>
                      <h2>Personal Information</h2>
                      <p>Update your name and email address</p>
                    </div>
                  </div>
                </div>

                <form className="profile-form" onSubmit={handleProfileSave}>
                  <div className="form-group">
                    <label>Full Name</label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => {
                        setFullName(e.target.value);
                        setProfileMsg(null);
                      }}
                      placeholder="Your full name"
                    />
                  </div>

                  <div className="form-group">
                    <label>Email Address</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setProfileMsg(null);
                      }}
                      placeholder="your@email.com"
                    />
                  </div>

                  {profileMsg && (
                    <div className={`profile-msg profile-msg--${profileMsg.type}`}>
                      {profileMsg.type === "success" ? "✓" : "✕"} {profileMsg.text}
                    </div>
                  )}

                  <div className="profile-form-footer">
                    <button
                      type="submit"
                      className="btn-profile-save"
                      disabled={profileSaving || !profileDirty}
                    >
                      {profileSaving ? "Saving…" : "Save Changes"}
                    </button>
                  </div>
                </form>
              </div>

              {/* Password */}
              <div className="profile-card">
                <div className="profile-card-header">
                  <div className="profile-card-title">
                    <span className="profile-card-icon">🔑</span>
                    <div>
                      <h2>Change Password</h2>
                      <p>Choose a strong password with at least 6 characters</p>
                    </div>
                  </div>
                </div>

                <form className="profile-form" onSubmit={handlePasswordSave}>
                  <div className="form-group">
                    <label>Current Password</label>
                    <div className="pw-input-wrap">
                      <input
                        type={showCurrent ? "text" : "password"}
                        value={currentPassword}
                        onChange={(e) => {
                          setCurrentPassword(e.target.value);
                          setPwMsg(null);
                        }}
                        placeholder="Enter current password"
                      />
                      <button
                        type="button"
                        className="pw-toggle"
                        onClick={() => setShowCurrent((v) => !v)}
                        tabIndex={-1}
                      >
                        {showCurrent ? "🙈" : "👁"}
                      </button>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>New Password</label>
                    <div className="pw-input-wrap">
                      <input
                        type={showNew ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => {
                          setNewPassword(e.target.value);
                          setPwMsg(null);
                        }}
                        placeholder="At least 6 characters"
                      />
                      <button
                        type="button"
                        className="pw-toggle"
                        onClick={() => setShowNew((v) => !v)}
                        tabIndex={-1}
                      >
                        {showNew ? "🙈" : "👁"}
                      </button>
                    </div>
                    {newPassword && (
                      <div className="pw-strength">
                        <div
                          className={`pw-strength-bar pw-strength-${
                            newPassword.length < 6
                              ? "weak"
                              : newPassword.length < 10
                              ? "medium"
                              : "strong"
                          }`}
                        />
                        <span className="pw-strength-label">
                          {newPassword.length < 6
                            ? "Too short"
                            : newPassword.length < 10
                            ? "Medium"
                            : "Strong"}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="form-group">
                    <label>Confirm New Password</label>
                    <div className="pw-input-wrap">
                      <input
                        type={showConfirm ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => {
                          setConfirmPassword(e.target.value);
                          setPwMsg(null);
                        }}
                        placeholder="Repeat new password"
                      />
                      <button
                        type="button"
                        className="pw-toggle"
                        onClick={() => setShowConfirm((v) => !v)}
                        tabIndex={-1}
                      >
                        {showConfirm ? "🙈" : "👁"}
                      </button>
                    </div>
                    {confirmPassword && newPassword !== confirmPassword && (
                      <span className="pw-mismatch">Passwords don't match</span>
                    )}
                  </div>

                  {pwMsg && (
                    <div className={`profile-msg profile-msg--${pwMsg.type}`}>
                      {pwMsg.type === "success" ? "✓" : "✕"} {pwMsg.text}
                    </div>
                  )}

                  <div className="profile-form-footer">
                    <button
                      type="submit"
                      className="btn-profile-save"
                      disabled={
                        pwSaving ||
                        !currentPassword ||
                        !newPassword ||
                        !confirmPassword
                      }
                    >
                      {pwSaving ? "Updating…" : "Update Password"}
                    </button>
                  </div>
                </form>
              </div>

              {/* Danger Zone */}
              <div className="profile-card profile-card--danger">
                <div className="profile-card-header">
                  <div className="profile-card-title">
                    <span className="profile-card-icon">⚠️</span>
                    <div>
                      <h2>Account Actions</h2>
                      <p>Irreversible account operations</p>
                    </div>
                  </div>
                </div>
                <div className="danger-zone">
                  <div className="danger-item">
                    <div>
                      <div className="danger-item-title">Sign out everywhere</div>
                      <div className="danger-item-desc">
                        Clears your session token from this device
                      </div>
                    </div>
                    <button
                      className="btn-danger-outline"
                      onClick={() => {
                        localStorage.removeItem("access_token");
                        navigate("/login");
                      }}
                    >
                      Log Out
                    </button>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Profile;
