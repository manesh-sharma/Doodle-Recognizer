import React, { useRef, useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Undo2, Redo2, Trash2, Download } from 'lucide-react';
import { showToast } from './Toast';

export const DrawingCanvas = forwardRef(function DrawingCanvas(
  { onStrokeEnd, disabled = false, showSaveButton = true },
  ref
) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  
  // Tool state
  const [tool, setTool] = useState('brush'); // 'brush' or 'eraser'
  const [brushSize, setBrushSize] = useState(18); // Default 18px suited for 400x400 square
  const [isDrawing, setIsDrawing] = useState(false);
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const [strokeCount, setStrokeCount] = useState(0);

  // Standard fixed internal resolution for consistent 28x28 QuickDraw conversion
  const CANVAS_INTERNAL_SIZE = 400;

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set internal resolution
    canvas.width = CANVAS_INTERNAL_SIZE;
    canvas.height = CANVAS_INTERNAL_SIZE;

    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, CANVAS_INTERNAL_SIZE, CANVAS_INTERNAL_SIZE);

    // Initial undo snapshot
    saveCanvasState();
  }, []);

  const saveCanvasState = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const imageData = ctx.getImageData(0, 0, CANVAS_INTERNAL_SIZE, CANVAS_INTERNAL_SIZE);
    setUndoStack((prev) => [...prev.slice(-30), imageData]); // Keep last 30 states
  };

  const getCanvasCoordinates = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    
    let clientX, clientY;
    if (e.touches && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    // Scale from CSS display size to internal 400x400 size
    const scaleX = CANVAS_INTERNAL_SIZE / rect.width;
    const scaleY = CANVAS_INTERNAL_SIZE / rect.height;

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  const startDrawing = (e) => {
    if (disabled) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    setIsDrawing(true);
    const { x, y } = getCanvasCoordinates(e);

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (tool === 'brush') {
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = brushSize;
    } else {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = brushSize * 2.2;
    }

    // Single dot on tap
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const draw = (e) => {
    if (!isDrawing || disabled) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const { x, y } = getCanvasCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.closePath();

    saveCanvasState();
    setRedoStack([]);
    setStrokeCount((c) => c + 1);

    if (onStrokeEnd) {
      const base64 = getBase64Image();
      onStrokeEnd(base64);
    }
  };

  const handleUndo = () => {
    if (undoStack.length <= 1) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const current = undoStack[undoStack.length - 1];
    const previous = undoStack[undoStack.length - 2];

    setRedoStack((prev) => [...prev, current]);
    setUndoStack((prev) => prev.slice(0, -1));

    ctx.putImageData(previous, 0, 0);

    if (onStrokeEnd) {
      const base64 = getBase64Image();
      onStrokeEnd(base64);
    }
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const nextState = redoStack[redoStack.length - 1];
    setRedoStack((prev) => prev.slice(0, -1));
    setUndoStack((prev) => [...prev, nextState]);

    ctx.putImageData(nextState, 0, 0);

    if (onStrokeEnd) {
      const base64 = getBase64Image();
      onStrokeEnd(base64);
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, CANVAS_INTERNAL_SIZE, CANVAS_INTERNAL_SIZE);

    saveCanvasState();
    setRedoStack([]);
    setStrokeCount(0);

    if (onStrokeEnd) {
      const base64 = getBase64Image();
      onStrokeEnd(base64);
    }
    showToast('Canvas cleared', 'info', 1800);
  };

  const getBase64Image = () => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    return canvas.toDataURL('image/png');
  };

  const saveLocally = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `doodle_${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    showToast('Doodle saved to your computer!', 'success');
  };

  useImperativeHandle(ref, () => ({
    getImageBase64: getBase64Image,
    clearCanvas,
    saveLocally,
    getStrokeCount: () => strokeCount,
  }));

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden select-none transition-colors duration-200">
      {/* Canvas Toolbar */}
      <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2.5">
        {/* Tool: Brush & Eraser */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={() => setTool('brush')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              tool === 'brush'
                ? 'bg-slate-900 dark:bg-indigo-600 text-white shadow-sm'
                : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            {/* Black filled circle with white boundary indicator */}
            <span className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-black border-2 border-white shrink-0"></span>
            <span>Brush</span>
          </button>

          <button
            type="button"
            onClick={() => setTool('eraser')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              tool === 'eraser'
                ? 'bg-slate-900 dark:bg-indigo-600 text-white shadow-sm'
                : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            {/* White filled circle with black boundary indicator */}
            <span className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-white border-2 border-black shrink-0"></span>
            <span>Eraser</span>
          </button>

          {/* Stroke Width Selector: 10px, 18px (default), 26px, 34px */}
          <div className="flex items-center gap-1.5 ml-1 pl-2.5 border-l border-slate-200 dark:border-slate-700">
            <span className="hidden sm:inline text-xs font-bold text-slate-500 dark:text-slate-400 mr-1">Size:</span>
            {[
              { label: 'Fine', size: 10 },
              { label: 'Med', size: 18 },
              { label: 'Thick', size: 26 },
              { label: 'Bold', size: 34 },
            ].map(({ label, size }) => (
              <button
                key={size}
                type="button"
                onClick={() => setBrushSize(size)}
                title={`${label} (${size}px)`}
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center transition ${
                  brushSize === size
                    ? 'bg-slate-900 dark:bg-indigo-600 text-white shadow-sm'
                    : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                <span
                  className="rounded-full bg-current"
                  style={{ width: Math.min(18, size / 1.8), height: Math.min(18, size / 1.8) }}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Action Controls: Undo, Redo, Clear, Save Locally */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={handleUndo}
            disabled={undoStack.length <= 1}
            title="Undo"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-bold transition"
          >
            <Undo2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Undo</span>
          </button>

          <button
            type="button"
            onClick={handleRedo}
            disabled={redoStack.length === 0}
            title="Redo"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-bold transition"
          >
            <Redo2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Redo</span>
          </button>

          <button
            type="button"
            onClick={clearCanvas}
            title="Clear Drawing"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-rose-200 dark:border-rose-900/40 bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-xs font-bold transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Clear</span>
          </button>

          {showSaveButton && (
            <button
              type="button"
              onClick={saveLocally}
              title="Download Doodle to Computer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 dark:bg-indigo-600 text-white hover:bg-slate-800 dark:hover:bg-indigo-500 text-xs font-bold transition shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Save</span>
            </button>
          )}
        </div>
      </div>

      {/* Canvas Drawing Area with Square Artboard Frame */}
      <div
        ref={containerRef}
        className="flex-1 w-full h-full bg-slate-100/70 dark:bg-slate-950/70 p-4 sm:p-6 flex items-center justify-center relative overflow-hidden transition-colors"
      >
        {/* Centered Square Canvas Artboard */}
        <div className="relative w-full max-w-[420px] aspect-square rounded-2xl shadow-lg border-2 border-slate-300 dark:border-slate-700 bg-white overflow-hidden group">
          <canvas
            ref={canvasRef}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
            className="w-full h-full block cursor-crosshair touch-none"
          />

          {disabled && (
            <div className="absolute inset-0 bg-white/70 backdrop-blur-[1px] flex items-center justify-center select-none">
              <span className="bg-slate-900 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-lg">
                Canvas Locked
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
