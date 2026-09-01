const screens = document.querySelectorAll(".screen");

function showScreen(id) {
  screens.forEach(screen => screen.classList.remove("active"));
  document.getElementById(id).classList.add("active");
}

const canvas = document.getElementById("drawCanvas");
const ctx = canvas.getContext("2d");

let drawing = false;
let tool = "pen";
let lastX = 0;
let lastY = 0;
let history = [];
let historyIndex = -1;

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

function position(e) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: (e.clientX - rect.left) * canvas.width / rect.width,
    y: (e.clientY - rect.top) * canvas.height / rect.height
  };
}

canvas.addEventListener("pointerdown", e => {
  drawing = true;
  const p = position(e);
  lastX = p.x;
  lastY = p.y;
  ctx.beginPath();
  ctx.moveTo(lastX, lastY);
});

canvas.addEventListener("pointermove", e => {
  if (!drawing) return;

  const p = position(e);
  ctx.lineWidth = tool === "eraser" ? 30 : 6;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = tool === "eraser" ? "#fff" : "#11164f";

  ctx.lineTo(p.x, p.y);
  ctx.stroke();

  lastX = p.x;
  lastY = p.y;
});

canvas.addEventListener("pointerup", () => {
  if (!drawing) return;
  drawing = false;
  saveCanvas();
  document.getElementById("prediction").textContent = "Thinking...";
  setTimeout(() => {
    document.getElementById("prediction").textContent = "Nice doodle!";
  }, 600);
});

canvas.addEventListener("pointerleave", () => {
  drawing = false;
});

document.querySelectorAll(".tool").forEach(button => {
  button.addEventListener("click", () => {
    const selected = button.dataset.tool;

    if (selected === "clear") {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      saveCanvas();
      return;
    }

    if (selected === "undo") {
      if (historyIndex > 0) {
        historyIndex--;
        restore(history[historyIndex]);
      }
      return;
    }

    if (selected === "redo") {
      if (historyIndex < history.length - 1) {
        historyIndex++;
        restore(history[historyIndex]);
      }
      return;
    }

    tool = selected;
    document.querySelectorAll(".tool").forEach(b => b.classList.remove("active"));
    button.classList.add("active");
  });
});

ctx.fillStyle = "#fff";
ctx.fillRect(0, 0, canvas.width, canvas.height);
saveCanvas();