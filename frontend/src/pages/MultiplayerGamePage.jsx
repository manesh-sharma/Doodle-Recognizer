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
  Crown
} from 'lucide-react';

export function MultiplayerGamePage({
  setView,
  roomState,
  currentUserId,
  onSubmitAttempt,
  onFinishRound,
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

  // Confirmation popups
  const [showDoneConfirm, setShowDoneConfirm] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);

  // Current room data
  const currentRound = roomState?.current_round || 1;
  const currentPrompt = roomState?.current_prompt;
  const players = roomState?.players || [];
  const me = players.find((p) => p.user_id === currentUserId);
  const isHost = roomState?.host_id === currentUserId;
  const status = roomState?.status; // 'in_round', 'round_summary', 'game_finished'

  // Calculate clock skew between local machine and server
  const clockSkewRef = useRef(0);

  useEffect(() => {
    if (roomState?.server_time) {
      clockSkewRef.current = (Date.now() / 1000) - roomState.server_time;
    }
  }, [roomState?.server_time]);

  // High-precision epoch timestamp countdown (immune to tab throttling, sleep, and clock drift)
  useEffect(() => {
    if (status !== 'in_round' || !roomState?.round_end_timestamp) {
      return;
    }

    const updateTimer = () => {
      const nowServerTime = (Date.now() / 1000) - clockSkewRef.current;
      const remaining = Math.max(0, Math.ceil(roomState.round_end_timestamp - nowServerTime));
      setLocalTimeLeft(remaining);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 250); // Tick 4 times a second for fluid sync

    return () => clearInterval(interval);
  }, [status, roomState?.round_end_timestamp]);

  // Reset round state when round changes
  useEffect(() => {
    setMyRoundAttempts([]);
    setMyBestScore(0);
    setMyBestDoodle(null);
    if (canvasRef.current) {
      canvasRef.current.clearCanvas();
    }
  }, [currentRound]);

  // Handle user clicking submit attempt
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
        // Broadcast best score to team
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
    // If haven't submitted yet, submit current canvas
    if (myBestScore === 0 && canvasRef.current && currentPrompt) {
      handleSubmitAttempt();
    }
    onFinishRound();
    showToast("You're ready! Waiting for all players to finish...", 'info');
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

  // Sort players by total score + current round score for live rankings
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

          <div className="bg-indigo-600 text-white px-3 py-1.5 rounded-xl text-xs font-black">
            Round {currentRound} / 4
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Draw Target:</span>
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

        {/* Synchronized Timer & Finish Button */}
        <div className="flex items-center gap-3">
          <div
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl border font-black text-sm transition-colors ${
              localTimeLeft <= 10
                ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-300 dark:border-rose-900/40 text-rose-600 dark:text-rose-400 animate-pulse'
                : localTimeLeft <= 25
                ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/40 text-amber-700 dark:text-amber-400'
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 shadow-sm'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span className="tabular-nums text-base">{localTimeLeft}s</span>
          </div>

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
        </div>
      </div>

      {/* 70/30 Split Layout */}
      <div className="flex-1 flex flex-col lg:flex-row gap-5 min-h-0 pb-2">
        {/* 70% Drawing Canvas */}
        <div className="w-full lg:w-[70%] h-full flex flex-col min-h-[420px] relative">
          <DrawingCanvas
            ref={canvasRef}
            disabled={me?.is_finished_round || status !== 'in_round'}
            showSaveButton={true}
          />

          {/* Waiting for other players overlay when finished */}
          {me?.is_finished_round && status === 'in_round' && (
            <div className="absolute inset-0 bg-white/75 backdrop-blur-[2px] rounded-3xl flex flex-col items-center justify-center text-center p-6 select-none z-10">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-3">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-slate-900">Your doodle is submitted!</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-xs">
                Waiting for other players to finish sketching or for round timer to expire.
              </p>
              <div className="mt-3 text-sm font-extrabold text-indigo-600">
                Your Best Round Score: {myBestScore.toFixed(1)}%
              </div>
            </div>
          )}
        </div>

        {/* 30% Multiplayer Sidebar: Live Scoreboard & Attempt Controls */}
        <div className="w-full lg:w-[30%] h-full flex flex-col min-h-[350px] bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          {/* My Round Score Card */}
          <div className="p-4 bg-slate-50 border-b border-slate-200">
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

          {/* Submit Attempt Button */}
          <div className="p-3.5 border-b border-slate-100 dark:border-slate-800 bg-indigo-50/40 dark:bg-indigo-950/20">
            <button
              type="button"
              disabled={submitting || me?.is_finished_round || status !== 'in_round'}
              onClick={handleSubmitAttempt}
              className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-800/90 dark:hover:bg-slate-700 text-white border border-slate-900 dark:border-white/50 hover:dark:border-white/80 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition disabled:opacity-40"
            >
              <Send className="w-4 h-4" />
              <span>{submitting ? 'Analyzing...' : 'Submit Doodle Attempt'}</span>
            </button>
            <span className="text-[10px] text-slate-400 dark:text-slate-400 block text-center mt-1.5">
              Submissions update your score live for all teammates!
            </span>
          </div>

          {/* Live In-Game Leaderboard */}
          <div className="flex-1 p-4 overflow-y-auto space-y-2">
            <div className="flex items-center justify-between text-xs font-black uppercase tracking-wider text-slate-400 mb-2">
              <span className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-indigo-600" />
                <span>Live Match Rankings</span>
              </span>
              <span>Total Pts</span>
            </div>

            <div className="space-y-2">
              {rankedPlayers.map((player, index) => {
                const isMe = player.user_id === currentUserId;
                const totalWithCurrent = player.total_score + player.current_round_score;

                return (
                  <div
                    key={player.user_id}
                    className={`p-2.5 rounded-xl border transition flex items-center justify-between ${
                      isMe
                        ? 'border-indigo-300 bg-indigo-50/60 shadow-sm'
                        : 'border-slate-100 bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-5 h-5 rounded-lg bg-slate-200 text-slate-700 text-xs font-extrabold flex items-center justify-center shrink-0">
                        {index + 1}
                      </span>
                      <div className="min-w-0">
                        <div className="text-xs font-black text-slate-900 truncate flex items-center gap-1">
                          <span>{player.username}</span>
                          {isMe && <span className="text-[9px] text-indigo-600 font-bold">(You)</span>}
                        </div>
                        <div className="text-[10px] text-slate-500 flex items-center gap-1">
                          <span>Round: {player.current_round_score.toFixed(1)}%</span>
                          {player.is_finished_round && (
                            <span className="text-emerald-600 font-bold">• Done</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs font-black text-indigo-700">
                        {totalWithCurrent.toFixed(1)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Sidebar Footer */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>Team Code: <strong className="font-mono text-slate-800 dark:text-slate-200">{roomState?.code}</strong></span>
            <span>{players.length} Players</span>
          </div>
        </div>
      </div>

      {/* Round Summary Intermission Overlay */}
      {status === 'round_summary' && (
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
            ? `Are you sure you want to lock in your score (${myBestScore.toFixed(1)} pts)? You won't be able to edit your doodle until the next round.`
            : `You haven't scored on your doodle yet! If you finish now, your current drawing will be evaluated and submitted as your final score for Round ${currentRound}.`
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
