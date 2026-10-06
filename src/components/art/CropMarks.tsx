interface CropMarksProps {
  /** Distance outside the frame, in px. */
  offset?: number;
  /** Tick length, in px. */
  length?: number;
  className?: string;
}

/** Four L-shaped corner ticks, like a print proof. Parent must be `relative`. */
export function CropMarks({ offset = 6, length = 14, className = 'text-ink/25' }: CropMarksProps) {
  const corners = [
    { key: 'tl', style: { top: -offset, left: -offset }, d: `M0 ${length} V0 H${length}` },
    { key: 'tr', style: { top: -offset, right: -offset }, d: `M0 0 H${length} V${length}` },
    { key: 'bl', style: { bottom: -offset, left: -offset }, d: `M0 0 V${length} H${length}` },
    { key: 'br', style: { bottom: -offset, right: -offset }, d: `M0 ${length} H${length} V0` },
  ];
  return (
    <>
      {corners.map((c) => (
        <svg
          key={c.key}
          aria-hidden
          width={length}
          height={length}
          viewBox={`0 0 ${length} ${length}`}
          style={c.style}
          className={`pointer-events-none absolute ${className}`}
          fill="none"
          stroke="currentColor"
          strokeWidth={1.25}
        >
          <path d={c.d} />
        </svg>
      ))}
    </>
  );
}
