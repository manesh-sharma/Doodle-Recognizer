import React from "react";

export default function ResultPage({ prediction, navigate, drawAgain, downloadImage }) {
  return (
    <section className="result-screen">
      <div className="result-header">
        <button onClick={drawAgain}>← Back</button>

        <div className="result-actions">
          <span>AI DOODLE EVALUATION</span>
          <button onClick={() => navigate("history")}>Gallery 📁</button>
        </div>
      </div>

      <div className="result-content">
        <div className="snapshot-card retro-card">
          <div className="target-row">
            <span>TARGET OBJECT:</span>
            <b>{prediction.target || prediction.label}</b>
          </div>

          <div className="snapshot">
            <img
              src={prediction.image || ""}
              alt="User doodle preview"
            />
          </div>

          <div className="snapshot-bottom">
            <span>{prediction.time}</span>
            <button onClick={() => downloadImage()}>
              ⬇ Save PNG
            </button>
          </div>
        </div>

        <div className="metrics-card retro-card">
          <div>
            <div className="metric-head">
              <div>
                <small>NEURAL NETWORK DETECTION</small>

                <h2>
                  {prediction.label}

                  <span
                    style={{
                      marginLeft: "10px",
                      color: prediction.isCorrect
                        ? "#16a34a"
                        : "#dc2626"
                    }}
                  >
                    {prediction.isCorrect
                      ? "✓ CORRECT"
                      : "✕ INCORRECT"}
                  </span>
                </h2>
              </div>

              <div className="rating">
                <small>Rating</small>
                <b>
                  {prediction.isCorrect
                    ? "⭐⭐⭐⭐⭐"
                    : "⭐⭐"}
                </b>
              </div>
            </div>

            <div
              style={{
                padding: "12px 16px",
                margin: "12px 0",
                borderRadius: "12px",
                fontWeight: 700,
                background: prediction.isCorrect
                  ? "#dcfce7"
                  : "#fee2e2",
                color: prediction.isCorrect
                  ? "#166534"
                  : "#991b1b"
              }}
            >
              {prediction.isCorrect
                ? `🎉 Correct! You were asked to draw a ${prediction.target}, and AI detected ${prediction.label}.`
                : `❌ Not quite! You were asked to draw a ${prediction.target}, but AI detected ${prediction.label}.`
              }
            </div>

            <div className="accuracy">
              <div>
                <b>Accuracy Score</b>
                <strong>{prediction.confidence}%</strong>
              </div>

              <div className="accuracy-track">
                <i style={{ width: `${prediction.confidence}%` }} />
              </div>
            </div>

            <div className="metric-grid">
              <div>
                <small>STROKE SIMILARITY</small>
                <b>{prediction.strokeSim}% (High)</b>
              </div>

              <div>
                <small>CONTOUR MATCH</small>
                <b>{prediction.contourMatch}% (Exact)</b>
              </div>

              <div>
                <small>AI CONFIDENCE</small>
                <b>{prediction.confidence}% ⭐</b>
              </div>
            </div>

            <div className="feedback">
              <span>🐣</span>
              <p>{prediction.commentary}</p>
            </div>
          </div>

          <div className="result-buttons">
            <button onClick={drawAgain}>
              ↺ Draw Again
            </button>

            <button onClick={() => downloadImage()}>
              ⬇ Save to Device
            </button>

            <button onClick={() => navigate("history")}>
              📁 My Gallery
            </button>
          </div>
        </div>
      </div>

      <div className="chick-note">
        Chick Mascot: {prediction.isCorrect ? '"Great sketch!"' : '"Try again!"'}
      </div>

      <div className="version">
        Neural Net v2.4 • Evaluated
      </div>
    </section>
  );
}
