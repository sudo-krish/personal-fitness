import { Check } from 'lucide-react';
import type { SetRecord } from '../../types/workout';
import { haptics } from '../../lib/haptics';

interface SetBeadsProps {
  targetSets: number;
  sets: SetRecord[];
  activeSetNumber: number;
  onSelectSet: (setNumber: number) => void;
  onToggleComplete?: (setNumber: number) => void;
  roleTint?: 'p1' | 'p2';
}

/** Set beads timeline with connecting hairline (spec §4.2 S4). */
export function SetBeads({
  targetSets,
  sets,
  activeSetNumber,
  onSelectSet,
  onToggleComplete,
  roleTint = 'p1',
}: SetBeadsProps) {
  const accentBorder = roleTint === 'p1' ? 'border-p1-ink' : 'border-p2-ink';

  return (
    <div className="relative flex items-center gap-3 py-1">
      {/* Connecting hairline */}
      <div className="absolute top-3.5 left-3 right-3 h-[1px] bg-ink/10 -translate-y-1/2" aria-hidden />

      {Array.from({ length: targetSets }).map((_, idx) => {
        const setNum = idx + 1;
        const record = sets.find((s) => s.setNumber === setNum);
        const isDone = Boolean(record?.isCompleted);
        const isActive = activeSetNumber === setNum;
        const weightText = record?.weightKg && record.weightKg !== '0' ? `${record.weightKg}k` : '—';

        return (
          <div key={setNum} className="relative z-10 flex flex-col items-center gap-1">
            <button
              type="button"
              onClick={() => {
                haptics.tap();
                if (isActive && onToggleComplete) {
                  onToggleComplete(setNum);
                } else {
                  onSelectSet(setNum);
                }
              }}
              onDoubleClick={() => {
                if (onToggleComplete) onToggleComplete(setNum);
              }}
              className={`size-7 rounded-full flex items-center justify-center transition-all cursor-pointer select-none ${
                isDone
                  ? 'bg-sage-300 text-sage-700 shadow-xs ring-1 ring-sage-500'
                  : isActive
                  ? `bg-surface ring-2 ring-offset-2 ring-offset-surface ${accentBorder}`
                  : 'bg-surface border border-ink/20 text-ink-muted hover:border-ink/40'
              }`}
              title={`Set ${setNum}${isDone ? ' (Done)' : ''}`}
              aria-label={`Set ${setNum}: ${isDone ? 'Completed' : isActive ? 'Active' : 'Pending'}`}
            >
              {isDone ? (
                <Check size={14} strokeWidth={2.5} />
              ) : (
                <span className="text-[11px] font-semibold tabular-nums text-ink">{setNum}</span>
              )}
            </button>

            {/* Logged weight tag */}
            <span className="text-[10px] font-mono text-ink-muted tracking-tight tabular-nums">
              {isDone ? weightText : `S${setNum}`}
            </span>
          </div>
        );
      })}
    </div>
  );
}
