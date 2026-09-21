import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { ProfileModal } from './ProfileModal';
import {
  Pencil,
  Trophy,
  Gamepad2,
  Sparkles
} from 'lucide-react';

export function Navbar({ currentView, setView }) {
  const { user, stats } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [showProfileModal, setShowProfileModal] = useState(false);

  return (
    <>
      <header
         className={`sticky top-0 z-30 transition-all duration-300 ${
         theme === "dark"
         ? "bg-slate-900/90 backdrop-blur-md border-b border-slate-800"
         : "bg-pixel-card border-b-4 border-pixel-border shadow-pixel"
         }`}
      >
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <button
            onClick={() => setView('dashboard')}
            className="flex items-center gap-3"
            title="Dashboard"
          >
           <div
             className={`w-12 h-12 flex items-center justify-center transition-all duration-300 ${
             theme === "dark"
             ? "rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-200"
             : "bg-pixel-primary border-4 border-pixel-border shadow-pixel"
              }`}
           >
             <Pencil
              className={`w-6 h-6 ${
              theme === "dark" ? "text-white" : "text-pixel-text"
              }`}
             />
             </div>

            <div>
              <h1
                className={`${
                theme === "dark"
                ? "text-lg font-black tracking-tight text-white font-doodle"
                : "font-pixel text-pixel-text text-sm"
               }`}
               >
               DOODLE AI
              </h1>
              <p
                className={`leading-none ${
                theme === "dark"
                ? "text-xs uppercase tracking-widest text-slate-400 font-bold"
                : "font-pixelmono text-lg text-pixel-text"
                }`}
               >
               QuickDraw Game
              </p>
            </div>
          </button>

          <div className="flex items-center gap-3">
            <button
             onClick={toggleTheme}
               title={`Switch to ${theme === "dark" ? "Pixelverse" : "NeoVerse"}`}
               className={`relative flex items-center overflow-hidden transition-all duration-300 ${
               theme === "dark"
               ? "w-60 h-12 rounded-2xl bg-slate-800 border border-slate-700"
               : "w-52 h-10 rounded-xl bg-pixel-card border-4 border-pixel-border shadow-pixel"
               }`}
              >
              {/* Sliding Active Background */}
              <div
               className={`absolute top-1 left-1 h-[calc(100%-8px)] w-[calc(50%-4px)] rounded-xl transition-all duration-300 ${
               theme === "dark"
               ? "translate-x-full bg-indigo-600"
               : "translate-x-0 bg-pixel-warning border-2 border-pixel-border"
               }`}
              />

            {/* Pixelverse */}
            <div className="relative z-10 flex-1 flex items-center justify-center gap-1">
          <span
           className={`text-lg transition ${
          theme === "dark" ? "opacity-50" : "opacity-100"
           }`}
           >
         <Gamepad2 className="w-3 h-3" />
       </span>

         <span
         className={`transition ${
         theme === "dark"
         ? "text-slate-400 font-medium"
         : "font-pixel font-pixel text-[8px] text-pixel-text-[9px]"
         }`}
         >
         PixelVerse
        </span>
       </div>

  {/* NeoVerse */}
  <div className="relative z-10 flex-1 flex items-center justify-center gap-1">
    <span
      className={`text-lg transition ${
        theme === "dark" ? "opacity-100" : "opacity-50"
      }`}
    >
      <Sparkles className="w-3 h-3" />
    </span>

   <span
       className={`transition ${
       theme === "dark"
       ? "font-semibold text-white text-sm"
       : "font-pixel font-pixel text-[8px] text-pixel-text-[9px]"
       }`}
    >
       NeoVerse
      </span>
     </div>
    </button>
           <div
             className={`hidden md:flex items-center gap-2 px-3 py-2 transition-all duration-300 ${
             theme === "dark"
             ? "rounded-xl bg-amber-950/30 border border-amber-900/40 shadow-sm"
             : "border-4 border-pixel-border bg-pixel-success shadow-pixel"
              }`}
           >
              <Trophy className="w-5 h-5 text-amber-600"/>
              <div>
                <p
               className={
               theme === "dark"
               ? "text-[9px] uppercase font-extrabold tracking-wider text-amber-400"
               : "font-pixel text-[8px]"
               }
                ></p>
                <p
                className={
                theme === "dark"
                ? "text-sm font-black text-amber-100"
                : "font-pixelmono text-lg"
               }
                >              
                  {stats?.high_score ? stats.high_score.toFixed(1) : "0.0"} pts
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowProfileModal(true)}
              className={`flex items-center gap-3 px-3 py-2 transition-all duration-300 ${
               theme === "dark"
               ? "rounded-xl border border-transparent hover:border-slate-700 hover:bg-slate-800"
               : "border-4 border-pixel-border bg-pixel-primary shadow-pixel hover:-translate-y-0.5"
               }`}
            >
              <div
               className={`w-10 h-10 flex items-center justify-center ${
               theme === "dark"
               ? "rounded-xl bg-slate-900 text-white text-sm font-bold"
               : "border-2 border-pixel-border bg-pixel-card font-pixelmono text-lg"
               }`}
               >
                {user?.username?.slice(0,2).toUpperCase() || "U"}
              </div>

              <div className="hidden sm:block text-left">
                <p
                  className={
                   theme === "dark"
                   ? "text-[10px] text-slate-400 font-medium"
                   : "font-pixel text-[8px] text-pixel-text"
                   }
                  >
                  PLAYER
                </p>
                <p
                 className={
                 theme === "dark"
                 ? "text-sm font-bold text-white"
                 : "font-pixelmono text-lg text-pixel-text"
                 }
                 >
                  {user?.username}
                </p>
              </div>
            </button>
          </div>
        </div>
      </header>

      <ProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
      />
    </>
  );
}
