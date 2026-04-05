import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./ChoosePlan.css";

const plans = [
  {
    id: "free",
    name: "Free",
    price: "₹0",
    period: "forever",
    desc: "Perfect for trying out TalentAlign",
    features: ["10 resumes / month", "Basic AI matching", "Candidate ranking", "Email notifications"],
    btnLabel: "Get Started",
    highlight: false,
    badge: null,
  },
  {
    id: "pro",
    name: "Pro",
    price: "₹499",
    period: "/ month",
    desc: "For growing recruitment teams",
    features: ["200 resumes / month", "Advanced AI ranking", "Recruiter notes & status", "Priority support", "Export results"],
    btnLabel: "Choose Pro",
    highlight: true,
    badge: "Most Popular",
  },
  {
    id: "premium",
    name: "Premium",
    price: "₹999",
    period: "/ month",
    desc: "For enterprise-level hiring",
    features: ["Unlimited resumes", "Best AI accuracy", "Full features access", "Dedicated support", "Custom integrations"],
    btnLabel: "Go Premium",
    highlight: false,
    badge: null,
  },
];

const ChoosePlan = () => {
  const navigate = useNavigate();
  const [selected, setSelected] = useState(null);

  const handleSelect = (planId) => {
    setSelected(planId);
    localStorage.setItem("user_plan", planId);
    setTimeout(() => navigate("/dashboard"), 300);
  };

  const handleSkip = () => {
    localStorage.setItem("user_plan", "free");
    navigate("/dashboard");
  };

  return (
    <div className="plan-page">

      {/* Background glow */}
      <div className="plan-glow plan-glow-1" />
      <div className="plan-glow plan-glow-2" />

      {/* Header */}
      <div className="plan-header">
        <div className="plan-logo">
          <div className="plan-logo-mark">TA</div>
          <span className="plan-logo-text">TalentAlign <em>AI</em></span>
        </div>
        <h1 className="plan-title">Choose Your Plan</h1>
        <p className="plan-subtitle">Select a plan that fits your hiring needs. Upgrade or downgrade anytime.</p>
      </div>

      {/* Cards */}
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
              onClick={() => handleSelect(plan.id)}
            >
              {plan.btnLabel}
            </button>
          </div>
        ))}
      </div>

      {/* Skip */}
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
