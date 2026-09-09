import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { ProfileModal } from './ProfileModal';
import { Pencil, Trophy, Sun, Moon, User } from 'lucide-react';

export function Navbar({ currentView, setView }) {
  const { user, stats } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [showProfileModal, setShowProfileModal] = useState(false);

  return (
    <>
      <header className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand Logo - Clicking returns to Dashboard */}
          <div
            onClick={() => setView('dashboard')}
            className="flex items-center gap-2.5 cursor-pointer select-none group"
            title="Return to Dashboard"
          >
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-200 dark:shadow-none group-hover:scale-105 transition">
              <Pencil className="w-5 h-5 -rotate-12 group-hover:rotate-0 transition" />
            </div>
            <div>
              <span className="text-lg font-black tracking-tight text-slate-900 dark:text-white font-doodle flex items-center gap-1">
                Doodle<span className="text-indigo-600 dark:text-indigo-400">AI</span>
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold tracking-wider uppercase block -mt-1">
                QuickDraw Game
              </span>
            </div>
          </div>

          {/* User Info & Controls */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Quick Theme Toggle Button */}
            <button
              type="button"
              onClick={toggleTheme}
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
              className="w-9 h-9 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center transition shadow-sm"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-600" />
              )}
            </button>

            {/* User High Score Badge */}
            <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/40 px-3 py-1.5 rounded-xl shadow-sm">
              <Trophy className="w-4 h-4 text-amber-500" />
              <div className="text-left">
                <span className="text-[9px] uppercase font-extrabold text-amber-800 dark:text-amber-400 tracking-wider block leading-none">
                  High Score
                </span>
                <span className="text-xs font-black text-amber-950 dark:text-amber-200">
                  {stats?.high_score ? stats.high_score.toFixed(1) : '0.0'} pts
                </span>
              </div>
            </div>

            {/* User Profile Pill - Clicking opens Profile & Settings */}
            <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowProfileModal(true)}
                title="View Profile & Settings"
                className="flex items-center gap-2 p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl border border-transparent hover:border-slate-200 dark:hover:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition text-left"
              >
                <div className="w-8 h-8 rounded-xl bg-slate-900 dark:bg-indigo-600 text-white flex items-center justify-center text-xs font-extrabold shadow-sm">
                  {user?.username?.slice(0, 2).toUpperCase() || 'U'}
                </div>
                <div className="hidden sm:block">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block leading-tight">
                    {user?.username}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium leading-none">
                    Profile & Settings
                  </span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* User Profile & Settings Modal */}
      <ProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
      />
    </>
  );
}
