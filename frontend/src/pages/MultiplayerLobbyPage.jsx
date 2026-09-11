import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { showToast } from '../components/Toast';
import {
  Users,
  Plus,
  LogIn,
  Copy,
  Check,
  Crown,
  Play,
  ArrowLeft,
  Shield,
  Sparkles,
  LogOut,
  CheckCircle2,
  Hourglass,
  Eye,
  HelpCircle,
  Zap,
  Award,
  Settings2
} from 'lucide-react';

export function MultiplayerLobbyPage({
  setView,
  roomState,
  connected,
  onCreateRoom,
  onJoinRoom,
  onToggleReady,
  onSetGameSettings,
  onStartGame,
  onLeaveRoom,
}) {
  const { user } = useAuth();
  const [joinCode, setJoinCode] = useState('');
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
  const [copied, setCopied] = useState(false);

  const isInRoom = !!roomState?.code;
  const isHost = roomState?.host_id === user?.id;
  const players = roomState?.players || [];
  const me = players.find((p) => p.user_id === user?.id);

  // Game mode & rounds
  const currentGameMode = roomState?.game_mode || 'classic';
  const currentTotalRounds = roomState?.total_rounds || (currentGameMode === 'classic' ? 4 : 3);

  // Ready conditions
  const nonHosts = players.filter((p) => !p.is_host);
  const readyCount = nonHosts.filter((p) => p.is_ready).length;
  const allNonHostsReady = nonHosts.length > 0 && nonHosts.every((p) => p.is_ready);

  // Player count requirement depends on mode (Imposter requires min 3; Classic/Contexto requires min 2)
  const minPlayersNeeded = currentGameMode === 'imposter' ? 3 : 2;
  const hasEnoughPlayers = players.length >= minPlayersNeeded;
  const canStart = isHost && hasEnoughPlayers && allNonHostsReady;

  const handleCreate = async () => {
    setCreating(true);
    try {
      const res = await api.createMultiplayerRoom();
      await onCreateRoom(res.room_code);
    } catch (err) {
      showToast('Failed to create team: ' + err.message, 'error');
    } finally {
      setCreating(false);
    }
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    const code = joinCode.trim().toUpperCase();
    if (!code || code.length < 4) {
      showToast('Please enter a valid team code', 'warning');
      return;
    }

    setJoining(true);
    try {
      await onJoinRoom(code);
    } catch (err) {
      showToast('Failed to join team: ' + err.message, 'error');
    } finally {
      setJoining(false);
    }
  };

  const copyCode = () => {
    if (!roomState?.code) return;
    navigator.clipboard.writeText(roomState.code);
    setCopied(true);
    showToast(`Team code ${roomState.code} copied!`, 'success', 2000);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleModeChange = (mode) => {
    if (!isHost || !onSetGameSettings) return;
    const defaultRounds = mode === 'classic' ? 4 : 3;
    onSetGameSettings(mode, defaultRounds);
    showToast(`Game mode set to ${mode.toUpperCase()}!`, 'info', 2000);
  };

  const handleRoundsChange = (rounds) => {
    if (!isHost || !onSetGameSettings) return;
    onSetGameSettings(currentGameMode, rounds);
    showToast(`Match set to ${rounds} rounds!`, 'info', 2000);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Navigation */}
      <div className="flex items-center justify-between pb-6">
        <button
          onClick={() => {
            if (isInRoom) onLeaveRoom();
            setView('dashboard');
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Dashboard</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Multiplayer Server Online</span>
        </div>
      </div>

      {!isInRoom ? (
        /* Create or Join Team Selection View */
        <div className="space-y-8">
          <div className="text-center max-w-xl mx-auto">
            <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-100 dark:border-indigo-800 rounded-3xl flex items-center justify-center mx-auto mb-4 text-indigo-600 dark:text-indigo-400 shadow-sm">
              <Users className="w-7 h-7" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight font-doodle">
              Multiplayer Team Lobby
            </h1>
            <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base mt-2">
              Create a team and invite friends with a code, or enter an existing code to join a live sketch match!
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Create Team Card */}
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between hover:shadow-md transition">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4 border border-indigo-100 dark:border-indigo-800">
                  <Plus className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">Create a Team</h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
                  Start a new lobby as the Host. You will receive a 6-character room code to share with your friends (2 to 8 players).
                </p>
              </div>

              <button
                type="button"
                disabled={creating}
                onClick={handleCreate}
                className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md shadow-indigo-200 dark:shadow-none flex items-center justify-center gap-2 transition disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
                <span>{creating ? 'Creating Team...' : 'Create New Team'}</span>
              </button>
            </div>

            {/* Join Team Card */}
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between hover:shadow-md transition">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-4 border border-amber-200 dark:border-amber-800">
                  <LogIn className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">Join a Team</h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                  Enter the 6-character invite code provided by your team host.
                </p>

                <form onSubmit={handleJoin} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                      Team Code
                    </label>
                    <input
                      type="text"
                      maxLength={8}
                      placeholder="e.g. SKETCH"
                      value={joinCode}
                      onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                      className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono text-center text-lg font-black tracking-widest uppercase text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-900"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={joining || !joinCode.trim()}
                    className="w-full py-3.5 rounded-2xl bg-slate-900 dark:bg-amber-500 hover:bg-slate-800 dark:hover:bg-amber-600 text-white dark:text-slate-950 font-bold text-sm shadow-md flex items-center justify-center gap-2 transition disabled:opacity-50"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>{joining ? 'Connecting...' : 'Join Team Lobby'}</span>
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Inside Active Team Lobby View */
        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden animate-in fade-in duration-200 transition-colors">
          {/* Lobby Banner */}
          <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-800 text-white p-6 sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-bold text-indigo-100 mb-2 border border-white/10">
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>Team Lobby Active</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black tracking-tight font-doodle">
                  Match Preparation
                </h2>
                <p className="text-indigo-100 text-xs sm:text-sm mt-1">
                  Share the team code with players. All players must ready up before the match begins!
                </p>
              </div>

              {/* Share Code Box */}
              <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/20 flex items-center gap-3">
                <div>
                  <span className="text-[10px] uppercase tracking-wider font-extrabold text-indigo-200 block">
                    Team Code
                  </span>
                  <span className="text-2xl font-black font-mono tracking-widest text-amber-300">
                    {roomState.code}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={copyCode}
                  className="p-2.5 bg-white/20 hover:bg-white/30 rounded-xl transition text-white"
                  title="Copy Team Code"
                >
                  {copied ? <Check className="w-5 h-5 text-emerald-300" /> : <Copy className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </div>

          {/* Game Mode & Custom Rounds Selector Section */}
          <div className="p-6 sm:p-8 border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/30 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-700 dark:text-slate-200 flex items-center gap-2">
                <Settings2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Select Game Mode</span>
              </h3>
              {!isHost && (
                <span className="text-xs text-slate-500 font-bold">
                  (Selected by Team Host)
                </span>
              )}
            </div>

            {/* Mode Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Mode 1: Classic 4-Round Challenge */}
              <div
                onClick={() => isHost && handleModeChange('classic')}
                className={`p-4 rounded-2xl border-2 transition cursor-pointer flex flex-col justify-between ${
                  currentGameMode === 'classic'
                    ? 'border-indigo-600 dark:border-indigo-400 bg-indigo-50/70 dark:bg-indigo-950/40 shadow-sm'
                    : isHost
                    ? 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 opacity-60 cursor-default'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-black uppercase tracking-wider px-2 py-0.5 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                      Classic
                    </span>
                    <span className="text-[11px] font-bold text-slate-500">2–8 Players</span>
                  </div>
                  <h4 className="text-sm font-black text-slate-900 dark:text-white">4-Round Challenge</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                    Everyone sketches simultaneously. Model evaluates each attempt for target accuracy!
                  </p>
                </div>
                {currentGameMode === 'classic' && (
                  <div className="mt-3 flex items-center gap-1 text-xs font-black text-indigo-600 dark:text-indigo-400">
                    <Check className="w-3.5 h-3.5" /> Selected
                  </div>
                )}
              </div>

              {/* Mode 2: Finding Imposter */}
              <div
                onClick={() => isHost && handleModeChange('imposter')}
                className={`p-4 rounded-2xl border-2 transition cursor-pointer flex flex-col justify-between ${
                  currentGameMode === 'imposter'
                    ? 'border-purple-600 dark:border-purple-400 bg-purple-50/70 dark:bg-purple-950/40 shadow-sm'
                    : isHost
                    ? 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 opacity-60 cursor-default'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-black uppercase tracking-wider px-2 py-0.5 rounded-lg bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 flex items-center gap-1">
                      <Eye className="w-3 h-3" /> Party Mode
                    </span>
                    <span className="text-[11px] font-bold text-purple-600 dark:text-purple-400">3–8 Players</span>
                  </div>
                  <h4 className="text-sm font-black text-slate-900 dark:text-white">Finding Imposter</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                    1 player is the Imposter! Take turns drawing 1 stroke at a time. AI recognizes sketch; vote out the imposter!
                  </p>
                </div>
                {currentGameMode === 'imposter' && (
                  <div className="mt-3 flex items-center gap-1 text-xs font-black text-purple-600 dark:text-purple-400">
                    <Check className="w-3.5 h-3.5" /> Selected
                  </div>
                )}
              </div>

              {/* Mode 3: Contexto Word Race */}
              <div
                onClick={() => isHost && handleModeChange('contexto')}
                className={`p-4 rounded-2xl border-2 transition cursor-pointer flex flex-col justify-between ${
                  currentGameMode === 'contexto'
                    ? 'border-emerald-600 dark:border-emerald-400 bg-emerald-50/70 dark:bg-emerald-950/40 shadow-sm'
                    : isHost
                    ? 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 opacity-60 cursor-default'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-black uppercase tracking-wider px-2 py-0.5 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                      <Zap className="w-3 h-3" /> Word Race
                    </span>
                    <span className="text-[11px] font-bold text-slate-500">2–8 Players</span>
                  </div>
                  <h4 className="text-sm font-black text-slate-900 dark:text-white">Contexto Word Race</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                    Draw guesses to uncover the mystery word! First player to hit Rank #1 wins the round.
                  </p>
                </div>
                {currentGameMode === 'contexto' && (
                  <div className="mt-3 flex items-center gap-1 text-xs font-black text-emerald-600 dark:text-emerald-400">
                    <Check className="w-3.5 h-3.5" /> Selected
                  </div>
                )}
              </div>
            </div>

            {/* Custom Rounds Selector */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Custom Rounds:</span>
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((num) => (
                    <button
                      key={num}
                      type="button"
                      disabled={!isHost}
                      onClick={() => handleRoundsChange(num)}
                      className={`w-8 h-8 rounded-xl font-black text-xs transition ${
                        currentTotalRounds === num
                          ? 'bg-slate-900 dark:bg-indigo-600 text-white shadow-sm'
                          : isHost
                          ? 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
                          : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 opacity-60 cursor-default'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>

              {currentGameMode === 'imposter' && players.length < 3 && (
                <span className="text-xs font-bold text-purple-600 dark:text-purple-400 flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" /> Finding Imposter requires 3 to 8 players ({players.length}/3)
                </span>
              )}
            </div>
          </div>

          {/* Connected Players List */}
          <div className="p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Connected Players ({players.length} / 8)</span>
              </h3>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-bold">
                {!hasEnoughPlayers
                  ? `Need at least ${minPlayersNeeded} players (${players.length}/${minPlayersNeeded})`
                  : allNonHostsReady
                  ? 'All players ready! Host can start match.'
                  : `Waiting for readiness (${readyCount}/${nonHosts.length} Ready)`}
              </span>
            </div>

            {/* Players Grid with Ready Badges */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {players.map((p) => {
                const isMe = p.user_id === user?.id;
                return (
                  <div
                    key={p.user_id}
                    className={`p-4 rounded-2xl border flex items-center gap-3 transition ${
                      isMe
                        ? 'border-indigo-300 dark:border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/40 shadow-sm'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-slate-900 dark:bg-slate-700 text-white flex items-center justify-center font-black text-sm relative">
                      {p.username?.slice(0, 2).toUpperCase()}
                      {p.is_host && (
                        <div className="absolute -top-1.5 -right-1.5 bg-amber-400 text-slate-950 rounded-full p-0.5 shadow">
                          <Crown className="w-3 h-3 fill-current" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-black text-slate-900 dark:text-white truncate flex items-center gap-1.5">
                        <span>{p.username}</span>
                        {isMe && <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold">(You)</span>}
                      </div>

                      {/* Player status badge */}
                      <div className="mt-1">
                        {p.is_host ? (
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                            Team Host
                          </span>
                        ) : p.is_ready ? (
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1 w-fit">
                            <CheckCircle2 className="w-3 h-3" /> Ready
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 flex items-center gap-1 w-fit">
                            <Hourglass className="w-3 h-3 animate-spin" /> Not Ready
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Empty slot indicators */}
              {Array.from({ length: Math.max(0, 4 - players.length) }).map((_, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 dark:text-slate-500 text-xs font-bold"
                >
                  <span>Waiting for player...</span>
                </div>
              ))}
            </div>

            {/* Info Banner */}
            <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                <span>
                  {currentGameMode === 'imposter'
                    ? `Finding Imposter: ${currentTotalRounds} Rounds. 1 stroke per turn. AI recognizes drawing. Voting to catch imposter!`
                    : currentGameMode === 'contexto'
                    ? `Contexto Word Race: ${currentTotalRounds} Rounds. First player to draw and guess the mystery word wins!`
                    : `Classic Challenge: ${currentTotalRounds} Synchronized Rounds (Easy, Medium, Hard). Highest score wins!`}
                </span>
              </div>
              <span className="font-bold text-indigo-600 dark:text-indigo-400">Synchronized Multiplayer</span>
            </div>
          </div>

          {/* Lobby Action Footer */}
          <div className="p-4 sm:p-6 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={onLeaveRoom}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs sm:text-sm transition shadow-sm"
            >
              <LogOut className="w-4 h-4 text-rose-500" />
              <span>Leave Team</span>
            </button>

            <div className="flex items-center gap-3">
              {/* Ready Button for Non-Hosts */}
              {!isHost && (
                <button
                  type="button"
                  onClick={onToggleReady}
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-black text-sm shadow-md transition ${
                    me?.is_ready
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200 dark:shadow-none'
                      : 'bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-amber-200 dark:shadow-none animate-bounce'
                  }`}
                >
                  {me?.is_ready ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>You Are Ready! (Click to Unready)</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Click to Ready Up!</span>
                    </>
                  )}
                </button>
              )}

              {/* Host Start Button */}
              {isHost && (
                <button
                  type="button"
                  disabled={!canStart}
                  onClick={onStartGame}
                  className="flex items-center gap-2 px-8 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-sm shadow-md shadow-amber-200 dark:shadow-none transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>
                    {!hasEnoughPlayers
                      ? `Need ${minPlayersNeeded}+ Players to Start`
                      : !allNonHostsReady
                      ? `Waiting for Players to Ready (${readyCount}/${nonHosts.length})`
                      : 'Start Match Now!'}
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
