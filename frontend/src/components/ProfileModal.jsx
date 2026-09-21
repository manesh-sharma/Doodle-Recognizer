import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { api } from '../services/api';
import {
  User,
  Settings,
  Trophy,
  Sun,
  Moon,
  LogOut,
  X,
  Calendar,
  Mail,
  Shield,
  Zap,
  Activity,
  Check,
  Award,
  Lock,
  Sparkles,
} from 'lucide-react';

import { formatDate } from '../utils/date';
import { ConfirmModal } from './ConfirmModal';
import { getAllBadgesWithStatus, unlockBadge } from '../utils/badgeManager';

export function ProfileModal({ isOpen, onClose }) {
  const { user, stats, logout } = useAuth();
  const { theme, setTheme, isDark } = useTheme();
  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'badges' | 'settings'
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  useEffect(() => {
    if (stats?.total_games >= 10) {
      unlockBadge('veteran_artist');
    }
    if (stats?.high_score >= 90) {
      unlockBadge('perfectionist');
    }
    if (stats?.high_score >= 98) {
      unlockBadge('century_club');
    }
  }, [stats]);

  const badges = getAllBadgesWithStatus();
  const unlockedCount = badges.filter((b) => b.isUnlocked).length;
  const totalBadges = badges.length;
  const progressPercent = Math.round((unlockedCount / totalBadges) * 100);

  if (!isOpen) return null;

  const formattedJoinDate = user?.created_at
    ? formatDate(user.created_at, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : 'Recently';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-orange-50 dark:bg-slate-900 border-[3px] border-[#3b2f2f] dark:border dark:border-slate-800 rounded-none dark:rounded-3xl shadow-[8px_8px_0_0_#3b2f2f] dark:shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[85vh]">
        {/* Modal Top Header */}
        <div className="p-6 border-b-[3px] border-[#3b2f2f] dark:border-b dark:border-slate-800 flex items-center justify-between bg-orange-100 dark:bg-slate-800/40">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-none dark:rounded-2xl border-[3px] border-[#3b2f2f] dark:border-0 bg-gradient-to-tr from-orange-400 to-amber-300 dark:from-indigo-600 dark:to-violet-600 text-stone-900 dark:text-white flex items-center justify-center text-lg font-black pixel-font dark:font-sans shadow-[3px_3px_0_0_#3b2f2f] dark:shadow-none">
              {user?.username?.slice(0, 2).toUpperCase() || 'U'}
            </div>
            <div>
              <h2 className="text-xl font-black pixel-font dark:font-sans text-stone-900 dark:text-white leading-tight">
                {user?.username}
              </h2>
              <span className="text-xs text-orange-700 dark:text-indigo-400 font-semibold pixel-font dark:font-sans flex items-center gap-1.5 mt-0.5">
                <Shield className="w-3.5 h-3.5" />
                Player Profile & Settings
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            type="button"
            className="w-8 h-8 rounded-none dark:rounded-xl border-2 border-[#3b2f2f] dark:border-0 bg-white dark:bg-transparent flex items-center justify-center text-stone-700 dark:text-slate-400 hover:text-stone-900 dark:hover:text-slate-200 hover:bg-orange-300 dark:hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b-[3px] border-[#3b2f2f] dark:border-b dark:border-slate-800 px-6 bg-orange-50 dark:bg-slate-900">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-2 py-3.5 px-3 border-b-2 text-xs font-bold pixel-font dark:font-sans transition ${
              activeTab === 'profile'
                ? 'border-orange-500 dark:border-indigo-600 text-orange-700 dark:text-indigo-400'
                : 'border-transparent text-stone-500 dark:text-slate-500 hover:text-stone-900 dark:hover:text-slate-200'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Profile & Stats</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('badges')}
            className={`flex items-center gap-2 py-3.5 px-3 border-b-2 text-xs font-bold pixel-font dark:font-sans transition ${
              activeTab === 'badges'
                ? 'border-orange-500 dark:border-indigo-600 text-orange-700 dark:text-indigo-400'
                : 'border-transparent text-stone-500 dark:text-slate-500 hover:text-stone-900 dark:hover:text-slate-200'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>Badges ({unlockedCount}/{totalBadges})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-2 py-3.5 px-3 border-b-2 text-xs font-bold pixel-font dark:font-sans transition ${
              activeTab === 'settings'
                ? 'border-orange-500 dark:border-indigo-600 text-orange-700 dark:text-indigo-400'
                : 'border-transparent text-stone-500 dark:text-slate-500 hover:text-stone-900 dark:hover:text-slate-200'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Settings & Theme</span>
          </button>
        </div>

        {/* Modal Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: Profile & Stats */}
          {activeTab === 'profile' && (
            <div className="space-y-5">
              {/* Account details card */}
              <div className="bg-orange-100 dark:bg-slate-800/60 rounded-none dark:rounded-2xl p-4 border-2 border-[#3b2f2f] dark:border dark:border-slate-800 shadow-[4px_4px_0_0_#3b2f2f] dark:shadow-none grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex items-center gap-2.5 text-xs text-stone-700 dark:text-slate-300">
                  <Mail className="w-4 h-4 text-orange-600 dark:text-slate-400" />
                  <div>
                    <span className="text-[10px] uppercase font-bold pixel-font dark:font-sans text-stone-500 dark:text-slate-400 block">Email</span>
                    <span className="font-semibold">{user?.email || 'No email attached'}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 text-xs text-stone-700 dark:text-slate-300">
                  <Calendar className="w-4 h-4 text-orange-600 dark:text-slate-400" />
                  <div>
                    <span className="text-[10px] uppercase font-bold pixel-font dark:font-sans text-stone-500 dark:text-slate-400 block">Member Since</span>
                    <span className="font-semibold">{formattedJoinDate}</span>
                  </div>
                </div>
              </div>

              {/* Stats Grid */}
              <div>
                <h4 className="text-xs font-bold pixel-font dark:font-sans text-stone-600 dark:text-slate-400 uppercase tracking-wider mb-3">
                  Career Performance
                </h4>
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-4 rounded-none dark:rounded-2xl bg-orange-100 dark:bg-amber-950/30 border-2 border-[#3b2f2f] dark:border dark:border-amber-900/40 shadow-[4px_4px_0_0_#3b2f2f] dark:shadow-none">
                    <Trophy className="w-5 h-5 text-orange-600 dark:text-amber-500 mb-1" />
                    <span className="text-[11px] font-bold pixel-font dark:font-sans text-orange-800 dark:text-amber-400 uppercase tracking-wider block">
                      High Score
                    </span>
                    <span className="text-xl font-black pixel-font dark:font-sans text-orange-950 dark:text-amber-200">
                      {stats?.high_score ? stats.high_score.toFixed(1) : '0.0'}
                    </span>
                  </div>

                  <div className="p-4 rounded-none dark:rounded-2xl bg-rose-100 dark:bg-indigo-950/30 border-2 border-[#3b2f2f] dark:border dark:border-indigo-900/40 shadow-[4px_4px_0_0_#3b2f2f] dark:shadow-none">
                    <Activity className="w-5 h-5 text-rose-500 dark:text-indigo-500 mb-1" />
                    <span className="text-[11px] font-bold pixel-font dark:font-sans text-rose-800 dark:text-indigo-400 uppercase tracking-wider block">
                      Avg Score
                    </span>
                    <span className="text-xl font-black pixel-font dark:font-sans text-rose-950 dark:text-indigo-200">
                      {stats?.avg_score ? stats.avg_score.toFixed(1) : '0.0'}
                    </span>
                  </div>

                  <div className="p-4 rounded-none dark:rounded-2xl bg-amber-100 dark:bg-emerald-950/30 border-2 border-[#3b2f2f] dark:border dark:border-emerald-900/40 shadow-[4px_4px_0_0_#3b2f2f] dark:shadow-none">
                    <Zap className="w-5 h-5 text-amber-600 dark:text-emerald-500 mb-1" />
                    <span className="text-[11px] font-bold pixel-font dark:font-sans text-amber-800 dark:text-emerald-400 uppercase tracking-wider block">
                      Games
                    </span>
                    <span className="text-xl font-black pixel-font dark:font-sans text-amber-950 dark:text-emerald-200">
                      {stats?.total_games || 0}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: Badges & Achievements */}
          {activeTab === 'badges' && (
            <div className="space-y-5">
              {/* Badges Overview Progress */}
              <div className="bg-gradient-to-r from-orange-300 via-rose-300 to-orange-300 dark:from-indigo-500/10 dark:via-purple-500/10 dark:to-pink-500/10 border-2 border-[#3b2f2f] dark:border dark:border-indigo-900/40 rounded-none dark:rounded-2xl shadow-[4px_4px_0_0_#3b2f2f] dark:shadow-none p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-stone-900 dark:text-indigo-400" />
                    <span className="font-bold text-sm pixel-font dark:font-sans text-stone-900 dark:text-slate-200">
                      Trophy Case
                    </span>
                  </div>
                  <span className="text-xs font-black pixel-font dark:font-sans text-stone-900 dark:text-indigo-400">
                    {unlockedCount} / {totalBadges} Unlocked ({progressPercent}%)
                  </span>
                </div>
                <div className="w-full bg-orange-50 dark:bg-slate-800 h-2.5 rounded-none dark:rounded-full border-2 border-[#3b2f2f] dark:border-0 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-orange-500 to-rose-500 dark:from-indigo-600 dark:to-violet-600 rounded-none dark:rounded-full transition-all duration-500"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              {/* Badges Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {badges.map((b) => (
                  <div
                    key={b.id}
                    className={`p-3.5 rounded-none dark:rounded-2xl border-2 dark:border transition-all flex items-start gap-3 ${
                      b.isUnlocked
                        ? 'bg-gradient-to-br from-orange-100 to-rose-100 dark:from-indigo-950/30 dark:to-violet-950/20 border-[#3b2f2f] dark:border-indigo-900/60 shadow-[3px_3px_0_0_#3b2f2f] dark:shadow-sm'
                        : 'bg-stone-100 dark:bg-slate-800/30 border-stone-400 dark:border-slate-800/60 opacity-65'
                    }`}
                  >
                    <div
                      className={`w-11 h-11 rounded-none dark:rounded-2xl flex items-center justify-center text-xl shrink-0 ${
                        b.isUnlocked
                          ? 'bg-white dark:bg-slate-800 shadow-sm border-2 border-[#3b2f2f] dark:border dark:border-indigo-800'
                          : 'bg-stone-200 dark:bg-slate-800/70 grayscale'
                      }`}
                    >
                      {b.isUnlocked ? b.icon : <Lock className="w-4 h-4 text-stone-500 dark:text-slate-400" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1.5 mb-1">
                        <h4
                          className={`text-xs font-black pixel-font dark:font-sans truncate ${
                            b.isUnlocked ? 'text-stone-900 dark:text-white' : 'text-stone-500 dark:text-slate-400'
                          }`}
                        >
                          {b.title}
                        </h4>
                        <span className="text-[9px] uppercase font-extrabold pixel-font dark:font-sans px-1.5 py-0.5 rounded-none dark:rounded-md border border-[#3b2f2f] dark:border-0 bg-orange-200 dark:bg-slate-800 text-stone-700 dark:text-slate-300 shrink-0">
                          {b.category}
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                        {b.description}
                      </p>
                      {b.isUnlocked && b.unlockedAt && (
                        <span className="text-[9px] text-orange-700 dark:text-indigo-400 font-bold pixel-font dark:font-sans block mt-1.5">
                          ✓ Unlocked {new Date(b.unlockedAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: Settings & Theme */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              {/* Theme Selector */}
              <div>
                <h4 className="text-xs font-bold pixel-font dark:font-sans text-stone-600 dark:text-slate-400 uppercase tracking-wider mb-2">
                  Theme Appearance
                </h4>
                <p className="text-xs text-stone-600 dark:text-slate-400 mb-3">
                  Choose your preferred color theme for the canvas and application UI.
                </p>

                <div className="grid grid-cols-2 gap-3">
                  {/* Light Theme Option */}
                  <button
                    type="button"
                    onClick={() => setTheme('light')}
                    className={`p-4 rounded-none dark:rounded-2xl border-2 dark:border text-left flex flex-col justify-between transition-all ${
                      theme === 'light'
                        ? 'border-[#3b2f2f] dark:border-indigo-600 bg-orange-200 dark:bg-indigo-950/40 ring-2 ring-orange-400/30 dark:ring-indigo-500/20 shadow-[4px_4px_0_0_#3b2f2f] dark:shadow-none'
                        : 'border-stone-400 dark:border-slate-800 bg-orange-50 dark:bg-slate-800 hover:border-stone-800'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-9 h-9 rounded-none dark:rounded-xl border-2 border-[#3b2f2f] dark:border-0 bg-amber-100 text-amber-700 flex items-center justify-center">
                        <Sun className="w-5 h-5" />
                      </div>
                      {theme === 'light' && (
                        <div className="w-5 h-5 rounded-none dark:rounded-full border-2 border-[#3b2f2f] dark:border-0 bg-orange-500 dark:bg-indigo-600 text-white flex items-center justify-center text-[10px]">
                          <Check className="w-3 h-3" />
                        </div>
                      )}
                    </div>
                    <div>
                      <span className="font-bold text-sm pixel-font dark:font-sans text-stone-900 dark:text-white block">
                        Light Mode
                      </span>
                      <span className="text-xs text-stone-600 dark:text-slate-400">
                        Clean, bright sketch style
                      </span>
                    </div>
                  </button>

                  {/* Dark Theme Option */}
                  <button
                    type="button"
                    onClick={() => setTheme('dark')}
                    className={`p-4 rounded-none dark:rounded-2xl border-2 dark:border text-left flex flex-col justify-between transition-all ${
                      theme === 'dark'
                        ? 'border-[#3b2f2f] dark:border-indigo-600 bg-orange-200 dark:bg-indigo-950/40 ring-2 ring-orange-400/30 dark:ring-indigo-500/20 shadow-[4px_4px_0_0_#3b2f2f] dark:shadow-none'
                        : 'border-stone-400 dark:border-slate-800 bg-orange-50 dark:bg-slate-800 hover:border-stone-800'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-9 h-9 rounded-none dark:rounded-xl border-2 border-[#3b2f2f] dark:border-0 bg-slate-900 text-indigo-400 flex items-center justify-center">
                        <Moon className="w-5 h-5" />
                      </div>
                      {theme === 'dark' && (
                        <div className="w-5 h-5 rounded-none dark:rounded-full border-2 border-[#3b2f2f] dark:border-0 bg-orange-500 dark:bg-indigo-600 text-white flex items-center justify-center text-[10px]">
                          <Check className="w-3 h-3" />
                        </div>
                      )}
                    </div>
                    <div>
                      <span className="font-bold text-sm pixel-font dark:font-sans text-stone-900 dark:text-white block">
                        Dark Mode
                      </span>
                      <span className="text-xs text-stone-600 dark:text-slate-400">
                        Easy on the eyes at night
                      </span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Game Preferences */}
              <div className="pt-2 border-t-2 border-[#3b2f2f] dark:border-t dark:border-slate-800 space-y-3">
                <h4 className="text-xs font-bold pixel-font dark:font-sans text-stone-600 dark:text-slate-400 uppercase tracking-wider">
                  Game & Canvas Settings
                </h4>
                <div className="flex items-center justify-between p-3.5 bg-orange-100 dark:bg-slate-800/60 rounded-none dark:rounded-xl border-2 border-[#3b2f2f] dark:border dark:border-slate-800 shadow-[3px_3px_0_0_#3b2f2f] dark:shadow-none">
                  <div>
                    <span className="text-xs font-bold pixel-font dark:font-sans text-stone-900 dark:text-slate-200 block">
                      Prediction Grouping
                    </span>
                    <span className="text-[11px] text-stone-600 dark:text-slate-400">
                      Curated V4 combined classes & dynamic support enabled
                    </span>
                  </div>
                  <span className="text-[10px] font-extrabold pixel-font dark:font-sans px-2.5 py-1 rounded-none dark:rounded-full border-2 border-[#3b2f2f] dark:border-0 bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
                    Active
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Footer */}
        <div className="p-4 bg-orange-100 dark:bg-slate-800/40 border-t-[3px] border-[#3b2f2f] dark:border-t dark:border-slate-800 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setShowLogoutConfirm(true)}
            className="flex items-center gap-1.5 text-xs font-bold pixel-font dark:font-sans text-rose-600 hover:text-rose-700 px-3 py-2 rounded-none dark:rounded-xl border-2 border-rose-700 dark:border-0 bg-white dark:bg-transparent hover:bg-rose-100 dark:hover:bg-rose-950/30 transition"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-none dark:rounded-xl border-2 border-[#3b2f2f] dark:border-0 bg-orange-400 hover:bg-orange-500 dark:bg-slate-100 dark:hover:bg-white text-stone-900 dark:text-slate-900 text-xs font-bold pixel-font dark:font-sans transition shadow-[3px_3px_0_0_#3b2f2f] dark:shadow-sm"
          >
            Done
          </button>
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      <ConfirmModal
        isOpen={showLogoutConfirm}
        title="Are you sure you want to log out?"
        message="You will need to sign in again with your username and password to access your drawing history, saved sessions, and stats."
        confirmText="Yes, Log Out"
        cancelText="Cancel"
        variant="danger"
        zIndex="z-[60]"
        onConfirm={() => {
          setShowLogoutConfirm(false);
          logout();
          onClose();
        }}
        onCancel={() => setShowLogoutConfirm(false)}
      />
    </div>
  );
}
 