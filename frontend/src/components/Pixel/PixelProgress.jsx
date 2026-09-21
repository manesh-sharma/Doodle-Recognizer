export default function PixelProgress({ value = 0, label, tone = 'primary', className = '' }) {
  const clamped = Math.max(0, Math.min(100, value));
  const fills = {
    primary: 'bg-pixel-primary dark:bg-indigo-500',
    accent:  'bg-pixel-accent dark:bg-rose-500',
    success: 'bg-pixel-success dark:bg-emerald-500',
  };
 
  return (
    <div className={className}>
      {label && (
        <div className="flex justify-between mb-1 font-pixelmono text-[11px] uppercase tracking-wide text-pixel-text/70 dark:text-slate-400">
          <span>{label}</span>
          <span>{Math.round(clamped)}%</span>
        </div>
      )}
      <div className="h-3 w-full rounded-full bg-pixel-bg dark:bg-slate-700 border border-pixel-border/40 dark:border-slate-600 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${fills[tone]}`}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}
 