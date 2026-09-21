export default function FloatingDecor({ variant = 'clouds', className = '' }) {
  if (variant === 'sparkles') {
    const positions = [
      { top: '8%', left: '6%', delay: '0s' },
      { top: '70%', left: '92%', delay: '.4s' },
      { top: '15%', left: '85%', delay: '.8s' },
      { top: '80%', left: '10%', delay: '1.1s' },
    ];
    return (
      <div className={`pointer-events-none absolute inset-0 dark:hidden ${className}`} aria-hidden="true">
        {positions.map((p, i) => (
          <span
            key={i}
            className="absolute text-pixel-primary animate-sparkle text-lg"
            style={{ top: p.top, left: p.left, animationDelay: p.delay }}
          >
            ✦
          </span>
        ))}
      </div>
    );
  }
 
  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden dark:hidden ${className}`} aria-hidden="true">
      <span className="absolute top-[10%] left-[8%] text-4xl opacity-70 animate-float">☁️</span>
      <span className="absolute top-[20%] right-[12%] text-3xl opacity-60 animate-float" style={{ animationDelay: '1.5s' }}>☁️</span>
      <span className="absolute bottom-[15%] left-[20%] text-2xl opacity-50 animate-float" style={{ animationDelay: '3s' }}>☁️</span>
    </div>
  );
}
 
