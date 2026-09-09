import React from "react";
import { Brush, Clock3, Eraser, LogIn, Palette, Pencil } from "lucide-react";
import Header from "../components/Header";
import Sailboat from "../components/Sailboat";

export default function HomePage({ user, startDrawing, setAuthOpen, navigate, showToast, setAboutOpen }) {
  return (
    <section className="home-screen">
      <Header {...{ user, startDrawing, navigate, showToast, setAuthOpen }} />

      <div className="hero">
        <div className="hero-copy">
          <div className="blue-accent"></div>
          <h1>
            Draw Anything.<br />
            <span>Watch Friendly AI</span><br />
            Guess in Real-Time.
          </h1>

          <div className="hero-actions">
            <button className="teal-btn" onClick={startDrawing}>
              <Brush size={15} />Start Drawing Free
            </button>

            <button className="signin-btn" onClick={() => setAuthOpen(true)}>
              <LogIn size={14} />
              {user.loggedIn ? `Logged in: ${user.username}` : "Sign In / Nickname"}
            </button>
          </div>

          <div className="playful-dots"><i /><i /><span>🚶‍♂️</span></div>
        </div>

        <div className="preview-card">
          <div className="preview-top">
            <div className="live-row">
              <i /><b>Guessing Live:</b><span>94% Sailboat ⛵</span>
            </div>
            <div className="latency">
              <Clock3 size={12} />118ms
            </div>
          </div>

          <div className="preview-canvas">
            <div className="corner tl" />
            <div className="corner tr" />
            <div className="corner bl" />
            <div className="corner br" />

            <Sailboat />

            <div className="guess-pills">
              <span>2nd Guess: <b>Paper Plane (6%)</b></span>
              <span>3rd Guess: <b>Pyramid (&lt;1%)</b></span>
            </div>
          </div>

          <div className="preview-bottom">
            <div className="mini-tools">
              <button onClick={startDrawing}><Pencil size={13} /></button>
              <button onClick={startDrawing}><Eraser size={13} /></button>
              <button onClick={startDrawing}><Palette size={13} /></button>
            </div>

            <div>
              <small>CANVAS RATIO</small>
              <b>16:10 Widescreen</b>
            </div>
          </div>
        </div>
      </div>

      <footer className="home-footer">
        <span><i />DoodleSense Live Classifier • 99.2% Uptime</span>
        <button onClick={() => setAboutOpen(true)}>About Project</button>
      </footer>
    </section>
  );
}
