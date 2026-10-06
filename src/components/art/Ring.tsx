import { motion, useReducedMotion } from 'motion/react';
import type { ReactNode } from 'react';

interface RingTrack {
  /** 0..1 */
  value: number;
  className: string;
}

interface RingProps {
  size?: number;
  stroke?: number;
  gap?: number;
  tracks: RingTrack[];
  label?: string;
  children?: ReactNode;
}

/** Concentric progress arcs. First track is the outermost. */
export function Ring({ size = 88, stroke = 6, gap = 4, tracks, label, children }: RingProps) {
  const reduce = useReducedMotion();
  const center = size / 2;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }} role="img" aria-label={label}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        {tracks.map((t, i) => {
          const r = center - stroke / 2 - i * (stroke + gap);
          const circumference = 2 * Math.PI * r;
          const clamped = Math.max(0, Math.min(1, t.value));
          return (
            <g key={i}>
              <circle cx={center} cy={center} r={r} fill="none" stroke="currentColor" strokeWidth={stroke} className="text-ink/[0.06]" />
              <motion.circle
                cx={center}
                cy={center}
                r={r}
                fill="none"
                stroke="currentColor"
                strokeWidth={stroke}
                strokeLinecap="round"
                strokeDasharray={circumference}
                initial={reduce ? false : { strokeDashoffset: circumference }}
                animate={{ strokeDashoffset: circumference * (1 - clamped) }}
                transition={{ duration: 0.9, delay: 0.1 + i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                className={t.className}
              />
            </g>
          );
        })}
      </svg>
      {children && <div className="absolute inset-0 flex items-center justify-center">{children}</div>}
    </div>
  );
}
