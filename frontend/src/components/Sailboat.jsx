import React from "react";

export default function Sailboat() {
  return (
    <svg className="sailboat" viewBox="0 0 220 180" fill="none">
      <circle cx="65" cy="40" r="10" fill="#FCD34D" opacity=".8" />
      <path d="M65 24v4M65 52v4M49 40h4M77 40h4" stroke="#FCD34D" strokeLinecap="round" strokeWidth="2" />
      <path d="M48 64l2 4 4 2-4 2-2 4-2-4-4-2 4-2 2-4z" fill="#38BDF8" />
      <path d="M168 60l1.5 3 3 1.5-3 1.5-1.5 3-1.5-3-3-1.5 3-1.5 1.5-3z" fill="#38BDF8" />
      <path d="M102 38L68 108c17 0 30-4 34-4V38Z" fill="#6EE7B7" stroke="#0F766E" strokeWidth="2.5" />
      <path d="M107 38l35 70c-14-2-28-4-35-4V38Z" fill="#A7F3D0" stroke="#0F766E" strokeWidth="2.5" />
      <line x1="105" y1="32" x2="105" y2="108" stroke="#0F766E" strokeWidth="3" />
      <polygon points="105,32 120,38 105,44" fill="#38BDF8" stroke="#0369A1" strokeWidth="1.5" />
      <path d="M52 110h104c-6 16-22 26-52 26s-46-10-52-26Z" fill="#38BDF8" stroke="#0369A1" strokeWidth="2.5" />
      <rect x="90" y="104" width="28" height="8" rx="2" fill="#E0F2FE" stroke="#0369A1" strokeWidth="1.5" />
      <circle cx="80" cy="118" r="2.5" fill="white" />
      <circle cx="104" cy="118" r="2.5" fill="white" />
      <circle cx="128" cy="118" r="2.5" fill="white" />
      <path d="M36 138c18-8 34 10 56 0s40 6 62-2 32 6 38 2" stroke="#0284C7" strokeWidth="3" strokeLinecap="round" />
      <path d="M42 148c20-6 38 8 60 0s40 4 64-2 26 4 32 2" stroke="#38BDF8" strokeWidth="2.5" strokeDasharray="2 3" strokeLinecap="round" />
    </svg>
  );
}
