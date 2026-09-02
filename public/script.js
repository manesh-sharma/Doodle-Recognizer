const screens = document.querySelectorAll(".screen");

function showScreen(id) {
  screens.forEach(screen => screen.classList.remove("active"));
  document.getElementById(id).classList.add("active");
}

// ===============================
// CANVAS SETUP
// ===============================

const canvas = document.getElementById("drawCanvas");
const ctx = canvas.getContext("2d");

let drawing = false;
let tool = "pen";

let lastX = 0;
let lastY = 0;

// Stores the actual strokes for the AI model
let strokes = [];
let currentStroke = null;

// Canvas history for undo / redo
let history = [];
let historyIndex = -1;


// ===============================
// CANVAS HISTORY
// ===============================

function saveCanvas() {
  history = history.slice(0, historyIndex + 1);
  history.push(canvas.toDataURL());
  historyIndex++;
}

function restore(data) {
  const img = new Image();

  img.onload = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);
  };

  img.src = data;
}


// ===============================
// POSITION
// ===============================

function position(e) {
  const rect = canvas.getBoundingClientRect();

  return {
    x: (e.clientX - rect.left) * canvas.width / rect.width,
    y: (e.clientY - rect.top) * canvas.height / rect.height
  };
}


// ===============================
// POINTER DOWN
// ===============================

canvas.addEventListener("pointerdown", e => {

  drawing = true;

  canvas.setPointerCapture(e.pointerId);

  const p = position(e);

  lastX = p.x;
  lastY = p.y;

  ctx.beginPath();
  ctx.moveTo(lastX, lastY);

  // Only record strokes when using the pen
  if (tool === "pen") {

    currentStroke = [
      {
        x: p.x,
        y: p.y
      }
    ];

    strokes.push(currentStroke);
  }

});


// ===============================
// POINTER MOVE
// ===============================

canvas.addEventListener("pointermove", e => {

  if (!drawing) return;

  const p = position(e);

  ctx.lineWidth = tool === "eraser" ? 30 : 6;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  ctx.strokeStyle =
    tool === "eraser"
      ? "#fff"
      : "#11164f";

  ctx.lineTo(p.x, p.y);
  ctx.stroke();

  // Record points for AI
  if (tool === "pen" && currentStroke) {

    currentStroke.push({
      x: p.x,
      y: p.y
    });

  }

  lastX = p.x;
  lastY = p.y;

});


// ===============================
// POINTER UP
// ===============================

canvas.addEventListener("pointerup", e => {

  if (!drawing) return;

  drawing = false;

  currentStroke = null;

  saveCanvas();

  // Don't automatically predict.
  // We will predict after the drawing is finished.
  predictDoodle();

});


// ===============================
// POINTER CANCEL / LEAVE
// ===============================

canvas.addEventListener("pointercancel", () => {

  drawing = false;
  currentStroke = null;

});


// ===============================
// PREDICTION
// ===============================

async function predictDoodle() {

  if (strokes.length === 0) {

    document.getElementById("prediction").textContent =
      "Draw something!";

    return;
  }

  const predictionElement =
    document.getElementById("prediction");

  predictionElement.textContent = "Thinking...";

  try {

    console.log("Sending strokes:", strokes);

    const response = await fetch(
      "http://127.0.0.1:8000/predict",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json"
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

    const result = await response.json();

    console.log("AI Prediction:", result);

    // Main prediction
    const predictedClass = result.class;

    const confidence =
      (result.confidence * 100).toFixed(1);

    predictionElement.textContent =
      predictedClass.toUpperCase();

    // Show top predictions in console
    console.log(
      "Top predictions:",
      result.top_predictions
    );

    console.log(
      `Prediction: ${predictedClass} (${confidence}%)`
    );

  } catch (error) {

    console.error("Prediction error:", error);

    predictionElement.textContent =
      "AI unavailable";

  }

}


// ===============================
// TOOLS
// ===============================

document.querySelectorAll(".tool").forEach(button => {

  button.addEventListener("click", () => {

    const selected = button.dataset.tool;


    // ===========================
    // CLEAR
    // ===========================

    if (selected === "clear") {

      ctx.fillStyle = "#fff";

      ctx.fillRect(
        0,
        0,
        canvas.width,
        canvas.height
      );

      // Clear AI strokes
      strokes = [];
      currentStroke = null;

      document.getElementById("prediction").textContent =
        "Draw something!";

      saveCanvas();

      return;
    }


    // ===========================
    // UNDO
    // ===========================

    if (selected === "undo") {

      if (historyIndex > 0) {

        historyIndex--;

        restore(history[historyIndex]);

        // For now rebuild AI strokes from
        // the canvas is not possible.
        // So we clear them to prevent
        // sending stale data.

        strokes = [];

        document.getElementById("prediction").textContent =
          "Draw something!";

      }

      return;
    }


    // ===========================
    // REDO
    // ===========================

    if (selected === "redo") {

      if (historyIndex < history.length - 1) {

        historyIndex++;

        restore(history[historyIndex]);

        strokes = [];

        document.getElementById("prediction").textContent =
          "Draw something!";

      }

      return;
    }


    // ===========================
    // PEN / ERASER
    // ===========================

    tool = selected;

    document
      .querySelectorAll(".tool")
      .forEach(b => b.classList.remove("active"));

    button.classList.add("active");

  });

});


// ===============================
// INITIAL CANVAS
// ===============================

ctx.fillStyle = "#fff";

ctx.fillRect(
  0,
  0,
  canvas.width,
  canvas.height
);

saveCanvas();

console.log("Doodle Recognizer frontend ready.");