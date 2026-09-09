import React from "react";
import { ArrowRight } from "lucide-react";

export default function AuthModal({ authName, setAuthName, authPass, setAuthPass, login, guestLogin, close }) {
  return (
    <div className="modal-overlay" onMouseDown={(e) => e.target === e.currentTarget && close()}>
      <div className="auth-card">
        <button className="modal-close" onClick={close}>×</button>
        <div className="auth-title"><div className="icon-circle">◉</div><h3>Sign In / Nickname</h3></div>
        <p>Choose a nickname to save your sketches and run neural recognition.</p>
        <label>Nickname / Username</label>
        <input value={authName} onChange={e => setAuthName(e.target.value)} placeholder="e.g. PicassoCat" />
        <label>Passcode / Secret (optional)</label>
        <input type="password" value={authPass} onChange={e => setAuthPass(e.target.value)} />
        <button className="teal-btn full" onClick={() => login()}>
          Start Drawing Now <ArrowRight size={16} />
        </button>
        <button className="guest-btn" onClick={guestLogin}>⚡ Quick Guest Draw (Skip)</button>
      </div>
    </div>
  );
}
