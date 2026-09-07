import React, { useEffect, useRef, useState } from "react";
import {
  Pencil,
  Eraser,
  Trash2,
  Undo2,
  Redo2,
  ArrowLeft,
  User,
  History,
  Info,
  LogIn,
  UserPlus,
  X,
  Play,
  Home,
  RotateCcw,
  Sparkles,
} from "lucide-react";

import "./styles.css";

const API_URL = "http://127.0.0.1:8000";

const CANVAS_WIDTH = 560;
const CANVAS_HEIGHT = 410;

const CLASSES = [
  "apple",
  "car",
  "cat",
  "dog",
  "fish",
  "airplane",
  "bicycle",
  "house",
  "tree",
  "flower",
];

function App() {
  // --------------------------------------------------
  // VIEW / AUTH
  // --------------------------------------------------

  const [view, setView] = useState("home");

  const [modal, setModal] = useState(null);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  // --------------------------------------------------
  // DRAWING
  // --------------------------------------------------

  const [tool, setTool] = useState("pen");
  const [hasDrawing, setHasDrawing] = useState(false);

  const [prediction, setPrediction] = useState("");
  const [confidence, setConfidence] = useState(0);
  const [topPredictions, setTopPredictions] = useState([]);

  const [isPredicting, setIsPredicting] = useState(false);

  const [snapshot, setSnapshot] = useState(null);

  const [currentPrompt, setCurrentPrompt] = useState("Draw something!");

  // --------------------------------------------------
  // HISTORY
  // --------------------------------------------------

  const [drawingHistory, setDrawingHistory] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("doodleHistory") || "[]");
    } catch {
      return [];
    }
  });

  // --------------------------------------------------
  // REFS
  // --------------------------------------------------

  const canvasRef = useRef(null);

  const drawingRef = useRef(false);

  const currentStrokeRef = useRef([]);

  const strokesRef = useRef([]);

  const historyRef = useRef([]);

  const historyIndexRef = useRef(-1);

  // --------------------------------------------------
  // CANVAS INITIALIZATION
  // --------------------------------------------------

  useEffect(() => {
    if (view !== "game") return;

    const canvas = canvasRef.current;

    if (!canvas) return;

    const ctx = canvas.getContext("2d");

    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    strokesRef.current = [];
    currentStrokeRef.current = [];
    drawingRef.current = false;

    historyRef.current = [];
    historyIndexRef.current = -1;

    setPrediction("");
    setConfidence(0);
    setTopPredictions([]);
    setHasDrawing(false);

    saveCanvas();
  }, [view]);

  // --------------------------------------------------
  // CANVAS COORDINATES
  // --------------------------------------------------

  const getCanvasPoint = (e) => {
    const canvas = canvasRef.current;

    const rect = canvas.getBoundingClientRect();

    return {
      x:
        ((e.clientX - rect.left) * canvas.width) /
        rect.width,

      y:
        ((e.clientY - rect.top) * canvas.height) /
        rect.height,
    };
  };

  // --------------------------------------------------
  // POINTER DOWN
  // --------------------------------------------------

  const handlePointerDown = (e) => {
    const canvas = canvasRef.current;

    if (!canvas) return;

    drawingRef.current = true;

    canvas.setPointerCapture(e.pointerId);

    const point = getCanvasPoint(e);

    const ctx = canvas.getContext("2d");

    ctx.beginPath();
    ctx.moveTo(point.x, point.y);

    if (tool === "pen") {
      const newStroke = [point];

      currentStrokeRef.current = newStroke;

      strokesRef.current.push(newStroke);

      setHasDrawing(true);
    }
  };

  // --------------------------------------------------
  // POINTER MOVE
  // --------------------------------------------------

  const handlePointerMove = (e) => {
    if (!drawingRef.current) return;

    const canvas = canvasRef.current;

    if (!canvas) return;

    const ctx = canvas.getContext("2d");

    const point = getCanvasPoint(e);

    ctx.lineWidth = tool === "eraser" ? 30 : 6;

    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    if (tool === "eraser") {
      ctx.strokeStyle = "#ffffff";
    } else {
      ctx.strokeStyle = "#11164f";
    }

    ctx.lineTo(point.x, point.y);
    ctx.stroke();

    if (tool === "pen") {
      currentStrokeRef.current.push(point);
    }
  };

  // --------------------------------------------------
  // POINTER UP
  // --------------------------------------------------

  const handlePointerUp = (e) => {
    const canvas = canvasRef.current;

    drawingRef.current = false;

    currentStrokeRef.current = [];

    if (canvas) {
      try {
        canvas.releasePointerCapture(e.pointerId);
      } catch {
        // Pointer may already have been released.
      }
    }

    // IMPORTANT:
    // Do NOT predict automatically here.
    //
    // The user must click the Predict button.
    saveCanvas();
  };

  // --------------------------------------------------
  // POINTER CANCEL
  // --------------------------------------------------

  const handlePointerCancel = () => {
    drawingRef.current = false;
    currentStrokeRef.current = [];
  };

  // --------------------------------------------------
  // SAVE CANVAS
  // --------------------------------------------------

  const saveCanvas = () => {
    const canvas = canvasRef.current;

    if (!canvas) return;

    const image = canvas.toDataURL("image/png");

    const newHistory = historyRef.current.slice(
      0,
      historyIndexRef.current + 1
    );

    newHistory.push(image);

    historyRef.current = newHistory;

    historyIndexRef.current = newHistory.length - 1;
  };

  // --------------------------------------------------
  // RESTORE CANVAS
  // --------------------------------------------------

  const restoreCanvas = (dataUrl) => {
    const canvas = canvasRef.current;

    if (!canvas || !dataUrl) return;

    const ctx = canvas.getContext("2d");

    const img = new Image();

    img.onload = () => {
      ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
      );

      ctx.drawImage(
        img,
        0,
        0,
        canvas.width,
        canvas.height
      );
    };

    img.src = dataUrl;
  };

  // --------------------------------------------------
  // CLEAR
  // --------------------------------------------------

  const clearCanvas = () => {
    const canvas = canvasRef.current;

    if (!canvas) return;

    const ctx = canvas.getContext("2d");

    ctx.fillStyle = "#ffffff";

    ctx.fillRect(
      0,
      0,
      canvas.width,
      canvas.height
    );

    strokesRef.current = [];

    currentStrokeRef.current = [];

    drawingRef.current = false;

    setHasDrawing(false);

    setPrediction("");
    setConfidence(0);
    setTopPredictions([]);

    saveCanvas();
  };

  // --------------------------------------------------
  // UNDO
  // --------------------------------------------------

  const undoCanvas = () => {
    if (historyIndexRef.current <= 0) return;

    historyIndexRef.current -= 1;

    const image =
      historyRef.current[
        historyIndexRef.current
      ];

    restoreCanvas(image);

    strokesRef.current = [];

    currentStrokeRef.current = [];

    setHasDrawing(false);

    setPrediction("");
    setConfidence(0);
    setTopPredictions([]);
  };

  // --------------------------------------------------
  // REDO
  // --------------------------------------------------

  const redoCanvas = () => {
    if (
      historyIndexRef.current >=
      historyRef.current.length - 1
    ) {
      return;
    }

    historyIndexRef.current += 1;

    const image =
      historyRef.current[
        historyIndexRef.current
      ];

    restoreCanvas(image);

    strokesRef.current = [];

    currentStrokeRef.current = [];

    setHasDrawing(false);

    setPrediction("");
    setConfidence(0);
    setTopPredictions([]);
  };

  // --------------------------------------------------
  // NEW PROMPT
  // --------------------------------------------------

  const newPrompt = () => {
    const prompts = [...CLASSES];

    const random =
      prompts[Math.floor(Math.random() * prompts.length)];

    setCurrentPrompt(
      random.charAt(0).toUpperCase() +
        random.slice(1)
    );

    clearCanvas();
  };

  // --------------------------------------------------
  // DRAW AGAIN
  // --------------------------------------------------

  const drawAgain = () => {
    setPrediction("");
    setConfidence(0);
    setTopPredictions([]);
    setHasDrawing(false);

    setView("game");
  };

  // --------------------------------------------------
  // PREDICT
  // --------------------------------------------------

  const predictDoodle = async () => {
    const strokes = strokesRef.current;

    if (!strokes || strokes.length === 0) {
      setPrediction("Draw something!");
      return;
    }

    setIsPredicting(true);

    setPrediction("Thinking...");

    try {
      const response = await fetch(
        `${API_URL}/predict`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            strokes,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(
          `Server returned ${response.status}`
        );
      }

      const result = await response.json();

      console.log("Prediction result:", result);

      const predictedClass =
        result.class || "unknown";

      const predictedConfidence =
        Number(result.confidence || 0);

      const predictions =
        Array.isArray(result.top_predictions)
          ? result.top_predictions
          : [];

      setPrediction(predictedClass);

      setConfidence(predictedConfidence);

      setTopPredictions(predictions);

      // Save snapshot before moving to result page.
      const canvas = canvasRef.current;

      if (canvas) {
        const image =
          canvas.toDataURL("image/png");

        setSnapshot(image);

        const newEntry = {
          id: Date.now(),

          image,

          prediction: predictedClass,

          confidence: predictedConfidence,

          date: new Date().toLocaleString(),
        };

        setDrawingHistory((previous) => {
          const updated = [
            newEntry,
            ...previous,
          ];

          localStorage.setItem(
            "doodleHistory",
            JSON.stringify(updated)
          );

          return updated;
        });
      }

      // IMPORTANT:
      // Only go to the result screen AFTER
      // the Predict button has been clicked
      // and the API has returned successfully.
      setView("result");
    } catch (error) {
      console.error(
        "Prediction error:",
        error
      );

      setPrediction("AI unavailable");

      setConfidence(0);

      setTopPredictions([]);
    } finally {
      setIsPredicting(false);
    }
  };

  // --------------------------------------------------
  // LOGIN
  // --------------------------------------------------

  const handleLogin = (e) => {
    e.preventDefault();

    if (!username.trim()) return;

    setModal(null);

    setView("home");
  };

  // --------------------------------------------------
  // SIGNUP
  // --------------------------------------------------

  const handleSignup = (e) => {
    e.preventDefault();

    if (!username.trim()) return;

    setModal(null);

    setView("home");
  };

  // --------------------------------------------------
  // HOME SCREEN
  // --------------------------------------------------

  const renderHome = () => {
    return (
      <div className="home-screen">
        <header className="top-nav">
          <div className="brand">
            <div className="brand-badge">
              <Pencil size={20} />
            </div>

            <span>DoodleAI</span>
          </div>

          <nav className="nav-dock">
            <button
              className="round-control"
              onClick={() => setView("home")}
              title="Home"
            >
              <Home size={19} />
            </button>

            <button
              className="round-control"
              onClick={() => setView("history")}
              title="History"
            >
              <History size={19} />
            </button>

            <button
              className="round-control"
              onClick={() =>
                setModal("about")
              }
              title="About"
            >
              <Info size={19} />
            </button>
          </nav>

          <div className="nav-actions">
            <div className="status-pill">
              <span>AI ONLINE</span>
            </div>

            <button
              className="avatar"
              onClick={() =>
                setModal("login")
              }
            >
              <User size={19} />
            </button>
          </div>
        </header>

        <main className="hero">
          <div className="hero-copy">
            <div className="blue-accent">
              AI DOODLE RECOGNIZER
            </div>

            <h1>
              Draw it.
              <br />
              <span>AI gets it.</span>
            </h1>

            <p>
              Sketch anything and let our neural
              network figure out what you drew.
            </p>

            <div className="hero-actions">
              <button
                className="signin-btn"
                onClick={() => setView("game")}
              >
                <Play size={18} />
                Start Drawing
              </button>

              <button
                className="guest-btn"
                onClick={() =>
                  setModal("about")
                }
              >
                How it works
              </button>
            </div>
          </div>

          <div className="preview-card">
            <div className="preview-top">
              <div className="live-row">
                <span className="status-pill">
                  LIVE
                </span>

                <span>Neural preview</span>
              </div>

              <span className="latency">
                ~42ms
              </span>
            </div>

            <div className="preview-canvas">
              <span className="corner tl" />
              <span className="corner tr" />
              <span className="corner bl" />
              <span className="corner br" />

              <div className="sailboat">
                <div className="sail" />
                <div className="boat" />
              </div>

              <div className="guess-pills">
                <span>boat</span>
                <span>sail</span>
                <span>water</span>
              </div>
            </div>

            <div className="preview-bottom">
              <div className="mini-tools">
                <Pencil size={15} />
                <span>Try your own doodle</span>
              </div>

              <Sparkles size={17} />
            </div>
          </div>
        </main>

        <footer className="home-footer">
          <span>
            10 trained classes
          </span>

          <span>
            •
          </span>

          <span>
            QuickDraw RNN
          </span>

          <span>
            •
          </span>

          <span>
            FastAPI
          </span>
        </footer>
      </div>
    );
  };

  // --------------------------------------------------
  // GAME SCREEN
  // --------------------------------------------------

  const renderGame = () => {
    return (
      <div className="draw-screen">
        <header className="draw-header">
          <button
            className="yellow-icon-btn"
            onClick={() => setView("home")}
            title="Back"
          >
            <ArrowLeft size={20} />
          </button>

          <div className="task-pill">
            <span>DRAW</span>

            <strong>
              {currentPrompt}
            </strong>
          </div>

          <div className="predict-top">
            <span>
              {hasDrawing
                ? "Ready to predict"
                : "Start drawing"}
            </span>
          </div>
        </header>

        <main className="draw-workspace">
          <div className="canvas-frame">
            <div className="canvas-inner">
              <canvas
                ref={canvasRef}
                onPointerDown={
                  handlePointerDown
                }
                onPointerMove={
                  handlePointerMove
                }
                onPointerUp={
                  handlePointerUp
                }
                onPointerCancel={
                  handlePointerCancel
                }
              />
            </div>
          </div>

          <aside className="tool-area">
            <button
              className="new-word"
              onClick={newPrompt}
            >
              <RotateCcw size={16} />
              New word
            </button>

            <div className="tool-panels">
              <div className="main-tools">
                <button
                  className={`tool ${
                    tool === "pen"
                      ? "selected"
                      : ""
                  }`}
                  onClick={() =>
                    setTool("pen")
                  }
                  title="Pen"
                >
                  <Pencil size={21} />
                  <span>Pen</span>
                </button>

                <button
                  className={`tool ${
                    tool === "eraser"
                      ? "selected"
                      : ""
                  }`}
                  onClick={() =>
                    setTool("eraser")
                  }
                  title="Eraser"
                >
                  <Eraser size={21} />
                  <span>Eraser</span>
                </button>

                <button
                  className="tool"
                  onClick={clearCanvas}
                  title="Clear"
                >
                  <Trash2 size={21} />
                  <span>Clear</span>
                </button>

                <button
                  className="tool"
                  onClick={undoCanvas}
                  title="Undo"
                >
                  <Undo2 size={21} />
                  <span>Undo</span>
                </button>

                <button
                  className="tool"
                  onClick={redoCanvas}
                  title="Redo"
                >
                  <Redo2 size={21} />
                  <span>Redo</span>
                </button>
              </div>

              <div className="dashed" />

              <div className="kitten">
                🐱
              </div>

              <div className="color-strip">
                <div className="swatches">
                  <span className="swatch active" />
                  <span className="swatch" />
                  <span className="swatch" />
                </div>
              </div>

              <div className="stroke-adjust">
                <span>Stroke</span>

                <div className="dash">
                  <span />
                  <span />
                  <span />
                </div>
              </div>
            </div>
          </aside>
        </main>

        <footer className="draw-bottom">
          <div className="status-bar">
            <span
              className={
                hasDrawing
                  ? "ai-active"
                  : ""
              }
            >
              {isPredicting
                ? "AI THINKING..."
                : hasDrawing
                ? "AI READY"
                : "DRAW SOMETHING"}
            </span>

            {prediction &&
              prediction !== "Thinking..." && (
                <span>
                  {prediction}
                </span>
              )}
          </div>

          <button
            className="big-predict"
            onClick={predictDoodle}
            disabled={
              isPredicting || !hasDrawing
            }
          >
            {isPredicting
              ? "Predicting..."
              : "Predict"}
          </button>
        </footer>
      </div>
    );
  };

  // --------------------------------------------------
  // RESULT SCREEN
  // --------------------------------------------------

  const renderResult = () => {
    const percentage = Math.round(
      confidence * 100
    );

    return (
      <div className="result-screen">
        <header className="result-header">
          <button
            className="yellow-icon-btn"
            onClick={() => setView("home")}
          >
            <ArrowLeft size={20} />
          </button>

          <div>
            <div className="blue-accent">
              AI RESULT
            </div>

            <h2>Your doodle says...</h2>
          </div>

          <div className="result-actions">
            <button
              className="round-control"
              onClick={() =>
                setView("history")
              }
            >
              <History size={18} />
            </button>
          </div>
        </header>

        <main className="result-content">
          <div className="retro-card">
            <div className="target-row">
              <span>BEST GUESS</span>

              <strong>
                {prediction || "Unknown"}
              </strong>
            </div>

            <div className="snapshot-card">
              <div className="snapshot">
                {snapshot ? (
                  <img
                    src={snapshot}
                    alt="Your doodle"
                  />
                ) : (
                  <div />
                )}
              </div>

              <div className="snapshot-bottom">
                <span>
                  Your drawing
                </span>

                <Pencil size={16} />
              </div>
            </div>
          </div>

          <div className="metrics-card">
            <div className="metric-head">
              <div>
                <span>CONFIDENCE</span>

                <div className="accuracy">
                  {percentage}%
                </div>
              </div>

              <div className="rating">
                {percentage >= 80
                  ? "Great match!"
                  : percentage >= 50
                  ? "Pretty close!"
                  : "Keep practicing!"}
              </div>
            </div>

            <div className="accuracy-track">
              <div
                style={{
                  width: `${Math.min(
                    percentage,
                    100
                  )}%`,
                }}
              />
            </div>

            <div className="metric-grid">
              {topPredictions
                .slice(0, 3)
                .map((item, index) => (
                  <div
                    key={`${item.class}-${index}`}
                  >
                    <span>
                      #{index + 1}
                    </span>

                    <strong>
                      {item.class}
                    </strong>

                    <small>
                      {Math.round(
                        Number(
                          item.confidence || 0
                        ) * 100
                      )}
                      %
                    </small>
                  </div>
                ))}
            </div>
          </div>

          <div className="feedback">
            <Sparkles size={18} />

            <span>
              Neural network analyzed your
              stroke sequence.
            </span>
          </div>

          <div className="result-buttons">
            <button
              className="signin-btn"
              onClick={drawAgain}
            >
              <Pencil size={18} />
              Draw Again
            </button>

            <button
              className="guest-btn"
              onClick={() => setView("history")}
            >
              View History
            </button>
          </div>

          <div className="chick-note">
            🐥 Nice doodle!
          </div>

          <div className="version">
            DoodleAI • 10-class RNN
          </div>
        </main>
      </div>
    );
  };

  // --------------------------------------------------
  // HISTORY SCREEN
  // --------------------------------------------------

  const renderHistory = () => {
    return (
      <div className="history-screen">
        <header className="history-head">
          <button
            className="yellow-icon-btn"
            onClick={() => setView("home")}
          >
            <ArrowLeft size={20} />
          </button>

          <div className="history-title">
            <div className="blue-accent">
              YOUR DOODLES
            </div>

            <h2>History</h2>
          </div>

          <History size={25} />
        </header>

        <main className="history-grid">
          {drawingHistory.length === 0 ? (
            <div className="empty-history">
              <History size={42} />

              <h3>
                No doodles yet
              </h3>

              <p>
                Your predicted drawings will
                appear here.
              </p>

              <button
                className="signin-btn"
                onClick={() =>
                  setView("game")
                }
              >
                <Pencil size={18} />
                Start Drawing
              </button>
            </div>
          ) : (
            drawingHistory.map((item) => (
              <div
                className="history-card"
                key={item.id}
              >
                <div className="history-image">
                  <img
                    src={item.image}
                    alt={item.prediction}
                  />
                </div>

                <div className="history-label">
                  {item.prediction}
                </div>

                <div className="history-meta">
                  <span>
                    {Math.round(
                      item.confidence * 100
                    )}
                    % confidence
                  </span>

                  <span>
                    {item.date}
                  </span>
                </div>
              </div>
            ))
          )}
        </main>

        <footer className="history-footer">
          <span>
            {drawingHistory.length} saved doodle
            {drawingHistory.length === 1
              ? ""
              : "s"}
          </span>
        </footer>
      </div>
    );
  };

  // --------------------------------------------------
  // MODALS
  // --------------------------------------------------

  const renderModal = () => {
    if (!modal) return null;

    if (modal === "about") {
      return (
        <div
          className="modal-overlay"
          onClick={() => setModal(null)}
        >
          <div
            className="about-card"
            onClick={(e) =>
              e.stopPropagation()
            }
          >
            <div className="modal-header">
              <div className="icon-circle">
                <Sparkles size={21} />
              </div>

              <button
                className="round-control"
                onClick={() =>
                  setModal(null)
                }
              >
                <X size={18} />
              </button>
            </div>

            <div className="auth-title">
              <h2>
                How DoodleAI works
              </h2>

              <p>
                Draw using strokes on the canvas.
                Your stroke sequence is sent to
                the FastAPI backend, where the
                trained TensorFlow RNN predicts
                one of the 10 trained classes.
              </p>
            </div>

            <div className="about-note">
              <strong>
                10 trained classes
              </strong>

              <span>
                apple • car • cat • dog • fish •
                airplane • bicycle • house • tree
                • flower
              </span>
            </div>

            <button
              className="teal-btn"
              onClick={() => {
                setModal(null);
                setView("game");
              }}
            >
              <Play size={18} />
              Try it
            </button>
          </div>
        </div>
      );
    }

    if (modal === "login") {
      return (
        <div
          className="modal-overlay"
          onClick={() => setModal(null)}
        >
          <div
            className="auth-card"
            onClick={(e) =>
              e.stopPropagation()
            }
          >
            <div className="modal-header">
              <div className="icon-circle">
                <LogIn size={21} />
              </div>

              <button
                className="round-control"
                onClick={() =>
                  setModal(null)
                }
              >
                <X size={18} />
              </button>
            </div>

            <div className="auth-title">
              <h2>
                Welcome back
              </h2>

              <p>
                Sign in to your doodle account.
              </p>
            </div>

            <form onSubmit={handleLogin}>
              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) =>
                  setUsername(
                    e.target.value
                  )
                }
              />

              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) =>
                  setPassword(
                    e.target.value
                  )
                }
              />

              <button
                className="teal-btn"
                type="submit"
              >
                <LogIn size={18} />
                Sign In
              </button>
            </form>

            <button
              className="guest-btn"
              onClick={() => {
                setModal("signup");
              }}
            >
              Create account
            </button>
          </div>
        </div>
      );
    }

    if (modal === "signup") {
      return (
        <div
          className="modal-overlay"
          onClick={() => setModal(null)}
        >
          <div
            className="auth-card"
            onClick={(e) =>
              e.stopPropagation()
            }
          >
            <div className="modal-header">
              <div className="icon-circle">
                <UserPlus size={21} />
              </div>

              <button
                className="round-control"
                onClick={() =>
                  setModal(null)
                }
              >
                <X size={18} />
              </button>
            </div>

            <div className="auth-title">
              <h2>
                Create account
              </h2>

              <p>
                Keep your doodle journey in one
                place.
              </p>
            </div>

            <form onSubmit={handleSignup}>
              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) =>
                  setUsername(
                    e.target.value
                  )
                }
              />

              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) =>
                  setPassword(
                    e.target.value
                  )
                }
              />

              <button
                className="teal-btn"
                type="submit"
              >
                <UserPlus size={18} />
                Create Account
              </button>
            </form>

            <button
              className="guest-btn"
              onClick={() => {
                setModal("login");
              }}
            >
              Already have an account?
            </button>
          </div>
        </div>
      );
    }

    return null;
  };

  // --------------------------------------------------
  // MAIN RENDER
  // --------------------------------------------------

  return (
    <div className="app-shell">
      <div className="viewport">
        {view === "home" &&
          renderHome()}

        {view === "game" &&
          renderGame()}

        {view === "result" &&
          renderResult()}

        {view === "history" &&
          renderHistory()}

        {renderModal()}
      </div>
    </div>
  );
}

export default App;
