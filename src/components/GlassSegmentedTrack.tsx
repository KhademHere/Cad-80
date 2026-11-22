import { useLayoutEffect, useRef, useState } from 'react';

export interface GlassSegmentOption<T extends string> {
  id: T;
  label: string;
}

interface GlassSegmentedTrackProps<T extends string> {
  options: Array<GlassSegmentOption<T>>;
  value: T;
  onChange: (value: T) => void;
  ariaLabel: string;
  as?: 'nav' | 'group';
  layout?: 'inline' | 'grid-3';
  size?: 'sm' | 'md';
  mono?: boolean;
  className?: string;
}

interface IndicatorRect {
  x: number;
  y: number;
  width: number;
  height: number;
  ready: boolean;
}

export function GlassSegmentedTrack<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
  as = 'group',
  layout = 'inline',
  size = 'md',
  mono = false,
  className = '',
}: GlassSegmentedTrackProps<T>) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const buttonRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const hasMeasuredRef = useRef(false);
  const [rect, setRect] = useState<IndicatorRect>({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    ready: false,
  });

  useLayoutEffect(() => {
    const updateIndicator = () => {
      const activeEl = buttonRefs.current[value];
      if (!activeEl) return;
      const nextWidth = activeEl.offsetWidth;
      const nextHeight = activeEl.offsetHeight;
      if (nextWidth === 0 || nextHeight === 0) return;

      setRect({
        x: activeEl.offsetLeft,
        y: activeEl.offsetTop,
        width: nextWidth,
        height: nextHeight,
        ready: true,
      });
      hasMeasuredRef.current = true;
    };

    updateIndicator();

    const container = containerRef.current;
    if (!container || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(updateIndicator);
    observer.observe(container);
    return () => observer.disconnect();
  }, [value, options]);

  const layoutClass =
    layout === 'grid-3'
      ? 'grid grid-cols-3 gap-1 p-1'
      : size === 'sm'
        ? 'inline-flex items-center gap-0.5 p-0.5'
        : 'flex items-center gap-1 p-1';

  const buttonPaddingClass =
    size === 'sm'
      ? 'px-3 py-1 text-[11px]'
      : layout === 'grid-3'
        ? 'py-1.5 px-2 text-xs'
        : 'px-3.5 sm:px-4 py-1.5 text-xs sm:text-[13px]';

  const content = (
    <div
      ref={containerRef}
      role={as === 'group' ? 'group' : undefined}
      aria-label={as === 'group' ? ariaLabel : undefined}
      className={`relative rounded-full liquid-glass-track ${layoutClass} ${className}`}
    >
      {/* Spring-gliding translucent glass capsule */}
      <span
        aria-hidden="true"
        style={{
          transform: `translate3d(${rect.x}px, ${rect.y}px, 0)`,
          width: `${rect.width}px`,
          height: `${rect.height}px`,
          opacity: rect.ready ? 1 : 0,
          transition: hasMeasuredRef.current
            ? 'transform 340ms cubic-bezier(0.34, 1.56, 0.64, 1), width 280ms cubic-bezier(0.34, 1.56, 0.64, 1), opacity 160ms ease'
            : 'none',
        }}
        className="liquid-glass-capsule pointer-events-none absolute top-0 left-0 rounded-full will-change-transform"
      />

      {options.map((opt) => {
        const isSelected = value === opt.id;
        return (
          <button
            key={opt.id}
            ref={(el) => {
              buttonRefs.current[opt.id] = el;
            }}
            type="button"
            aria-current={as === 'nav' && isSelected ? 'page' : undefined}
            aria-pressed={as === 'group' ? isSelected : undefined}
            onClick={() => onChange(opt.id)}
            className={`relative z-10 rounded-full font-medium whitespace-nowrap shrink-0 cursor-pointer transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 ${buttonPaddingClass} ${
              mono ? 'font-mono tabular-nums' : ''
            } ${
              isSelected
                ? 'text-slate-950 font-semibold'
                : 'text-slate-600 hover:text-slate-950'
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );

  if (as === 'nav') {
    return <nav aria-label={ariaLabel}>{content}</nav>;
  }

  return content;
}
