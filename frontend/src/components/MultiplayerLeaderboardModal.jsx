import React, { useEffect, useState } from 'react';
import { Trophy, Medal, Crown, Download, Home, RotateCcw, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import { showToast } from './Toast';

export function MultiplayerLeaderboardModal({
  isOpen,
  leaderboard = [],
  currentUserId,
  isHost,
  onPlayAgain,
  onBackToDashboard,
}) {
  const [selectedPlayerId, setSelectedPlayerId] = useState(null);

  useEffect(() => {
    if (isOpen) {
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.55 },
      });
      setTimeout(() => {
        confetti({
          particleCount: 60,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
        });
        confetti({
          particleCount: 60,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
        });
      }, 350);

      // Select current user or 1st place by default for inspecting doodles
      if (leaderboard.length > 0) {
        setSelectedPlayerId(leaderboard[0].user_id);
      }
    }
  }, [isOpen, leaderboard]);

  if (!isOpen) return null;

  const downloadDoodle = (username, roundNum, base64) => {
    if (!base64) return;
    const link = document.createElement('a');
    link.download = `${username}_round${roundNum}.png`;
    link.href = base64;
    link.click();
    showToast(`Downloaded ${username}'s Round ${roundNum} doodle!`, 'success');
  };

  const getRankBadge = (rank) => {
    switch (rank) {
      case 1:
        return (
          <div className="w-8 h-8 rounded-xl bg-amber-400 text-amber-950 flex items-center justify-center font-black text-sm shadow-md shadow-amber-200">
            🥇
          </div>
        );
      case 2:
        return (
          <div className="w-8 h-8 rounded-xl bg-slate-300 text-slate-800 flex items-center justify-center font-black text-sm shadow-md shadow-slate-200">
            🥈
          </div>
        );
      case 3:
        return (
          <div className="w-8 h-8 rounded-xl bg-amber-700 text-amber-100 flex items-center justify-center font-black text-sm shadow-md shadow-amber-900/20">
            🥉
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center font-black text-xs">
            #{rank}
          </div>
        );
    }
  };

  const activePlayer = leaderboard.find((p) => p.user_id === selectedPlayerId) || leaderboard[0];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-in fade-in zoom-in duration-200 transition-colors">
        {/* Modal Banner Header */}
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white p-6 text-center relative">
          <div className="w-16 h-16 bg-white/15 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-3 border border-white/20 shadow-inner">
            <Trophy className="w-8 h-8 text-amber-300" />
          </div>
          <h2 className="text-3xl font-black tracking-tight font-doodle">
            Match Finished!
          </h2>
          <p className="text-indigo-100 text-sm mt-1">
            Official Multiplayer Results & Doodle Exhibition
          </p>
        </div>

        {/* Modal Content: Split into Rankings (Left) and Player Round Doodles (Right) */}
        <div className="flex-1 p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Left: Ranked Leaderboard Table (5 cols) */}
          <div className="md:col-span-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-400">
                Final Leaderboard
              </h3>
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                {leaderboard.length} Players
              </span>
            </div>

            <div className="space-y-2">
              {leaderboard.map((player, index) => {
                const rank = index + 1;
                const isSelected = player.user_id === selectedPlayerId;
                const isMe = player.user_id === currentUserId;

                return (
                  <div
                    key={player.user_id}
                    onClick={() => setSelectedPlayerId(player.user_id)}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                      isSelected
                        ? 'border-indigo-500 dark:border-indigo-400 bg-indigo-50/70 dark:bg-indigo-950/50 shadow-md ring-2 ring-indigo-500/20'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900/60 hover:bg-slate-100 dark:hover:bg-slate-700/60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {getRankBadge(rank)}
                      <div>
                        <div className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                          <span>{player.username}</span>
                          {isMe && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                              YOU
                            </span>
                          )}
                          {player.is_host && (
                            <Crown className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                          Click to inspect doodles
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-base font-black text-indigo-600 dark:text-indigo-400">
                        {player.total_score.toFixed(1)}
                      </div>
                      <div className="text-[10px] uppercase font-bold text-slate-400">
                        pts
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Selected Player's Doodles & Round Breakdown (7 cols) */}
          <div className="md:col-span-7 bg-slate-50 dark:bg-slate-900/60 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700 mb-4">
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                    Viewing Doodles
                  </span>
                  <span className="text-lg font-black text-slate-900 dark:text-white capitalize">
                    {activePlayer?.username}'s Artwork
                  </span>
                </div>
                <div className="bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 text-xs font-black px-3 py-1.5 rounded-xl border border-indigo-200 dark:border-indigo-800">
                  Total: {activePlayer?.total_score.toFixed(1)} / 400
                </div>
              </div>

              {/* 4 Rounds Grid */}
              <div className="grid grid-cols-2 gap-3">
                {[1, 2, 3, 4].map((rNum) => {
                  const score = activePlayer?.round_scores?.[rNum] ?? 0;
                  const doodle = activePlayer?.round_doodles?.[rNum];

                  return (
                    <div
                      key={rNum}
                      className="bg-white dark:bg-slate-800 rounded-xl p-3 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between"
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Round {rNum}</span>
                        <span className="text-xs font-black text-indigo-600 dark:text-indigo-400">
                          {score.toFixed(1)}%
                        </span>
                      </div>

                      {/* Doodle preview image */}
                      <div className="w-full aspect-square bg-white rounded-lg border border-slate-200 dark:border-slate-600 overflow-hidden flex items-center justify-center mb-2">
                        {doodle ? (
                          <img
                            src={doodle}
                            alt={`Round ${rNum}`}
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <span className="text-[10px] text-slate-400 font-medium">No sketch</span>
                        )}
                      </div>

                      {/* Download Doodle Button */}
                      {doodle && (
                        <button
                          type="button"
                          onClick={() => downloadDoodle(activePlayer?.username, rNum, doodle)}
                          className="w-full py-1.5 bg-slate-900 dark:bg-indigo-600 hover:bg-slate-800 dark:hover:bg-indigo-500 text-white rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 transition shadow-sm"
                        >
                          <Download className="w-3 h-3" />
                          <span>Download</span>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Action Bar */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <button
            type="button"
            onClick={onBackToDashboard}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs sm:text-sm transition shadow-sm"
          >
            <Home className="w-4 h-4" />
            <span>Dashboard</span>
          </button>

          {isHost ? (
            <button
              type="button"
              onClick={onPlayAgain}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm shadow-md transition"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Play Another Match</span>
            </button>
          ) : (
            <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold italic">
              Waiting for host to restart match...
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
