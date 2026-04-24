import React from 'react';

interface Props {
  size?: number;
  className?: string;
}

export const Logo: React.FC<Props> = ({ size = 40, className = '' }) => (
  <div
    className={`inline-flex items-center justify-center rounded-2xl bg-slate-950 shadow-xl ring-1 ring-white/10 ${className}`}
    style={{ width: size, height: size }}
    aria-label="SubTrack logo"
  >
    <svg width={size * 0.68} height={size * 0.68} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect x="10" y="8" width="34" height="48" rx="8" fill="#f8fafc" />
      <path d="M19 20H36M19 30H35M19 40H29" stroke="#0f172a" strokeWidth="4" strokeLinecap="round" />
      <circle cx="43" cy="42" r="13" fill="#10b981" stroke="#0f172a" strokeWidth="4" />
      <path d="M38 42.5L41.5 46L49 37.5" stroke="#fff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  </div>
);
