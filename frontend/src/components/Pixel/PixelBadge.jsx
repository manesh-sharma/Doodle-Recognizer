export default function PixelBadge({ children, tone = 'primary', className = '' }) {
  const tones = {
    primary: 'bg-pixel-primary/20 text-pixel-primary border-pixel-primary/40 dark:bg-indigo-500/20 dark:text-indigo-300 dark:border-indigo-500/40',
    accent:  'bg-pixel-accent/20 text-pixel-accent border-pixel-accent/40 dark:bg-rose-500/20 dark:text-rose-300 dark:border-rose-500/40',
    success: 'bg-pixel-success/25 text-emerald-700 border-pixel-success/50 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/40',
    sky:     'bg-pixel-sky/30 text-slate-700 border-pixel-sky/50 dark:bg-sky-500/20 dark:text-sky-300 dark:border-sky-500/40',
  };
 
  return (
    <span
      className={[
        'inline-flex items-center gap-1.5 px-2.5 py-1',
        'font-pixelmono text-[11px] tracking-wide uppercase',
        'rounded-full border',
        tones[tone],
        className,
      ].join(' ')}
    >
      {children}
    </span>
  );
}
 