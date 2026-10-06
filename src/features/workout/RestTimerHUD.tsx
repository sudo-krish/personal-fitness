import { X } from 'lucide-react';
import { haptics } from '../../lib/haptics';

interface RestTimerHUDProps {
  secondsRemaining: number;
  isRunning: boolean;
  onAdjust: (delta: number) => void;
  onSkip: () => void;
}

/** Floating frosted rest timer pill (spec §4.4). */
export function RestTimerHUD({
  secondsRemaining,
  isRunning,
  onAdjust,
  onSkip,
}: RestTimerHUDProps) {
  if (!isRunning && secondsRemaining <= 0) {
    return null;
  }

  const mins = Math.floor(secondsRemaining / 60);
  const secs = secondsRemaining % 60;
  const timeFormatted = `${mins}:${secs.toString().padStart(2, '0')}`;

  // Approximate arc for 90s countdown cycle
  const maxTime = 90;
  const pct = Math.min(1, Math.max(0, secondsRemaining / maxTime));
  const radius = 10;
  const circumference = 2 * Math.PI * radius;

  return (
    <aside
      aria-label="Rest timer"
      className="fixed inset-x-0 z-40 flex justify-center px-4 pointer-events-none"
      style={{ bottom: 'calc(max(16px, var(--safe-bottom)) + 74px)' }}
    >
      <div className="glass-strong pointer-events-auto flex h-14 w-full max-w-[340px] items-center justify-between rounded-full px-4 py-2 shadow-float animate-rise">
        {/* Drawn Arc + Time */}
        <div className="flex items-center gap-2.5">
          <svg width={24} height={24} viewBox="0 0 24 24" className="-rotate-90 shrink-0">
            <circle cx={12} cy={12} r={radius} fill="none" stroke="currentColor" strokeWidth={2} className="text-ink/10" />
            <circle
              cx={12}
              cy={12}
              r={radius}
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - pct)}
              className="text-sage-500 transition-all duration-1000 ease-linear"
            />
          </svg>
          <div className="flex flex-col">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-ink-muted leading-none">Rest</span>
            <span className="font-mono text-base font-bold text-ink leading-tight tabular-nums">{timeFormatted}</span>
          </div>
        </div>

        {/* Adjust & Skip controls */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => {
              haptics.tap();
              onAdjust(15);
            }}
            className="h-8 px-2.5 rounded-full text-xs font-semibold text-ink bg-white/60 hover:bg-white active:scale-95 border border-white/80 transition-all cursor-pointer"
          >
            +15
          </button>
          <button
            type="button"
            onClick={() => {
              haptics.tap();
              onAdjust(30);
            }}
            className="h-8 px-2.5 rounded-full text-xs font-semibold text-ink bg-white/60 hover:bg-white active:scale-95 border border-white/80 transition-all cursor-pointer"
          >
            +30
          </button>
          <button
            type="button"
            onClick={() => {
              haptics.tap();
              onSkip();
            }}
            className="size-8 rounded-full flex items-center justify-center text-clay hover:bg-p2-tint/60 active:scale-95 transition-all cursor-pointer"
            aria-label="Skip rest"
            title="Skip rest"
          >
            <X size={15} />
          </button>
        </div>
      </div>
    </aside>
  );
}
