import React from "react";

export default function LoadingModal({ progress, text }) {
  return (
    <div className="modal-overlay">
      <div className="loading-card">
        <div className="loading-icon">🎨</div>
        <h3>DoodleSense AI Analyzing...</h3>
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
        <p>{text}</p>
        <span className="mono-label">Neural Net Live Classifier</span>
      </div>
    </div>
  );
}
