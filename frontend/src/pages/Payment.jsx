import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../services/api";
import "./Payment.css";

const Payment = () => {
  const navigate  = useNavigate();
  const location  = useLocation();
  const plan      = location.state?.plan;

  const [step,    setStep]    = useState("details"); // 'details' | 'processing' | 'success'
  const [cardNum, setCardNum] = useState("4111 1111 1111 1111");
  const [expiry,  setExpiry]  = useState("12/26");
  const [cvv,     setCvv]     = useState("123");
  const [name,    setName]    = useState("Test User");

  // If no plan passed, go back
  if (!plan) {
    navigate("/choose-plan");
    return null;
  }

  const savePlanToBackend = async (planId) => {
    try {
      await api.post("/auth/update-plan", { plan: planId });
    } catch (e) {
      console.error("Failed to save plan:", e);
    }
  };

  const handlePay = async (e) => {
    e.preventDefault();
    setStep("processing");

    // Simulate payment processing — 2 seconds
    await new Promise((r) => setTimeout(r, 2000));

    // Save plan to backend
    await savePlanToBackend(plan.id);
    localStorage.setItem("user_plan", plan.id);
    localStorage.setItem("plan_chosen", "true");
    localStorage.removeItem("show_choose_plan");

    setStep("success");

    // Redirect to dashboard after 2.5 seconds
    setTimeout(() => navigate("/dashboard"), 2500);
  };

  const PLAN_COLORS = {
    pro:     { color: "#7c3aed", bg: "#fdf4ff", label: "Pro Plan" },
    premium: { color: "#d97706", bg: "#fff7ed", label: "Premium Plan" },
  };
  const planStyle = PLAN_COLORS[plan.id] || PLAN_COLORS.pro;

  return (
    <div className="payment-page">

      {/* Processing overlay */}
      {step === "processing" && (
        <div className="payment-overlay">
          <div className="payment-overlay-card">
            <div className="payment-spinner" />
            <h3>Processing Payment...</h3>
            <p>Please wait. Do not close this page.</p>
          </div>
        </div>
      )}

      {/* Success overlay */}
      {step === "success" && (
        <div className="payment-overlay">
          <div className="payment-overlay-card">
            <div className="payment-success-icon">✅</div>
            <h3>Payment Successful!</h3>
            <p>Your <strong>{planStyle.label}</strong> is now active.</p>
            <p className="payment-redirect-note">Redirecting to Dashboard...</p>
          </div>
        </div>
      )}

      <div className="payment-content">

        {/* Back */}
        <button className="payment-back" onClick={() => navigate("/choose-plan")}>
          ← Back to Plans
        </button>

        <div className="payment-layout">

          {/* Left — Order Summary */}
          <div className="payment-summary">
            <h2>Order Summary</h2>

            <div className="summary-plan" style={{ background: planStyle.bg, borderColor: planStyle.color }}>
              <div className="summary-plan-name" style={{ color: planStyle.color }}>
                {planStyle.label}
              </div>
              <div className="summary-plan-price">{plan.price}<span>{plan.period}</span></div>
            </div>

            <ul className="summary-features">
              {plan.features.map((f, i) => (
                <li key={i}><span>✓</span> {f}</li>
              ))}
            </ul>

            <div className="summary-total">
              <span>Total today</span>
              <span className="summary-total-amount">{plan.price}</span>
            </div>

            <div className="summary-note">
              🔒 This is a demo payment. No real money will be charged.
            </div>
          </div>

          {/* Right — Payment Form */}
          <div className="payment-form-card">
            <h2>Payment Details</h2>
            <p className="payment-form-sub">Enter your card details below</p>

            <form onSubmit={handlePay} className="payment-form">

              <div className="payment-form-group">
                <label>Cardholder Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="payment-form-group">
                <label>Card Number</label>
                <input
                  type="text"
                  value={cardNum}
                  onChange={(e) => setCardNum(e.target.value)}
                  maxLength={19}
                  required
                />
                <span className="payment-card-icons">💳</span>
              </div>

              <div className="payment-form-row">
                <div className="payment-form-group">
                  <label>Expiry Date</label>
                  <input
                    type="text"
                    placeholder="MM/YY"
                    value={expiry}
                    onChange={(e) => setExpiry(e.target.value)}
                    maxLength={5}
                    required
                  />
                </div>
                <div className="payment-form-group">
                  <label>CVV</label>
                  <input
                    type="text"
                    placeholder="123"
                    value={cvv}
                    onChange={(e) => setCvv(e.target.value)}
                    maxLength={3}
                    required
                  />
                </div>
              </div>

              <div className="payment-demo-note">
                💡 Demo mode — use any values above. No real payment will happen.
              </div>

              <button type="submit" className="btn-pay-now">
                Pay {plan.price} Now →
              </button>

              <p className="payment-secure">
                🔒 Secured by TalentAlign — Demo Environment
              </p>

            </form>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Payment;
