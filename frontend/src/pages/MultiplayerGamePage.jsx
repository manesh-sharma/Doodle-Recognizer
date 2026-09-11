import React, { useState, useEffect, useRef } from 'react';
import { DrawingCanvas } from '../components/DrawingCanvas';
import { MultiplayerLeaderboardModal } from '../components/MultiplayerLeaderboardModal';
import { ConfirmModal } from '../components/ConfirmModal';
import { api } from '../services/api';
import { showToast } from '../components/Toast';
import {
  Clock,
  Send,
  Trophy,
  CheckCircle2,
  Users,
  Target,
  ArrowLeft,
  Sparkles,
  Crown,
  Eye,
  Vote,
  AlertTriangle,
  HelpCircle,
  Flame,
  Zap,
  Check
} from 'lucide-react';

export function MultiplayerGamePage({
  setView,
  roomState,
  currentUserId,
  onSubmitAttempt,
  onFinishRound,
  onSubmitImposterStroke,
  onSubmitImposterVote,
  onSubmitContextoGuess,
  onPlayAgain,
  onLeaveRoom,
}) {
  const canvasRef = useRef(null);

  // Local state
  const [submitting, setSubmitting] = useState(false);
  const [myRoundAttempts, setMyRoundAttempts] = useState([]);
  const [myBestScore, setMyBestScore] = useState(0);
  const [myBestDoodle, setMyBestDoodle] = useState(null);
  const [localTimeLeft, setLocalTimeLeft] = useState(50);
  const [turnTimeLeft, setTurnTimeLeft] = useState(25);
  const [contextoGuesses, setContextoGuesses] = useState([]);

  // Confirmation popups
  const [showDoneConfirm, setShowDoneConfirm] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);

  // Current room data
  const gameMode = roomState?.game_mode || 'classic';
  const currentRound = roomState?.current_round || 1;
  const totalRounds = roomState?.total_rounds || 4;
  const currentPrompt = roomState?.current_prompt;
  const players = roomState?.players || [];
  const me = players.find((p) => p.user_id === currentUserId);
  const isHost = roomState?.host_id === currentUserId;
  const status = roomState?.status;

  // Imposter state
  const isMyImposterTurn = gameMode === 'imposter' && roomState?.active_turn_player_id === currentUserId;
  const isImposter = me?.is_imposter || currentPrompt?.is_imposter || currentPrompt?.role === 'imposter';
  const topPrediction = roomState?.top_prediction;
  const targetConfidence = roomState?.target_confidence || 0.0;
  const roundResult = roomState?.round_result;

  // Calculate clock skew between local machine and server
  const clockSkewRef = useRef(0);

  useEffect(() => {
    if (roomState?.server_time) {
      clockSkewRef.current = (Date.now() / 1000) - roomState.server_time;
    }
  }, [roomState?.server_time]);

  // Synchronized epoch countdown for rounds
  useEffect(() => {
    if (!roomState?.round_end_timestamp && !roomState?.voting_end_timestamp) return;

    const targetEnd = status === 'imposter_voting'
      ? roomState.voting_end_timestamp
      : roomState.round_end_timestamp;

    if (!targetEnd) return;

    const updateTimer = () => {
      const nowServerTime = (Date.now() / 1000) - clockSkewRef.current;
      const remaining = Math.max(0, Math.ceil(targetEnd - nowServerTime));
      setLocalTimeLeft(remaining);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 250);
    return () => clearInterval(interval);
  }, [status, roomState?.round_end_timestamp, roomState?.voting_end_timestamp]);

  // Turn timer for Imposter drawing
  useEffect(() => {
    if (status !== 'imposter_drawing' || !roomState?.turn_end_timestamp) return;

    const updateTurnTimer = () => {
      const nowServerTime = (Date.now() / 1000) - clockSkewRef.current;
      const remaining = Math.max(0, Math.ceil(roomState.turn_end_timestamp - nowServerTime));
      setTurnTimeLeft(remaining);
    };

    updateTurnTimer();
    const interval = setInterval(updateTurnTimer, 250);
    return () => clearInterval(interval);
  }, [status, roomState?.turn_end_timestamp]);

  // Sync composite canvas in Imposter mode when someone else draws
  useEffect(() => {
    if (gameMode === 'imposter' && roomState?.composite_canvas && canvasRef.current) {
      // If it's NOT my turn or just loaded, sync the drawing
      if (!isMyImposterTurn) {
        canvasRef.current.loadImageBase64(roomState.composite_canvas);
      }
    }
  }, [gameMode, roomState?.composite_canvas, isMyImposterTurn]);

  // Reset round state when round changes
  useEffect(() => {
    setMyRoundAttempts([]);
    setMyBestScore(0);
    setMyBestDoodle(null);
    setContextoGuesses([]);
    if (canvasRef.current) {
      canvasRef.current.clearCanvas();
    }
  }, [currentRound, gameMode]);

  // Handle user clicking submit attempt in Classic mode
  const handleSubmitAttempt = async () => {
    if (!canvasRef.current || !currentPrompt || status !== 'in_round') return;
    const base64 = canvasRef.current.getImageBase64();
    if (!base64) {
      showToast('Please sketch something on the canvas first!', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.predict(base64, currentPrompt.prompt);
      const conf = res.target_confidence || 0.0;
      const attemptNumber = myRoundAttempts.length + 1;

      const newAttempt = {
        attemptNumber,
        score: conf,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        base64,
      };

      setMyRoundAttempts((prev) => [newAttempt, ...prev]);

      if (conf >= myBestScore || myBestDoodle === null) {
        setMyBestScore(conf);
        setMyBestDoodle(base64);
        showToast(`Attempt ${attemptNumber}: ${conf}% Match! New Best! 🎯`, 'success');
        onSubmitAttempt(conf, base64);
      } else {
        showToast(`Attempt ${attemptNumber}: ${conf}% Match (Best: ${myBestScore}%)`, 'info');
      }
    } catch (err) {
      showToast('Failed to analyze doodle: ' + err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFinishRound = () => {
    if (myBestScore === 0 && canvasRef.current && currentPrompt) {
      handleSubmitAttempt();
    }
    onFinishRound();
    showToast("You're ready! Waiting for all players to finish...", 'info');
  };

  // Imposter stroke submit handler
  const handleSingleStrokeComplete = (compositeBase64) => {
    if (gameMode !== 'imposter' || !isMyImposterTurn || status !== 'imposter_drawing') return;
    if (onSubmitImposterStroke) {
      onSubmitImposterStroke(compositeBase64);
      showToast('Stroke submitted! Next player is up.', 'success', 2000);
    }
  };

  // Manual Done Stroke button for imposter
  const handleManualStrokeDone = () => {
    if (!canvasRef.current || !isMyImposterTurn) return;
    const base64 = canvasRef.current.getImageBase64();
    handleSingleStrokeComplete(base64);
  };

  // Cast vote in Imposter mode
  const handleCastVote = (suspectId) => {
    if (status !== 'imposter_voting' || me?.has_voted) return;
    if (onSubmitImposterVote) {
      onSubmitImposterVote(suspectId);
      showToast('Vote cast! Waiting for results...', 'info');
    }
  };

  // Contexto multiplayer guess submit
  const handleContextoGuess = async () => {
    if (!canvasRef.current || status !== 'contexto_race') return;
    const base64 = canvasRef.current.getImageBase64();
    if (!base64) {
      showToast('Please sketch something on the canvas first!', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      if (onSubmitContextoGuess) {
        onSubmitContextoGuess(base64);
      }
      showToast('Guess submitted! Checking proximity...', 'info', 1500);
      if (canvasRef.current) {
        canvasRef.current.clearCanvas();
      }
    } catch (err) {
      showToast('Failed: ' + err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Sort players by total score
  const rankedPlayers = [...players].sort((a, b) => {
    const totalA = a.total_score + a.current_round_score;
    const totalB = b.total_score + b.current_round_score;
    return totalB - totalA;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col h-[calc(100vh-5rem)]">
      {/* Top Status Bar */}
      <div className="flex flex-wrap items-center justify-between pb-4 gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowLeaveConfirm(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Leave</span>
          </button>

          {/* Mode & Round Pill */}
          <div className="flex items-center gap-1.5">
            <span className="bg-indigo-600 text-white px-3 py-1.5 rounded-xl text-xs font-black">
              Round {currentRound} / {totalRounds}
            </span>
            <span className="px-2.5 py-1 rounded-xl text-[11px] font-black uppercase tracking-wider bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              {gameMode === 'imposter' ? 'Finding Imposter' : gameMode === 'contexto' ? 'Contexto Race' : 'Classic Match'}
            </span>
          </div>

          {/* Role / Target Display */}
          <div>
            {gameMode === 'classic' && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Draw Target:</span>
                <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white capitalize font-doodle">
                  "{currentPrompt?.prompt}"
                </span>
              </div>
            )}

            {gameMode === 'imposter' && (
              <div className="flex items-center gap-2">
                {isImposter ? (
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                    <Eye className="w-4 h-4" />
                    <span className="text-sm font-black">YOU ARE THE IMPOSTER! 🤫 Blend in!</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-500 uppercase">Secret Word:</span>
                    <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white capitalize font-doodle">
                      "{currentPrompt?.prompt}"
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800">
                      Innocent
                    </span>
                  </div>
                )}
              </div>
            )}

            {gameMode === 'contexto' && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500 uppercase">Mystery Word:</span>
                <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-doodle">
                  {status === 'contexto_summary' ? `"${roomState?.contexto_winner?.secret_word}"` : '???'}
                </span>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  (First to Rank #1 wins!)
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Timers & Action Buttons */}
        <div className="flex items-center gap-3">
          {/* Main Round / Voting Timer */}
          <div
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl border font-black text-sm transition-colors ${
              localTimeLeft <= 10
                ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-300 dark:border-rose-900/40 text-rose-600 dark:text-rose-400 animate-pulse'
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 shadow-sm'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span className="tabular-nums text-base">{localTimeLeft}s</span>
          </div>

          {/* Classic Mode Finish Button */}
          {gameMode === 'classic' && (
            <button
              type="button"
              disabled={me?.is_finished_round || status !== 'in_round'}
              onClick={() => setShowDoneConfirm(true)}
              className={`px-4 py-2 rounded-2xl text-xs font-bold transition shadow-sm ${
                me?.is_finished_round
                  ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                  : 'bg-slate-900 hover:bg-slate-800 dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white'
              }`}
            >
              {me?.is_finished_round ? '✓ Finished & Ready' : "I'm Done"}
            </button>
          )}

          {/* Imposter Mode Finish Stroke Button */}
          {gameMode === 'imposter' && status === 'imposter_drawing' && isMyImposterTurn && (
            <button
              type="button"
              onClick={handleManualStrokeDone}
              className="px-4 py-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md transition flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Done My Stroke</span>
            </button>
          )}
        </div>
      </div>

      {/* Imposter Mode Turn Banner */}
      {gameMode === 'imposter' && status === 'imposter_drawing' && (
        <div
          className={`mb-3 p-3 rounded-2xl border flex flex-wrap items-center justify-between gap-2 shadow-sm transition ${
            isMyImposterTurn
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 ring-2 ring-emerald-400'
              : 'bg-slate-100 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
          }`}
        >
          <div className="flex items-center gap-2">
            <span
              className={`w-3 h-3 rounded-full ${
                isMyImposterTurn ? 'bg-emerald-500 animate-ping' : 'bg-amber-400'
              }`}
            />
            <span className="text-xs sm:text-sm font-black">
              {isMyImposterTurn
                ? `🎨 IT'S YOUR TURN! Draw 1 stroke on the shared canvas (${turnTimeLeft}s)`
                : `⏳ Waiting for ${roomState?.active_turn_username || 'Player'} to draw 1 stroke (${turnTimeLeft}s)`}
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs font-bold">
            <span>Stroke Round {roomState?.current_stroke_round || 1} / {roomState?.max_stroke_rounds || 2}</span>
            <span>•</span>
            <span>Total Strokes: {roomState?.turn_count || 0}</span>
          </div>
        </div>
      )}

      {/* 70/30 Split Layout */}
      <div className="flex-1 flex flex-col lg:flex-row gap-5 min-h-0 pb-2">
        {/* 70% Canvas */}
        <div className="w-full lg:w-[70%] h-full flex flex-col min-h-[420px] relative">
          <DrawingCanvas
            ref={canvasRef}
            disabled={
              gameMode === 'classic'
                ? me?.is_finished_round || status !== 'in_round'
                : gameMode === 'imposter'
                ? !isMyImposterTurn || status !== 'imposter_drawing'
                : status !== 'contexto_race'
            }
            singleStrokeMode={gameMode === 'imposter'}
            onSingleStrokeComplete={handleSingleStrokeComplete}
            showSaveButton={true}
            lockedMessage={
              gameMode === 'imposter'
                ? isMyImposterTurn
                  ? 'Your Turn'
                  : `Waiting for ${roomState?.active_turn_username || 'Player'}'s stroke...`
                : 'Canvas Locked'
            }
          />

          {/* Imposter Mode AI Meter Below Canvas */}
          {gameMode === 'imposter' && status === 'imposter_drawing' && (
            <div className="mt-2.5 p-3.5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-wrap items-center justify-between gap-3">
              <div>
                <span className="text-[10px] uppercase font-black tracking-wider text-slate-400 block">
                  AI Real-Time Recognition
                </span>
                <span className="text-sm font-black text-slate-900 dark:text-white capitalize">
                  Top Guess: <strong className="text-indigo-600 dark:text-indigo-400">{topPrediction?.class_name || 'Analyzing sketch...'}</strong> ({topPrediction?.confidence || 0}%)
                </span>
              </div>

              {/* Accuracy towards 75% threshold */}
              <div className="w-full sm:w-60">
                <div className="flex items-center justify-between text-[11px] font-extrabold mb-1">
                  <span className="text-slate-500">Target Accuracy (Auto-Vote at 75%):</span>
                  <span className={targetConfidence >= 75 ? 'text-emerald-600' : 'text-indigo-600'}>
                    {targetConfidence.toFixed(1)}% / 75%
                  </span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${
                      targetConfidence >= 75 ? 'bg-emerald-500' : 'bg-indigo-600'
                    }`}
                    style={{ width: `${Math.min(100, (targetConfidence / 75) * 100)}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Contexto Mode Submit Button */}
          {gameMode === 'contexto' && status === 'contexto_race' && (
            <div className="mt-2.5 p-3 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">
                Draw your guess, then submit! Model will tell you how close you are.
              </span>
              <button
                type="button"
                disabled={submitting}
                onClick={handleContextoGuess}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs sm:text-sm shadow-md transition flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                <span>{submitting ? 'Analyzing...' : 'Submit Doodle Guess'}</span>
              </button>
            </div>
          )}
        </div>

        {/* 30% Multiplayer Sidebar */}
        <div className="w-full lg:w-[30%] h-full flex flex-col min-h-[350px] bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
          {/* Top Score Card for Classic Mode */}
          {gameMode === 'classic' && (
            <>
              <div className="p-4 bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">My Round Score</span>
                  <span className="text-xs font-extrabold text-indigo-600">
                    {myBestScore.toFixed(1)} / 100 pts
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-indigo-600 h-2 rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${Math.min(100, myBestScore)}%` }}
                  />
                </div>
              </div>

              <div className="p-3.5 border-b border-slate-100 dark:border-slate-800 bg-indigo-50/40 dark:bg-indigo-950/20">
                <button
                  type="button"
                  disabled={submitting || me?.is_finished_round || status !== 'in_round'}
                  onClick={handleSubmitAttempt}
                  className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-800/90 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition disabled:opacity-40"
                >
                  <Send className="w-4 h-4" />
                  <span>{submitting ? 'Analyzing...' : 'Submit Doodle Attempt'}</span>
                </button>
              </div>
            </>
          )}

          {/* Imposter Mode Header in Sidebar */}
          {gameMode === 'imposter' && (
            <div className="p-4 bg-purple-50/50 dark:bg-purple-950/30 border-b border-purple-100 dark:border-purple-900/40">
              <div className="flex items-center gap-2 text-purple-900 dark:text-purple-200 text-xs font-black uppercase">
                <Eye className="w-4 h-4 text-purple-600" />
                <span>Imposter Investigation</span>
              </div>
              <p className="text-[11px] text-purple-700 dark:text-purple-300 mt-1">
                Watch each stroke carefully. The player who doesn't know the word might hesitate or draw out of place!
              </p>
            </div>
          )}

          {/* Live In-Game Leaderboard / Players List */}
          <div className="flex-1 p-4 overflow-y-auto space-y-2">
            <div className="flex items-center justify-between text-xs font-black uppercase tracking-wider text-slate-400 mb-2">
              <span className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-indigo-600" />
                <span>Teammates</span>
              </span>
              <span>Points</span>
            </div>

            <div className="space-y-2">
              {rankedPlayers.map((player, index) => {
                const isMe = player.user_id === currentUserId;
                const isCurrentTurn = gameMode === 'imposter' && roomState?.active_turn_player_id === player.user_id;

                return (
                  <div
                    key={player.user_id}
                    className={`p-2.5 rounded-xl border transition flex items-center justify-between ${
                      isCurrentTurn
                        ? 'border-emerald-400 bg-emerald-50/60 dark:bg-emerald-950/40 shadow-sm ring-1 ring-emerald-400'
                        : isMe
                        ? 'border-indigo-300 dark:border-indigo-700 bg-indigo-50/60 dark:bg-indigo-950/40'
                        : 'border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-5 h-5 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-extrabold flex items-center justify-center shrink-0">
                        {index + 1}
                      </span>
                      <div className="min-w-0">
                        <div className="text-xs font-black text-slate-900 dark:text-white truncate flex items-center gap-1">
                          <span>{player.username}</span>
                          {isMe && <span className="text-[9px] text-indigo-600 font-bold">(You)</span>}
                        </div>
                        <div className="text-[10px] text-slate-500 flex items-center gap-1">
                          {gameMode === 'classic' && (
                            <span>Round: {player.current_round_score.toFixed(1)}%</span>
                          )}
                          {gameMode === 'imposter' && (
                            <span>{player.strokes_drawn} strokes drawn</span>
                          )}
                          {isCurrentTurn && (
                            <span className="text-emerald-600 font-bold">• Drawing</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs font-black text-indigo-700 dark:text-indigo-300">
                        {player.total_score.toFixed(0)} pts
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Sidebar Footer */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-700 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Code: <strong className="font-mono text-slate-800 dark:text-slate-200">{roomState?.code}</strong></span>
            <span>{players.length} Players</span>
          </div>
        </div>
      </div>

      {/* ================= MODALS & OVERLAYS ================= */}

      {/* Imposter Voting Modal Overlay */}
      {status === 'imposter_voting' && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full text-center shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="w-14 h-14 rounded-2xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center mx-auto mb-3 shadow">
              <Vote className="w-7 h-7" />
            </div>

            <h3 className="text-2xl font-black text-slate-900 dark:text-white font-doodle">
              Vote Out the Imposter! 🕵️
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Who didn't know the word? Cast your secret vote before time expires ({localTimeLeft}s)!
            </p>

            {/* Voting Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-5">
              {players.map((p) => {
                const isMe = p.user_id === currentUserId;
                const isSelected = me?.vote_target === p.user_id;

                return (
                  <button
                    key={p.user_id}
                    type="button"
                    disabled={isMe || me?.has_voted}
                    onClick={() => handleCastVote(p.user_id)}
                    className={`p-3.5 rounded-2xl border text-left flex items-center justify-between transition ${
                      isMe
                        ? 'opacity-50 cursor-not-allowed border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900'
                        : isSelected
                        ? 'border-purple-600 bg-purple-50 dark:bg-purple-950/60 ring-2 ring-purple-600'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-purple-400 hover:shadow'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-xs">
                        {p.username.slice(0, 2).toUpperCase()}
                      </div>
                      <span className="text-xs font-black text-slate-900 dark:text-white truncate">
                        {p.username} {isMe && '(You)'}
                      </span>
                    </div>

                    {!isMe && (
                      <span className={`text-[11px] font-black px-2 py-1 rounded-xl ${
                        isSelected ? 'bg-purple-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                      }`}>
                        {isSelected ? '✓ Voted' : 'Vote'}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {me?.has_voted && (
              <div className="text-xs font-bold text-purple-600 dark:text-purple-400 animate-pulse">
                Vote cast! Waiting for remaining players to submit votes...
              </div>
            )}
          </div>
        </div>
      )}

      {/* Imposter Round Reveal Overlay */}
      {status === 'imposter_reveal' && roundResult && (
        <div className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full text-center shadow-2xl animate-in zoom-in-95 duration-200">
            <div className={`w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-lg ${
              roundResult.outcome === 'innocents_win'
                ? 'bg-emerald-100 text-emerald-600'
                : 'bg-purple-100 text-purple-600'
            }`}>
              {roundResult.outcome === 'innocents_win' ? (
                <Trophy className="w-8 h-8" />
              ) : (
                <Eye className="w-8 h-8" />
              )}
            </div>

            <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-doodle">
              {roundResult.outcome === 'innocents_win'
                ? 'Innocents Win! Imposter Caught!'
                : 'Imposter Wins! Fooled Everyone!'}
            </h3>

            <div className="my-5 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-bold">Secret Target Word:</span>
                <span className="font-black text-slate-900 dark:text-white capitalize">
                  "{roundResult.secret_word}"
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-bold">The Real Imposter:</span>
                <span className="font-black text-purple-600 dark:text-purple-400">
                  {roundResult.imposter_username}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-bold">Voted Out by Team:</span>
                <span className="font-black text-slate-900 dark:text-white">
                  {roundResult.accused_username}
                </span>
              </div>
            </div>

            <span className="text-xs font-bold text-amber-600 dark:text-amber-400 animate-pulse">
              Next round starting in a few seconds...
            </span>
          </div>
        </div>
      )}

      {/* Contexto Summary Overlay */}
      {status === 'contexto_summary' && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full text-center shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4">
              <Zap className="w-8 h-8" />
            </div>

            <h3 className="text-2xl font-black text-slate-900 dark:text-white font-doodle">
              {roomState?.contexto_winner?.user_id
                ? `${roomState.contexto_winner.username} Won the Round! 🎯`
                : 'Time Expired!'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              The mystery word was <strong className="text-emerald-600 capitalize">"{roomState?.contexto_winner?.secret_word}"</strong>!
            </p>

            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 block mt-4 animate-pulse">
              Advancing to next round...
            </span>
          </div>
        </div>
      )}

      {/* Classic Round Summary Intermission Overlay */}
      {status === 'round_summary' && gameMode === 'classic' && (
        <div className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full text-center shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-3">
              <Sparkles className="w-6 h-6 animate-spin" />
            </div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white font-doodle">
              Round {currentRound} Finished!
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Synchronizing scores and advancing all players together...
            </p>

            <div className="my-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-3 divide-y divide-slate-100 dark:divide-slate-800">
              {rankedPlayers.map((p, idx) => (
                <div key={p.user_id} className="py-2 flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-800 dark:text-slate-200">
                    {idx + 1}. {p.username}
                  </span>
                  <span className="text-indigo-600 dark:text-indigo-400">
                    +{p.current_round_score.toFixed(1)} pts
                  </span>
                </div>
              ))}
            </div>

            <span className="text-xs font-bold text-amber-600 dark:text-amber-400 animate-pulse">
              Next round starting in a few seconds...
            </span>
          </div>
        </div>
      )}

      {/* Confirm Done Modal */}
      <ConfirmModal
        isOpen={showDoneConfirm}
        title={`Finish Round ${currentRound}?`}
        message={
          myBestScore > 0
            ? `Are you sure you want to lock in your score (${myBestScore.toFixed(1)} pts)?`
            : `You haven't scored on your doodle yet! If you finish now, your current drawing will be evaluated.`
        }
        confirmText="Yes, I'm Done"
        cancelText="Keep Drawing"
        variant="warning"
        onConfirm={() => {
          setShowDoneConfirm(false);
          handleFinishRound();
        }}
        onCancel={() => setShowDoneConfirm(false)}
      />

      {/* Confirm Leave Room Modal */}
      <ConfirmModal
        isOpen={showLeaveConfirm}
        title="Leave Multiplayer Match?"
        message="Are you sure you want to leave this room? You will disconnect from the team and return to the dashboard."
        confirmText="Leave Match"
        cancelText="Stay in Room"
        variant="danger"
        onConfirm={() => {
          setShowLeaveConfirm(false);
          onLeaveRoom();
          setView('dashboard');
        }}
        onCancel={() => setShowLeaveConfirm(false)}
      />

      {/* Final Multiplayer Leaderboard Modal */}
      <MultiplayerLeaderboardModal
        isOpen={status === 'game_finished'}
        leaderboard={rankedPlayers}
        currentUserId={currentUserId}
        isHost={isHost}
        onPlayAgain={onPlayAgain}
        onBackToDashboard={() => setView('dashboard')}
      />
    </div>
  );
}
