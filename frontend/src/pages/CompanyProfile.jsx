import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import "./CompanyProfile.css";

const INDUSTRIES = [
  "Technology", "Finance & Banking", "Healthcare", "E-Commerce",
  "Education", "Manufacturing", "Consulting", "Media & Entertainment",
  "Real Estate", "Logistics", "Retail", "Telecommunications", "Other",
];

const COMPANY_SIZES = [
  { label: "1–10", desc: "Startup" },
  { label: "11–50", desc: "Small" },
  { label: "51–200", desc: "Mid-size" },
  { label: "201–1000", desc: "Large" },
  { label: "1000+", desc: "Enterprise" },
];

const ROLE_SUGGESTIONS = [
  "Frontend Developer", "Backend Developer", "Full Stack Developer",
  "Data Scientist", "Data Analyst", "ML Engineer", "DevOps Engineer",
  "Product Manager", "UI/UX Designer", "QA Engineer", "Business Analyst",
  "HR Manager", "Sales Executive", "Marketing Manager",
];

const CompanyProfile = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1 = company info, 2 = hiring needs
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    company_name: "",
    industry: "",
    company_size: "",
    website: "",
    location: "",
    description: "",
    hiring_roles: [],
    custom_role: "",
  });

  const [errors, setErrors] = useState({});

  const set = (key, val) => {
    setForm((prev) => ({ ...prev, [key]: val }));
    setErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const toggleRole = (role) => {
    setForm((prev) => ({
      ...prev,
      hiring_roles: prev.hiring_roles.includes(role)
        ? prev.hiring_roles.filter((r) => r !== role)
        : [...prev.hiring_roles, role],
    }));
  };

  const addCustomRole = () => {
    const r = form.custom_role.trim();
    if (r && !form.hiring_roles.includes(r)) {
      setForm((prev) => ({
        ...prev,
        hiring_roles: [...prev.hiring_roles, r],
        custom_role: "",
      }));
    }
  };

  const validateStep1 = () => {
    const e = {};
    if (!form.company_name.trim()) e.company_name = "Company name is required";
    if (!form.industry) e.industry = "Please select an industry";
    if (!form.company_size) e.company_size = "Please select company size";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = () => {
    if (validateStep1()) setStep(2);
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      await api.post("/auth/company-profile", {
        company_name: form.company_name,
        industry: form.industry,
        company_size: form.company_size,
        website: form.website,
        location: form.location,
        description: form.description,
        hiring_roles: form.hiring_roles,
      });
    } catch (e) {
      // Non-blocking — profile saves best-effort
      console.error("Profile save failed:", e);
    } finally {
      setSaving(false);
      localStorage.setItem("company_profile_set", "true");
      localStorage.setItem("company_name", form.company_name);
      navigate("/dashboard");
    }
  };

  const handleSkip = () => {
    localStorage.setItem("company_profile_set", "true");
    navigate("/dashboard");
  };

  return (
    <div className="cp-page">
      {/* Background blobs */}
      <div className="cp-blob cp-blob-1" />
      <div className="cp-blob cp-blob-2" />
      <div className="cp-blob cp-blob-3" />

      <div className="cp-container">
        {/* Logo */}
        <div className="cp-logo">
          <div className="cp-logo-mark">TA</div>
          <span className="cp-logo-text">TalentAlign <em>AI</em></span>
        </div>

        {/* Progress */}
        <div className="cp-progress">
          <div className={`cp-step ${step >= 1 ? "cp-step-active" : ""}`}>
            <div className="cp-step-dot">{step > 1 ? "✓" : "1"}</div>
            <span>Company Info</span>
          </div>
          <div className="cp-step-line" />
          <div className={`cp-step ${step >= 2 ? "cp-step-active" : ""}`}>
            <div className="cp-step-dot">2</div>
            <span>Hiring Needs</span>
          </div>
        </div>

        <div className="cp-card">
          {step === 1 && (
            <>
              <div className="cp-card-header">
                <h1>Tell us about your company</h1>
                <p>This helps TalentAlign AI personalise your recruitment experience</p>
              </div>

              <div className="cp-form">
                {/* Company Name */}
                <div className={`cp-field ${errors.company_name ? "cp-field-error" : ""}`}>
                  <label>Company Name <span className="cp-required">*</span></label>
                  <input
                    type="text"
                    placeholder="e.g. Infosys, Startup Labs Pvt. Ltd."
                    value={form.company_name}
                    onChange={(e) => set("company_name", e.target.value)}
                  />
                  {errors.company_name && <span className="cp-error-msg">{errors.company_name}</span>}
                </div>

                {/* Industry */}
                <div className={`cp-field ${errors.industry ? "cp-field-error" : ""}`}>
                  <label>Industry <span className="cp-required">*</span></label>
                  <select value={form.industry} onChange={(e) => set("industry", e.target.value)}>
                    <option value="">Select your industry</option>
                    {INDUSTRIES.map((ind) => (
                      <option key={ind} value={ind}>{ind}</option>
                    ))}
                  </select>
                  {errors.industry && <span className="cp-error-msg">{errors.industry}</span>}
                </div>

                {/* Company Size */}
                <div className={`cp-field ${errors.company_size ? "cp-field-error" : ""}`}>
                  <label>Company Size <span className="cp-required">*</span></label>
                  <div className="cp-size-grid">
                    {COMPANY_SIZES.map((s) => (
                      <button
                        key={s.label}
                        className={`cp-size-btn ${form.company_size === s.label ? "cp-size-btn-active" : ""}`}
                        onClick={() => set("company_size", s.label)}
                        type="button"
                      >
                        <span className="cp-size-label">{s.label}</span>
                        <span className="cp-size-desc">{s.desc}</span>
                      </button>
                    ))}
                  </div>
                  {errors.company_size && <span className="cp-error-msg">{errors.company_size}</span>}
                </div>

                {/* Two columns */}
                <div className="cp-row">
                  <div className="cp-field">
                    <label>Website <span className="cp-optional">(optional)</span></label>
                    <input
                      type="text"
                      placeholder="https://yourcompany.com"
                      value={form.website}
                      onChange={(e) => set("website", e.target.value)}
                    />
                  </div>
                  <div className="cp-field">
                    <label>Headquarters <span className="cp-optional">(optional)</span></label>
                    <input
                      type="text"
                      placeholder="e.g. Bengaluru, India"
                      value={form.location}
                      onChange={(e) => set("location", e.target.value)}
                    />
                  </div>
                </div>

                {/* Description */}
                <div className="cp-field">
                  <label>About your company <span className="cp-optional">(optional)</span></label>
                  <textarea
                    rows={3}
                    placeholder="Briefly describe what your company does, your mission, culture..."
                    value={form.description}
                    onChange={(e) => set("description", e.target.value)}
                  />
                  <span className="cp-char-count">{form.description.length}/300</span>
                </div>
              </div>

              <div className="cp-actions">
                <button className="cp-btn-skip" onClick={handleSkip}>Skip for now</button>
                <button className="cp-btn-next" onClick={handleNext}>
                  Next — Hiring Needs →
                </button>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="cp-card-header">
                <h1>What roles are you hiring for?</h1>
                <p>Select the job roles you actively recruit for. AI will use this to improve matching.</p>
              </div>

              <div className="cp-form">
                {/* Role chips */}
                <div className="cp-field">
                  <label>Common Roles <span className="cp-optional">(pick any)</span></label>
                  <div className="cp-roles-grid">
                    {ROLE_SUGGESTIONS.map((role) => (
                      <button
                        key={role}
                        type="button"
                        className={`cp-role-chip ${form.hiring_roles.includes(role) ? "cp-role-chip-active" : ""}`}
                        onClick={() => toggleRole(role)}
                      >
                        {form.hiring_roles.includes(role) ? "✓ " : ""}{role}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom role input */}
                <div className="cp-field">
                  <label>Add custom role <span className="cp-optional">(optional)</span></label>
                  <div className="cp-custom-role-row">
                    <input
                      type="text"
                      placeholder="e.g. Blockchain Developer, Growth Hacker..."
                      value={form.custom_role}
                      onChange={(e) => set("custom_role", e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && addCustomRole()}
                    />
                    <button
                      type="button"
                      className="cp-btn-add"
                      onClick={addCustomRole}
                      disabled={!form.custom_role.trim()}
                    >
                      + Add
                    </button>
                  </div>
                </div>

                {/* Selected roles summary */}
                {form.hiring_roles.length > 0 && (
                  <div className="cp-selected-roles">
                    <label>Selected roles ({form.hiring_roles.length})</label>
                    <div className="cp-selected-tags">
                      {form.hiring_roles.map((r) => (
                        <span key={r} className="cp-selected-tag">
                          {r}
                          <button onClick={() => toggleRole(r)}>×</button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Info box */}
                <div className="cp-info-box">
                  <span className="cp-info-icon">💡</span>
                  <p>
                    These roles will appear in your <strong>Jobs</strong> board and will be included
                    in recommendation emails sent to candidates. You can update them anytime from
                    your profile.
                  </p>
                </div>
              </div>

              <div className="cp-actions">
                <button className="cp-btn-skip" onClick={() => setStep(1)}>← Back</button>
                <button
                  className="cp-btn-next"
                  onClick={handleSubmit}
                  disabled={saving}
                >
                  {saving ? "Saving..." : "🚀 Go to Dashboard"}
                </button>
              </div>
            </>
          )}
        </div>

        {/* Features preview */}
        <div className="cp-features">
          <div className="cp-feature">
            <span className="cp-feature-icon">🤖</span>
            <span>AI-powered resume matching</span>
          </div>
          <div className="cp-feature">
            <span className="cp-feature-icon">📧</span>
            <span>Automated candidate emails</span>
          </div>
          <div className="cp-feature">
            <span className="cp-feature-icon">💼</span>
            <span>Public job board included</span>
          </div>
          <div className="cp-feature">
            <span className="cp-feature-icon">📊</span>
            <span>Recruitment analytics</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyProfile;
