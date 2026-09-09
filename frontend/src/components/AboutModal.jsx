import React from "react";

export default function AboutModal({ close }) {
  return (
    <div className="modal-overlay" onMouseDown={(e) => e.target === e.currentTarget && close()}>
      <div className="about-card">
        <div className="modal-header">
          <h3>About DoodleSense</h3>
          <button onClick={close}>×</button>
        </div>
        <p><b>DoodleSense</b> is an interactive real-time AI sketch recognizer. Draw quick doodles on our custom canvas, and friendly neural classifiers compare your contours against hundreds of thousands of standard QuickDraw vectors!</p>
        <div className="about-note">⚡ Zero-lag stroke input, touch &amp; stylus friendly, instant accuracy metrics.</div>
        <button className="teal-btn full" onClick={close}>Got It, Let's Draw!</button>
      </div>
    </div>
  );
}
