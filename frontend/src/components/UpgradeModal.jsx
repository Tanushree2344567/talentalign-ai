import React from "react";
import { useNavigate } from "react-router-dom";
import "./UpgradeModal.css";

const UpgradeModal = ({ open, message, onClose }) => {
  const navigate = useNavigate();

  if (!open) return null;

  return (
    <div className="upgrade-overlay" onClick={onClose}>
      <div className="upgrade-modal" onClick={(e) => e.stopPropagation()}>
        <div className="upgrade-header">
          <h3>Upgrade Required</h3>
          <button className="upgrade-close" onClick={onClose}>✕</button>
        </div>
        <p className="upgrade-message">{message || "This feature is not available on your current plan."}</p>
        <div className="upgrade-actions">
          <button className="upgrade-btn-secondary" onClick={onClose}>Maybe later</button>
          <button
            className="upgrade-btn-primary"
            onClick={() => {
              onClose();
              navigate("/choose-plan");
            }}
          >
            View plans
          </button>
        </div>
      </div>
    </div>
  );
};

export default UpgradeModal;
