import React, { useState, useEffect, useRef } from 'react';
import { DrawingCanvas } from '../components/DrawingCanvas';
import { api } from '../services/api';
import { showToast } from '../components/Toast';
import { unlockBadge } from '../utils/badgeManager';
import { getAllLearningLessons } from '../data/doodleBlueprints';
import {
  GraduationCap,
  Sparkles,
  ArrowLeft,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Trophy,
  Star,
  Search,
  BookOpen,
  Layers,
  RotateCcw,
  Target,
  Lightbulb
} from 'lucide-react';

export function LearningModePage({ setView }) {
  const canvasRef = useRef(null);
  const lessons = getAllLearningLessons();

  // Selected level state (1-indexed, level 1 to 197)
  const [currentLevelIndex, setCurrentLevelIndex] = useState(0);
  const [isLevelDrawerOpen, setIsLevelDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDiff, setFilterDiff] = useState('all'); // 'all' | 'easy' | 'medium' | 'hard'

  // Model inference state
  const [targetConfidence, setTargetConfidence] = useState(0);
  const [modelPrediction, setModelPrediction] = useState(null);
  const [isEvaluating, setIsEvaluating] = useState(false);

  // Completed lessons storage
  const [progress, setProgress] = useState(() => {
    try {
      const saved = localStorage.getItem('doodle_learning_progress');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Level completion modal
  const [isCompletedModalOpen, setIsCompletedModalOpen] = useState(false);
  const [completionStats, setCompletionStats] = useState(null);

  const currentLesson = lessons[currentLevelIndex] || lessons[0];

  // Reset state when switching levels
  useEffect(() => {
    setTargetConfidence(0);
    setModelPrediction(null);
    setIsCompletedModalOpen(false);
    if (canvasRef.current) {
      canvasRef.current.clearCanvas();
    }
  }, [currentLevelIndex]);

  const handleStrokeEnd = async (base64) => {
    if (!base64 || !currentLesson) return;
    setIsEvaluating(true);

    try {
      const res = await api.predictDoodle(base64, currentLesson.className);
      if (res && res.predictions) {
        setModelPrediction(res.predictions[0] || null);
        const conf = res.target_confidence || 0;
        setTargetConfidence(conf);
      }
    } catch (err) {
      console.error('Learning mode prediction error:', err);
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleVerifyOrComplete = async () => {
    // If target confidence is already >= 50, claim/complete immediately
    if (targetConfidence >= 50) {
      if (targetConfidence >= 90) unlockBadge('perfectionist');
      handleLevelCompleted(targetConfidence);
      return;
    }

    // Actively evaluate current canvas drawing
    if (canvasRef.current) {
      const base64 = canvasRef.current.getImageBase64();
      const strokeCount = canvasRef.current.getStrokeCount ? canvasRef.current.getStrokeCount() : 0;
      if (!base64 || strokeCount === 0) {
        showToast('Please trace along the dotted outline first!', 'info');
        return;
      }

      setIsEvaluating(true);
      try {
        const res = await api.predictDoodle(base64, currentLesson.className);
        if (res && res.predictions) {
          setModelPrediction(res.predictions[0] || null);
          const conf = res.target_confidence || 0;
          setTargetConfidence(conf);

          if (conf >= 50) {
            if (conf >= 90) unlockBadge('perfectionist');
            handleLevelCompleted(conf);
          } else {
            showToast(`Accuracy reached ${conf.toFixed(1)}%. Keep tracing the dotted guide to reach at least 50%!`, 'warning', 3500);
          }
        }
      } catch (err) {
        console.error('Learning mode verify error:', err);
        showToast('Error verifying doodle. Please check connection.', 'error');
      } finally {
        setIsEvaluating(false);
      }
    } else {
      showToast('Please trace along the dotted outline first!', 'info');
    }
  };

  const handleLevelCompleted = (conf) => {
    const stars = conf >= 92 ? 3 : conf >= 85 ? 2 : 1;
    const updated = {
      ...progress,
      [currentLesson.level]: {
        confidence: conf,
        stars,
        completedAt: new Date().toISOString()
      }
    };
    setProgress(updated);
    localStorage.setItem('doodle_learning_progress', JSON.stringify(updated));

    setCompletionStats({
      level: currentLesson.level,
      name: currentLesson.displayName,
      confidence: conf,
      stars
    });
    setIsCompletedModalOpen(true);

    // Check Badges
    const completedCount = Object.keys(updated).length;
    if (completedCount >= 3) unlockBadge('learning_starter');
    if (completedCount >= 20) unlockBadge('learning_scholar');
    if (completedCount >= lessons.length) unlockBadge('learning_master');
  };

  const advanceNextLesson = () => {
    setIsCompletedModalOpen(false);
    if (currentLevelIndex < lessons.length - 1) {
      setCurrentLevelIndex((prev) => prev + 1);
    } else {
      showToast('🎉 Congratulations! You have completed all 197 lessons!', 'success', 4000);
      unlockBadge('learning_master');
    }
  };

  // Filter lessons for drawer
  const filteredLessons = lessons.filter((l) => {
    const matchesSearch = l.displayName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDiff = filterDiff === 'all' || l.difficulty === filterDiff;
    return matchesSearch && matchesDiff;
  });

  const completedCount = Object.keys(progress).length;

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 rounded-3xl p-6 text-white shadow-xl">
        <div>
          <button
            onClick={() => setView('dashboard')}
            className="inline-flex items-center gap-2 text-xs font-bold text-teal-100 hover:text-white bg-black/20 hover:bg-black/30 px-3 py-1.5 rounded-xl mb-3 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
          </button>
          <h1 className="text-2xl sm:text-3xl font-black font-doodle flex items-center gap-2.5">
            <GraduationCap className="w-8 h-8 text-amber-300" />
            <span>Doodle Academy — Learning Mode</span>
          </h1>
          <p className="text-teal-100 text-xs sm:text-sm mt-1 max-w-xl">
            Learn to draw every object step-by-step! Trace the guided dotted outlines and hit 90%+ confidence with the AI model.
          </p>
        </div>

        {/* Level Map Opener & Progress Pill */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsLevelDrawerOpen(true)}
            className="px-4 py-3 bg-white/15 hover:bg-white/25 backdrop-blur-md rounded-2xl border border-white/20 text-white font-bold text-xs flex items-center gap-2 transition"
          >
            <BookOpen className="w-4 h-4 text-amber-300" />
            <span>All Lessons ({completedCount}/{lessons.length})</span>
          </button>
        </div>
      </div>

      {/* Lesson Navigation Bar */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-xs font-black px-3 py-1 rounded-xl bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300">
            Level {currentLesson.level} of {lessons.length}
          </span>
          <h2 className="text-xl font-black text-slate-900 dark:text-white capitalize">
            {currentLesson.displayName}
          </h2>
          <span
            className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-lg uppercase ${
              currentLesson.difficulty === 'easy'
                ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                : currentLesson.difficulty === 'medium'
                ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                : 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
            }`}
          >
            {currentLesson.difficulty}
          </span>
          {progress[currentLesson.level] && (
            <span className="flex items-center gap-1 text-xs font-bold text-amber-500 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-lg border border-amber-200 dark:border-amber-800">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>Completed ({progress[currentLesson.level].confidence.toFixed(0)}%)</span>
            </span>
          )}
        </div>

        {/* Prev / Next Level Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={currentLevelIndex <= 0}
            onClick={() => setCurrentLevelIndex((prev) => Math.max(0, prev - 1))}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 dark:text-slate-200 transition"
            title="Previous Lesson"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            disabled={currentLevelIndex >= lessons.length - 1}
            onClick={() => setCurrentLevelIndex((prev) => Math.min(lessons.length - 1, prev + 1))}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 dark:text-slate-200 transition"
            title="Next Lesson"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Learning Canvas Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Drawing Artboard with Dotted Blueprint Guide (3 cols) */}
        <div className="lg:col-span-3 h-[500px] flex flex-col">
          <DrawingCanvas
            ref={canvasRef}
            onStrokeEnd={handleStrokeEnd}
            onClear={() => {
              setTargetConfidence(0);
              setModelPrediction(null);
            }}
            showSaveButton={true}
            traceGuide={currentLesson.paths}
          />
        </div>

        {/* Right Sidebar: Tips, Goal & AI Feedback */}
        <div className="lg:col-span-1 flex flex-col justify-between space-y-4">
          {/* Target Goal & Tips Box */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" /> Target Accuracy
              </h3>
              <span className="text-xs font-black text-teal-600 dark:text-teal-400">Goal: 90%+</span>
            </div>

            {/* AI Accuracy Meter */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700">
              <div className="flex justify-between text-xs font-bold mb-1.5">
                <span className="text-slate-600 dark:text-slate-300">Your Accuracy:</span>
                <span className="font-mono font-black text-slate-900 dark:text-white">
                  {targetConfidence.toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 h-3 rounded-full overflow-hidden relative">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    targetConfidence >= 90 ? 'bg-emerald-500' : targetConfidence >= 50 ? 'bg-teal-500' : 'bg-indigo-600'
                  }`}
                  style={{ width: `${Math.min(100, targetConfidence)}%` }}
                />
                {/* 90% Goal Line Indicator */}
                <div className="absolute top-0 bottom-0 left-[90%] w-0.5 bg-white/80 dark:bg-slate-300 pointer-events-none" />
              </div>
              <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 flex flex-col gap-1">
                <span>
                  {targetConfidence >= 90
                    ? '🎉 Fantastic! 90%+ reached! Click Submit Drawing when ready.'
                    : targetConfidence >= 50
                    ? '✓ Passing accuracy! Click Submit Drawing when ready.'
                    : 'Trace along the dashed outline, then click Submit Drawing.'}
                </span>
                {modelPrediction && (
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    AI Top Guess: <strong className="text-teal-600 dark:text-teal-400">{modelPrediction.class_name}</strong> ({modelPrediction.confidence.toFixed(1)}%)
                  </span>
                )}
              </div>
            </div>

            {/* Step-by-Step Drawing Tips */}
            <div className="p-3.5 rounded-2xl bg-teal-50 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800/60 text-xs">
              <div className="font-black text-teal-900 dark:text-teal-200 flex items-center gap-1.5 mb-1.5">
                <Lightbulb className="w-3.5 h-3.5 text-amber-500" /> Drawing Guide
              </div>
              <p className="text-teal-800 dark:text-teal-300 leading-relaxed">
                {currentLesson.tips}
              </p>
            </div>
          </div>

          {/* Action / Submit Drawing Button */}
          <button
            type="button"
            onClick={handleVerifyOrComplete}
            disabled={isEvaluating}
            className={`w-full py-4 rounded-2xl font-black text-sm shadow-lg flex items-center justify-center gap-2 transition cursor-pointer active:scale-[0.98] ${
              targetConfidence >= 90
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/25'
                : targetConfidence >= 50
                ? 'bg-teal-600 hover:bg-teal-700 text-white shadow-teal-500/25'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/25'
            }`}
          >
            {isEvaluating ? (
              <>
                <RotateCcw className="w-5 h-5 animate-spin" />
                <span>Evaluating Doodle...</span>
              </>
            ) : targetConfidence >= 90 ? (
              <>
                <CheckCircle2 className="w-5 h-5" />
                <span>Submit Drawing ({targetConfidence.toFixed(0)}%)</span>
              </>
            ) : targetConfidence >= 50 ? (
              <>
                <CheckCircle2 className="w-5 h-5" />
                <span>Submit Drawing ({targetConfidence.toFixed(0)}%)</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" />
                <span>Submit Drawing</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Level Selection Drawer / Modal */}
      {isLevelDrawerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                  <span>Choose Lesson ({lessons.length} Total)</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Ordered progressively from Easy to Hard. Completed: {completedCount}/{lessons.length}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsLevelDrawerOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            {/* Search & Filter Bar */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search doodle (e.g. apple, bicycle)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="flex items-center gap-1">
                {['all', 'easy', 'medium', 'hard'].map((df) => (
                  <button
                    key={df}
                    type="button"
                    onClick={() => setFilterDiff(df)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase transition ${
                      filterDiff === df
                        ? 'bg-teal-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    {df}
                  </button>
                ))}
              </div>
            </div>

            {/* Lessons Grid */}
            <div className="flex-1 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 gap-2.5 pr-1">
              {filteredLessons.map((les) => {
                const isCurrent = les.level === currentLesson.level;
                const isDone = !!progress[les.level];
                return (
                  <button
                    key={les.level}
                    type="button"
                    onClick={() => {
                      setCurrentLevelIndex(les.level - 1);
                      setIsLevelDrawerOpen(false);
                    }}
                    className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition ${
                      isCurrent
                        ? 'border-teal-600 bg-teal-50/70 dark:bg-teal-950/40 ring-2 ring-teal-500/20'
                        : isDone
                        ? 'border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/30 dark:bg-emerald-950/20 hover:border-emerald-300'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold mb-1">
                      <span>Lvl {les.level}</span>
                      <span className="capitalize">{les.difficulty}</span>
                    </div>
                    <div className="text-xs font-black text-slate-900 dark:text-white capitalize truncate">
                      {les.displayName}
                    </div>
                    <div className="mt-2 flex items-center justify-between text-[10px]">
                      {isDone ? (
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> {progress[les.level].confidence.toFixed(0)}%
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">Not drawn</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Level Completed Celebration Modal */}
      {isCompletedModalOpen && completionStats && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-6 text-center">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-emerald-400 to-teal-600 text-white flex items-center justify-center mx-auto shadow-lg shadow-teal-500/30">
              <Trophy className="w-8 h-8" />
            </div>

            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                Lesson Completed!
              </span>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white capitalize mt-1">
                Level {completionStats.level}: {completionStats.name}
              </h2>
            </div>

            {/* Stars Rating */}
            <div className="flex justify-center gap-2 text-amber-400">
              {[1, 2, 3].map((s) => (
                <Star
                  key={s}
                  className={`w-8 h-8 ${s <= completionStats.stars ? 'fill-amber-400' : 'text-slate-300 dark:text-slate-700'}`}
                />
              ))}
            </div>

            {/* Confidence Score Pill */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Model Confidence
              </div>
              <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">
                {completionStats.confidence.toFixed(1)}%
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={advanceNextLesson}
                className="flex-1 py-3.5 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition shadow-md"
              >
                <span>Next Lesson</span>
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setIsCompletedModalOpen(false)}
                className="py-3.5 px-5 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs sm:text-sm transition"
              >
                Practice Again
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
