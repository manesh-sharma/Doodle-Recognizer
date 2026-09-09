import React from "react";
import { CircleUserRound, Sun } from "lucide-react";

export default function Header({ user, startDrawing, navigate, showToast, setAuthOpen }) {
  return (
    <header className="top-nav">
      <div className="brand" onClick={() => navigate("home")}>
        <div className="brand-badge">〰</div>
        <span>DoodleSense</span>
      </div>
      <nav className="nav-dock">
        <button className="active" onClick={() => navigate("home")}>Explore</button>
        <button onClick={startDrawing}>Play &amp; Draw</button>
        <button onClick={() => navigate("history")}>Gallery Vault</button>
        <button onClick={() => showToast('New Community Challenge unlocked: "Space Marine in 20s"!', '🏆')}>
          Community Challenges
        </button>
      </nav>
      <div className="nav-actions">
        <span className="status-pill"></span>
        <button className="round-control" onClick={() => showToast("Switched to Adaptive Contrast Mode", "☀️")}>
          <Sun size={15} />
        </button>
        <button className="avatar" onClick={() => setAuthOpen(true)}>
          {user.loggedIn ? user.username.slice(0, 2).toUpperCase() : <CircleUserRound size={15} />}
        </button>
      </div>
    </header>
  );
}
