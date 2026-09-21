import { useState } from 'react';
 
/**
 * PixelButton
 * -----------
 * Drop-in replacement for a plain <button>. Same props you'd expect
 * (onClick, disabled, type, children) — no new logic, purely visual.
 *
 * IMPORTANT: the `dark:` classes below are neutral placeholders so this
 * never looks broken in dark mode. Once you paste me your real button
 * markup from Navbar/DashboardPage, I'll swap these for your exact
 * existing dark-mode classes so dark mode is pixel-for-pixel unchanged.
 *
 * variant: 'primary' | 'accent' | 'success' | 'ghost'
 */
export default function PixelButton({
  children,
  onClick,
  variant = 'primary',
  disabled = false,
  type = 'button',
  className = '',
  ...rest
}) {
  const [pressed, setPressed] = useState(false);
 
  const variants = {
    primary: 'bg-pixel-primary text-pixel-text dark:bg-indigo-600 dark:text-white',
    accent:  'bg-pixel-accent text-white dark:bg-rose-600 dark:text-white',
    success: 'bg-pixel-success text-pixel-text dark:bg-emerald-600 dark:text-white',
    ghost:   'bg-pixel-card text-pixel-text dark:bg-slate-800 dark:text-slate-100',
  };
 
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      className={[
        'inline-flex items-center justify-center gap-2 px-5 py-2.5',
        'font-pixel text-sm rounded-pixel border-2',
        'border-pixel-border dark:border-transparent',
        'shadow-pixel dark:shadow-none',
        'transition-transform duration-150 ease-out',
        'hover:-translate-y-0.5 active:translate-y-0',
        pressed ? 'shadow-pixel-press translate-x-[2px] translate-y-[2px]' : '',
        disabled ? 'opacity-40 cursor-not-allowed hover:translate-y-0' : 'cursor-pointer',
        variants[variant],
        className,
      ].join(' ')}
      {...rest}
    >
      {children}
    </button>
  );
}
 
