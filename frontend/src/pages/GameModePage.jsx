import React, { useState, useEffect, useRef } from "react";
import { DrawingCanvas } from "../components/DrawingCanvas";
import { RoundAnalysisModal } from "../components/RoundAnalysisModal";
import { ConfirmModal } from "../components/ConfirmModal";
import { api } from "../services/api";
import { showToast } from "../components/Toast";
import { getBlueprintForClass } from "../data/doodleBlueprints";
import { unlockBadge } from "../utils/badgeManager";
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
  X,
} from "lucide-react";

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

  // Dotted Doodle Hint state
  const [hintActive, setHintActive] = useState(false);
  const [hintUsedInRound, setHintUsedInRound] = useState(false);

  // Completed rounds history
  const [completedRounds, setCompletedRounds] = useState([]);
  const [gameFinished, setGameFinished] = useState(false);
  const [savingGame, setSavingGame] = useState(false);

  // Fetch prompts on mount and start immediately without landing page
  useEffect(() => {
    initGame(true);
  }, []);

  const initGame = async (startImmediately = true) => {
    setLoadingPrompts(true);
    setGameFinished(false);
    setCompletedRounds([]);
    setCurrentRoundIndex(0);
    setAttempts([]);
    setBestRoundScore(0);
    setBestRoundDoodle(null);
    setIsTransitioning(false);
    isTransitioningRef.current = false;
    setGameStarted(true);
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
      showToast("Failed to load prompts: " + err.message, "error");
    } finally {
      setLoadingPrompts(false);
    }
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
    if (
      timeLeft === 0 &&
      timerActive &&
      !isTransitioningRef.current &&
      !gameFinished
    ) {
      handleTimeExpire();
    }
  }, [timeLeft, timerActive, gameFinished]);

  const handleTimeExpire = async () => {
    if (isTransitioningRef.current) return;
    setTimerActive(false);
    showToast(
      `Time expired for Round ${currentRoundIndex + 1}!`,
      "warning",
      2500,
    );
    await finalizeCurrentRound();
  };

  // User submits an attempt for current round
  const handleSubmitAttempt = async () => {
    if (!canvasRef.current || !currentPrompt || isTransitioningRef.current)
      return;
    const base64 = canvasRef.current.getImageBase64();
    if (!base64) {
      showToast("Please sketch something on the canvas first!", "warning");
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
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
        base64,
      };

      setAttempts((prev) => [newAttempt, ...prev]);

      if (conf >= bestRoundScore || bestRoundDoodle === null) {
        setBestRoundScore(conf);
        setBestRoundDoodle(base64);
        showToast(
          `Attempt ${attemptNumber}: ${conf}% Match! New Best! 🎯`,
          "success",
        );
      } else {
        showToast(
          `Attempt ${attemptNumber}: ${conf}% Match (Best: ${bestRoundScore}%)`,
          "info",
        );
      }
    } catch (err) {
      showToast("Failed to analyze doodle: " + err.message, "error");
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

    if (hintUsedInRound) {
      finalScore = Math.max(0, finalScore - 20);
      showToast("Hint penalty applied: -20 points on this round score", "info");
    }

    const roundRecord = {
      round_number: currentRoundIndex + 1,
      prompt: currentPrompt.prompt,
      difficulty: currentPrompt.difficulty,
      score: finalScore,
      doodle_image: finalDoodle,
      hint_used: hintUsedInRound,
    };

    const updatedCompleted = [...completedRounds, roundRecord];
    setCompletedRounds(updatedCompleted);

    const nextIdx = currentRoundIndex + 1;

    // Reset hint for next round
    setHintActive(false);
    setHintUsedInRound(false);

    if (nextIdx < prompts.length) {
      // Advance to next round smoothly
      const nextPrompt = prompts[nextIdx];
      showToast(
        `Round ${currentRoundIndex + 1} completed (${finalScore.toFixed(1)} pts). Starting Round ${nextIdx + 1}: ${nextPrompt.prompt}!`,
        "info",
        3000,
      );

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

  const toggleHint = () => {
    if (!hintActive) {
      setHintActive(true);
      setHintUsedInRound(true);
      showToast(
        "💡 Hint Active: Dotted blueprint outline revealed! (-20 pts round penalty)",
        "info",
        4000,
      );
    } else {
      setHintActive(false);
    }
  };

  const saveCompleteGame = async (roundsList) => {
    setSavingGame(true);
    const totalScore = roundsList.reduce((sum, r) => sum + r.score, 0);
    try {
      await api.saveGame(roundsList, totalScore);
      showToast("Full 4-round game saved to your profile history!", "success");
      unlockBadge("first_solo");
      if (totalScore >= 300) {
        unlockBadge("veteran_artist");
      }
    } catch (err) {
      console.warn("Could not persist match session to database:", err);
    } finally {
      setSavingGame(false);
    }
  };

  const getDifficultyBadge = (diff) => {
    switch (diff) {
      case "easy":
        return (
          <span className="bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-black uppercase px-2.5 py-1 rounded-full">
            Easy • 50s
          </span>
        );
      case "medium":
        return (
          <span className="bg-amber-100 text-amber-800 border border-amber-200 text-xs font-black uppercase px-2.5 py-1 rounded-full">
            Medium • 100s
          </span>
        );
      case "hard":
        return (
          <span className="bg-purple-100 text-purple-800 border border-purple-200 text-xs font-black uppercase px-2.5 py-1 rounded-full">
            Hard • 150s
          </span>
        );
      default:
        return null;
    }
  };

  if (loadingPrompts) {
    return (
      <div
        className="
    rounded-3xl
    border
    border-orange-200
    bg-gradient-to-r
    from-orange-50
    via-yellow-50
    to-orange-100
    dark:border-slate-800
    dark:bg-none
    dark:bg-slate-900
    p-6
    mb-8

    flex
    items-center
    justify-between

    gap-6

    overflow-x-auto
   
                  "
      >
        {/* Pixel Background - Light Mode Only */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none dark:hidden">
          <div className="absolute top-12 left-12 w-3 h-3 bg-white/40 rounded-full"></div>
          <div className="absolute top-32 right-24 w-2 h-2 bg-white/40 rounded-full"></div>
          <div className="absolute bottom-24 left-1/3 w-3 h-3 bg-white/30 rounded-full"></div>
          <div className="absolute bottom-20 right-16 w-2 h-2 bg-white/40 rounded-full"></div>

          <div className="absolute -left-10 top-1/3 text-white/20 text-8xl rotate-12">
            ✏️
          </div>

          <div className="absolute right-0 top-48 text-white/20 text-7xl -rotate-12">
            🎨
          </div>

          <div className="absolute left-1/2 bottom-10 text-white/20 text-6xl">
            ⭐
          </div>
        </div>
        <div className="relative z-10 max-w-7xl mx-auto w-full"></div>

        <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-4 animate-bounce">
          <Sparkles className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-black text-slate-900 dark:text-white">
          Preparing Game Prompts...
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Curating 2 Easy, 1 Medium, and 1 Hard categories from the 345-class
          database.
        </p>
      </div>
    );
  }

  const totalScore = completedRounds.reduce((sum, r) => sum + r.score, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col h-[calc(100vh-5rem)]">
      {/* Page Background - Light Mode Only */}
      <div className="fixed inset-x-0 top-20 bottom-0 z-0 overflow-hidden pointer-events-none dark:hidden bg-gradient-to-br from-orange-100 via-yellow-100 to-orange-200">
        <div className="absolute top-12 left-12 w-3 h-3 bg-white/40 rounded-full"></div>
        <div className="absolute top-32 right-24 w-2 h-2 bg-white/40 rounded-full"></div>
        <div className="absolute bottom-24 left-1/3 w-3 h-3 bg-white/30 rounded-full"></div>
        <div className="absolute bottom-20 right-16 w-2 h-2 bg-white/40 rounded-full"></div>

        <div className="absolute -left-10 top-1/3 text-white/20 text-8xl rotate-12">
          ✏️
        </div>

        <div className="absolute right-0 top-48 text-white/20 text-7xl -rotate-12">
          🎨
        </div>

        <div className="absolute left-1/2 bottom-10 text-white/20 text-6xl">
          ⭐
        </div>
      </div>

      {/* Top Game Navigation & Status Bar */}
      <div
        className="
    relative
    rounded-3xl
    border
    border-orange-200
    bg-gradient-to-r
    from-orange-50
    via-yellow-50
    to-orange-100
    dark:border-slate-800
    dark:bg-none
    dark:bg-slate-900
    p-6
    mb-8

    flex
    items-center
    justify-between

    gap-6

    overflow-x-auto
    whitespace-nowrap
  "
      >
        {/* Back to Dashboard & Prompt Details */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              if (!gameFinished) {
                setShowExitConfirm(true);
              } else {
                setView("dashboard");
              }
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-orange-200
            dark:text-white-700
            dark:text-slate-200
            dark:border-slate-800 bg-orange-100
            hover:bg-orange-200
            dark:hover:bg-slate-700
            dark:bg-slate-1000 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="pixel-font dark:font-sans text-[10px]">
              Dashboard
            </span>
          </button>

          <button
            type="button"
            onClick={() => setShowRulesModal(true)}

            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-orange-200
            dark:text-white-700
            dark:text-slate-200
            dark:border-slate-800 bg-orange-100
            hover:bg-orange-200
            dark:hover:bg-slate-700
            dark:bg-slate-800 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition shadow-sm"

            title="View Rules & Scoring"
          >
            <HelpCircle className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span className="hidden sm:inline  pixel-font dark:font-sans text-[10px]">
              Rules
            </span>
          </button>

          <div
            className="bg-orange-500
            dark:bg-indigo-600 dark:bg-indigo-600 text-white px-3 py-1.5 rounded-xl text-xs font-black"
          >
            Round {currentRoundIndex + 1} / 4
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Draw:
              </span>
              <span
                className="
               pixel-font
               dark:font-sans
               text-2xl
               text-slate-900
               dark:text-white
               "
              >
                "{currentPrompt?.prompt}"
              </span>
              {getDifficultyBadge(currentPrompt?.difficulty)}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {currentPrompt?.hint ||
                "Sketch clearly to maximize model confidence!"}
            </p>
          </div>
        </div>

        {/* Timer, Hint & Next Round Controls */}
        <div className="flex items-center gap-2.5">
          {/* Need a Hint Button */}
          <button
            type="button"
            onClick={toggleHint}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-2xl text-xs font-bold transition border shadow-sm ${
              hintActive
                ? "bg-amber-100 dark:bg-amber-950/60 border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200"
                : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
            }`}
            title="Reveal dotted outline guide (-20 pts penalty)"
          >
            <Lightbulb
              className={`w-4 h-4 ${hintActive ? "text-amber-500 fill-amber-500" : "text-amber-500"}`}
            />
            <span>{hintActive ? "Hide Hint" : "💡 Need a Hint?"}</span>
          </button>

          {/* Animated Countdown Timer */}
          <div
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl border font-black text-sm transition-colors ${
              timeLeft <= 10
                ? "bg-rose-50 dark:bg-rose-950/30 border-rose-300 dark:border-rose-900/40 text-rose-600 dark:text-rose-400 animate-pulse"
                : timeLeft <= 25
                  ? "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/40 text-amber-700 dark:text-amber-400"
                  : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 shadow-sm"
            }`}
          >
            <Clock className="w-4 h-4 " />
            <span className="tabular-nums text-base">
              {timeLeft}s remaining
            </span>
          </div>

          <button
            type="button"
            disabled={isTransitioning || submittingAttempt}
            onClick={() => setShowNextRoundConfirm(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-orange-50
                    dark:bg-slate-800 hover:bg-orange-500 text-orange text-xs font-bold shadow-md transition disabled:opacity-50"
          >
            <span>
              {currentRoundIndex + 1 === 4 ? "Finish Game" : "Next Round"}
            </span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 70/30 Split Layout */}
      <div className="relative flex-1 flex flex-col lg:flex-row gap-5 min-h-0 pb-2">
        {/* 70% Drawing Canvas */}
        <div className="w-full lg:w-[70%] h-full flex flex-col min-h-[420px]">
          <DrawingCanvas
            ref={canvasRef}
            disabled={
              isTransitioning ||
              gameFinished ||
              (timeLeft === 0 && !timerActive)
            }
            showSaveButton={true}
            traceGuide={
              hintActive && currentPrompt
                ? getBlueprintForClass(currentPrompt.prompt)?.paths
                : null
            }
          />
        </div>

        {/* 30% Game Mode Sidebar: Target, Best Score, Submissions */}
        <div className="w-full lg:w-[30%] h-full flex flex-col min-h-[350px] bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          {/* Sidebar Header */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Round Score
              </span>
              <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                Points = Match %
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <div className="text-3xl font-black text-slate-900 dark:text-white">
                {bestRoundScore.toFixed(1)}{" "}
                <span className="text-sm font-semibold text-slate-400">
                  / 100
                </span>
              </div>
              <div className="text-xs font-bold text-slate-500 dark:text-slate-400">
                {attempts.length}{" "}
                {attempts.length === 1 ? "attempt" : "attempts"}
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
              <span>
                {submittingAttempt
                  ? "Evaluating Stroke..."
                  : "Submit Doodle Attempt"}
              </span>
            </button>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 text-center mt-2 leading-tight">
              Draw multiple variations before time runs out! The highest
              confidence score will be saved for this round.
            </p>
          </div>

          {/* Attempts History Log */}
          <div className="flex-1 p-4 overflow-y-auto space-y-2.5">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>Attempts in this Round</span>
              {bestRoundScore > 0 && (
                <span className="text-emerald-600 font-bold normal-case text-[11px] flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Best:{" "}
                  {bestRoundScore.toFixed(1)}%
                </span>
              )}
            </div>

            {attempts.length === 0 ? (
              <div className="py-8 text-center text-slate-400">
                <Target className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                <p className="text-xs">
                  Draw "{currentPrompt?.prompt}" and click Submit above!
                </p>
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
                          ? "border-emerald-300 dark:border-emerald-800 bg-emerald-50/60 dark:bg-emerald-950/30 shadow-sm"
                          : "border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center ${
                            isBest
                              ? "bg-emerald-600 text-white"
                              : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
                          }`}
                        >
                          #{att.attemptNumber}
                        </span>
                        <div>
                          <div className="text-xs font-extrabold text-slate-900 dark:text-white">
                            {att.score.toFixed(1)}% Match
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {att.timestamp}
                          </div>
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
        title={
          currentRoundIndex + 1 === 4
            ? "Finish Single Player Match?"
            : `Advance to Round ${currentRoundIndex + 2}?`
        }
        message={
          attempts.length > 0
            ? `Your current highest score (${bestRoundScore.toFixed(1)}%) will be submitted for Round ${currentRoundIndex + 1}. Once you proceed, you cannot return to this round.`
            : `You haven't submitted an attempt yet! If you continue, your current drawing on canvas will be evaluated automatically.`
        }
        confirmText={
          currentRoundIndex + 1 === 4 ? "Finish Match" : "Yes, Next Round"
        }
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
        title="Leave to Dashboard?"
        message="Do you want to leave the 4-Round Challenge? Your progress in this game session will be lost."
        confirmText="Leave"
        cancelText="Stay & Play"
        variant="danger"
        onConfirm={() => {
          setShowExitConfirm(false);
          setView("dashboard");
        }}
        onCancel={() => setShowExitConfirm(false)}
      />

      {/* Game Complete Modal with Doodle Download and 4-Round Analysis */}
      <RoundAnalysisModal
        isOpen={gameFinished}
        rounds={completedRounds}
        totalScore={totalScore}
        onPlayAgain={() => initGame(true)}
        onBackToDashboard={() => setView("dashboard")}
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
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    Solo Challenge Rules
                  </h3>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Quick Reference
                  </span>
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
                <div className="font-bold text-slate-900 dark:text-white">
                  4 Progressive Rounds:
                </div>
                <div className="mt-0.5">
                  Rounds 1 & 2: Easy (50s) • Round 3: Medium (100s) • Round 4:
                  Hard (150s).
                </div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60">
                <div className="font-bold text-slate-900 dark:text-white">
                  Scoring System:
                </div>
                <div className="mt-0.5">
                  Round Score = Match % (0 - 100). Cumulative maximum match
                  score: 400 pts.
                </div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60">
                <div className="font-bold text-slate-900 dark:text-white">
                  Multiple Submissions:
                </div>
                <div className="mt-0.5">
                  Submit as many times as you like before time expires. Your
                  highest score is always saved.
                </div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60">
                <div className="font-bold text-slate-900 dark:text-white">
                  Timeout:
                </div>
                <div className="mt-0.5">
                  If the clock runs out, your best attempt is automatically
                  locked in and submitted.
                </div>
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
 