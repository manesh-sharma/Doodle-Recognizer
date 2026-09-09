import React, { useEffect } from 'react';
import { Trophy, Download, RotateCcw, Home, Star, CheckCircle, ArrowRight } from 'lucide-react';
import confetti from 'canvas-confetti';

export function RoundAnalysisModal({
  isOpen,
  rounds = [],
  totalScore = 0,
  onPlayAgain,
  onBackToDashboard,
}) {
  useEffect(() => {
    if (isOpen) {
      // Fire celebratory confetti!
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
      setTimeout(() => {
        confetti({
          particleCount: 50,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
        });
        confetti({
          particleCount: 50,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
        });
      }, 300);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const downloadDoodle = (roundNumber, promptName, base64) => {
    if (!base64) return;
    const link = document.createElement('a');
    link.download = `round${roundNumber}_${promptName.replace(/\s+/g, '_')}.png`;
    link.href = base64;
    link.click();
  };

  const getDifficultyColor = (diff) => {
    switch (diff) {
      case 'easy':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'medium':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'hard':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-in fade-in zoom-in duration-200 transition-colors">
        {/* Header with Total Score Banner */}
        <div className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 text-white p-6 text-center relative">
          <div className="w-14 h-14 bg-white/15 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-3 border border-white/20 shadow-inner">
            <Trophy className="w-8 h-8 text-amber-300" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Game Complete!</h2>
          <p className="text-indigo-100 text-sm mt-1">Here is your 4-round doodle performance analysis</p>

          <div className="mt-4 inline-flex items-center gap-3 bg-white/15 backdrop-blur-md px-5 py-2.5 rounded-2xl border border-white/20">
            <span className="text-xs uppercase font-bold tracking-wider text-indigo-200">Total Score:</span>
            <span className="text-3xl font-black text-amber-300">
              {totalScore.toFixed(1)} <span className="text-sm font-semibold text-white/80">/ 400</span>
            </span>
          </div>
        </div>

        {/* Round Breakdown List */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Round-by-Round Breakdown
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {rounds.map((r, index) => (
              <div
                key={index}
                className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 flex flex-col justify-between hover:shadow-md transition"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Round {index + 1}</span>
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${getDifficultyColor(
                        r.difficulty
                      )}`}
                    >
                      {r.difficulty}
                    </span>
                  </div>

                  <h4 className="text-lg font-bold text-slate-900 dark:text-white capitalize mb-1">
                    {r.prompt}
                  </h4>

                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Confidence Score:</span>
                    <span className="text-sm font-extrabold text-indigo-600 dark:text-indigo-400">
                      {r.score.toFixed(1)} / 100
                    </span>
                  </div>
                </div>

                {/* Doodle Preview thumbnail */}
                <div className="mt-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-2 flex items-center justify-between">
                  <div className="w-16 h-16 rounded-lg bg-white border border-slate-200 dark:border-slate-600 overflow-hidden flex items-center justify-center">
                    {r.doodle_image ? (
                      <img
                        src={r.doodle_image}
                        alt={`Doodle for ${r.prompt}`}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <span className="text-[10px] text-slate-400">No sketch</span>
                    )}
                  </div>

                  {/* Download Doodle Button */}
                  {r.doodle_image && (
                    <button
                      type="button"
                      onClick={() => downloadDoodle(index + 1, r.prompt, r.doodle_image)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 dark:bg-indigo-600 hover:bg-slate-800 dark:hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-sm transition"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Modal Actions */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={onBackToDashboard}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 font-bold text-sm transition shadow-sm"
          >
            <Home className="w-4 h-4" />
            <span>Dashboard</span>
          </button>

          <button
            type="button"
            onClick={onPlayAgain}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md transition"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Play Again</span>
          </button>
        </div>
      </div>
    </div>
  );
}
