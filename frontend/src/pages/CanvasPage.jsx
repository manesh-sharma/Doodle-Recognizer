import React from "react";
import { ArrowLeft, ArrowRight, Eraser, Pencil, Save, Trash2 } from "lucide-react";
import { COLORS } from "../constants";

export default function CanvasPage({
  prompt, newPrompt, navigate, predict, canvasRef, canvasBoxRef,
  pointerDown, pointerMove, pointerUp, pointerCancel, tool, setTool, color, setColor,
  lineWidth, setLineWidth, clearCanvas, saveDoodle
}) {
  const sizes = [2, 4, 6, 8, 12, 16];

  const adjust = (d) =>
    setLineWidth(
      sizes[
        Math.max(
          0,
          Math.min(
            sizes.length - 1,
            sizes.indexOf(lineWidth) + d
          )
        )
      ]
    );

  return (
    <section className="draw-screen">
      <div className="draw-header">
        <button className="yellow-icon-btn" onClick={() => navigate("home")}>
          <ArrowLeft size={19} />
        </button>

        <div className="task-pill">
          TASK: <u>DRAW A {prompt}</u>
        </div>

        <button className="predict-top" onClick={predict}>
          ✨ Predict <ArrowRight size={15} />
        </button>
      </div>

      <div className="draw-workspace">
        <div className="canvas-frame">
          <div ref={canvasBoxRef} className="canvas-inner">
            <canvas
              ref={canvasRef}
              onPointerDown={pointerDown}
              onPointerMove={pointerMove}
              onPointerUp={pointerUp}
              onPointerCancel={pointerCancel}
              onPointerLeave={pointerUp}
            />
          </div>
        </div>

        <div className="tool-area">
          <button className="new-word" onClick={newPrompt}>
            🎲 New Word
          </button>

          <div className="tool-panels">
            <div className="main-tools">
              <button
                className={tool === "pencil" ? "selected tool" : "tool"}
                onClick={() => setTool("pencil")}
              >
                <Pencil /><b>PENCIL</b>
              </button>

              <button
                className={tool === "eraser" ? "selected tool" : "tool"}
                onClick={() => setTool("eraser")}
              >
                <Eraser /><b>ERASER</b>
              </button>

              <div className="dashed" />

              <button className="tool" onClick={clearCanvas}>
                <Trash2 /><b>CLEAR</b>
              </button>

              <button className="tool" onClick={saveDoodle}>
                <Save /><b>SAVE</b>
              </button>

              <div className="kitten">🐈‍⬛</div>
            </div>

            <div className="color-strip">
              <span>⚡</span>

              <div className="stroke-adjust">
                <button onClick={() => adjust(1)}>+</button>
                <b>{lineWidth}px</b>
                <button onClick={() => adjust(-1)}>-</button>
              </div>

              <div className="swatches">
                {COLORS.map(c =>
                  <button
                    key={c}
                    className={color === c ? "swatch active" : "swatch"}
                    style={{ background: c }}
                    onClick={() => {
                      setColor(c);
                      setTool("pencil");
                    }}
                  />
                )}
              </div>

              <span className="dash" />
            </div>
          </div>
        </div>
      </div>

      <div className="draw-bottom">
        <div className="status-bar">
          <span>⭐</span>
          <b>Draw boldly! Click PREDICT when you're done sketching...</b>
          <span className="ai-active">◉ AI Active</span>
        </div>

        <button className="big-predict" onClick={predict}>
          🔮 AI PREDICT<br />DOODLE ⚡
        </button>
      </div>
    </section>
  );
}
