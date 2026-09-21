export default function PixelHeartRow({ current = 3, max = 3, className = '' }) {
  return (
    <div className={`flex items-center gap-1 ${className}`} aria-label={`${current} of ${max} lives`}>
      {Array.from({ length: max }).map((_, i) => (
        <span
          key={i}
          className={[
            'text-lg leading-none select-none transition-transform duration-200',
            i < current ? 'scale-100' : 'scale-90 opacity-30 grayscale',
          ].join(' ')}
        >
          ❤️
        </span>
      ))}
    </div>
  );
}
 