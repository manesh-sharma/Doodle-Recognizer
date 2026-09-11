import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import {
  Palette,
  Flame,
  Trophy,
  History,
  TrendingUp,
  Download,
  Calendar,
  Sparkles,
  Layers,
  Clock,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Users,
  X,
  HelpCircle,
  Zap,
  Eye,
  BookOpen,
  Target
} from 'lucide-react';
import { showToast } from '../components/Toast';
import { formatDate, formatTime } from '../utils/date';

export function DashboardPage({ setView }) {
  const { user, stats, refreshUser } = useAuth();
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [expandedSession, setExpandedSession] = useState(null);
  const [modelStatus, setModelStatus] = useState(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      await refreshUser();
      const [histData, modelData] = await Promise.all([
        api.getGameHistory(),
        api.getModelStatus(),
      ]);
      setHistory(histData || []);
      setModelStatus(modelData);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const toggleExpand = (id) => {
    setExpandedSession(expandedSession === id ? null : id);
  };

  const downloadDoodle = (roundNumber, prompt, base64) => {
    if (!base64) return;
    const link = document.createElement('a');
    link.download = `doodle_r${roundNumber}_${prompt}.png`;
    link.href = base64;
    link.click();
    showToast('Doodle downloaded!', 'success');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-bold text-indigo-100 mb-3 border border-white/10">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Welcome back, {user?.username}!</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight font-doodle">
            Ready to Sketch?
          </h1>
          <p className="text-indigo-100 text-sm sm:text-base mt-2 max-w-xl">
            Choose your mode: free-draw in Normal Mode, test your speed in Extreme Challenge, master 208 lessons in Learning Mode, solve Contexto, or compete in Multiplayer!
          </p>
        </div>

        {/* Model Status Badge */}
        <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/15 shrink-0 text-right">
          <div className="text-xs text-indigo-200 font-bold uppercase tracking-wider mb-1">
            Inference Engine
          </div>
          <div className="flex items-center gap-2 justify-end">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                modelStatus?.is_model_loaded ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'
              }`}
            />
            <span className="font-extrabold text-sm text-white">
              {modelStatus?.is_model_loaded ? 'Keras CNN Active' : 'Heuristic Engine'}
            </span>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4 transition-colors">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-200 dark:border-amber-800/60 shrink-0">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">High Score</div>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">
              {stats?.high_score ? stats.high_score.toFixed(1) : '0.0'}
              <span className="text-xs text-slate-400 font-bold ml-1">pts</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4 transition-colors">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-200 dark:border-indigo-800/60 shrink-0">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Games Played</div>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">
              {stats?.total_games || 0}
              <span className="text-xs text-slate-400 font-bold ml-1">sessions</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4 transition-colors">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-200 dark:border-emerald-800/60 shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Average Score</div>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">
              {stats?.avg_score ? stats.avg_score.toFixed(1) : '0.0'}
              <span className="text-xs text-slate-400 font-bold ml-1">pts</span>
            </div>
          </div>
        </div>
      </div>

      {/* Game Mode Options (6 Game Modes Grid) */}
      <div>
        <h2 className="text-lg font-extrabold text-slate-900 dark:text-white uppercase tracking-wider mb-4">
          Select Game Mode
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* 1. Normal Mode Card */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-lg transition-all duration-200 flex flex-col justify-between group">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-100 dark:border-indigo-800 group-hover:scale-105 transition">
                  <Palette className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                  Free Draw
                </span>
              </div>

              <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">Normal Mode</h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
                Unlimited drawing canvas with continuous AI stroke recognition. Practice any object with the built-in Trace Guide overlay.
              </p>

              <div className="space-y-2 mb-6 text-xs text-slate-600 dark:text-slate-300">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400"></span>
                  <span>70% Canvas / 30% Live Predictions Sidebar</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400"></span>
                  <span>Stroke-by-stroke real-time recognition</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400"></span>
                  <span>Trace Guide dropdown for all classes</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setView('normal')}
              className="w-full py-3.5 rounded-2xl bg-slate-900 dark:bg-indigo-600 hover:bg-slate-800 dark:hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition group-hover:bg-indigo-600 dark:group-hover:bg-indigo-500"
            >
              <span>Launch Normal Mode</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* 2. Single Player Arcade Challenge Card */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border-2 border-amber-200/80 dark:border-amber-500/40 shadow-sm hover:shadow-lg transition-all duration-200 flex flex-col justify-between group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-100/50 dark:bg-amber-500/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />

            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-200 dark:border-amber-800 group-hover:scale-105 transition">
                  <Flame className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
                  Solo Arcade
                </span>
              </div>

              <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">Arcade Challenge</h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
                4 timed rounds: 2 Easy (50s), 1 Medium (100s), and 1 Hard (150s). Use "Need a Hint?" for dotted trace guides (-20 pts).
              </p>

              <div className="space-y-2 mb-6 text-xs text-slate-600 dark:text-slate-300">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                  <span>2 Easy + 1 Medium + 1 Hard rounds</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                  <span>Score = Target confidence % (Max 100/rd)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                  <span>Dotted trace hint & doodle exports</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setView('game')}
              className="w-full py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-amber-200 dark:shadow-none transition"
            >
              <span>Start Solo Challenge</span>
              <Flame className="w-4 h-4" />
            </button>
          </div>

          {/* 3. Extreme Challenge Card (NEW) */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border-2 border-rose-200/80 dark:border-rose-500/40 shadow-sm hover:shadow-lg transition-all duration-200 flex flex-col justify-between group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-rose-100/50 dark:bg-rose-500/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />

            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center border border-rose-200 dark:border-rose-800 group-hover:scale-105 transition">
                  <Zap className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300">
                  New • Speed Run
                </span>
              </div>

              <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">Extreme Challenge</h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
                Fast-paced score attack! Maximize your score through stroke efficiency, high AI confidence, and rapid reflexes.
              </p>

              <div className="space-y-2 mb-6 text-xs text-slate-600 dark:text-slate-300">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                  <span>Formula: 100 + Conf% + Stroke Bonus - Time</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                  <span>Fewer strokes = Higher efficiency bonus</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                  <span>High score records & speed badges</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setView('extreme')}
              className="w-full py-3.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-rose-200 dark:shadow-none transition"
            >
              <span>Start Extreme Run</span>
              <Zap className="w-4 h-4" />
            </button>
          </div>

          {/* 4. Learning Mode Card (NEW) */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border-2 border-sky-200/80 dark:border-sky-500/40 shadow-sm hover:shadow-lg transition-all duration-200 flex flex-col justify-between group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-sky-100/50 dark:bg-sky-500/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />

            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 flex items-center justify-center border border-sky-200 dark:border-sky-800 group-hover:scale-105 transition">
                  <BookOpen className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-sky-100 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300">
                  New • 208 Levels
                </span>
              </div>

              <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">Learning Mode</h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
                Master sketching through 208 structured lessons. Trace dotted guide blueprints, hit 90%+ AI target goals, and earn 3 stars.
              </p>

              <div className="space-y-2 mb-6 text-xs text-slate-600 dark:text-slate-300">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-500"></span>
                  <span>208 curated lessons from Easy to Hard</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-500"></span>
                  <span>Dotted outline trace guide overlays</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-500"></span>
                  <span>Target 90%+ goal meter & star ratings</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setView('learning')}
              className="w-full py-3.5 rounded-2xl bg-sky-600 hover:bg-sky-700 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-sky-200 dark:shadow-none transition"
            >
              <span>Open Drawing Lessons</span>
              <BookOpen className="w-4 h-4" />
            </button>
          </div>

          {/* 5. Contexto Mystery Word Solo Card */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border-2 border-emerald-200/80 dark:border-emerald-500/40 shadow-sm hover:shadow-lg transition-all duration-200 flex flex-col justify-between group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-100/50 dark:bg-emerald-500/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />

            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-200 dark:border-emerald-800 group-hover:scale-105 transition">
                  <HelpCircle className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
                  Deduction Solo
                </span>
              </div>

              <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">Contexto Solo</h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
                Guess the secret mystery word by sketching! The AI ranks each sketch by semantic proximity (Green, Yellow, Red) until you hit Rank #1!
              </p>

              <div className="space-y-2 mb-6 text-xs text-slate-600 dark:text-slate-300">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  <span>Secret mystery word with category clues</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  <span>Hot/Warm/Cold semantic distance ranks</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  <span>Stopwatch timer & progressive hints</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setView('contexto_solo')}
              className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-emerald-200 dark:shadow-none transition"
            >
              <span>Play Contexto Solo</span>
              <Sparkles className="w-4 h-4" />
            </button>
          </div>

          {/* 6. Multiplayer Team Mode Card */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border-2 border-purple-200/80 dark:border-purple-500/40 shadow-sm hover:shadow-lg transition-all duration-200 flex flex-col justify-between group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-100/50 dark:bg-purple-500/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />

            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center border border-purple-200 dark:border-purple-800 group-hover:scale-105 transition">
                  <Users className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300">
                  2-8 Players
                </span>
              </div>

              <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">Multiplayer Arena</h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
                Create a lobby and choose your mode: Classic Match, Finding Imposter (turn-based 1 stroke party game), or Contexto Word Race!
              </p>

              <div className="space-y-2 mb-6 text-xs text-slate-600 dark:text-slate-300">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-600 dark:bg-purple-400"></span>
                  <span>Finding Imposter (3–8 players, 1 stroke turns)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-600 dark:bg-purple-400"></span>
                  <span>Contexto Word Race & Classic Match</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-600 dark:bg-purple-400"></span>
                  <span>Custom rounds (1 to 5) & synchronized play</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setView('multiplayer_lobby')}
              className="w-full py-3.5 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-purple-200 dark:shadow-none transition"
            >
              <span>Enter Multiplayer Team</span>
              <Users className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Match History Small Tab / Bar */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-colors">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-800/80 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
            <History className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                Match History
              </h3>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                {history.length} {history.length === 1 ? 'game' : 'games'} recorded
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {history.length > 0
                ? `Latest match: ${history[0]?.total_score?.toFixed(1) || 0} pts • ${history[0]?.rounds_count || 4} rounds (${formatDate(history[0]?.created_at)})`
                : 'No games played yet. Jump into Single Player or Multiplayer to build your record!'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsHistoryModalOpen(true)}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white font-bold text-xs shadow-sm transition shrink-0"
        >
          <History className="w-4 h-4" />
          <span>View Match History</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Fixed-Size Scrollable History Window / Modal */}
      {isHistoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-slate-50/70 dark:bg-slate-900/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">
                    Your Match History
                  </h3>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                    {history.length} {history.length === 1 ? 'game' : 'games'} recorded
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsHistoryModalOpen(false)}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-700 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
              {loadingHistory ? (
                <div className="py-12 text-center text-sm text-slate-400">Loading history...</div>
              ) : history.length === 0 ? (
                <div className="py-16 text-center text-slate-400">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center mx-auto mb-3">
                    <Trophy className="w-6 h-6 text-slate-400" />
                  </div>
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No games played yet!</p>
                  <p className="text-xs text-slate-400 mt-1">Play your first 4-Round challenge to see your score analysis here.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-700">
                  {history.map((session) => {
                    const isExpanded = expandedSession === session.id;
                    return (
                      <div key={session.id} className="py-3.5 first:pt-0 last:pb-0">
                        <div
                          onClick={() => toggleExpand(session.id)}
                          className="flex items-center justify-between cursor-pointer hover:bg-slate-50/80 dark:hover:bg-slate-700/50 p-3 rounded-xl transition"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-800 flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-extrabold text-sm">
                              {session.rounds_count}R
                            </div>
                            <div>
                              <div className="text-sm font-extrabold text-slate-900 dark:text-white">
                                Total Score: {session.total_score.toFixed(1)} / 400
                              </div>
                              <div className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                                <Calendar className="w-3 h-3" />
                                <span>{formatDate(session.created_at)}</span>
                                <span>•</span>
                                <span>{formatTime(session.created_at)}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition">
                              {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                            </button>
                          </div>
                        </div>

                        {/* Expanded Round Details */}
                        {isExpanded && session.rounds && (
                          <div className="mt-3 pl-2 sm:pl-12 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                            {session.rounds.map((r, idx) => (
                              <div
                                key={idx}
                                className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl p-3 flex flex-col justify-between"
                              >
                                <div>
                                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                                    <span>Round {r.round_number}</span>
                                    <span className="uppercase text-[9px] px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                                      {r.difficulty}
                                    </span>
                                  </div>
                                  <div className="font-bold text-slate-900 dark:text-white capitalize text-sm mb-1">
                                    {r.prompt_name}
                                  </div>
                                  <div className="text-xs font-black text-indigo-600 dark:text-indigo-400 mb-2">
                                    {r.score_earned.toFixed(1)}%
                                  </div>
                                </div>

                                {/* Doodle Thumbnail & Download */}
                                <div className="bg-white dark:bg-slate-800 rounded-lg p-1 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                                  <div className="w-12 h-12 bg-white rounded overflow-hidden flex items-center justify-center border border-slate-100 dark:border-slate-600">
                                    {r.doodle_image ? (
                                      <img
                                        src={r.doodle_image}
                                        alt={r.prompt_name}
                                        className="w-full h-full object-contain"
                                      />
                                    ) : (
                                      <span className="text-[9px] text-slate-400">N/A</span>
                                    )}
                                  </div>
                                  {r.doodle_image && (
                                    <button
                                      type="button"
                                      onClick={() => downloadDoodle(r.round_number, r.prompt_name, r.doodle_image)}
                                      title="Download Doodle"
                                      className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition"
                                    >
                                      <Download className="w-4 h-4" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-200 dark:border-slate-700 flex justify-end">
              <button
                type="button"
                onClick={() => setIsHistoryModalOpen(false)}
                className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 text-xs font-bold transition shadow-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
