import type { ReactNode } from 'react';

interface ArchFrameProps {
  src: string;
  alt: string;
  className?: string;
  /** Offset outline arch drawn behind the photo. */
  outline?: boolean;
  tilt?: number;
  children?: ReactNode;
}

/**
 * Photo masked into a tall arch with an offset outline arch behind it.
 * Size is controlled by the parent via `className` (width + aspect).
 */
export function ArchFrame({ src, alt, className = '', outline = true, tilt = 0, children }: ArchFrameProps) {
  return (
    <div className={`relative ${className}`} style={tilt ? { transform: `rotate(${tilt}deg)` } : undefined}>
      {outline && (
        <span
          aria-hidden
          className="absolute inset-0 translate-x-2.5 translate-y-2.5 rounded-t-full rounded-b-[28px] border border-ink/20"
        />
      )}
      <div className="relative h-full w-full overflow-hidden rounded-t-full rounded-b-[28px] bg-sunk ring-1 ring-white/60 ring-inset">
        <img src={src} alt={alt} className="h-full w-full object-cover" draggable={false} />
        {children}
      </div>
    </div>
  );
}
