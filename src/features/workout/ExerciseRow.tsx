import { Play, Check, ChevronDown } from 'lucide-react';
import type { Exercise, SetRecord } from '../../types/workout';
import type { ExerciseBest, LastPerformance } from '../../lib/progressStats';
import { ExerciseThumb } from '../../components/ui/ExerciseThumb';
import { Avatar } from '../../components/ui/Avatar';
import { SetLogger } from './SetLogger';
import { haptics } from '../../lib/haptics';

interface ExerciseRowProps {
  exercise: Exercise;
  sets: SetRecord[];
  role: 'person_1' | 'person_2';
  ownerName: string;
  showOwner: boolean;
  isExpanded: boolean;
  isDone: boolean;
  last: LastPerformance | null;
  best: ExerciseBest | undefined;
  dateStr: string;
  onExpand: () => void;
  onLog: (setNumber: number, weightKg: number, reps: number) => void;
  onUndo: (setNumber: number) => void;
  onExerciseComplete: () => void;
  onOpenVideo?: (url: string, title: string) => void;
}

/** Collapsible exercise card: summary header + inline SetLogger when focused. */
export function ExerciseRow({
  exercise,
  sets,
  role,
  ownerName,
  showOwner,
  isExpanded,
  isDone,
  last,
  best,
  dateStr,
  onExpand,
  onLog,
  onUndo,
  onExerciseComplete,
  onOpenVideo,
}: ExerciseRowProps) {
  const tint = role === 'person_1' ? 'p1' : 'p2';
  const completed = sets.filter(s => s.isCompleted).length;
  const pct = exercise.targetSets > 0 ? (completed / exercise.targetSets) * 100 : 0;

  return (
    <article
      id={`row-${role}-${exercise.id}`}
      className={`scroll-mt-24 rounded-[22px] border transition-[box-shadow,border-color,background-color] duration-300 ${
        isExpanded
          ? 'bg-surface border-sage-300 shadow-card'
          : isDone
            ? 'bg-sage-100/40 border-hairline'
            : 'bg-surface/70 border-hairline hover:border-ink/20'
      }`}
    >
      <div className="flex items-center gap-3 p-3">
        <button
          type="button"
          onClick={() => {
            haptics.tap();
            onExpand();
          }}
          aria-expanded={isExpanded}
          aria-controls={`logger-${role}-${exercise.id}`}
          className="flex flex-1 items-center gap-3 min-w-0 text-left cursor-pointer rounded-2xl focus-visible:outline-2 focus-visible:outline-sage-500"
        >
          <div className="relative size-14 rounded-2xl overflow-hidden shrink-0 bg-sunk">
            <ExerciseThumb exercise={exercise} className="size-full" />
            {isDone && (
              <span className="absolute inset-0 bg-sage-500/55 flex items-center justify-center text-white">
                <Check size={22} strokeWidth={2.5} />
              </span>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              {showOwner && <Avatar name={ownerName} role={tint} size={18} />}
              <h3 className="text-[15px] font-semibold text-ink leading-tight truncate">{exercise.name}</h3>
            </div>
            <p className="text-xs text-ink-muted mt-0.5 tabular-nums truncate">
              {exercise.targetSets} × {exercise.targetReps}
              {exercise.targetRpe ? ` · RPE ${exercise.targetRpe}` : ''} · {exercise.muscle}
            </p>
            <div className="mt-2 flex items-center gap-2">
              <div className="h-1 flex-1 max-w-[120px] rounded-full bg-sunk overflow-hidden">
                <div
                  className={`h-full rounded-full transition-[width] duration-500 ${tint === 'p1' ? 'bg-p1-ink/70' : 'bg-p2-ink/70'}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="text-[10px] font-mono text-ink-muted tabular-nums">
                {completed}/{exercise.targetSets}
              </span>
            </div>
          </div>

          <ChevronDown
            size={18}
            aria-hidden
            className={`shrink-0 text-ink-muted transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
          />
        </button>

        {exercise.videoUrl && onOpenVideo && (
          <button
            type="button"
            onClick={() => onOpenVideo(exercise.videoUrl ?? '', exercise.name)}
            className="glass size-11 rounded-full flex items-center justify-center text-ink shrink-0 hover:bg-white/80 active:scale-95 transition cursor-pointer"
            aria-label={`Watch technique for ${exercise.name}`}
          >
            <Play size={14} className="fill-current ml-0.5" />
          </button>
        )}
      </div>

      {isExpanded && (
        <div id={`logger-${role}-${exercise.id}`} className="px-4 pb-4 pt-1 border-t border-hairline animate-rise">
          {exercise.notes && <p className="text-xs text-ink-muted leading-relaxed py-3">{exercise.notes}</p>}
          <SetLogger
            key={`${exercise.id}-${dateStr}`}
            exercise={exercise}
            sets={sets}
            roleTint={tint}
            ownerName={ownerName}
            last={last}
            best={best}
            onLog={onLog}
            onUndo={onUndo}
            onExerciseComplete={onExerciseComplete}
          />
        </div>
      )}
    </article>
  );
}
