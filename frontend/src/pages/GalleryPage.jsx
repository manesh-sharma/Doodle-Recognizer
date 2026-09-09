import React from "react";
import { Folder } from "lucide-react";

export default function GalleryPage({ history, closeHistory, downloadImage, clearAll }) {
  return (
    <section className="history-screen">
      <div className="history-head">
        <div className="history-title">
          <Folder />
          <div>
            <h2>Gallery Vault</h2>
            <p>Your AI-analyzed sketches and accuracy timestamps</p>
          </div>
        </div>

        <button onClick={closeHistory}>
          Close &amp; Return
        </button>
      </div>

      <div className="history-grid">
        {history.length === 0 ? (
          <div className="empty-history">
            <span>🎨</span>
            <b>No doodles saved in vault yet!</b>
            <p>Draw a quick sketch and hit predict to populate your vault.</p>
          </div>
        ) :
          history.map(item => (
            <div className="history-card" key={item.id}>
              <div className="history-image">
                <img src={item.image} alt={item.label} />
              </div>

              <div className="history-label">
                <b>{item.label}</b>
                <strong>{item.confidence}%</strong>
              </div>

              <div className="history-meta">
                <span>{item.date}</span>
                <button onClick={() => downloadImage(item.image, item.label)}>
                  DL ↓
                </button>
              </div>
            </div>
          ))
        }
      </div>

      <div className="history-footer">
        <span>{history.length} doodle(s) saved in vault</span>
        <button onClick={clearAll}>
          Clear Vault History
        </button>
      </div>
    </section>
  );
}
