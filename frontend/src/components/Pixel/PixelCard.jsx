export default function PixelCard({ children, className = '', hover = true, as: Tag = 'div', ...rest }) {
  return (
    <Tag
      className={[
        'bg-pixel-card dark:bg-slate-800',
        'border-2 border-pixel-border dark:border-slate-700',
        'rounded-pixel shadow-pixel dark:shadow-none',
        'p-5',
        hover ? 'transition-all duration-200 ease-out hover:-translate-y-1 hover:shadow-pixel-lg' : '',
        className,
      ].join(' ')}
      {...rest}
    >
      {children}
    </Tag>
  );
}
 