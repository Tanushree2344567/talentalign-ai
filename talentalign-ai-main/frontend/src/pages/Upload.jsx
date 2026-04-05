import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../services/api";
import Navbar from "../components/Navbar";
import "./Upload.css";

const STEPS = [
  { id: 1, icon: "📄", label: "Reading Job Description",   sub: "Extracting text from JD PDF..."        },
  { id: 2, icon: "🗂️", label: "Parsing Resumes",          sub: "Extracting text from all resume PDFs..." },
  { id: 3, icon: "🧠", label: "AI Feature Extraction",    sub: "Identifying skills, experience, education..." },
  { id: 4, icon: "⚖️", label: "Scoring Candidates",       sub: "Comparing each resume against JD..."     },
  { id: 5, icon: "🏆", label: "Ranking & Finalizing",     sub: "Sorting candidates by match score..."    },
];

const Upload = () => {
  const { projectId } = useParams();
  const navigate      = useNavigate();

  const [jdFile,      setJdFile]      = useState(null);
  const [resumesZip,  setResumesZip]  = useState(null);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState("");
  const [currentStep, setCurrentStep] = useState(0); // 0 = not started
  const [doneSteps,   setDoneSteps]   = useState([]);

  // Simulate step progression while API is running
  useEffect(() => {
    if (!loading) return;
    setCurrentStep(1);
    setDoneSteps([]);

    const timings = [0, 2500, 5500, 9000, 13000]; // ms per step
    const timers = timings.map((delay, i) =>
      setTimeout(() => {
        setCurrentStep(i + 1);
        if (i > 0) setDoneSteps((prev) => [...prev, i]);
      }, delay)
    );
    return () => timers.forEach(clearTimeout);
  }, [loading]);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!jdFile)     { setError("Please select a Job Description PDF."); return; }
    if (!resumesZip) { setError("Please select a resumes ZIP file."); return; }
    if (!jdFile.name.toLowerCase().endsWith(".pdf"))  { setError("JD must be a PDF file."); return; }
    if (!resumesZip.name.toLowerCase().endsWith(".zip")) { setError("Resumes must be a ZIP file."); return; }

    setError("");
    setLoading(true);

    const formData = new FormData();
    formData.append("jd_file",     jdFile);
    formData.append("resumes_zip", resumesZip);

    try {
      if (localStorage.getItem("access_token") === "demo-token") {
        await new Promise((r) => setTimeout(r, 4000));
        navigate(`/projects/${projectId}/results`);
        return;
      }
      const response = await api.post(
        `/projects/${projectId}/upload`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      navigate(`/projects/${projectId}/results`, { state: { results: response.data } });
    } catch (err) {
      setError(err.response?.data?.detail || "Upload failed. Please try again.");
      setLoading(false);
      setCurrentStep(0);
      setDoneSteps([]);
    }
  };

  return (
    <div className="upload-page">
      <Navbar />
      <div className="upload-content">
        <div className="upload-card">

          <button className="back-btn" onClick={() => navigate("/dashboard")}>
            ← Back to Dashboard
          </button>

          <h1>Upload Files</h1>
          <p>
            Upload the Job Description PDF and a ZIP of all candidate resumes.
            AI will automatically score and rank every candidate.
          </p>

          {error && <div className="upload-error">{error}</div>}

          {loading ? (
            <div className="upload-progress">
              <div className="progress-title">
                <span className="progress-ai-badge">🤖 AI Processing</span>
                <p>Analyzing your files — this takes 20–60 seconds</p>
              </div>

              <div className="progress-steps">
                {STEPS.map((step) => {
                  const isDone    = doneSteps.includes(step.id);
                  const isActive  = currentStep === step.id;
                  const isPending = currentStep < step.id;
                  return (
                    <div
                      key={step.id}
                      className={`progress-step ${isDone ? "step-done" : ""} ${isActive ? "step-active" : ""} ${isPending ? "step-pending" : ""}`}
                    >
                      <div className="step-indicator">
                        {isDone ? (
                          <div className="step-check">✓</div>
                        ) : isActive ? (
                          <div className="step-spinner" />
                        ) : (
                          <div className="step-circle">{step.id}</div>
                        )}
                        {step.id < STEPS.length && <div className="step-line" />}
                      </div>
                      <div className="step-content">
                        <div className="step-icon">{step.icon}</div>
                        <div className="step-text">
                          <span className="step-label">{step.label}</span>
                          <span className="step-sub">{isActive ? step.sub : isDone ? "Completed ✓" : "Waiting..."}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="progress-note">
                <span>⚠️</span> Do not close or refresh this page
              </div>
            </div>
          ) : (
            <form onSubmit={handleUpload} className="upload-form">

              <div className={`upload-zone ${jdFile ? "upload-zone--selected" : ""}`}>
                <div className="upload-zone-icon">📄</div>
                <h3>Job Description</h3>
                <p>PDF file only</p>
                <label className="file-label">
                  {jdFile ? `✅  ${jdFile.name}` : "Choose PDF file"}
                  <input type="file" accept=".pdf" onChange={(e) => setJdFile(e.target.files[0])} hidden />
                </label>
              </div>

              <div className={`upload-zone ${resumesZip ? "upload-zone--selected" : ""}`}>
                <div className="upload-zone-icon">🗂️</div>
                <h3>Candidate Resumes</h3>
                <p>ZIP file containing all PDF resumes</p>
                <label className="file-label">
                  {resumesZip ? `✅  ${resumesZip.name}` : "Choose ZIP file"}
                  <input type="file" accept=".zip" onChange={(e) => setResumesZip(e.target.files[0])} hidden />
                </label>
              </div>

              <div className="upload-tip">
                💡 ZIP should contain only PDF resume files. Non-PDF files are skipped automatically.
              </div>

              <button type="submit" className="btn-process" disabled={!jdFile || !resumesZip}>
                Process with AI →
              </button>

            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Upload;
