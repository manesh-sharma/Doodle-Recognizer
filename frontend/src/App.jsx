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
} from "lucide-react";

// import "frontend/src/styles.css";


// ============================================================
// CONFIG
// ============================================================

const API_URL = "http://127.0.0.1:8000";

const CANVAS_WIDTH = 560;
const CANVAS_HEIGHT = 410;


// These are ONLY the classes trained by your model.
const TRAINED_CLASSES = [
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


// ============================================================
// APP
// ============================================================

export default function App() {

  // ----------------------------------------------------------
  // SCREEN
  // ----------------------------------------------------------

  const [view, setView] = useState("home");


  // ----------------------------------------------------------
  // USER
  // ----------------------------------------------------------

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");


  // ----------------------------------------------------------
  // GAME
  // ----------------------------------------------------------

  const [tool, setTool] = useState("pen");

  const [prediction, setPrediction] =
    useState("Draw something!");

  const [confidence, setConfidence] =
    useState(null);

  const [topPredictions, setTopPredictions] =
    useState([]);


  // ----------------------------------------------------------
  // CANVAS REFS
  // ----------------------------------------------------------

  const canvasRef = useRef(null);

  const drawingRef =
    useRef(false);

  const currentStrokeRef =
    useRef(null);

  // IMPORTANT:
  // This is the exact data sent to FastAPI.
  const strokesRef =
    useRef([]);


  // ----------------------------------------------------------
  // HISTORY
  // ----------------------------------------------------------

  const historyRef =
    useRef([]);

  const historyIndexRef =
    useRef(-1);


  // ==========================================================
  // CANVAS INITIALIZATION
  // ==========================================================

  useEffect(() => {

    if (view !== "game") {
      return;
    }

    const canvas =
      canvasRef.current;

    if (!canvas) {
      return;
    }

    canvas.width =
      CANVAS_WIDTH;

    canvas.height =
      CANVAS_HEIGHT;

    const ctx =
      canvas.getContext("2d");

    ctx.fillStyle = "#fff";

    ctx.fillRect(
      0,
      0,
      CANVAS_WIDTH,
      CANVAS_HEIGHT
    );

    ctx.lineCap = "round";
    ctx.lineJoin = "round";


    // Reset drawing data
    strokesRef.current = [];

    currentStrokeRef.current = null;

    drawingRef.current = false;


    // Reset history
    historyRef.current = [];

    historyIndexRef.current = -1;


    saveCanvas();

    setPrediction(
      "Draw something!"
    );

    setConfidence(null);

    setTopPredictions([]);

  }, [view]);


  // ==========================================================
  // SCREEN NAVIGATION
  // ==========================================================

  function showScreen(screen) {

    setView(screen);

  }


  // ==========================================================
  // CANVAS POSITION
  // ==========================================================

  function getCanvasPoint(e) {

    const canvas =
      canvasRef.current;

    const rect =
      canvas.getBoundingClientRect();


    return {

      x:
        (e.clientX - rect.left) *
        canvas.width /
        rect.width,

      y:
        (e.clientY - rect.top) *
        canvas.height /
        rect.height

    };

  }


  // ==========================================================
  // POINTER DOWN
  // ==========================================================

  function handlePointerDown(e) {

    const canvas =
      canvasRef.current;

    if (!canvas) {
      return;
    }


    drawingRef.current =
      true;


    try {

      canvas.setPointerCapture(
        e.pointerId
      );

    } catch {}


    const point =
      getCanvasPoint(e);


    const ctx =
      canvas.getContext("2d");


    ctx.beginPath();

    ctx.moveTo(
      point.x,
      point.y
    );


    // --------------------------------------------------------
    // PEN
    // --------------------------------------------------------

    if (tool === "pen") {

      const newStroke = [

        {
          x: point.x,
          y: point.y
        }

      ];


      currentStrokeRef.current =
        newStroke;


      strokesRef.current.push(
        newStroke
      );

    }

  }


  // ==========================================================
  // POINTER MOVE
  // ==========================================================

  function handlePointerMove(e) {

    if (!drawingRef.current) {
      return;
    }


    const canvas =
      canvasRef.current;

    if (!canvas) {
      return;
    }


    const point =
      getCanvasPoint(e);


    const ctx =
      canvas.getContext("2d");


    // Same drawing settings as old JS

    ctx.lineWidth =
      tool === "eraser"
        ? 30
        : 6;


    ctx.lineCap =
      "round";

    ctx.lineJoin =
      "round";


    ctx.strokeStyle =
      tool === "eraser"
        ? "#fff"
        : "#11164f";


    ctx.lineTo(
      point.x,
      point.y
    );

    ctx.stroke();


    // --------------------------------------------------------
    // STORE AI POINT
    // --------------------------------------------------------

    if (
      tool === "pen" &&
      currentStrokeRef.current
    ) {

      currentStrokeRef.current.push({

        x: point.x,
        y: point.y

      });

    }

  }


  // ==========================================================
  // POINTER UP
  // ==========================================================

  function handlePointerUp(e) {

    if (!drawingRef.current) {
      return;
    }


    drawingRef.current =
      false;


    currentStrokeRef.current =
      null;


    const canvas =
      canvasRef.current;


    try {

      canvas.releasePointerCapture(
        e.pointerId
      );

    } catch {}


    // Save canvas history
    saveCanvas();


    // EXACT SAME BEHAVIOR AS OLD JS
    predictDoodle();

  }


  // ==========================================================
  // POINTER CANCEL
  // ==========================================================

  function handlePointerCancel() {

    drawingRef.current =
      false;

    currentStrokeRef.current =
      null;

  }


  // ==========================================================
  // SAVE CANVAS HISTORY
  // ==========================================================

  function saveCanvas() {

    const canvas =
      canvasRef.current;

    if (!canvas) {
      return;
    }


    const data =
      canvas.toDataURL();


    const history =
      historyRef.current;


    const currentIndex =
      historyIndexRef.current;


    history.splice(
      currentIndex + 1
    );


    history.push(data);


    historyIndexRef.current =
      history.length - 1;

  }


  // ==========================================================
  // RESTORE CANVAS
  // ==========================================================

  function restoreCanvas(data) {

    const canvas =
      canvasRef.current;

    if (!canvas) {
      return;
    }


    const ctx =
      canvas.getContext("2d");


    const image =
      new Image();


    image.onload = () => {

      ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
      );


      ctx.drawImage(
        image,
        0,
        0
      );

    };


    image.src = data;

  }


  // ==========================================================
  // CLEAR CANVAS
  // ==========================================================

  function clearCanvas() {

    const canvas =
      canvasRef.current;

    if (!canvas) {
      return;
    }


    const ctx =
      canvas.getContext("2d");


    ctx.fillStyle =
      "#fff";


    ctx.fillRect(
      0,
      0,
      canvas.width,
      canvas.height
    );


    // IMPORTANT:
    // Clear AI stroke data too.

    strokesRef.current = [];

    currentStrokeRef.current =
      null;

    drawingRef.current =
      false;


    setPrediction(
      "Draw something!"
    );

    setConfidence(null);

    setTopPredictions([]);


    saveCanvas();

  }


  // ==========================================================
  // UNDO
  // ==========================================================

  function undoCanvas() {

    if (
      historyIndexRef.current <= 0
    ) {

      return;

    }


    historyIndexRef.current--;


    const data =
      historyRef.current[
        historyIndexRef.current
      ];


    restoreCanvas(data);


    // Same behavior as old JS.
    // Prevent stale AI stroke data.

    strokesRef.current = [];

    currentStrokeRef.current =
      null;


    setPrediction(
      "Draw something!"
    );

    setConfidence(null);

    setTopPredictions([]);

  }


  // ==========================================================
  // REDO
  // ==========================================================

  function redoCanvas() {

    if (
      historyIndexRef.current >=
      historyRef.current.length - 1
    ) {

      return;

    }


    historyIndexRef.current++;


    const data =
      historyRef.current[
        historyIndexRef.current
      ];


    restoreCanvas(data);


    // Same behavior as old JS

    strokesRef.current = [];

    currentStrokeRef.current =
      null;


    setPrediction(
      "Draw something!"
    );

    setConfidence(null);

    setTopPredictions([]);

  }


  // ==========================================================
  // PREDICTION
  // ==========================================================

  async function predictDoodle() {

    const strokes =
      strokesRef.current;


    if (
      strokes.length === 0
    ) {

      setPrediction(
        "Draw something!"
      );

      return;

    }


    setPrediction(
      "Thinking..."
    );


    try {

      console.log(
        "================================="
      );

      console.log(
        "Sending strokes:"
      );

      console.log(
        "Number of strokes:",
        strokes.length
      );


      console.log(
        "Number of points:",
        strokes.reduce(
          (total, stroke) =>
            total + stroke.length,
          0
        )
      );


      console.log(
        "First stroke:",
        strokes[0]
      );


      console.log(
        "Canvas:",
        CANVAS_WIDTH,
        "x",
        CANVAS_HEIGHT
      );


      console.log(
        "================================="
      );


      const response =
        await fetch(
          `${API_URL}/predict`,
          {

            method: "POST",

            headers: {

              "Content-Type":
                "application/json"

            },

            body: JSON.stringify({

              strokes: strokes

            })

          }
        );


      if (!response.ok) {

        throw new Error(
          `Prediction request failed: ${response.status}`
        );

      }


      const result =
        await response.json();


      console.log(
        "AI Prediction:",
        result
      );


      // ------------------------------------------------------
      // MAIN PREDICTION
      // ------------------------------------------------------

      const predictedClass =
        result.class;


      const predictionConfidence =
        result.confidence;


      setPrediction(
        predictedClass.toUpperCase()
      );


      setConfidence(
        predictionConfidence
      );


      // ------------------------------------------------------
      // TOP PREDICTIONS
      // ------------------------------------------------------

      if (
        Array.isArray(
          result.top_predictions
        )
      ) {

        setTopPredictions(
          result.top_predictions
        );

      }


      console.log(
        "Top predictions:",
        result.top_predictions
      );


      console.log(
        `Prediction: ${predictedClass} (${(
          predictionConfidence * 100
        ).toFixed(1)}%)`
      );


    } catch (error) {

      console.error(
        "Prediction error:",
        error
      );


      setPrediction(
        "AI unavailable"
      );

      setConfidence(null);

      setTopPredictions([]);

    }

  }


  // ==========================================================
  // TOOL SELECTION
  // ==========================================================

  function selectTool(selectedTool) {

    if (
      selectedTool === "clear"
    ) {

      clearCanvas();

      return;

    }


    if (
      selectedTool === "undo"
    ) {

      undoCanvas();

      return;

    }


    if (
      selectedTool === "redo"
    ) {

      redoCanvas();

      return;

    }


    setTool(
      selectedTool
    );

  }


  // ==========================================================
  // HOME
  // ==========================================================

  if (view === "home") {

    return (

      <div className="app">

        <section className="screen active">

          <div className="home-card">

            <div className="corner-star">
              ✦
            </div>


            <div className="top-buttons">

              <button
                onClick={() =>
                  showScreen("login")
                }
              >
                Login
              </button>


              <button
                onClick={() =>
                  showScreen("signup")
                }
              >
                Sign Up
              </button>


              <button
                onClick={() =>
                  showScreen("about")
                }
              >
                About Us
              </button>

            </div>


            <div className="home-content">

              <div className="doodle-label">
                Doodle
              </div>


              <h1>
                Ready, Set,
                <br />
                Doodle!!!
              </h1>


              <button
                className="pixel-button start"
                onClick={() =>
                  showScreen("age")
                }
              >
                Get Started
              </button>

            </div>


            <div className="wave wave-one" />

            <div className="wave wave-two" />

            <div className="tiny-character">
              ✦
            </div>

          </div>

        </section>

      </div>

    );

  }


  // ==========================================================
  // LOGIN
  // ==========================================================

  if (view === "login") {

    return (

      <div className="app">

        <section className="screen auth-screen active">

          <div className="auth-card">

            <h2>
              hello !!!!
            </h2>


            <div className="auth-panel">

              <label>
                Email / username
              </label>

              <input
                type="text"
                value={username}
                onChange={(e) =>
                  setUsername(
                    e.target.value
                  )
                }
              />


              <label>
                Password
              </label>

              <input
                type="password"
                value={password}
                onChange={(e) =>
                  setPassword(
                    e.target.value
                  )
                }
              />


              <button
                className="pixel-button"
                onClick={() =>
                  showScreen("age")
                }
              >
                Login
              </button>

            </div>


            <button
              className="text-link"
              onClick={() =>
                showScreen("signup")
              }
            >
              SignIn
            </button>

          </div>


          <button
            className="back"
            onClick={() =>
              showScreen("home")
            }
          >
            ← Back
          </button>

        </section>

      </div>

    );

  }


  // ==========================================================
  // SIGN UP
  // ==========================================================

  if (view === "signup") {

    return (

      <div className="app">

        <section className="screen auth-screen active">

          <div className="auth-card signup-card">

            <h2>
              hello !!!!
            </h2>


            <div className="auth-panel">

              <label>
                Email / username
              </label>

              <input
                type="text"
              />


              <label>
                Password
              </label>

              <input
                type="password"
              />


              <label>
                Confirm Password
              </label>

              <input
                type="password"
              />


              <button
                className="pixel-button"
                onClick={() =>
                  showScreen("age")
                }
              >
                SignIn
              </button>

            </div>

          </div>


          <button
            className="back"
            onClick={() =>
              showScreen("home")
            }
          >
            ← Back
          </button>

        </section>

      </div>

    );

  }


  // ==========================================================
  // ABOUT
  // ==========================================================

  if (view === "about") {

    return (

      <div className="app">

        <section className="screen age-screen active">

          <div className="grid-card">

            <button
              className="back-grid"
              onClick={() =>
                showScreen("home")
              }
            >
              ←
            </button>


            <h2>
              About Doodle
            </h2>


            <p>
              Draw anything and let our
              AI recognize your doodle.
            </p>


            <p>
              The recognizer currently
              supports 10 classes.
            </p>


            <button
              className="pixel-button"
              onClick={() =>
                showScreen("age")
              }
            >
              Try Doodle
            </button>

          </div>

        </section>

      </div>

    );

  }


  // ==========================================================
  // AGE
  // ==========================================================

  if (view === "age") {

    return (

      <div className="app">

        <section className="screen age-screen active">

          <div className="grid-card">

            <button
              className="back-grid"
              onClick={() =>
                showScreen("home")
              }
            >
              ←
            </button>


            <h2>
              Select age
            </h2>


            <div className="age-options">

              <button
                onClick={() =>
                  showScreen("game")
                }
              >
                01–30
              </button>


              <button
                onClick={() =>
                  showScreen("game")
                }
              >
                30 &amp; above
              </button>

            </div>

          </div>

        </section>

      </div>

    );

  }


  // ==========================================================
  // GAME
  // ==========================================================

  if (view === "game") {

    return (

      <div className="app">

        <section className="screen game-screen active">

          <div className="game-shell">


            {/* BACK */}

            <button
              className="game-back"
              onClick={() =>
                showScreen("age")
              }
            >
              ←
            </button>


            <div className="game-main">


              {/* CANVAS */}

              <div className="canvas-wrap">

                <canvas
                  ref={canvasRef}
                  width={CANVAS_WIDTH}
                  height={CANVAS_HEIGHT}

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

                  style={{
                    touchAction:
                      "none"
                  }}

                />

              </div>


              {/* TOOLS */}

              <div className="tools">

                <button
                  className={
                    `tool ${
                      tool === "pen"
                        ? "active"
                        : ""
                    }`
                  }

                  onClick={() =>
                    selectTool("pen")
                  }
                >
                  <Pencil size={22} />
                </button>


                <button
                  className={
                    `tool ${
                      tool === "eraser"
                        ? "active"
                        : ""
                    }`
                  }

                  onClick={() =>
                    selectTool("eraser")
                  }
                >
                  <Eraser size={22} />
                </button>


                <button
                  className="tool"

                  onClick={() =>
                    selectTool("clear")
                  }
                >
                  <Trash2 size={22} />
                </button>


                <button
                  className="tool"

                  onClick={() =>
                    selectTool("undo")
                  }
                >
                  <Undo2 size={22} />
                </button>


                <button
                  className="tool"

                  onClick={() =>
                    selectTool("redo")
                  }
                >
                  <Redo2 size={22} />
                </button>

              </div>

            </div>


            {/* SIDE PANEL */}

            <div className="side-panel">


              <div className="prediction">

                <span>
                  AI THINKING
                </span>


                <strong>
                  {prediction}
                </strong>


                {confidence !== null && (

                  <small>

                    {(confidence * 100).toFixed(1)}
                    %

                  </small>

                )}

              </div>


              {/* TOP 3 */}

              {topPredictions.length > 0 && (

                <div className="top-predictions">

                  <span>
                    TOP PREDICTIONS
                  </span>


                  {topPredictions.map(
                    (item, index) => (

                      <div
                        key={`${item.class}-${index}`}
                        className="prediction-row"
                      >

                        <span>
                          {item.class}
                        </span>


                        <span>
                          {(
                            item.confidence *
                            100
                          ).toFixed(1)}
                          %
                        </span>

                      </div>

                    )
                  )}

                </div>

              )}


              <div className="mini-tools">

                <button>
                  ✎
                </button>

                <button>
                  □
                </button>

                <button>
                  ◌
                </button>

              </div>


              <div className="mascot">

                ●

                <br />

                <span>
                  ◡
                </span>

              </div>

            </div>


            {/* PROMPT */}

            <div className="prompt">

              <small>
                ✦ PROMPT
              </small>


              <strong>
                Draw something amazing!
              </strong>

            </div>

          </div>

        </section>

      </div>

    );

  }


  // ==========================================================
  // FALLBACK
  // ==========================================================

  return null;

}