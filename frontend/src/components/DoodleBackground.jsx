import React from 'react';

export function DoodleBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10 bg-gradient-to-br from-indigo-50/70 via-slate-50 to-amber-50/50 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950/60 transition-colors duration-300">
      {/* Grid Pattern overlay */}
      <div className="absolute inset-0 bg-grid-pattern opacity-40 dark:opacity-15" />

      {/* Floating Animated Doodles */}
      <svg
        className="absolute w-full h-full inset-0"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Animated Doodle: Lightbulb (Top Left) */}
        <g className="animate-float" style={{ transformOrigin: '12% 18%' }}>
          <path
            d="M 120,130 C 100,100 105,60 140,50 C 175,40 200,70 190,110 C 185,125 170,135 165,150 L 145,150 C 140,135 125,125 120,130 Z"
            fill="none"
            stroke="#6366f1"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="animate-doodle-stroke"
          />
          <path
            d="M 145,155 L 165,155 M 148,162 L 162,162"
            stroke="#f59e0b"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
          {/* Glow rays */}
          <line x1="150" y1="30" x2="150" y2="15" stroke="#f59e0b" strokeWidth="3" strokeLinecap="round" />
          <line x1="195" y1="50" x2="208" y2="40" stroke="#f59e0b" strokeWidth="3" strokeLinecap="round" />
          <line x1="105" y1="50" x2="92" y2="40" stroke="#f59e0b" strokeWidth="3" strokeLinecap="round" />
        </g>

        {/* Animated Doodle: Star (Top Right) */}
        <g className="animate-float-slow" style={{ transformOrigin: '82% 14%', animationDelay: '1.2s' }}>
          <path
            d="M 850,90 L 865,125 L 905,128 L 875,152 L 884,190 L 850,168 L 816,190 L 825,152 L 795,128 L 835,125 Z"
            fill="rgba(245, 158, 11, 0.08)"
            stroke="#f59e0b"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="animate-doodle-stroke"
          />
        </g>

        {/* Animated Doodle: Pencil (Bottom Left) */}
        <g className="animate-float" style={{ transformOrigin: '15% 75%', animationDelay: '2s' }}>
          <path
            d="M 120,680 L 190,610 L 210,630 L 140,700 L 110,705 Z"
            fill="rgba(99, 102, 241, 0.06)"
            stroke="#4f46e5"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M 180,620 L 200,640 M 130,670 L 150,690"
            stroke="#4f46e5"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          {/* Swirl stroke coming from pencil tip */}
          <path
            d="M 110,705 Q 80,720 100,750 T 150,770 T 220,740"
            fill="none"
            stroke="#818cf8"
            strokeWidth="2.5"
            strokeDasharray="6 4"
            strokeLinecap="round"
          />
        </g>

        {/* Animated Doodle: Happy Cloud (Center Right) */}
        <g className="animate-float-slow" style={{ transformOrigin: '80% 60%', animationDelay: '0.6s' }}>
          <path
            d="M 780,480 C 760,480 745,460 755,440 C 740,420 760,390 790,395 C 810,370 850,375 865,400 C 885,395 905,415 895,440 C 915,460 900,480 880,480 Z"
            fill="rgba(56, 189, 248, 0.08)"
            stroke="#0ea5e9"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="animate-doodle-stroke"
          />
          {/* Cute face */}
          <circle cx="810" cy="435" r="3" fill="#0ea5e9" />
          <circle cx="845" cy="435" r="3" fill="#0ea5e9" />
          <path d="M 822,448 Q 827,455 833,448" stroke="#0ea5e9" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        </g>

        {/* Animated Doodle: Paper Airplane (Center Left) */}
        <g className="animate-float" style={{ transformOrigin: '25% 40%', animationDelay: '1.8s' }}>
          <path
            d="M 220,320 L 300,280 L 260,360 L 245,330 L 220,320 Z M 300,280 L 245,330"
            fill="rgba(16, 185, 129, 0.08)"
            stroke="#10b981"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M 210,325 Q 170,340 180,380 T 150,420"
            fill="none"
            stroke="#34d399"
            strokeWidth="2"
            strokeDasharray="5 5"
            strokeLinecap="round"
          />
        </g>

        {/* Animated Doodle: Palette / Sparkle (Bottom Right) */}
        <g className="animate-float-slow" style={{ transformOrigin: '88% 85%', animationDelay: '2.5s' }}>
          <path
            d="M 820,720 C 800,680 860,650 900,670 C 940,690 940,750 890,770 C 860,780 830,750 820,720 Z"
            fill="rgba(244, 63, 94, 0.06)"
            stroke="#f43f5e"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <circle cx="850" cy="700" r="4" fill="#f59e0b" />
          <circle cx="880" cy="700" r="4" fill="#3b82f6" />
          <circle cx="895" cy="730" r="4" fill="#10b981" />
        </g>
      </svg>
    </div>
  );
}
