import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../services/api";
import "./Payment.css";

const Payment = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const plan = location.state?.plan;

  const [step, setStep] = useState("details"); // 'details' | 'processing' | 'success'
  const [cardNum, setCardNum] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [name, setName] = useState("");
  const [focused, setFocused] = useState(null);
  const [cardType, setCardType] = useState("unknown");
  const [cvvVisible, setCvvVisible] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setTimeout(() => setMounted(true), 50);
  }, []);

  if (!plan) {
    navigate("/choose-plan");
    return null;
  }

  const detectCard = (num) => {
    const n = num.replace(/\s/g, "");
    if (/^4/.test(n)) return "visa";
    if (/^5[1-5]/.test(n)) return "mastercard";
    if (/^3[47]/.test(n)) return "amex";
    if (/^6(?:011|5)/.test(n)) return "discover";
    return "unknown";
  };

  const formatCard = (val) => {
    const digits = val.replace(/\D/g, "").slice(0, 16);
    return digits.replace(/(.{4})/g, "$1 ").trim();
  };

  const formatExpiry = (val) => {
    const digits = val.replace(/\D/g, "").slice(0, 4);
    if (digits.length >= 3) return digits.slice(0, 2) + "/" + digits.slice(2);
    return digits;
  };

  const handleCardChange = (e) => {
    const formatted = formatCard(e.target.value);
    setCardNum(formatted);
    setCardType(detectCard(formatted));
  };

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
    await new Promise((r) => setTimeout(r, 2200));
    await savePlanToBackend(plan.id);
    localStorage.setItem("user_plan", plan.id);
    localStorage.setItem("plan_chosen", "true");
    localStorage.removeItem("show_choose_plan");
    setStep("success");
    setTimeout(() => navigate("/dashboard"), 2800);
  };

  const PLAN_META = {
    pro: {
      color: "#6366f1",
      glow: "rgba(99,102,241,0.18)",
      tag: "Pro Plan",
      tagBg: "rgba(99,102,241,0.12)",
      tagColor: "#818cf8",
    },
    premium: {
      color: "#f59e0b",
      glow: "rgba(245,158,11,0.15)",
      tag: "Premium Plan",
      tagBg: "rgba(245,158,11,0.12)",
      tagColor: "#fbbf24",
    },
  };
  const meta = PLAN_META[plan.id] || PLAN_META.pro;

  const CARD_ICONS = {
    visa: (
      <svg viewBox="0 0 48 16" width="38" height="13" fill="none">
        <text x="0" y="13" fontFamily="Arial" fontWeight="900" fontSize="14" fill="#1a1f71">VISA</text>
      </svg>
    ),
    mastercard: (
      <svg viewBox="0 0 38 24" width="32" height="20">
        <circle cx="14" cy="12" r="12" fill="#eb001b" />
        <circle cx="24" cy="12" r="12" fill="#f79e1b" />
        <path d="M19 5.5a12 12 0 0 1 0 13A12 12 0 0 1 19 5.5z" fill="#ff5f00" />
      </svg>
    ),
    amex: (
      <svg viewBox="0 0 48 16" width="38" height="13" fill="none">
        <text x="0" y="13" fontFamily="Arial" fontWeight="900" fontSize="11" fill="#2671b9">AMEX</text>
      </svg>
    ),
    discover: (
      <svg viewBox="0 0 48 16" width="38" height="13" fill="none">
        <text x="0" y="13" fontFamily="Arial" fontWeight="700" fontSize="11" fill="#f76f20">DISC</text>
      </svg>
    ),
    unknown: null,
  };

  const maskedCard = cardNum
    ? cardNum.replace(/\d(?=\d{4})/g, "•")
    : "•••• •••• •••• ••••";

  return (
    <div className={`pmt-page ${mounted ? "pmt-mounted" : ""}`}>
      {/* Ambient background */}
      <div className="pmt-bg-orb pmt-orb-1" style={{ background: meta.glow.replace("0.18", "1") }} />
      <div className="pmt-bg-orb pmt-orb-2" />

      {/* Processing overlay */}
      {step === "processing" && (
        <div className="pmt-overlay">
          <div className="pmt-overlay-card">
            <div className="pmt-processing-ring">
              <div className="pmt-processing-inner">
                <svg viewBox="0 0 24 24" width="26" height="26" fill="none">
                  <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round"/>
                </svg>
              </div>
            </div>
            <h3 className="pmt-overlay-title">Processing Payment</h3>
            <p className="pmt-overlay-sub">Authenticating your card securely…</p>
            <div className="pmt-processing-steps">
              <span className="pmt-step pmt-step-done">✓ Encrypting details</span>
              <span className="pmt-step pmt-step-active">⟳ Verifying card</span>
              <span className="pmt-step pmt-step-pending">○ Confirming payment</span>
            </div>
          </div>
        </div>
      )}

      {/* Success overlay */}
      {step === "success" && (
        <div className="pmt-overlay">
          <div className="pmt-overlay-card pmt-success-card">
            <div className="pmt-success-ring">
              <svg viewBox="0 0 52 52" width="52" height="52" fill="none">
                <circle cx="26" cy="26" r="25" stroke="#22c55e" strokeWidth="2" />
                <path d="M14 27l8 8 16-16" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="pmt-check-path"/>
              </svg>
            </div>
            <h3 className="pmt-overlay-title">Payment Successful!</h3>
            <p className="pmt-overlay-sub">
              <strong style={{ color: meta.tagColor }}>{meta.tag}</strong> is now active on your account.
            </p>
            <div className="pmt-success-amount">{plan.price}<span>{plan.period}</span></div>
            <p className="pmt-redirect-note">Redirecting to Dashboard…</p>
          </div>
        </div>
      )}

      <div className="pmt-content">
        {/* Top bar */}
        <div className="pmt-topbar">
          <button className="pmt-back" onClick={() => navigate("/choose-plan")}>
            <svg viewBox="0 0 20 20" width="16" height="16" fill="none">
              <path d="M12 5L7 10l5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Back to Plans
          </button>
          <div className="pmt-brand">
            <div className="pmt-brand-mark">TA</div>
            <span className="pmt-brand-name">TalentAlign <em>AI</em></span>
          </div>
          <div className="pmt-secure-badge">
            <svg viewBox="0 0 16 20" width="11" height="14" fill="none">
              <path d="M8 1L1 4v5c0 4.4 3 8.5 7 9.5C15 17.5 15 13.4 15 9V4L8 1z" fill="#22c55e" fillOpacity="0.2" stroke="#22c55e" strokeWidth="1.4"/>
            </svg>
            SSL Secured
          </div>
        </div>

        <div className="pmt-layout">
          {/* LEFT — Visual card + order summary */}
          <div className="pmt-left">
            {/* Card Preview */}
            <div className="pmt-card-preview" style={{ "--card-glow": meta.glow }}>
              <div className="pmt-card-chip">
                <div className="pmt-chip-grid" />
              </div>
              <div className="pmt-card-logo">
                {CARD_ICONS[cardType]}
              </div>
              <div className="pmt-card-number">{maskedCard}</div>
              <div className="pmt-card-bottom">
                <div>
                  <div className="pmt-card-label">Card Holder</div>
                  <div className="pmt-card-value">{name || "Your Name"}</div>
                </div>
                <div>
                  <div className="pmt-card-label">Expires</div>
                  <div className="pmt-card-value">{expiry || "MM/YY"}</div>
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className="pmt-summary">
              <div className="pmt-summary-header">
                <span className="pmt-summary-title">Order Summary</span>
                <span className="pmt-plan-badge" style={{ background: meta.tagBg, color: meta.tagColor }}>
                  {meta.tag}
                </span>
              </div>

              <div className="pmt-summary-price">
                <span className="pmt-price-big">{plan.price}</span>
                <span className="pmt-price-period">{plan.period}</span>
              </div>

              <ul className="pmt-features">
                {plan.features.map((f, i) => (
                  <li key={i}>
                    <span className="pmt-feat-dot" style={{ background: meta.color }} />
                    {f}
                  </li>
                ))}
              </ul>

              <div className="pmt-divider" />

              <div className="pmt-total-row">
                <span>Total due today</span>
                <strong>{plan.price}</strong>
              </div>

              <div className="pmt-billing-note">
                <svg viewBox="0 0 16 16" width="13" height="13" fill="none">
                  <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.3"/>
                  <path d="M8 7v4M8 5v1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                Billed monthly. Cancel anytime from settings.
              </div>
            </div>
          </div>

          {/* RIGHT — Payment form */}
          <div className="pmt-form-card">
            <div className="pmt-form-header">
              <h2 className="pmt-form-title">Payment Details</h2>
              <p className="pmt-form-sub">Complete your purchase securely</p>
            </div>

            <form onSubmit={handlePay} className="pmt-form">
              {/* Cardholder Name */}
              <div className={`pmt-field ${focused === "name" ? "pmt-field-focused" : ""} ${name ? "pmt-field-filled" : ""}`}>
                <label className="pmt-label">Cardholder Name</label>
                <div className="pmt-input-wrap">
                  <svg className="pmt-input-icon" viewBox="0 0 20 20" width="16" height="16" fill="none">
                    <circle cx="10" cy="7" r="3.5" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M3 17c0-3.3 3.1-6 7-6s7 2.7 7 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onFocus={() => setFocused("name")}
                    onBlur={() => setFocused(null)}
                    placeholder="Name on card"
                    required
                  />
                </div>
              </div>

              {/* Card Number */}
              <div className={`pmt-field ${focused === "card" ? "pmt-field-focused" : ""} ${cardNum ? "pmt-field-filled" : ""}`}>
                <label className="pmt-label">Card Number</label>
                <div className="pmt-input-wrap">
                  <svg className="pmt-input-icon" viewBox="0 0 20 16" width="18" height="14" fill="none">
                    <rect x="1" y="1" width="18" height="14" rx="2.5" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M1 5h18" stroke="currentColor" strokeWidth="1.5"/>
                    <rect x="3" y="9" width="4" height="2" rx="0.5" fill="currentColor" opacity="0.5"/>
                  </svg>
                  <input
                    type="text"
                    value={cardNum}
                    onChange={handleCardChange}
                    onFocus={() => setFocused("card")}
                    onBlur={() => setFocused(null)}
                    placeholder="1234 5678 9012 3456"
                    maxLength={19}
                    required
                  />
                  <span className="pmt-card-type-icon">{CARD_ICONS[cardType]}</span>
                </div>
              </div>

              {/* Expiry + CVV */}
              <div className="pmt-field-row">
                <div className={`pmt-field ${focused === "expiry" ? "pmt-field-focused" : ""} ${expiry ? "pmt-field-filled" : ""}`}>
                  <label className="pmt-label">Expiry Date</label>
                  <div className="pmt-input-wrap">
                    <svg className="pmt-input-icon" viewBox="0 0 18 18" width="15" height="15" fill="none">
                      <rect x="1" y="3" width="16" height="14" rx="2" stroke="currentColor" strokeWidth="1.4"/>
                      <path d="M1 7h16M6 1v3M12 1v3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                    </svg>
                    <input
                      type="text"
                      value={expiry}
                      onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                      onFocus={() => setFocused("expiry")}
                      onBlur={() => setFocused(null)}
                      placeholder="MM / YY"
                      maxLength={5}
                      required
                    />
                  </div>
                </div>

                <div className={`pmt-field ${focused === "cvv" ? "pmt-field-focused" : ""} ${cvv ? "pmt-field-filled" : ""}`}>
                  <label className="pmt-label">
                    CVV
                    <span className="pmt-cvv-hint" title="3 or 4 digit security code on back of card">?</span>
                  </label>
                  <div className="pmt-input-wrap">
                    <svg className="pmt-input-icon" viewBox="0 0 18 18" width="15" height="15" fill="none">
                      <rect x="2" y="5" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.4"/>
                      <path d="M6 5V4a3 3 0 0 1 6 0v1" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                    </svg>
                    <input
                      type={cvvVisible ? "text" : "password"}
                      value={cvv}
                      onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
                      onFocus={() => setFocused("cvv")}
                      onBlur={() => setFocused(null)}
                      placeholder="•••"
                      maxLength={4}
                      required
                    />
                    <button type="button" className="pmt-cvv-toggle" onClick={() => setCvvVisible(!cvvVisible)}>
                      {cvvVisible ? (
                        <svg viewBox="0 0 20 14" width="15" height="11" fill="none">
                          <path d="M1 7S4 1 10 1s9 6 9 6-3 6-9 6S1 7 1 7z" stroke="currentColor" strokeWidth="1.4"/>
                          <circle cx="10" cy="7" r="2.5" stroke="currentColor" strokeWidth="1.4"/>
                        </svg>
                      ) : (
                        <svg viewBox="0 0 20 16" width="15" height="12" fill="none">
                          <path d="M2 2l16 12M8.5 4.5C9 4.2 9.5 4 10 4c3 0 5.5 2.5 7 5-.5.9-1.2 1.8-2 2.5M5.5 5.5C4 6.7 2.7 8.2 2 9.5c1.5 2.5 4 5 8 5 1.5 0 2.9-.4 4.1-1.1" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* UPI / Alternative (collapsed) */}
              <div className="pmt-alt-methods">
                <span className="pmt-alt-label">or pay with</span>
                <div className="pmt-alt-chips">
                  <span className="pmt-chip">UPI</span>
                  <span className="pmt-chip">Net Banking</span>
                  <span className="pmt-chip">Wallet</span>
                </div>
              </div>

              {/* Pay button */}
              <button
                type="submit"
                className="pmt-pay-btn"
                style={{ "--btn-color": meta.color }}
                disabled={step === "processing"}
              >
                <svg viewBox="0 0 20 20" width="16" height="16" fill="none">
                  <path d="M16 5H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2zM2 9h16" stroke="white" strokeWidth="1.6"/>
                </svg>
                Pay {plan.price} Securely
              </button>

              <div className="pmt-trust-row">
                <span>
                  <svg viewBox="0 0 16 20" width="10" height="13" fill="none">
                    <path d="M8 1L1 4v5c0 4.4 3 8.5 7 9.5C15 17.5 15 13.4 15 9V4L8 1z" fill="#22c55e" fillOpacity="0.15" stroke="#22c55e" strokeWidth="1.3"/>
                  </svg>
                  256-bit SSL
                </span>
                <span>
                  <svg viewBox="0 0 18 18" width="11" height="11" fill="none">
                    <circle cx="9" cy="9" r="8" stroke="#6366f1" strokeWidth="1.3"/>
                    <path d="M6 9l2 2 4-4" stroke="#6366f1" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  PCI DSS Compliant
                </span>
                <span>
                  <svg viewBox="0 0 18 18" width="11" height="11" fill="none">
                    <path d="M9 1l2 5.5H17l-5 3.5 2 5.5L9 12l-5 3.5 2-5.5-5-3.5h6L9 1z" stroke="#f59e0b" strokeWidth="1.3" strokeLinejoin="round"/>
                  </svg>
                  Trusted Checkout
                </span>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Payment;
