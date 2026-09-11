import React, { useState, useEffect, useRef } from 'react';
import { DrawingCanvas } from '../components/DrawingCanvas';
import { ConfirmModal } from '../components/ConfirmModal';
import { api } from '../services/api';
import { showToast } from '../components/Toast';
import {
  ArrowLeft,
  Send,
  HelpCircle,
  Lightbulb,
  Clock,
  Target,
  Trophy,
  Sparkles,
  Flame,
  RotateCcw,
  Flag,
  CheckCircle2,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

export function ContextoSoloPage({ setView }) {
  const canvasRef = useRef(null);

  // Game state
  const [sessionId, setSessionId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [categoryHint, setCategoryHint] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const [totalWords, setTotalWords] = useState(214);

  // Timer state
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [timerActive, setTimerActive] = useState(false);

  // Guesses history
  const [guesses, setGuesses] = useState([]);
  const [bestRank, setBestRank] = useState(999);
  const [won, setWon] = useState(false);
  const [secretWord, setSecretWord] = useState(null);

  // Hints
  const [hintLevel, setHintLevel] = useState(0);
  const [hints, setHints] = useState([]);
  const [loadingHint, setLoadingHint] = useState(false);

  // Modals
  const [showGiveUpConfirm, setShowGiveUpConfirm] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [gaveUp, setGaveUp] = useState(false);

  // Start new solo Contexto game
  const startNewGame = async () => {
    setLoading(true);
    setGuesses([]);
    setBestRank(999);
    setWon(false);
    setGaveUp(false);
    setSecretWord(null);
    setHintLevel(0);
    setHints([]);
    setSecondsElapsed(0);
    setTimerActive(false);

    if (canvasRef.current) {
      canvasRef.current.clearCanvas();
    }

    try {
      const res = await api.getContextoTarget();
      setSessionId(res.session_id);
      setCategoryHint(res.category_hint);
      setDifficulty(res.difficulty);
      setTotalWords(res.total_words || 214);
      setTimerActive(true);
      showToast('New mystery word chosen! Start drawing your guesses!', 'info');
    } catch (err) {
      showToast('Failed to start game: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    startNewGame();
  }, []);

  // Timer ticker
  useEffect(() => {
    let interval = null;
    if (timerActive && !won && !gaveUp) {
      interval = setInterval(() => {
        setSecondsElapsed((s) => s + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerActive, won, gaveUp]);

  // Format seconds as MM:SS
  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Submit Doodle Guess
  const handleGuess = async () => {
    if (!canvasRef.current || !sessionId || won || gaveUp) return;
    const base64 = canvasRef.current.getImageBase64();
    if (!base64) {
      showToast('Please sketch something on the canvas first!', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.submitContextoGuess(sessionId, base64);
      const newGuess = {
        guessNumber: res.guess_count,
        word: res.guessed_word,
        rank: res.rank,
        similarity: res.similarity,
        proximity: res.proximity,
        color: res.color,
        isMatch: res.is_match,
        thumbnail: base64,
        confidence: res.confidence,
      };

      setGuesses((prev) => [newGuess, ...prev]);

      if (res.rank < bestRank) {
        setBestRank(res.rank);
      }

      if (res.is_match) {
        setWon(true);
        setTimerActive(false);
        setSecretWord(res.secret_word);
        showToast(`🎉 BINGO! You guessed the secret word "${res.secret_word}"!`, 'success', 5000);
      } else {
        if (res.proximity === 'hot') {
          showToast(`Rank #${res.rank}: "${res.guessed_word}" is extremely close! 🔥`, 'success');
        } else if (res.proximity === 'warm') {
          showToast(`Rank #${res.rank}: "${res.guessed_word}" is warm! ⚡`, 'info');
        } else {
          showToast(`Rank #${res.rank}: "${res.guessed_word}" (Cold)`, 'info');
        }
      }

      // Clear canvas for next guess
      if (canvasRef.current && !res.is_match) {
        canvasRef.current.clearCanvas();
      }
    } catch (err) {
      showToast('Error evaluating doodle: ' + err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Request progressive hint
  const handleGetHint = async () => {
    if (!sessionId || hintLevel >= 3 || won || gaveUp) return;
    const nextLevel = hintLevel + 1;
    setLoadingHint(true);
    try {
      const res = await api.getContextoHint(sessionId, nextLevel);
      setHints((prev) => [...prev, res.hint]);
      setHintLevel(nextLevel);
      showToast(`Hint ${nextLevel}: ${res.hint}`, 'info', 4000);
    } catch (err) {
      showToast('Failed to get hint: ' + err.message, 'error');
    } finally {
      setLoadingHint(false);
    }
  };

  // Give up
  const handleConfirmGiveUp = async () => {
    setShowGiveUpConfirm(false);
    try {
      const res = await api.giveUpContexto(sessionId);
      setGaveUp(true);
      setTimerActive(false);
      setSecretWord(res.secret_word);
      showToast(`The secret word was "${res.secret_word}"!`, 'info', 5000);
    } catch (err) {
      showToast('Error: ' + err.message, 'error');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col h-[calc(100vh-5rem)]">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between pb-4 gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              if (guesses.length > 0 && !won && !gaveUp) {
                setShowLeaveConfirm(true);
              } else {
                setView('dashboard');
              }
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Dashboard</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-doodle">
              Contexto Word Guess
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              Solo Mode
            </span>
          </div>
        </div>

        {/* Status Pills */}
        <div className="flex items-center gap-2.5">
          {/* Timer */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-xs sm:text-sm font-black text-slate-800 dark:text-slate-200 shadow-sm">
            <Clock className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>{formatTime(secondsElapsed)}</span>
          </div>

          {/* Guesses Count */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-black text-slate-800 dark:text-slate-200 shadow-sm">
            <Target className="w-3.5 h-3.5 text-amber-500" />
            <span>{guesses.length} Guesses</span>
          </div>

          {/* New Game Button */}
          <button
            type="button"
            onClick={startNewGame}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition shadow-sm"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>New Word</span>
          </button>
        </div>
      </div>

      {/* 70/30 Split Layout */}
      <div className="flex-1 flex flex-col lg:flex-row gap-5 min-h-0 pb-2">
        {/* 70% Drawing Canvas */}
        <div className="w-full lg:w-[70%] h-full flex flex-col min-h-[420px] relative">
          <DrawingCanvas
            ref={canvasRef}
            disabled={won || gaveUp || loading}
            showSaveButton={true}
            lockedMessage={won ? 'Word Solved! 🎉' : gaveUp ? 'Word Revealed' : 'Canvas Locked'}
          />

          {/* Bottom Submit Guess Banner */}
          <div className="mt-3 p-3 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                Draw anything you think the mystery word is, then click Submit!
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={submitting || won || gaveUp || loading}
                onClick={handleGuess}
                className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs sm:text-sm shadow-md shadow-indigo-200 dark:shadow-none flex items-center gap-2 transition disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>{submitting ? 'Analyzing Doodle...' : 'Guess This Doodle!'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* 30% Contexto Guess Feed & Proximity Sidebar */}
        <div className="w-full lg:w-[30%] h-full flex flex-col min-h-[350px] bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
          {/* Mystery Word Header Card */}
          <div className="p-4 bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Mystery Word
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                {categoryHint || 'Everyday Object'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="text-2xl font-black font-doodle text-slate-900 dark:text-white">
                {won || gaveUp ? `"${secretWord}"` : '???'}
              </div>

              {bestRank < 999 && (
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block font-bold uppercase">Best Rank</span>
                  <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                    #{bestRank} / {totalWords}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Hint Actions Bar */}
          <div className="p-3 border-b border-slate-100 dark:border-slate-800 bg-amber-50/40 dark:bg-amber-950/20 flex items-center justify-between gap-2">
            <button
              type="button"
              disabled={hintLevel >= 3 || won || gaveUp || loadingHint}
              onClick={handleGetHint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-amber-300 dark:border-amber-800 bg-white dark:bg-slate-800 hover:bg-amber-100 dark:hover:bg-amber-900/40 text-amber-800 dark:text-amber-300 text-xs font-bold transition shadow-sm disabled:opacity-40"
            >
              <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
              <span>{loadingHint ? 'Loading...' : `Hint (${hintLevel}/3)`}</span>
            </button>

            <button
              type="button"
              disabled={won || gaveUp}
              onClick={() => setShowGiveUpConfirm(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-slate-600 hover:text-rose-600 dark:text-slate-300 dark:hover:text-rose-400 text-xs font-bold transition shadow-sm disabled:opacity-40"
            >
              <Flag className="w-3.5 h-3.5" />
              <span>Give Up</span>
            </button>
          </div>

          {/* Unlocked Hints Display */}
          {hints.length > 0 && (
            <div className="p-3 bg-amber-50/60 dark:bg-amber-950/30 border-b border-amber-200 dark:border-amber-900/40 space-y-1">
              {hints.map((h, idx) => (
                <div key={idx} className="text-xs font-bold text-amber-900 dark:text-amber-200 flex items-start gap-1.5">
                  <span className="text-amber-500 font-extrabold">•</span>
                  <span>{h}</span>
                </div>
              ))}
            </div>
          )}

          {/* Temperature Legend */}
          <div className="px-4 py-2 bg-slate-50 dark:bg-slate-900/40 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] font-bold text-slate-500">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500" /> 1–20 Close
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-500" /> 21–60 Warm
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-rose-500" /> 61+ Far
            </span>
          </div>

          {/* Guesses List */}
          <div className="flex-1 p-3 overflow-y-auto space-y-2">
            {guesses.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
                <Target className="w-8 h-8 mb-2 opacity-40 text-indigo-500" />
                <span className="text-xs font-bold">No guesses yet!</span>
                <p className="text-[11px] text-slate-400 mt-1 max-w-[200px]">
                  Draw any object you suspect. The model will recognize it and tell you how close you are!
                </p>
              </div>
            ) : (
              guesses.map((g, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-2xl border transition flex items-center justify-between gap-3 ${
                    g.isMatch
                      ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 shadow-md ring-2 ring-emerald-400'
                      : g.proximity === 'hot'
                      ? 'border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/40 dark:bg-emerald-950/20'
                      : g.proximity === 'warm'
                      ? 'border-amber-200 dark:border-amber-900/40 bg-amber-50/40 dark:bg-amber-950/20'
                      : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {/* Doodle Thumbnail */}
                    {g.thumbnail && (
                      <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                        <img src={g.thumbnail} alt={g.word} className="w-full h-full object-contain" />
                      </div>
                    )}

                    <div className="min-w-0">
                      <div className="text-sm font-black text-slate-900 dark:text-white capitalize truncate flex items-center gap-1.5">
                        <span>{g.word}</span>
                        {g.isMatch && <span className="text-xs text-emerald-600 font-extrabold">✓ Match!</span>}
                      </div>

                      {/* Progress Similarity Bar */}
                      <div className="w-28 bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 mt-1 overflow-hidden">
                        <div
                          className="h-1.5 rounded-full transition-all duration-300"
                          style={{
                            width: `${Math.min(100, Math.max(5, g.similarity))}%`,
                            backgroundColor: g.color,
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Rank Badge */}
                  <div className="text-right shrink-0">
                    <span
                      className="inline-block px-2.5 py-1 rounded-xl text-xs font-black text-white"
                      style={{ backgroundColor: g.color }}
                    >
                      #{g.rank}
                    </span>
                    <span className="text-[10px] text-slate-400 block font-bold mt-0.5">
                      {g.similarity}% sim
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Victory Celebration Modal */}
      {won && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full text-center shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-3xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-4 border border-emerald-200 dark:border-emerald-800 shadow-md">
              <Trophy className="w-8 h-8" />
            </div>

            <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-doodle">
              Mystery Word Solved!
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              You uncovered the secret word <strong className="text-emerald-600 dark:text-emerald-400 capitalize font-black">"{secretWord}"</strong>!
            </p>

            <div className="grid grid-cols-2 gap-3 my-5">
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Time Taken</span>
                <span className="text-xl font-black text-slate-900 dark:text-white font-mono">{formatTime(secondsElapsed)}</span>
              </div>
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Guesses</span>
                <span className="text-xl font-black text-indigo-600 dark:text-indigo-400">{guesses.length}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setView('dashboard')}
                className="flex-1 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs sm:text-sm transition"
              >
                Dashboard
              </button>
              <button
                type="button"
                onClick={startNewGame}
                className="flex-1 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs sm:text-sm shadow-md transition flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>Next Word</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Give Up Modal */}
      <ConfirmModal
        isOpen={showGiveUpConfirm}
        title="Reveal Secret Word?"
        message="Are you sure you want to give up? The mystery word will be revealed and this round will end."
        confirmText="Yes, Give Up"
        cancelText="Keep Guessing"
        variant="warning"
        onConfirm={handleConfirmGiveUp}
        onCancel={() => setShowGiveUpConfirm(false)}
      />

      {/* Confirm Leave Modal */}
      <ConfirmModal
        isOpen={showLeaveConfirm}
        title="Leave Contexto Mode?"
        message="Your active guessing progress will be lost if you return to the dashboard."
        confirmText="Leave Game"
        cancelText="Stay Here"
        variant="danger"
        onConfirm={() => {
          setShowLeaveConfirm(false);
          setView('dashboard');
        }}
        onCancel={() => setShowLeaveConfirm(false)}
      />
    </div>
  );
}
