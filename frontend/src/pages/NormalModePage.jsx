import React, { useState, useRef, useEffect } from 'react';
import { DrawingCanvas } from '../components/DrawingCanvas';
import { PredictionSidebar } from '../components/PredictionSidebar';
import { api } from '../services/api';
import { ArrowLeft, Sparkles, RefreshCw, BookOpen, X } from 'lucide-react';
import { showToast } from '../components/Toast';
import { ACTIVE_CLASSES_ORDERED, getBlueprintForClass } from '../data/doodleBlueprints';

export function NormalModePage({ setView }) {
  const canvasRef = useRef(null);
  const [predictions, setPredictions] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [modelSource, setModelSource] = useState('');
  const [strokeCount, setStrokeCount] = useState(0);

  // Practice & Trace Guide state
  const [selectedPracticeClass, setSelectedPracticeClass] = useState('');
  const [guidePaths, setGuidePaths] = useState(null);

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

  const handleSelectPractice = (cname) => {
    setSelectedPracticeClass(cname);
    if (!cname) {
      setGuidePaths(null);
    } else {
      const bp = getBlueprintForClass(cname);
      setGuidePaths(bp?.paths || null);
      showToast(`Dotted guide loaded for "${bp?.name || cname}". Trace over it!`, 'info');
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
    <div className="max-w-7xl mx-auto px-4 sm:6 lg:px-8 py-6 flex flex-col h-[calc(100vh-5rem)]">
      {/* Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4">
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
              Draw anything freely, or choose a practice guide below to trace along dotted outlines!
            </p>
          </div>
        </div>

        {/* Practice Guide Selector & New Canvas Button */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Practice Class Dropdown Selector */}
          <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1 shadow-sm">
            <BookOpen className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 hidden sm:inline">Trace Guide:</span>
            <select
              value={selectedPracticeClass}
              onChange={(e) => handleSelectPractice(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-800 dark:text-white focus:outline-none cursor-pointer py-1"
            >
              <option value="">-- None (Free Draw) --</option>
              {ACTIVE_CLASSES_ORDERED.map((item) => (
                <option key={item.name} value={item.name} className="dark:bg-slate-800">
                  {item.name} ({item.difficulty})
                </option>
              ))}
            </select>
            {selectedPracticeClass && (
              <button
                type="button"
                onClick={() => handleSelectPractice('')}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
                title="Clear Trace Guide"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-bold transition shadow-sm"
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
            traceGuide={guidePaths}
          />
        </div>

        {/* 30% Live Predictions Sidebar */}
        <div className="w-full lg:w-[30%] h-full flex flex-col min-h-[350px]">
          <PredictionSidebar
            predictions={predictions}
            isAnalyzing={isAnalyzing}
            isModelLoaded={isModelLoaded}
            modelSource={modelSource}
            strokeCount={strokeCount}
            emptyMessage="Draw any doodle on the canvas. Release your mouse to see real-time AI predictions!"
          />
        </div>
      </div>
    </div>
  );
}
