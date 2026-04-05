import React, { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./Landing.css";

const Landing = () => {
  const navigate = useNavigate();
  const heroRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && e.target.classList.add("visible")),
      { threshold: 0.15 }
    );
    document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const features = [
    { icon: "⚡", title: "Instant AI Scoring", desc: "Every resume scored in seconds — not hours. GPT-4 reads, understands, and ranks candidates with recruiter-level judgment." },
    { icon: "🎯", title: "Precision Matching", desc: "Skills, experience, and education weighted intelligently against your exact job description. No generic keyword matching." },
    { icon: "📊", title: "Visual Leaderboard", desc: "See every candidate ranked by overall fit. Drill into matched/missing skills, work history, and AI summaries at a glance." },
    { icon: "📝", title: "Recruiter Notes", desc: "Add private notes and status tags — Shortlisted, On Hold, Rejected — all saved per candidate per project." },
    { icon: "🤖", title: "AI Support Chat", desc: "Built-in support assistant answers platform questions and auto-creates tickets when you need human help." },
    { icon: "🔒", title: "Secure & Private", desc: "JWT-based auth, encrypted credentials, and SQLite local storage. Your data never leaves your stack." },
  ];

  const steps = [
    { num: "01", title: "Create a Project", desc: "Name your job opening — e.g. Senior Backend Engineer, Bangalore." },
    { num: "02", title: "Upload JD + Resumes", desc: "Drop your Job Description PDF and a ZIP of all candidate resumes." },
    { num: "03", title: "AI Does the Work", desc: "Each resume is read, scored on skills, experience, and education." },
    { num: "04", title: "Review & Decide", desc: "See a ranked leaderboard. Add notes, change statuses, hire faster." },
  ];

  const stats = [
    { value: "10×", label: "Faster Screening" },
    { value: "3",   label: "Scoring Dimensions" },
    { value: "100%",label: "AI Powered" },
    { value: "0",   label: "Manual Effort" },
  ];

  const companies = [
  { name: "Infosys", emoji: "💼", color1: "#2563eb", color2: "#1e40af" },
  { name: "Wipro", emoji: "🧠", color1: "#7c3aed", color2: "#5b21b6" },
  { name: "TCS", emoji: "🚀", color1: "#ef4444", color2: "#b91c1c" },
  { name: "Flipkart", emoji: "🛒", color1: "#3b82f6", color2: "#1d4ed8" },
  { name: "Razorpay", emoji: "💳", color1: "#60a5fa", color2: "#2563eb" },
  { name: "Zepto", emoji: "⚡", color1: "#a855f7", color2: "#6d28d9" },
  { name: "CRED", emoji: "🖤", color1: "#374151", color2: "#111827" },
  { name: "Meesho", emoji: "🛍️", color1: "#ec4899", color2: "#be185d" },
];

  const reviews = [
    {
      name: "Priya Nambiar", role: "HR Manager", company: "Infosys", avatar: "PN", rating: 5,
      text: "TalentAlign cut our screening time from 3 days to under 2 hours. The AI ranking is shockingly accurate — it shortlisted exactly the candidates our team would have picked manually.",
    },
    {
      name: "Arjun Mehta", role: "Talent Acquisition Lead", company: "Flipkart", avatar: "AM", rating: 5,
      text: "We process 200+ resumes per opening. TalentAlign handles it in minutes. The matched/missing skills breakdown saves us from reading entire CVs just to reject obvious mismatches.",
    },
    {
      name: "Sneha Rao", role: "Recruitment Specialist", company: "Razorpay", avatar: "SR", rating: 5,
      text: "The recruiter notes and shortlist/reject status per candidate is brilliant. Our whole team can collaborate on the same project without stepping on each other.",
    },
    {
      name: "Vikram Shetty", role: "Engineering Manager", company: "CRED", avatar: "VS", rating: 4,
      text: "I was skeptical about AI resume screening but TalentAlign proved me wrong. The education and experience scoring is surprisingly nuanced — not just keyword matching.",
    },
    {
      name: "Divya Krishnan", role: "People Operations", company: "Zepto", avatar: "DK", rating: 5,
      text: "Setup took 5 minutes. No credit card, no complex configuration. We uploaded our first JD and got ranked results instantly. The AI support chat is a bonus.",
    },
    {
      name: "Rohit Jain", role: "Head of Hiring", company: "Meesho", avatar: "RJ", rating: 5,
      text: "The email notification feature to shortlisted candidates directly from the results page is a huge time saver. Everything a recruiter needs in one place.",
    },
  ];

  return (
    <div className="landing">

      {/* NAV */}
      <nav className="land-nav">
        <div className="land-nav-inner">
          <div className="land-logo">
            <span className="land-logo-mark">TA</span>
            <span className="land-logo-text">TalentAlign <em>AI</em></span>
          </div>
          <div className="land-nav-links">
            <a href="#features">Features</a>
            <a href="#how">How it works</a>
            <a href="#reviews">Reviews</a>
          </div>
          <div className="land-nav-ctas">
            <button className="land-btn-ghost" onClick={() => navigate("/login")}>Sign In</button>
            <button className="land-btn-solid" onClick={() => navigate("/signup")}>Get Started Free</button>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="land-hero" ref={heroRef}>
        <div className="hero-bg-grid" />
        <div className="hero-glow hero-glow-1" />
        <div className="hero-glow hero-glow-2" />
        <div className="hero-inner">
          <div className="hero-badge">✦ AI-Powered Recruitment Intelligence</div>
          <h1 className="hero-title">
            Hire the right talent<br />
            <span className="hero-gradient-text">10× faster with AI</span>
          </h1>
          <p className="hero-subtitle">
            Upload your job description and a ZIP of resumes. TalentAlign AI reads every CV,
            scores candidates across skills, experience &amp; education, and hands you a ranked
            shortlist — in seconds.
          </p>
          <div className="hero-ctas">
            <button className="land-btn-solid land-btn-lg" onClick={() => navigate("/signup")}>
              Start Screening Free →
            </button>
            <button className="land-btn-outline land-btn-lg" onClick={() => navigate("/login")}>
              Demo Login
            </button>
          </div>
          <p className="hero-hint">Demo: demo@talentalign.com / demo123 — no card needed</p>

          <div className="hero-preview">
            <div className="preview-bar">
              <span /><span /><span />
              <div className="preview-url">talentalign.ai/dashboard</div>
            </div>
            <div className="preview-body">
              <div className="preview-sidebar">
                <div className="ps-logo">TA</div>
                <div className="ps-item ps-item-active">Dashboard</div>
                <div className="ps-item">Projects</div>
                <div className="ps-item">Support</div>
              </div>
              <div className="preview-main">
                <div className="pm-header">
                  <div className="pm-title">Senior Engineer · Bangalore</div>
                  <div className="pm-sub">12 candidates ranked by AI</div>
                </div>
                {[
                  { name: "Priya S.",  score: 94, skills: 97 },
                  { name: "Rahul M.", score: 81, skills: 85 },
                  { name: "Ananya K.",score: 73, skills: 76 },
                ].map((c, i) => (
                  <div className="pm-row" key={i}>
                    <div className="pm-rank">{i === 0 ? "🏆" : `#${i + 1}`}</div>
                    <div className="pm-name">{c.name}</div>
                    <div className="pm-score" style={{ color: i === 0 ? "#34d399" : i === 1 ? "#fbbf24" : "#94a3b8" }}>
                      {c.score}%
                    </div>
                    <div className="pm-bar-wrap">
                      <div className="pm-bar" style={{ width: `${c.skills}%` }} />
                    </div>
                    <div className="pm-badge">{i === 0 ? "Shortlisted" : i === 1 ? "Review" : "On Hold"}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="land-stats" id="stats">
        <div className="land-container">
          <div className="stats-grid">
            {stats.map((s, i) => (
              <div className="stat-item reveal" key={i}>
                <div className="stat-val">{s.value}</div>
                <div className="stat-lbl">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* COMPANIES */}
      <section className="land-companies">
        <div className="co-glow-1" />
        <div className="co-glow-2" />
        <div className="land-container">

          <div className="co-header reveal">
            <span className="co-eyebrow">🏆 Trusted Worldwide</span>
            <h2 className="co-title">
              Powering recruitment at<br />
              <span className="co-title-grad">India's top companies</span>
            </h2>
            <p className="co-sub">
              Join <strong>500+ recruiting teams</strong> who screen smarter with TalentAlign AI
            </p>
          </div>

          <div className="co-grid">
            {companies.map((c, i) => (
              <div className="co-card reveal" key={i} style={{ animationDelay: `${i * 0.07}s` }}>
                <div
  className="co-logo"
  style={{ background: `linear-gradient(135deg, ${c.color1}, ${c.color2})` }}
>
  {c.emoji}
</div>
                <div className="co-info">
                  <span className="co-name">{c.name}</span>
                  <span className="co-badge">✦ Hiring with AI</span>
                </div>
                <div className="co-tick">✓</div>
              </div>
            ))}
          </div>

          <div className="co-stats reveal">
            {[
              { num: "500+", lbl: "Companies" },
              { num: "50K+", lbl: "Resumes Screened" },
              { num: "10×",  lbl: "Faster Hiring" },
              { num: "98%",  lbl: "Satisfaction" },
            ].map((s, i) => (
              <React.Fragment key={i}>
                {i > 0 && <div className="co-stats-div" />}
                <div className="co-stat">
                  <span className="co-stat-num">{s.num}</span>
                  <span className="co-stat-lbl">{s.lbl}</span>
                </div>
              </React.Fragment>
            ))}
          </div>

        </div>
      </section>

      {/* FEATURES */}
      <section className="land-features" id="features">
        <div className="land-container">
          <div className="section-label reveal">Features</div>
          <h2 className="section-heading reveal">Everything a recruiter needs.<br /><span>Nothing they don't.</span></h2>
          <div className="features-grid">
            {features.map((f, i) => (
              <div className="feature-card reveal" key={i} style={{ animationDelay: `${i * 0.08}s` }}>
                <div className="feature-icon">{f.icon}</div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="land-how" id="how">
        <div className="land-container">
          <div className="section-label reveal">Process</div>
          <h2 className="section-heading reveal">From JD to shortlist<br /><span>in four steps.</span></h2>
          <div className="steps-grid">
            {steps.map((s, i) => (
              <div className="step-card reveal" key={i} style={{ animationDelay: `${i * 0.1}s` }}>
                <div className="step-num">{s.num}</div>
                <div className="step-connector" />
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* REVIEWS */}
      <section className="land-reviews" id="reviews">
        <div className="land-container">
          <div className="section-label reveal">Testimonials</div>
          <h2 className="section-heading reveal">
            Loved by recruiters<br /><span>across India.</span>
          </h2>
          <div className="reviews-grid">
            {reviews.map((r, i) => (
              <div className="review-card reveal" key={i} style={{ animationDelay: `${i * 0.08}s` }}>
                <div className="review-stars">
                  {"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}
                </div>
                <p className="review-text">"{r.text}"</p>
                <div className="review-author">
                  <div className="review-avatar">{r.avatar}</div>
                  <div>
                    <div className="review-name">{r.name}</div>
                    <div className="review-meta">{r.role} · {r.company}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA BANNER */}
      <section className="land-cta-banner">
        <div className="cta-glow" />
        <div className="land-container">
          <div className="cta-inner reveal">
            <div className="cta-badge">✦ Free to use</div>
            <h2>Ready to hire smarter?</h2>
            <p>No credit card. No setup. Just upload and let AI do the screening.</p>
            <button className="land-btn-solid land-btn-xl" onClick={() => navigate("/signup")}>
              Create Free Account →
            </button>
            <div className="cta-demo">
              Already have an account?{" "}
              <span onClick={() => navigate("/login")}>Sign in →</span>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="land-footer">
        <div className="land-container">
          <div className="footer-inner">
            <div className="land-logo">
              <span className="land-logo-mark">TA</span>
              <span className="land-logo-text">TalentAlign <em>AI</em></span>
            </div>
            <p className="footer-tagline">AI-powered resume screening for modern recruiters.</p>
            <div className="footer-links">
              <span onClick={() => navigate("/login")}>Login</span>
              <span onClick={() => navigate("/signup")}>Sign Up</span>
            </div>
          </div>
          <div className="footer-copy">© 2025 TalentAlign AI · Built with FastAPI + React + GPT-4</div>
        </div>
      </footer>

    </div>
  );
};

export default Landing;
