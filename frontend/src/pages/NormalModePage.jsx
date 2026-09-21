import React, { useState, useRef, useEffect } from 'react';
import { DrawingCanvas } from '../components/DrawingCanvas';
import { PredictionSidebar } from '../components/PredictionSidebar';
import { ConfirmModal } from '../components/ConfirmModal';
import { api } from '../services/api';
import { ArrowLeft, Sparkles, RefreshCw, BookOpen, X } from 'lucide-react';
import { showToast } from '../components/Toast';
import { ACTIVE_CLASSES_ORDERED, getBlueprintForClass } from '../data/doodleBlueprints';

export function NormalModePage({ setView }) {
  const canvasRef = useRef(null);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
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
    <div
  className="
    min-h-[calc(100vh-5rem)]
    w-full
    px-6
    py-8
    flex
    flex-col
    bg-gradient-to-br
    from-[#ffb347]
    via-[#ffb84d]
    to-[#f59e0b]
    dark:from-slate-950
    dark:via-slate-900
    dark:to-slate-950
    relative
    overflow-hidden"
>

      {/* Decorative Background */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none dark:hidden">

             <div className="absolute top-10 left-10 w-3 h-3 bg-white/40 rounded-full"></div>
             <div className="absolute top-28 right-24 w-2 h-2 bg-white/50 rounded-full"></div>
             <div className="absolute bottom-20 left-1/4 w-3 h-3 bg-white/30 rounded-full"></div>
             <div className="absolute bottom-32 right-16 w-2 h-2 bg-white/40 rounded-full"></div>

             <div className="absolute -left-10 top-1/3 text-white/20 text-8xl rotate-12">
              ✏️
             </div>

            <div className="absolute right-0 top-40 text-white/20 text-7xl -rotate-12">
               🎨
             </div>

            <div className="absolute left-1/3 bottom-6 text-white/20 text-6xl">
               ⭐
            </div>
           </div>
           <div className="relative z-10 max-w-7xl w-full mx-auto">
      {/* Top Bar */}
      <div className="
           rounded-3xl
           border
           border-orange-200
           dark:border-slate-800
           bg-gradient-to-r
           from-orange-50
           via-yellow-50
           to-pink-50
           dark:from-slate-900
           dark:via-slate-900
           dark:to-slate-900
           p-3
           flex
           flex-wrap
            items-center
            justify-between
            gap-3
           shadow-sm
           
            ">
        <div className="flex items-start gap-30">
          <button
            type="button"
            onClick={() => setShowExitConfirm(true)}
             className="flex items-center gap-5 px-4 py-2 rounded-xl border border-orange-200 bg-orange-100  dark:bg-slate-800 hover:bg-orange-200 text-orange-700 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 text-xs font-bold transition-all duration-200 shadow-sm hover:scale-105"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="pixel-font text-[10px]">Dashboard</span>
          </button>
          <div className="pt-3">
            <h1 className="pixel-font text-lg text-slate-900 dark:text-white tracking-wide flex items-center gap-10">
              <span>Normal Mode</span>
              <span className="pixel-font text-[8px] px-3 py-1 rounded-full bg-indigo-100 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300">
              Free Draw
             </span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium text-sm
                         leading-relaxed
                         max-w-xl">
              Draw anything freely, or choose a practice guide below to trace along dotted outlines!
            </p>
              <div className="flex flex-wrap gap-8 mt-4">
               <div className="px-4 py-2 rounded-xl bg-orange-100 dark:bg-slate-800">
               <p className="text-[11px] text-slate-500">Model</p>
               <p className="font-bold text-slate-800 dark:text-white">
               {isModelLoaded ? "CNN Ready" : "Loading"}
               </p>
               </div>

                <div className="px-4 py-2 rounded-xl bg-pink-100 dark:bg-slate-800">
                <p className="text-[11px] text-slate-500">Strokes</p>
                <p className="font-bold text-slate-800 dark:text-white">
                {strokeCount}
                 </p>
               </div>

                <div className="px-4 py-2 rounded-xl bg-yellow-100 dark:bg-slate-800">
                <p className="text-[11px] text-slate-500">Practice</p>
                <p className="font-bold text-slate-800 dark:text-white">
                 {selectedPracticeClass || "Free Draw"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Practice Guide Selector & New Canvas Button */}
        <div className="bg-orange-50
                        dark:bg-slate-800
                       border-orange-200

                       dark:bg-slate-800
                       dark:border-slate-700">

          {/* Practice Class Dropdown Selector */}
          <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1 shadow-sm">
            <BookOpen className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <span className="pixel-font text-[8px] text-slate-500 dark:text-slate-400 hidden sm:inline">Trace Guide:</span>
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
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800bg-gradient-to-r
                       from-orange-400
                        to-pink-400
                      text-orange
                       border-transparent
                       hover:scale-105 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-bold transition shadow-sm"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="pixel-font text-[9px]">New Canvas</span>
          </button>
        </div>
      </div>

      {/* 70/30 Split Layout */}
      
      <div className="mt-10 flex-1 flex flex-col lg:flex-row gap-8 min-h-0 pb-10">
        {/* 70% Drawing Canvas */}
        <div className="w-full lg:w-[72%] h-full flex flex-col min-h-[420px]">
          <DrawingCanvas
            ref={canvasRef}
            onStrokeEnd={handleStrokeEnd}
            showSaveButton={true}
            traceGuide={guidePaths}
          />
        </div>

        {/* 30% Live Predictions Sidebar */}
        <div className="w-full lg:w-[28%] h-full flex flex-col min-h-[350px]">
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

      {/* Confirm Exit Modal */}
      <ConfirmModal
        isOpen={showExitConfirm}
        title="Leave to Dashboard?"
        message="Do you want to leave Normal Mode and return to the dashboard? Your current drawing will be lost."
        confirmText="Leave"
        cancelText="Stay & Play"
        variant="warning"
        onConfirm={() => {
          setShowExitConfirm(false);
          setView('dashboard');
        }}
        onCancel={() => setShowExitConfirm(false)}
      />
    </div>

     </div>
  );
}
