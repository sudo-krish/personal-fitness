interface ContoursProps {
  /** Same seed always draws the same pattern (e.g. the day key). */
  seed?: string;
  lines?: number;
  drift?: boolean;
  className?: string;
}

function hashSeed(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(a: number) {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function buildPaths(seed: string, lines: number): string[] {
  const rand = mulberry32(hashSeed(seed));
  const paths: string[] = [];
  const width = 400;
  const steps = 8;
  for (let l = 0; l < lines; l++) {
    const baseY = 30 + l * (240 / lines) + rand() * 10;
    const amp = 10 + rand() * 18;
    const phase = rand() * Math.PI * 2;
    let d = `M -20 ${baseY.toFixed(1)}`;
    for (let s = 1; s <= steps; s++) {
      const x = -20 + (s * (width + 40)) / steps;
      const cx = x - (width + 40) / steps / 2;
      const cy = baseY + Math.sin(phase + s * 0.9) * amp + Math.cos(l * 0.7 + s) * 4;
      const y = baseY + Math.sin(phase + s * 0.9 + 0.5) * amp * 0.6;
      d += ` Q ${cx.toFixed(1)} ${cy.toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)}`;
    }
    paths.push(d);
  }
  return paths;
}

/** Topographic ripple lines. Decorative only. */
export function Contours({ seed = 'duo', lines = 8, drift = false, className = 'text-ink/10' }: ContoursProps) {
  const paths = buildPaths(seed, lines);
  return (
    <svg
      aria-hidden
      viewBox="0 0 400 300"
      preserveAspectRatio="xMidYMid slice"
      className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
      fill="none"
      stroke="currentColor"
      strokeWidth={1}
      vectorEffect="non-scaling-stroke"
    >
      <g className={drift ? 'animate-drift' : undefined}>
        {paths.map((d, i) => (
          <path key={i} d={d} vectorEffect="non-scaling-stroke" />
        ))}
      </g>
    </svg>
  );
}
