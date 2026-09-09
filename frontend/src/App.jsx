import React, { useCallback, useEffect, useRef, useState } from "react";
import "./styles.css";

import { API_URL, PROMPTS, COLORS } from "./constants";
import { getSavedHistory, getSavedUser } from "./utils/storage";

import HomePage from "./pages/HomePage";
import CanvasPage from "./pages/CanvasPage";
import ResultPage from "./pages/ResultPage";
import GalleryPage from "./pages/GalleryPage";

import AuthModal from "./components/AuthModal";
import AboutModal from "./components/AboutModal";
import LoadingModal from "./components/LoadingModal";

export default function App() {
  const [view, setView] = useState("home");
  const [previousView, setPreviousView] = useState("home");
  const [user, setUser] = useState(getSavedUser);
  const [history, setHistory] = useState(getSavedHistory);
  const [prompt, setPrompt] = useState("CAT");
  const [tool, setTool] = useState("pencil");
  const [color, setColor] = useState("#1F1F1F");
  const [lineWidth, setLineWidth] = useState(4);
  const [toast, setToast] = useState(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [authName, setAuthName] = useState("artist_doodler");
  const [authPass, setAuthPass] = useState("secret123");
  const [loading, setLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(35);
  const [loadingText, setLoadingText] = useState("Extracting stroke curvature...");
  const [prediction, setPrediction] = useState({
    label: "CAT", confidence: 96.4, strokeSim: 95.2, contourMatch: 94.8,
    commentary: "Terrific stroke rhythm! Clean recognition with high certainty from our classifier!",
    time: "Just now", image: null, target: "CAT", isCorrect: false
  });

  const canvasRef = useRef(null);
  const canvasBoxRef = useRef(null);
  const drawingRef = useRef(false);
  const lastPointRef = useRef({ x: 0, y: 0 });
  const strokesRef = useRef([]);
  const toastTimer = useRef(null);

  const showToast = useCallback((message, icon = "✨") => {
    setToast({ message, icon });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  }, []);

  const navigate = useCallback((next) => {
    setPreviousView(view);
    setView(next);
  }, [view]);

  useEffect(() => {
    localStorage.setItem("doodlesense_app_history", JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    if (view === "draw") {
      strokesRef.current = [];
      drawingRef.current = false;
      const id = setTimeout(initCanvas, 50);
      return () => clearTimeout(id);
    }
  }, [view]);

  useEffect(() => {
    const onResize = () => { if (view === "draw") initCanvas(); };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  });

  function initCanvas() {
    const canvas = canvasRef.current;
    const box = canvasBoxRef.current;
    if (!canvas || !box) return;
    const rect = box.getBoundingClientRect();
    const w = Math.max(320, Math.round(rect.width));
    const h = Math.max(220, Math.round(rect.height));
    let snapshot = null;
    if (canvas.width && canvas.height && canvas.dataset.hasDrawn === "1") {
      try { snapshot = canvas.toDataURL(); } catch { }
    }
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    if (snapshot) {
      const img = new Image();
      img.onload = () => ctx.drawImage(img, 0, 0, w, h);
      img.src = snapshot;
    }
  }

  function canvasPoint(e) {
    const canvas = canvasRef.current;
    const r = canvas.getBoundingClientRect();
    const source = e.touches?.[0] || e;
    return {
      x: (source.clientX - r.left) * (canvas.width / r.width),
      y: (source.clientY - r.top) * (canvas.height / r.height)
    };
  }

  function pointerDown(e) {
    e.preventDefault();

    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      canvas.setPointerCapture(e.pointerId);
    } catch { }

    const ctx = canvas.getContext("2d");
    const p = canvasPoint(e);

    drawingRef.current = true;
    lastPointRef.current = p;

    if (tool !== "eraser") {
      const newStroke = [{ x: p.x, y: p.y }];
      strokesRef.current.push(newStroke);
    }

    canvas.dataset.hasDrawn = "1";

    ctx.beginPath();
    ctx.fillStyle = tool === "eraser" ? "#fff" : color;
    ctx.arc(
      p.x,
      p.y,
      (tool === "eraser" ? lineWidth * 3.5 : lineWidth) / 2,
      0,
      Math.PI * 2
    );
    ctx.fill();
  }

  function pointerMove(e) {
    if (!drawingRef.current) return;

    e.preventDefault();

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const p = canvasPoint(e);

    ctx.beginPath();
    ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
    ctx.lineTo(p.x, p.y);

    ctx.strokeStyle = tool === "eraser" ? "#fff" : color;
    ctx.lineWidth = tool === "eraser" ? lineWidth * 3.5 : lineWidth;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();

    lastPointRef.current = p;

    if (tool !== "eraser" && strokesRef.current.length) {
      strokesRef.current[strokesRef.current.length - 1].push({
        x: p.x,
        y: p.y
      });
    }
  }

  function pointerUp(e) {
    drawingRef.current = false;

    const canvas = canvasRef.current;
    if (canvas && e?.pointerId !== undefined) {
      try {
        canvas.releasePointerCapture(e.pointerId);
      } catch { }
    }
  }

  // The source had this handler twice; keeping one copy avoids duplicate declarations.
  function pointerCancel(e) {
    drawingRef.current = false;

    const canvas = canvasRef.current;
    if (canvas && e?.pointerId !== undefined) {
      try {
        canvas.releasePointerCapture(e.pointerId);
      } catch { }
    }
  }

  function clearCanvas() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
    canvas.dataset.hasDrawn = "0";
    strokesRef.current = [];
    showToast("Canvas cleared!", "🧼");
  }

  function cleanSnapshot() {
    const canvas = canvasRef.current;
    if (!canvas || canvas.dataset.hasDrawn !== "1") return null;
    const out = document.createElement("canvas");
    out.width = canvas.width || 640;
    out.height = canvas.height || 400;
    const ctx = out.getContext("2d");
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, out.width, out.height);
    ctx.drawImage(canvas, 0, 0);
    return out.toDataURL("image/png");
  }

  function newPrompt() {
    const options = PROMPTS.filter(x => x !== prompt);
    const next = options[Math.floor(Math.random() * options.length)];
    setPrompt(next);
    clearCanvas();
    showToast(`New Task: Draw a ${next}!`, "🎲");
  }

  function saveDoodle() {
    const image = cleanSnapshot();
    if (!image) { showToast("Draw something first!", "✏️"); return; }
    const confidence = (91 + Math.random() * 8.5).toFixed(1);
    const item = {
      id: Date.now(), image, label: prompt, confidence,
      date: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };
    setHistory(h => [item, ...h]);
    showToast("Doodle saved to Gallery Vault!", "💾");
  }

  async function predict() {
    const image = cleanSnapshot();
    if (!image) { showToast("Draw something first!", "✏️"); return; }
    if (!strokesRef.current.length) { showToast("Draw something first!", "✏️"); return; }

    // Freeze the strokes before the asynchronous API call so the data
    // sent to the trained model cannot change while the user is drawing.
    const strokes = strokesRef.current.map((stroke) =>
      stroke.map((point) => ({ x: point.x, y: point.y }))
    );

    setLoading(true);
    setLoadingProgress(35);
    setLoadingText(`Sending your ${prompt.toLowerCase()} sketch to the neural network...`);

    try {
      const response = await fetch(`${API_URL}/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ strokes })
      });

      if (!response.ok) {
        throw new Error(`Prediction API returned ${response.status}`);
      }

      setLoadingProgress(80);
      setLoadingText("Running the trained doodle recognition model...");

      const result = await response.json();
      const confidence = +(Number(result.confidence) * 100).toFixed(1);
      const predictedLabel = String(result.class || "unknown").toUpperCase();
      const topPredictions = Array.isArray(result.top_predictions) ? result.top_predictions : [];
      const second = topPredictions[1]?.confidence ?? 0;
      const third = topPredictions[2]?.confidence ?? 0;
      const strokeSim = +(Math.max(0, Math.min(100, confidence - Number(second) * 20)).toFixed(1));
      const contourMatch = +(Math.max(0, Math.min(100, confidence - Number(third) * 10)).toFixed(1));

      setLoadingProgress(100);
      setLoadingText("Prediction complete!");

      const comments = [
        `Egg-cellent doodle! Our neural network recognized ${predictedLabel.toLowerCase()} with ${confidence}% confidence!`,
        `Chirp chirp! The trained model matched your sketch to ${predictedLabel.toLowerCase()} with high confidence!`,
        `Terrific stroke rhythm! The classifier recognized ${predictedLabel.toLowerCase()} with ${confidence}% confidence!`,
        `Remarkable sketch! The model found a strong match for ${predictedLabel.toLowerCase()} in its trained classes!`
      ];

      const isCorrect =
        predictedLabel.toLowerCase() === prompt.toLowerCase();

      const nextPrediction = {
        target: prompt,
        label: predictedLabel,
        confidence,
        strokeSim,
        contourMatch,
        isCorrect,
        commentary: comments[Math.floor(Math.random() * comments.length)],
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        image
      };

      setPrediction(nextPrediction);

      setHistory(h => [{
        id: Date.now(), image, label: predictedLabel, confidence: confidence.toFixed(1),
        date: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      }, ...h]);

      setTimeout(() => {
        setLoading(false);
        navigate("result");
      }, 250);
    } catch (error) {
      console.error(error);
      setLoading(false);
      showToast("Could not connect to the AI backend. Start FastAPI on port 8000.", "⚠️");
    }
  }

  function downloadImage(image = prediction.image, label = prediction.label) {
    if (!image) return;
    const a = document.createElement("a");
    a.download = `doodlesense-${label.toLowerCase()}-${Date.now()}.png`;
    a.href = image;
    a.click();
    showToast("Doodle PNG downloaded!", "⬇️");
  }

  function startDrawing() {
    if (!user.loggedIn) setAuthOpen(true);
    else navigate("draw");
  }

  function login(name = authName) {
    const username = name.trim() || "artist_doodler";
    const next = { loggedIn: true, username };
    setUser(next);
    localStorage.setItem("doodlesense_user_session", JSON.stringify(next));
    setAuthOpen(false);
    showToast(`Welcome, ${username}! Workspace ready.`, "🎨");
    navigate("draw");
  }

  function guestLogin() {
    setAuthName("SpeedArtist");
    login("SpeedArtist");
  }

  function closeHistory() {
    navigate(previousView === "history" ? "home" : previousView);
  }

  return (
    <div className="app-shell">
      {toast && <div className="toast"><span>{toast.icon}</span>{toast.message}</div>}

      {loading && <LoadingModal progress={loadingProgress} text={loadingText} />}

      {authOpen && (
        <AuthModal
          authName={authName}
          setAuthName={setAuthName}
          authPass={authPass}
          setAuthPass={setAuthPass}
          login={login}
          guestLogin={guestLogin}
          close={() => setAuthOpen(false)}
        />
      )}

      {aboutOpen && <AboutModal close={() => setAboutOpen(false)} />}

      <main className="viewport">
        {view === "home" && (
          <HomePage
            user={user}
            startDrawing={startDrawing}
            setAuthOpen={setAuthOpen}
            navigate={navigate}
            showToast={showToast}
            setAboutOpen={setAboutOpen}
          />
        )}

        {view === "draw" && (
          <CanvasPage
            prompt={prompt}
            newPrompt={newPrompt}
            navigate={navigate}
            predict={predict}
            canvasRef={canvasRef}
            canvasBoxRef={canvasBoxRef}
            pointerDown={pointerDown}
            pointerMove={pointerMove}
            pointerUp={pointerUp}
            pointerCancel={pointerCancel}
            tool={tool}
            setTool={setTool}
            color={color}
            setColor={setColor}
            lineWidth={lineWidth}
            setLineWidth={setLineWidth}
            clearCanvas={clearCanvas}
            saveDoodle={saveDoodle}
          />
        )}

        {view === "result" && (
          <ResultPage
            prediction={prediction}
            navigate={navigate}
            drawAgain={() => { clearCanvas(); navigate("draw"); }}
            downloadImage={downloadImage}
          />
        )}

        {view === "history" && (
          <GalleryPage
            history={history}
            closeHistory={closeHistory}
            downloadImage={downloadImage}
            clearAll={() => {
              if (confirm("Clear all saved doodles from your DoodleSense Vault?")) {
                setHistory([]);
                localStorage.removeItem("doodlesense_app_history");
                showToast("Vault history cleared", "🗑️");
              }
            }}
          />
        )}
      </main>
    </div>
  );
}
