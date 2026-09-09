import React, { useState, useRef, useEffect } from 'react';
import { DrawingCanvas } from '../components/DrawingCanvas';
import { PredictionSidebar } from '../components/PredictionSidebar';
import { api } from '../services/api';
import { ArrowLeft, Sparkles, RefreshCw } from 'lucide-react';
import { showToast } from '../components/Toast';

export function NormalModePage({ setView }) {
  const canvasRef = useRef(null);
  const [predictions, setPredictions] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [modelSource, setModelSource] = useState('');
  const [strokeCount, setStrokeCount] = useState(0);

  useEffect(() => {
    checkModel();
  }, []);

  const checkModel = async () => {
    try {
      const status = await api.getModelStatus();
      setIsModelLoaded(status.is_model_loaded);
    } catch (e) {
      console.warn('Could not retrieve model status:', e);
    }
  };

  // Called after each stroke ends (mouse release / touch end)
  const handleStrokeEnd = async (base64Image) => {
    if (!base64Image) {
      setPredictions([]);
      return;
    }

    setIsAnalyzing(true);
    try {
      const res = await api.predict(base64Image);
      setPredictions(res.predictions || []);
      setIsModelLoaded(res.is_model_loaded);
      setModelSource(res.model_source || '');
      setStrokeCount((c) => c + 1);
    } catch (err) {
      console.error('Prediction failed:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleReset = () => {
    if (canvasRef.current) {
      canvasRef.current.clearCanvas();
      setPredictions([]);
      setStrokeCount(0);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col h-[calc(100vh-5rem)]">
      {/* Top Bar */}
      <div className="flex items-center justify-between pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setView('dashboard')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Dashboard</span>
          </button>
          <div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <span>Normal Mode</span>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300">
                Free Draw
              </span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Draw anything freely. Predictions refresh automatically on each mouse release.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-bold transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>New Canvas</span>
          </button>
        </div>
      </div>

      {/* 70/30 Split Layout */}
      <div className="flex-1 flex flex-col lg:flex-row gap-5 min-h-0 pb-2">
        {/* 70% Drawing Canvas */}
        <div className="w-full lg:w-[70%] h-full flex flex-col min-h-[420px]">
          <DrawingCanvas
            ref={canvasRef}
            onStrokeEnd={handleStrokeEnd}
            showSaveButton={true}
          />
        </div>

        {/* 30% Live Predictions Sidebar */}
        <div className="w-full lg:w-[30%] h-full flex flex-col min-h-[350px]">
          <PredictionSidebar
            predictions={predictions}
            isAnalyzing={isAnalyzing}
            isModelLoaded={isModelLoaded}
            modelSource={modelSource}
            emptyMessage="Draw any doodle on the canvas. Release your mouse to see real-time AI predictions!"
          />
        </div>
      </div>
    </div>
  );
}
