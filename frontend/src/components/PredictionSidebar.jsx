import React from 'react';
import { Sparkles, Activity, Check, HelpCircle, Layers, Award } from 'lucide-react';

export function PredictionSidebar({
  predictions = [],
  targetClass = null,
  targetConfidence = null,
  isAnalyzing = false,
  isModelLoaded = false,
  modelSource = '',
  emptyMessage = 'Start sketching on the canvas! The AI will identify your drawing after each stroke.',
}) {
  const getConfidenceColor = (conf) => {
    if (conf >= 70) return 'bg-emerald-500 text-emerald-700';
    if (conf >= 40) return 'bg-indigo-500 text-indigo-700';
    if (conf >= 20) return 'bg-amber-500 text-amber-700';
    return 'bg-slate-400 text-slate-600';
  };

  const topPrediction = predictions.length > 0 ? predictions[0] : null;

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-colors duration-200">
      {/* Sidebar Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-sm">
            <Sparkles className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 dark:text-white text-sm leading-tight">AI Recognizer</h3>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Real-time stroke inference</span>
          </div>
        </div>

        {/* Model status tag */}
        <div
          title={modelSource || (isModelLoaded ? 'TensorFlow/Keras CNN' : 'Heuristic Mode')}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
            isModelLoaded
              ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300'
              : 'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-300'
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              isModelLoaded ? 'bg-emerald-500' : 'bg-amber-500 animate-ping'
            }`}
          />
          <span>{isModelLoaded ? 'Keras Loaded' : 'Demo Model'}</span>
        </div>
      </div>

      {/* Target Class Focus Banner (if game mode or targeted) */}
      {targetClass && (
        <div className="p-4 bg-indigo-50/60 dark:bg-indigo-950/30 border-b border-indigo-100 dark:border-indigo-900/40">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-indigo-900 dark:text-indigo-300 uppercase tracking-wider">Target Objective</span>
            <span className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400">
              {targetConfidence !== null ? `${targetConfidence}% Match` : 'Awaiting stroke'}
            </span>
          </div>
          <div className="text-lg font-extrabold text-slate-900 dark:text-white capitalize flex items-center gap-2">
            <span>{targetClass}</span>
          </div>
          {/* Target confidence bar */}
          <div className="w-full bg-indigo-100 dark:bg-indigo-950 rounded-full h-2.5 mt-2 overflow-hidden">
            <div
              className="bg-indigo-600 dark:bg-indigo-500 h-2.5 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${Math.min(100, targetConfidence || 0)}%` }}
            />
          </div>
        </div>
      )}

      {/* Top 5 Predictions List */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3">
        <div className="flex items-center justify-between text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
          <span>Top Predictions</span>
          {isAnalyzing && (
            <span className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 normal-case font-medium">
              <Activity className="w-3 h-3 animate-spin" />
              Thinking...
            </span>
          )}
        </div>

        {predictions.length === 0 ? (
          <div className="py-12 px-4 text-center flex flex-col items-center justify-center text-slate-400 dark:text-slate-500">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3 text-slate-400 dark:text-slate-500">
              <Layers className="w-6 h-6" />
            </div>
            <p className="text-xs leading-relaxed max-w-[200px]">{emptyMessage}</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {predictions.map((item, index) => {
              const isTop = index === 0;
              const isTargetMatch =
                targetClass && item.class_name.toLowerCase() === targetClass.toLowerCase();

              return (
                <div
                  key={item.id || index}
                  className={`p-3 rounded-xl border transition-all duration-200 ${
                    isTop
                      ? 'border-indigo-200 dark:border-indigo-800 bg-indigo-50/40 dark:bg-indigo-950/30 shadow-sm'
                      : isTargetMatch
                      ? 'border-emerald-300 dark:border-emerald-800 bg-emerald-50/40 dark:bg-emerald-950/30'
                      : 'border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 hover:bg-slate-50 dark:hover:bg-slate-800/70'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center ${
                          isTop
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        {index + 1}
                      </span>
                      <span className="text-sm font-bold text-slate-800 dark:text-slate-200 capitalize">
                        {item.class_name}
                      </span>
                    </div>
                    <span className="text-sm font-extrabold text-slate-900 dark:text-white">
                      {item.confidence}%
                    </span>
                  </div>

                  {/* Confidence Progress Bar */}
                  <div className="w-full bg-slate-200/80 dark:bg-slate-700/80 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ease-out ${
                        isTop ? 'bg-indigo-600 dark:bg-indigo-500' : 'bg-slate-500 dark:bg-slate-400'
                      }`}
                      style={{ width: `${Math.max(3, item.confidence)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
        <span>Draw stroke & release mouse to predict</span>
        <span className="font-semibold text-slate-600 dark:text-slate-300">345 Classes (Curated V4)</span>
      </div>
    </div>
  );
}
