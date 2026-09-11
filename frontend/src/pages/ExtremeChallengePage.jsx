import React, { useState, useEffect, useRef } from 'react';
import { DrawingCanvas } from '../components/DrawingCanvas';
import { api } from '../services/api';
import { showToast } from '../components/Toast';
import { unlockBadge } from '../utils/badgeManager';
import { ACTIVE_CLASSES_ORDERED } from '../data/doodleBlueprints';
import {
  Zap,
  Clock,
  Flame,
  Trophy,
  ArrowLeft,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  ChevronRight,
  TrendingUp
} from 'lucide-react';

export function ExtremeChallengePage({ setView }) {
  const canvasRef = useRef(null);

  // Target word selection
  const [currentPrompt, setCurrentPrompt] = useState(null);
  const [modelPrediction, setModelPrediction] = useState(null);
  const [targetConfidence, setTargetConfidence] = useState(0);

  // Challenge metrics
  const [startTime, setStartTime] = useState(null);
  const [timeElapsed, setTimeElapsed] = useState(0); // in seconds
  const [isRunning, setIsRunning] = useState(false);
  const [strokeCount, setStrokeCount] = useState(0);
  const [hasStartedDrawing, setHasStartedDrawing] = useState(false);

  // Completion modal & scores
  const [isCompleted, setIsCompleted] = useState(false);
  const [scoreBreakdown, setScoreBreakdown] = useState(null);
  const [highScore, setHighScore] = useState(() => {
    try {
      return parseFloat(localStorage.getItem('doodle_extreme_high_score') || '0');
    } catch {
      return 0;
    }
  });

  // Select a random active class for challenge
  useEffect(() => {
    pickNewPrompt();
  }, []);

  // Timer loop
  useEffect(() => {
    let interval = null;
    if (isRunning && startTime) {
      interval = setInterval(() => {
        const now = Date.now();
        setTimeElapsed((now - startTime) / 1000);
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isRunning, startTime]);

  const pickNewPrompt = () => {
    if (!ACTIVE_CLASSES_ORDERED || ACTIVE_CLASSES_ORDERED.length === 0) return;
    const rand = ACTIVE_CLASSES_ORDERED[Math.floor(Math.random() * ACTIVE_CLASSES_ORDERED.length)];
    setCurrentPrompt(rand);
    resetChallenge();
  };

  const handleCanvasCleared = () => {
    setIsRunning(false);
    setStartTime(null);
    setTimeElapsed(0);
    setStrokeCount(0);
    setHasStartedDrawing(false);
    setTargetConfidence(0);
    setModelPrediction(null);
  };

  const resetChallenge = () => {
    handleCanvasCleared();
    setIsCompleted(false);
    setScoreBreakdown(null);
    if (canvasRef.current) {
      canvasRef.current.clearCanvas();
    }
  };

  const handleStrokeEnd = async (base64) => {
    if (!hasStartedDrawing) {
      setHasStartedDrawing(true);
      setIsRunning(true);
      setStartTime(Date.now());
    }

    const currentStrokes = canvasRef.current ? canvasRef.current.getStrokeCount() : strokeCount + 1;
    setStrokeCount(currentStrokes);

    if (!base64 || !currentPrompt) return;

    try {
      const res = await api.predictDoodle(base64, currentPrompt.name);
      if (res && res.predictions) {
        setModelPrediction(res.predictions[0] || null);
        const conf = res.target_confidence || 0;
        setTargetConfidence(conf);

        if (conf >= 90) {
          unlockBadge('perfectionist');
        }
        if (conf >= 98) {
          unlockBadge('century_club');
        }
      }
    } catch (err) {
      console.error('Inference error:', err);
    }
  };

  const handleFinishChallenge = () => {
    if (!hasStartedDrawing) {
      showToast('Draw something first before finishing!', 'warning');
      return;
    }

    setIsRunning(false);
    const finalTime = timeElapsed || 0.1;
    const finalStrokes = strokeCount || 1;
    const finalConf = targetConfidence || 0;

    // SCORING FORMULA:
    // Base challenge bonus: 100
    // Confidence score: round(finalConf)
    // Stroke score: max(10, 100 - (finalStrokes - 1) * 5) (1 stroke = 100 pts)
    // Time penalty: -1 pt per full second used
    const baseBonus = 100;
    const confScore = Math.round(finalConf);
    const strokeScore = Math.max(10, 100 - (finalStrokes - 1) * 5);
    const timePenalty = Math.floor(finalTime);
    const total = Math.max(0, baseBonus + confScore + strokeScore - timePenalty);

    const breakdown = {
      baseBonus,
      confScore,
      finalConf,
      strokeScore,
      strokes: finalStrokes,
      timePenalty,
      seconds: finalTime.toFixed(1),
      totalScore: total
    };

    setScoreBreakdown(breakdown);
    setIsCompleted(true);

    if (total > highScore) {
      setHighScore(total);
      localStorage.setItem('doodle_extreme_high_score', total.toString());
    }

    // Award Badges
    unlockBadge('first_extreme');
    if (finalTime <= 6.0 && total >= 250) {
      unlockBadge('extreme_lightning');
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-gradient-to-r from-amber-500 via-orange-600 to-red-600 rounded-3xl p-6 text-white shadow-xl">
        <div>
          <button
            onClick={() => setView('dashboard')}
            className="inline-flex items-center gap-2 text-xs font-bold text-amber-100 hover:text-white bg-black/20 hover:bg-black/30 px-3 py-1.5 rounded-xl mb-3 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
          </button>
          <h1 className="text-2xl sm:text-3xl font-black font-doodle flex items-center gap-2">
            <Zap className="w-7 h-7 text-yellow-300" /> Extreme Challenge
          </h1>
          <p className="text-amber-100 text-xs sm:text-sm mt-1 max-w-xl">
            Fast strokes. Lightning speed. High accuracy. Every second costs 1 point. Can you achieve the legendary 295+ score?
          </p>
        </div>

        {/* High Score Badge */}
        <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 text-right shrink-0">
          <div className="text-[11px] font-bold text-amber-200 uppercase tracking-wider">High Score</div>
          <div className="text-2xl sm:text-3xl font-black text-yellow-300 font-mono">
            {highScore} <span className="text-xs text-white font-bold">pts</span>
          </div>
        </div>
      </div>

      {/* Target Word & Live Metrics HUD */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {/* Target Prompt Box */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between sm:col-span-1">
          <div>
            <div className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400">Target Doodle</div>
            <div className="text-xl font-black text-slate-900 dark:text-white capitalize mt-0.5">
              {currentPrompt?.name || 'Loading...'}
            </div>
            <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 uppercase">
              {currentPrompt?.difficulty || 'medium'}
            </span>
          </div>
          <button
            onClick={pickNewPrompt}
            title="Change Target Prompt"
            className="p-2.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Live Stopwatch */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0 border border-orange-200 dark:border-orange-800">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400">Time Used (-1/s)</div>
            <div className="text-2xl font-black font-mono text-slate-900 dark:text-white">
              {timeElapsed.toFixed(1)}s
            </div>
          </div>
        </div>

        {/* Strokes Counter */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 border border-purple-200 dark:border-purple-800">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400">Strokes Used</div>
            <div className="text-2xl font-black font-mono text-slate-900 dark:text-white">
              {strokeCount} <span className="text-xs text-slate-400 font-bold">{strokeCount === 1 ? 'stroke' : 'strokes'}</span>
            </div>
          </div>
        </div>

        {/* Model Live Accuracy */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-200 dark:border-emerald-800">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400">AI Accuracy</div>
            <div className="text-2xl font-black font-mono text-slate-900 dark:text-white">
              {targetConfidence.toFixed(0)}%
            </div>
          </div>
        </div>
      </div>

      {/* Main Drawing & Control Area */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Drawing Artboard (3 cols) */}
        <div className="lg:col-span-3 h-[480px] flex flex-col">
          <DrawingCanvas
            ref={canvasRef}
            onStrokeEnd={handleStrokeEnd}
            showSaveButton={true}
            onClear={handleCanvasCleared}
          />
        </div>

        {/* Right Sidebar: Prediction HUD & Submit Button */}
        <div className="lg:col-span-1 flex flex-col justify-between space-y-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Live AI Insight
            </h3>

            {modelPrediction ? (
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700">
                <div className="text-[11px] text-slate-500 dark:text-slate-400">Top Prediction:</div>
                <div className="text-base font-black text-slate-900 dark:text-white capitalize">
                  {modelPrediction.class_name}
                </div>
                <div className="mt-2 w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, modelPrediction.confidence)}%` }}
                  />
                </div>
                <div className="text-right text-[11px] font-black text-emerald-600 dark:text-emerald-400 mt-1">
                  {modelPrediction.confidence.toFixed(1)}%
                </div>
              </div>
            ) : (
              <div className="p-4 text-center text-xs text-slate-400 italic bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                Draw a stroke on the canvas to start the timer and receive real-time recognition!
              </div>
            )}

            {/* Target Confidence Meter */}
            <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60">
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className="text-amber-800 dark:text-amber-300 capitalize">{currentPrompt?.name} Confidence:</span>
                <span className="font-mono font-black text-amber-900 dark:text-amber-200">{targetConfidence.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-amber-200/60 dark:bg-amber-950 h-2.5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, targetConfidence)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Complete / Submit Challenge Button */}
          <button
            type="button"
            onClick={handleFinishChallenge}
            disabled={!hasStartedDrawing}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-slate-950 font-black text-sm shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2 transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <CheckCircle2 className="w-5 h-5" />
            <span>Lock In & Finish Challenge</span>
          </button>
        </div>
      </div>

      {/* Extreme Challenge Scorecard Modal */}
      {isCompleted && scoreBreakdown && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-6 text-center">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-amber-400 to-orange-500 text-slate-950 flex items-center justify-center mx-auto shadow-lg shadow-amber-500/30">
              <Trophy className="w-8 h-8" />
            </div>

            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-amber-500">
                Challenge Completed!
              </span>
              <h2 className="text-3xl font-black text-slate-900 dark:text-white capitalize mt-1">
                {currentPrompt?.name}
              </h2>
            </div>

            {/* Scorecard Calculation Grid */}
            <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 space-y-2.5 text-xs text-left">
              <div className="flex justify-between items-center py-1 border-b border-slate-200 dark:border-slate-700">
                <span className="text-slate-600 dark:text-slate-300">Base Completion Bonus</span>
                <span className="font-bold font-mono text-emerald-600 dark:text-emerald-400">+{scoreBreakdown.baseBonus} pts</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-200 dark:border-slate-700">
                <span className="text-slate-600 dark:text-slate-300">AI Confidence ({scoreBreakdown.finalConf.toFixed(0)}%)</span>
                <span className="font-bold font-mono text-emerald-600 dark:text-emerald-400">+{scoreBreakdown.confScore} pts</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-200 dark:border-slate-700">
                <span className="text-slate-600 dark:text-slate-300">Stroke Efficiency ({scoreBreakdown.strokes} {scoreBreakdown.strokes === 1 ? 'stroke' : 'strokes'})</span>
                <span className="font-bold font-mono text-purple-600 dark:text-purple-400">+{scoreBreakdown.strokeScore} pts</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-600 dark:text-slate-300">Time Penalty ({scoreBreakdown.seconds}s used)</span>
                <span className="font-bold font-mono text-rose-600 dark:text-rose-400">-{scoreBreakdown.timePenalty} pts</span>
              </div>
            </div>

            {/* Total Grand Score */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-orange-500/15 to-red-500/15 border border-amber-500/30">
              <div className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Total Score</div>
              <div className="text-4xl font-black text-slate-900 dark:text-white font-mono mt-1">
                {scoreBreakdown.totalScore} <span className="text-base text-slate-400 font-bold">pts</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={pickNewPrompt}
                className="flex-1 py-3.5 rounded-2xl bg-slate-900 dark:bg-amber-500 hover:bg-slate-800 dark:hover:bg-amber-600 text-white dark:text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition shadow-md"
              >
                <span>Play Next Challenge</span>
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setView('dashboard')}
                className="py-3.5 px-6 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs sm:text-sm transition"
              >
                Dashboard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
