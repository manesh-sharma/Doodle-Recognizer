import React, { useState, useEffect, useRef } from 'react';
import { DrawingCanvas } from '../components/DrawingCanvas';
import { RoundAnalysisModal } from '../components/RoundAnalysisModal';
import { ConfirmModal } from '../components/ConfirmModal';
import { api } from '../services/api';
import { showToast } from '../components/Toast';
import {
  Clock,
  Send,
  Sparkles,
  Trophy,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Target,
  ArrowLeft,
  Play,
  HelpCircle,
  Layers,
  Palette,
  RotateCcw,
  Lightbulb,
  X
} from 'lucide-react';

export function GameModePage({ setView }) {
  const canvasRef = useRef(null);

  // Game state
  const [prompts, setPrompts] = useState([]);
  const [currentRoundIndex, setCurrentRoundIndex] = useState(0);
  const [loadingPrompts, setLoadingPrompts] = useState(true);
  
  // Intro & Rules screen state
  const [gameStarted, setGameStarted] = useState(false);
  const [showRulesModal, setShowRulesModal] = useState(false);

  // Timer state
  const [timeLeft, setTimeLeft] = useState(50);
  const [timerActive, setTimerActive] = useState(false);
  const isTransitioningRef = useRef(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Confirmation popups
  const [showNextRoundConfirm, setShowNextRoundConfirm] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  // Current Round Scoring state
  const [attempts, setAttempts] = useState([]);
  const [bestRoundScore, setBestRoundScore] = useState(0);
  const [bestRoundDoodle, setBestRoundDoodle] = useState(null);
  const [submittingAttempt, setSubmittingAttempt] = useState(false);

  // Completed rounds history
  const [completedRounds, setCompletedRounds] = useState([]);
  const [gameFinished, setGameFinished] = useState(false);
  const [savingGame, setSavingGame] = useState(false);

  // Fetch prompts on mount
  useEffect(() => {
    initGame(false);
  }, []);

  const initGame = async (startImmediately = false) => {
    setLoadingPrompts(true);
    setGameFinished(false);
    setCompletedRounds([]);
    setCurrentRoundIndex(0);
    setAttempts([]);
    setBestRoundScore(0);
    setBestRoundDoodle(null);
    setIsTransitioning(false);
    isTransitioningRef.current = false;
    setGameStarted(startImmediately);
    setTimerActive(startImmediately);

    try {
      const data = await api.getPrompts();
      setPrompts(data);
      if (data.length > 0) {
        setTimeLeft(data[0].time_limit);
        if (startImmediately) {
          setTimerActive(true);
        }
      }
    } catch (err) {
      showToast('Failed to load prompts: ' + err.message, 'error');
    } finally {
      setLoadingPrompts(false);
    }
  };

  const handleStartGame = () => {
    if (prompts.length === 0) {
      initGame(true);
      return;
    }
    setTimeLeft(prompts[0].time_limit);
    setGameStarted(true);
    setTimerActive(true);
  };

  const currentPrompt = prompts[currentRoundIndex] || null;

  // Robust Countdown Timer
  useEffect(() => {
    if (!timerActive || isTransitioning || gameFinished) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timerActive, isTransitioning, gameFinished, currentRoundIndex]);

  // Effect to handle time expiration safely outside updater
  useEffect(() => {
    if (timeLeft === 0 && timerActive && !isTransitioningRef.current && !gameFinished) {
      handleTimeExpire();
    }
  }, [timeLeft, timerActive, gameFinished]);

  const handleTimeExpire = async () => {
    if (isTransitioningRef.current) return;
    setTimerActive(false);
    showToast(`Time expired for Round ${currentRoundIndex + 1}!`, 'warning', 2500);
    await finalizeCurrentRound();
  };

  // User submits an attempt for current round
  const handleSubmitAttempt = async () => {
    if (!canvasRef.current || !currentPrompt || isTransitioningRef.current) return;
    const base64 = canvasRef.current.getImageBase64();
    if (!base64) {
      showToast('Please sketch something on the canvas first!', 'warning');
      return;
    }

    setSubmittingAttempt(true);
    try {
      const res = await api.predict(base64, currentPrompt.prompt);
      const conf = res.target_confidence || 0.0;
      const attemptNumber = attempts.length + 1;

      const newAttempt = {
        attemptNumber,
        score: conf,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        base64,
      };

      setAttempts((prev) => [newAttempt, ...prev]);

      if (conf >= bestRoundScore || bestRoundDoodle === null) {
        setBestRoundScore(conf);
        setBestRoundDoodle(base64);
        showToast(`Attempt ${attemptNumber}: ${conf}% Match! New Best! 🎯`, 'success');
      } else {
        showToast(`Attempt ${attemptNumber}: ${conf}% Match (Best: ${bestRoundScore}%)`, 'info');
      }
    } catch (err) {
      showToast('Failed to analyze doodle: ' + err.message, 'error');
    } finally {
      setSubmittingAttempt(false);
    }
  };

  // Finalize current round and advance or finish game
  const finalizeCurrentRound = async () => {
    if (isTransitioningRef.current || !currentPrompt) return;
    isTransitioningRef.current = true;
    setIsTransitioning(true);
    setTimerActive(false);

    let finalScore = bestRoundScore;
    let finalDoodle = bestRoundDoodle;

    // If user hasn't manually submitted, evaluate the current canvas drawing
    if (attempts.length === 0 && canvasRef.current) {
      const base64 = canvasRef.current.getImageBase64();
      try {
        const res = await api.predict(base64, currentPrompt.prompt);
        finalScore = res.target_confidence || 0.0;
        finalDoodle = base64;
      } catch (e) {
        finalScore = 0.0;
        finalDoodle = base64;
      }
    }

    const roundRecord = {
      round_number: currentRoundIndex + 1,
      prompt: currentPrompt.prompt,
      difficulty: currentPrompt.difficulty,
      score: finalScore,
      doodle_image: finalDoodle,
    };

    const updatedCompleted = [...completedRounds, roundRecord];
    setCompletedRounds(updatedCompleted);

    const nextIdx = currentRoundIndex + 1;

    if (nextIdx < prompts.length) {
      // Advance to next round smoothly
      const nextPrompt = prompts[nextIdx];
      showToast(`Round ${currentRoundIndex + 1} completed (${finalScore.toFixed(1)} pts). Starting Round ${nextIdx + 1}: ${nextPrompt.prompt}!`, 'info', 3000);

      // Reset round state
      setCurrentRoundIndex(nextIdx);
      setAttempts([]);
      setBestRoundScore(0);
      setBestRoundDoodle(null);
      setTimeLeft(nextPrompt.time_limit);

      if (canvasRef.current) {
        canvasRef.current.clearCanvas();
      }

      // Resume timer after state settles
      setTimeout(() => {
        isTransitioningRef.current = false;
        setIsTransitioning(false);
        setTimerActive(true);
      }, 400);
    } else {
      // Game Over: All 4 rounds complete!
      setGameFinished(true);
      isTransitioningRef.current = false;
      setIsTransitioning(false);
      await saveCompleteGame(updatedCompleted);
    }
  };

  const saveCompleteGame = async (roundsList) => {
    setSavingGame(true);
    const totalScore = roundsList.reduce((sum, r) => sum + r.score, 0);
    try {
      await api.saveGame(roundsList, totalScore);
      showToast('Game session saved to your history!', 'success');
    } catch (err) {
      console.error('Error saving game session:', err);
    } finally {
      setSavingGame(false);
    }
  };

  const getDifficultyBadge = (diff) => {
    switch (diff) {
      case 'easy':
        return <span className="bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-black uppercase px-2.5 py-1 rounded-full">Easy • 50s</span>;
      case 'medium':
        return <span className="bg-amber-100 text-amber-800 border border-amber-200 text-xs font-black uppercase px-2.5 py-1 rounded-full">Medium • 100s</span>;
      case 'hard':
        return <span className="bg-purple-100 text-purple-800 border border-purple-200 text-xs font-black uppercase px-2.5 py-1 rounded-full">Hard • 150s</span>;
      default:
        return null;
    }
  };

  if (!gameStarted) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col min-h-[calc(100vh-5rem)] animate-in fade-in duration-300">
        {/* Top Nav Bar */}
        <div className="flex items-center justify-between pb-4">
          <button
            type="button"
            onClick={() => setView('dashboard')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </button>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-900/60 text-indigo-700 dark:text-indigo-300 text-xs font-black">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>Single Player Mode</span>
          </div>
        </div>

        {/* Hero Section */}
        <div className="text-center py-4 sm:py-6 max-w-2xl mx-auto">
          <div className="inline-flex p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 mb-3 border border-indigo-200/80 dark:border-indigo-800/60 shadow-sm">
            <Trophy className="w-8 h-8 text-amber-500" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight font-doodle">
            Solo Challenge: Rules & How to Play
          </h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
            Test your sketching speed and accuracy against our real-time QuickDraw AI recognizer across 4 progressive rounds.
          </p>
        </div>

        {/* Quick Highlights Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 mb-6">
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/60 text-center">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Rounds</div>
            <div className="text-lg font-black text-slate-900 dark:text-white mt-0.5">4 Rounds</div>
            <div className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold">2 Easy • 1 Med • 1 Hard</div>
          </div>
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/60 text-center">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Timers</div>
            <div className="text-lg font-black text-slate-900 dark:text-white mt-0.5">50s - 150s</div>
            <div className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold">Tiered by difficulty</div>
          </div>
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/60 text-center">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Scoring</div>
            <div className="text-lg font-black text-slate-900 dark:text-white mt-0.5">400 Max Pts</div>
            <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">Points = Match %</div>
          </div>
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/60 text-center">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Attempts</div>
            <div className="text-lg font-black text-slate-900 dark:text-white mt-0.5">Unlimited</div>
            <div className="text-[11px] text-purple-600 dark:text-purple-400 font-semibold">Best score preserved</div>
          </div>
        </div>

        {/* 6 Rules Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {/* Card 1 */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 shadow-sm flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-3">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">4 Progressive Rounds</h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                You will face 4 distinct sketch prompts: <strong className="text-slate-900 dark:text-white">Rounds 1 & 2</strong> are Easy, <strong className="text-slate-900 dark:text-white">Round 3</strong> is Medium, and <strong className="text-slate-900 dark:text-white">Round 4</strong> is Hard.
              </p>
            </div>
            <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-700/60 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">
              Gradually increasing difficulty
            </div>
          </div>

          {/* Card 2 */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 shadow-sm flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-3">
                <Clock className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">Tiered Countdown Timers</h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                You have <strong className="text-slate-900 dark:text-white">50 seconds</strong> for Easy, <strong className="text-slate-900 dark:text-white">100 seconds</strong> for Medium, and <strong className="text-slate-900 dark:text-white">150 seconds</strong> for Hard. If time runs out, your best doodle is auto-submitted!
              </p>
            </div>
            <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-700/60 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
              No penalty if clock expires
            </div>
          </div>

          {/* Card 3 */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 shadow-sm flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3">
                <RotateCcw className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">Unlimited Submissions</h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Click <strong className="text-slate-900 dark:text-white">Submit Doodle Attempt</strong> whenever you add strokes or refine details. The game automatically preserves your highest score for that round.
              </p>
            </div>
            <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-700/60 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
              Highest score is never lost
            </div>
          </div>

          {/* Card 4 */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 shadow-sm flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-3">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">Real-time AI Match</h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Our CNN model evaluates your drawing in real time against trained categories. Your round score equals the match percentage (0 to 100 points, max 400 total).
              </p>
            </div>
            <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-700/60 text-[11px] font-semibold text-purple-600 dark:text-purple-400">
              Saved to your History & Stats
            </div>
          </div>

          {/* Card 5 */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 shadow-sm flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-sky-100 dark:bg-sky-900/40 text-sky-600 dark:text-sky-400 flex items-center justify-center mb-3">
                <Palette className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">Drawing Tools</h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Access Brush and Eraser, adjust between 3 stroke sizes, use Undo & Redo, or Clear the canvas to restart anytime. Download your art upon match completion!
              </p>
            </div>
            <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-700/60 text-[11px] font-semibold text-sky-600 dark:text-sky-400">
              Intuitive creative controls
            </div>
          </div>

          {/* Card 6 */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 shadow-sm flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-3">
                <Lightbulb className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">Tips for Success</h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Keep doodles centered. Start with the main outline shape, then add key defining features (e.g. wheels, wings, handles) for high AI confidence.
              </p>
            </div>
            <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-700/60 text-[11px] font-semibold text-rose-600 dark:text-rose-400">
              Clear silhouettes score best
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="mt-auto pt-2 pb-6 flex flex-col sm:flex-row items-center justify-center gap-3.5">
          <button
            type="button"
            onClick={() => setView('dashboard')}
            className="w-full sm:w-auto px-6 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-bold transition shadow-sm text-center"
          >
            Return to Dashboard
          </button>

          <button
            type="button"
            disabled={loadingPrompts}
            onClick={handleStartGame}
            className="w-full sm:w-auto px-8 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white font-extrabold text-sm sm:text-base flex items-center justify-center gap-2.5 shadow-lg shadow-indigo-600/25 border border-indigo-500 dark:border-white/30 transition transform active:scale-95 disabled:opacity-50"
          >
            {loadingPrompts ? (
              <span>Preparing Match Prompts...</span>
            ) : (
              <>
                <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
                <span>Start Solo Challenge</span>
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  if (loadingPrompts) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-4 animate-bounce">
          <Sparkles className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-black text-slate-900 dark:text-white">Preparing Game Prompts...</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Curating 2 Easy, 1 Medium, and 1 Hard categories from the 345-class database.</p>
      </div>
    );
  }

  const totalScore = completedRounds.reduce((sum, r) => sum + r.score, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col h-[calc(100vh-5rem)]">
      {/* Top Game Navigation & Status Bar */}
      <div className="flex flex-wrap items-center justify-between pb-4 gap-3">
        {/* Back to Dashboard & Prompt Details */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              if (!gameFinished && currentRoundIndex < prompts.length - 1) {
                setShowExitConfirm(true);
              } else {
                setView('dashboard');
              }
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Dashboard</span>
          </button>

          <button
            type="button"
            onClick={() => setShowRulesModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition shadow-sm"
            title="View Rules & Scoring"
          >
            <HelpCircle className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span className="hidden sm:inline">Rules</span>
          </button>

          <div className="bg-slate-900 dark:bg-indigo-600 text-white px-3 py-1.5 rounded-xl text-xs font-black">
            Round {currentRoundIndex + 1} / 4
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Draw:</span>
              <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white capitalize font-doodle">
                "{currentPrompt?.prompt}"
              </span>
              {getDifficultyBadge(currentPrompt?.difficulty)}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {currentPrompt?.hint || 'Sketch clearly to maximize model confidence!'}
            </p>
          </div>
        </div>

        {/* Timer & Next Round Control */}
        <div className="flex items-center gap-3">
          {/* Animated Countdown Timer */}
          <div
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl border font-black text-sm transition-colors ${
              timeLeft <= 10
                ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-300 dark:border-rose-900/40 text-rose-600 dark:text-rose-400 animate-pulse'
                : timeLeft <= 25
                ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/40 text-amber-700 dark:text-amber-400'
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 shadow-sm'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span className="tabular-nums text-base">{timeLeft}s remaining</span>
          </div>

          <button
            type="button"
            disabled={isTransitioning || submittingAttempt}
            onClick={() => setShowNextRoundConfirm(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md transition disabled:opacity-50"
          >
            <span>{currentRoundIndex + 1 === 4 ? 'Finish Game' : 'Next Round'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 70/30 Split Layout */}
      <div className="flex-1 flex flex-col lg:flex-row gap-5 min-h-0 pb-2">
        {/* 70% Drawing Canvas */}
        <div className="w-full lg:w-[70%] h-full flex flex-col min-h-[420px]">
          <DrawingCanvas
            ref={canvasRef}
            disabled={isTransitioning || gameFinished || (timeLeft === 0 && !timerActive)}
            showSaveButton={true}
          />
        </div>

        {/* 30% Game Mode Sidebar: Target, Best Score, Submissions */}
        <div className="w-full lg:w-[30%] h-full flex flex-col min-h-[350px] bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          {/* Sidebar Header */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Round Score</span>
              <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">Points = Match %</span>
            </div>
            <div className="flex items-baseline justify-between">
              <div className="text-3xl font-black text-slate-900 dark:text-white">
                {bestRoundScore.toFixed(1)} <span className="text-sm font-semibold text-slate-400">/ 100</span>
              </div>
              <div className="text-xs font-bold text-slate-500 dark:text-slate-400">
                {attempts.length} {attempts.length === 1 ? 'attempt' : 'attempts'}
              </div>
            </div>

            {/* Score progress bar */}
            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5 mt-2 overflow-hidden">
              <div
                className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${Math.min(100, bestRoundScore)}%` }}
              />
            </div>
          </div>

          {/* Submit Action Box */}
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-indigo-50/40 dark:bg-indigo-950/20">
            <button
              type="button"
              disabled={submittingAttempt || isTransitioning || gameFinished}
              onClick={handleSubmitAttempt}
              className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-800/90 dark:hover:bg-slate-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md border border-slate-900 dark:border-white/50 hover:dark:border-white/80 transition disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>{submittingAttempt ? 'Evaluating Stroke...' : 'Submit Doodle Attempt'}</span>
            </button>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 text-center mt-2 leading-tight">
              Draw multiple variations before time runs out! The highest confidence score will be saved for this round.
            </p>
          </div>

          {/* Attempts History Log */}
          <div className="flex-1 p-4 overflow-y-auto space-y-2.5">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>Attempts in this Round</span>
              {bestRoundScore > 0 && (
                <span className="text-emerald-600 font-bold normal-case text-[11px] flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Best: {bestRoundScore.toFixed(1)}%
                </span>
              )}
            </div>

            {attempts.length === 0 ? (
              <div className="py-8 text-center text-slate-400">
                <Target className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                <p className="text-xs">Draw "{currentPrompt?.prompt}" and click Submit above!</p>
              </div>
            ) : (
              <div className="space-y-2">
                {attempts.map((att) => {
                  const isBest = att.score === bestRoundScore;
                  return (
                    <div
                      key={att.attemptNumber}
                      className={`p-2.5 rounded-xl border flex items-center justify-between transition ${
                        isBest
                          ? 'border-emerald-300 dark:border-emerald-800 bg-emerald-50/60 dark:bg-emerald-950/30 shadow-sm'
                          : 'border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center ${
                            isBest
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          #{att.attemptNumber}
                        </span>
                        <div>
                          <div className="text-xs font-extrabold text-slate-900 dark:text-white">
                            {att.score.toFixed(1)}% Match
                          </div>
                          <div className="text-[10px] text-slate-400">{att.timestamp}</div>
                        </div>
                      </div>

                      {isBest && (
                        <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/50 px-2 py-0.5 rounded-full">
                          Best Score
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Sidebar Footer */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>Cumulative Score:</span>
            <span className="font-extrabold text-indigo-700 dark:text-indigo-400 text-sm">
              {(totalScore + bestRoundScore).toFixed(1)} pts
            </span>
          </div>
        </div>
      </div>

      {/* Confirm Next Round Modal */}
      <ConfirmModal
        isOpen={showNextRoundConfirm}
        title={currentRoundIndex + 1 === 4 ? 'Finish Single Player Match?' : `Advance to Round ${currentRoundIndex + 2}?`}
        message={
          attempts.length > 0
            ? `Your current highest score (${bestRoundScore.toFixed(1)}%) will be submitted for Round ${currentRoundIndex + 1}. Once you proceed, you cannot return to this round.`
            : `You haven't submitted an attempt yet! If you continue, your current drawing on canvas will be evaluated automatically.`
        }
        confirmText={currentRoundIndex + 1 === 4 ? 'Finish Match' : 'Yes, Next Round'}
        cancelText="Keep Drawing"
        variant="info"
        onConfirm={() => {
          setShowNextRoundConfirm(false);
          finalizeCurrentRound();
        }}
        onCancel={() => setShowNextRoundConfirm(false)}
      />

      {/* Confirm Exit Modal */}
      <ConfirmModal
        isOpen={showExitConfirm}
        title="Leave Current Match?"
        message="Are you sure you want to return to the dashboard? Your progress in this game session will be lost."
        confirmText="Leave Match"
        cancelText="Stay & Play"
        variant="danger"
        onConfirm={() => {
          setShowExitConfirm(false);
          setView('dashboard');
        }}
        onCancel={() => setShowExitConfirm(false)}
      />

      {/* Game Complete Modal with Doodle Download and 4-Round Analysis */}
      <RoundAnalysisModal
        isOpen={gameFinished}
        rounds={completedRounds}
        totalScore={totalScore}
        onPlayAgain={() => initGame(true)}
        onBackToDashboard={() => setView('dashboard')}
      />

      {/* In-Game Rules Modal */}
      {showRulesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-lg w-full p-6 overflow-hidden">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">Solo Challenge Rules</h3>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">Quick Reference</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowRulesModal(false)}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-4 space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60">
                <div className="font-bold text-slate-900 dark:text-white">4 Progressive Rounds:</div>
                <div className="mt-0.5">Rounds 1 & 2: Easy (50s) • Round 3: Medium (100s) • Round 4: Hard (150s).</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60">
                <div className="font-bold text-slate-900 dark:text-white">Scoring System:</div>
                <div className="mt-0.5">Round Score = Match % (0 - 100). Cumulative maximum match score: 400 pts.</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60">
                <div className="font-bold text-slate-900 dark:text-white">Multiple Submissions:</div>
                <div className="mt-0.5">Submit as many times as you like before time expires. Your highest score is always saved.</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60">
                <div className="font-bold text-slate-900 dark:text-white">Timeout:</div>
                <div className="mt-0.5">If the clock runs out, your best attempt is automatically locked in and submitted.</div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setShowRulesModal(false)}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition"
              >
                Resume Match
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
