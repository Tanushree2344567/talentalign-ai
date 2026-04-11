import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import "./ChoosePlan.css";

const plans = [
  {
    id: "free",
    name: "Free",
    price: "₹0",
    period: "forever",
    desc: "For solo recruiters getting started",
    features: [
      "Up to 5 active projects",
      "Up to 2 job postings",
      "Basic AI candidate ranking",
      "No recruiter email sending",
      "No AI re-screen / interview questions",
    ],
    btnLabel: "Get Started Free",
    highlight: false,
    badge: null,
  },
  {
    id: "pro",
    name: "Pro",
    price: "₹499",
    period: "/ month",
    desc: "For growing teams with regular hiring",
    features: [
      "Up to 20 active projects",
      "Up to 15 job postings",
      "Candidate email sending",
      "AI interview questions + re-screening",
      "LinkedIn post + job recommendations",
    ],
    btnLabel: "Choose Pro",
    highlight: true,
    badge: "Most Popular",
  },
  {
    id: "premium",
    name: "Premium",
    price: "₹999",
    period: "/ month",
    desc: "For high-volume hiring and full automation",
    features: [
      "Up to 999 active projects",
      "Up to 999 job postings",
      "All AI tools unlocked",
      "Advanced candidate communication flows",
      "Priority support and faster assistance",
    ],
    btnLabel: "Go Premium",
    highlight: false,
    badge: null,
  },
];

const ChoosePlan = () => {
  const navigate  = useNavigate();
  const [selected, setSelected] = useState(null);
  const [loading,  setLoading]  = useState(false);

  // No redirect guard here — users can revisit to upgrade anytime

  const savePlanToBackend = async (planId) => {
    try {
      await api.post("/auth/update-plan", { plan: planId });
    } catch (e) {
      console.error("Failed to save plan:", e);
    }
  };

  const handleSelect = async (plan) => {
    setSelected(plan.id);
    setLoading(true);

    if (plan.id === "free") {
      await savePlanToBackend("free");
      localStorage.setItem("user_plan", "free");
      localStorage.setItem("plan_chosen", "true");
      localStorage.removeItem("show_choose_plan");
      const profileSet = localStorage.getItem("company_profile_set");
      navigate(profileSet ? "/dashboard" : "/company-profile");
    } else {
      localStorage.setItem("user_plan", plan.id);
      navigate("/payment", { state: { plan } });
    }

    setLoading(false);
  };

  const handleSkip = async () => {
    await savePlanToBackend("free");
    localStorage.setItem("user_plan", "free");
    localStorage.setItem("plan_chosen", "true");
    localStorage.removeItem("show_choose_plan");
    const profileSet = localStorage.getItem("company_profile_set");
    navigate(profileSet ? "/dashboard" : "/company-profile");
  };

  return (
    <div className="plan-page">
      <div className="plan-glow plan-glow-1" />
      <div className="plan-glow plan-glow-2" />

      <div className="plan-header">
        <div className="plan-logo">
          <div className="plan-logo-mark">TA</div>
          <span className="plan-logo-text">TalentAlign <em>AI</em></span>
        </div>
        <h1 className="plan-title">Choose Your Plan</h1>
        <p className="plan-subtitle">Select a plan that fits your hiring needs. Upgrade or downgrade anytime.</p>
      </div>

      <div className="plan-grid">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`plan-card ${plan.highlight ? "plan-card-highlight" : ""} ${selected === plan.id ? "plan-card-selected" : ""}`}
          >
            {plan.badge && <div className="plan-badge">{plan.badge}</div>}

            <div className="plan-card-top">
              <h2 className="plan-name">{plan.name}</h2>
              <p className="plan-desc">{plan.desc}</p>
              <div className="plan-price-row">
                <span className="plan-price">{plan.price}</span>
                <span className="plan-period">{plan.period}</span>
              </div>
            </div>

            <ul className="plan-features">
              {plan.features.map((f, i) => (
                <li key={i}>
                  <span className="plan-check">✓</span>
                  {f}
                </li>
              ))}
            </ul>

            <button
              className={`plan-btn ${plan.highlight ? "plan-btn-highlight" : ""}`}
              onClick={() => handleSelect(plan)}
              disabled={loading}
            >
              {selected === plan.id && loading ? "Processing..." : plan.btnLabel}
            </button>
          </div>
        ))}
      </div>

      <div className="plan-skip-wrap">
        <button className="plan-skip-btn" onClick={handleSkip}>
          Skip for now — continue with Free plan
          <span className="plan-skip-arrow">→</span>
        </button>
      </div>
    </div>
  );
};

export default ChoosePlan;