import { useState } from 'react';
import { Undo2, Trophy, History, Target } from 'lucide-react';
import type { Exercise, SetRecord } from '../../types/workout';
import type { ExerciseBest, LastPerformance } from '../../lib/progressStats';
import { epley, formatVolume } from '../../lib/progressStats';
import { SetBeads } from '../../components/art/SetBeads';
import { Stepper } from '../../components/ui/Stepper';
import { Button } from '../../components/ui/Button';
import { haptics } from '../../lib/haptics';

interface SetLoggerProps {
  exercise: Exercise;
  sets: SetRecord[];
  roleTint: 'p1' | 'p2';
  ownerName?: string;
  last: LastPerformance | null;
  best: ExerciseBest | undefined;
  onLog: (setNumber: number, weightKg: number, reps: number) => void;
  onUndo: (setNumber: number) => void;
  onExerciseComplete: () => void;
}

function parseTargetReps(target: string): number {
  const match = /\d+/.exec(target);
  return match ? parseInt(match[0], 10) : 10;
}

function parseTargetRange(target: string): [number, number] | null {
  const match = /(\d+)\s*-\s*(\d+)/.exec(target);
  if (match?.[1] && match[2]) return [parseInt(match[1], 10), parseInt(match[2], 10)];
  const single = /^(\d+)$/.exec(target.trim());
  return single?.[1] ? [parseInt(single[1], 10), parseInt(single[1], 10)] : null;
}

function firstOpenSet(sets: SetRecord[], targetSets: number): number {
  for (let n = 1; n <= targetSets; n++) {
    if (!sets.find(s => s.setNumber === n)?.isCompleted) return n;
  }
  return targetSets;
}

function toNum(v: string | undefined): number {
  const n = parseFloat(v ?? '');
  return Number.isFinite(n) ? n : 0;
}

/**
 * Self-contained set logger for one exercise row.
 * Drafts are seeded from: this set → previous set today → last session → target.
 */
export function SetLogger({
  exercise,
  sets,
  roleTint,
  ownerName,
  last,
  best,
  onLog,
  onUndo,
  onExerciseComplete,
}: SetLoggerProps) {
  const seedFor = (setNumber: number): { weight: number; reps: number } => {
    const own = sets.find(s => s.setNumber === setNumber);
    if (own?.isCompleted && toNum(own.repsCompleted) > 0) {
      return { weight: toNum(own.weightKg), reps: toNum(own.repsCompleted) };
    }
    const previous = [...sets]
      .filter(s => s.isCompleted && s.setNumber < setNumber && toNum(s.repsCompleted) > 0)
      .sort((a, b) => b.setNumber - a.setNumber)[0];
    if (previous) return { weight: toNum(previous.weightKg), reps: toNum(previous.repsCompleted) };
    if (last) return { weight: last.weightKg, reps: last.reps };
    return { weight: 0, reps: parseTargetReps(exercise.targetReps) };
  };

  const initialSet = firstOpenSet(sets, exercise.targetSets);
  const [activeSet, setActiveSet] = useState<number>(initialSet);
  const [weight, setWeight] = useState<number>(() => seedFor(initialSet).weight);
  const [reps, setReps] = useState<number>(() => seedFor(initialSet).reps);
  const [prFlash, setPrFlash] = useState<boolean>(false);

  const selectSet = (n: number) => {
    setActiveSet(n);
    const seed = seedFor(n);
    setWeight(seed.weight);
    setReps(seed.reps);
  };

  const activeRecord = sets.find(s => s.setNumber === activeSet);
  const isActiveLogged = Boolean(activeRecord?.isCompleted);
  const completedCount = sets.filter(s => s.isCompleted).length;
  const range = parseTargetRange(exercise.targetReps);
  const repsStatus = !range ? null : reps < range[0] ? 'below' : reps > range[1] ? 'above' : 'in';
  const loggedVolume = sets
    .filter(s => s.isCompleted)
    .reduce((acc, s) => acc + toNum(s.weightKg) * toNum(s.repsCompleted), 0);

  const handleLog = () => {
    const isPr = Boolean(best) && epley(weight, reps) > (best?.e1rm ?? Infinity);
    onLog(activeSet, weight, reps);
    if (isPr) {
      haptics.celebration();
      setPrFlash(true);
      window.setTimeout(() => setPrFlash(false), 2400);
    }
    const remaining = Array.from({ length: exercise.targetSets }, (_, i) => i + 1).filter(
      n => n !== activeSet && !sets.find(s => s.setNumber === n)?.isCompleted,
    );
    const next = remaining.find(n => n > activeSet) ?? remaining[0];
    if (next !== undefined) {
      setActiveSet(next);
      // Carry the just-logged values forward; they are the best predictor for the next set.
      setWeight(weight);
      setReps(reps);
    } else if (!isActiveLogged) {
      onExerciseComplete();
    }
  };

  const handleUndo = () => {
    haptics.tap();
    onUndo(activeSet);
  };

  return (
    <div className="flex flex-col gap-3.5">
      {/* Context line: last session + best */}
      <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-medium">
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-sunk text-ink-muted">
          <History size={11} aria-hidden />
          {last ? `Last ${last.weightKg}kg × ${last.reps}` : 'First session'}
        </span>
        {best && (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-butter/60 text-ink">
            <Trophy size={11} aria-hidden />
            Best {best.weightKg}kg × {best.reps}
          </span>
        )}
        <span className="ml-auto font-mono tabular-nums text-ink-muted">
          {completedCount}/{exercise.targetSets} · {formatVolume(loggedVolume)}
        </span>
      </div>

      <SetBeads
        targetSets={exercise.targetSets}
        sets={sets}
        activeSetNumber={activeSet}
        onSelectSet={selectSet}
        roleTint={roleTint}
      />

      <div className="flex items-center gap-2">
        <Stepper label={`Set ${activeSet} weight`} value={weight} onChange={setWeight} step={2.5} min={0} max={400} unit="kg" />
        <Stepper label={`Set ${activeSet} reps`} value={reps} onChange={setReps} step={1} min={0} max={100} unit="reps" />
      </div>

      {repsStatus && (
        <p
          className={`flex items-center gap-1.5 text-[11px] font-medium px-1 ${
            repsStatus === 'in' ? 'text-sage-700' : 'text-ink-muted'
          }`}
        >
          <Target size={12} aria-hidden />
          {repsStatus === 'in'
            ? `In target range (${exercise.targetReps})`
            : repsStatus === 'below'
              ? `Below target ${exercise.targetReps}, consider dropping weight`
              : `Above target ${exercise.targetReps}, add weight next set`}
        </p>
      )}

      <div className="flex items-center gap-2">
        <Button variant="primary" onClick={handleLog} className="flex-1" disabled={reps <= 0}>
          {isActiveLogged ? `Update set ${activeSet}` : `Log set ${activeSet}`}
          <span className="font-mono text-[13px] opacity-70 tabular-nums">
            {weight}×{reps}
          </span>
          {ownerName && <span className="sr-only"> for {ownerName}</span>}
        </Button>
        {isActiveLogged && (
          <Button variant="glass" size="icon" onClick={handleUndo} aria-label={`Undo set ${activeSet}`} title="Undo set">
            <Undo2 size={16} />
          </Button>
        )}
      </div>

      {prFlash && (
        <div
          role="status"
          className="flex items-center justify-center gap-2 py-2 rounded-2xl bg-butter/70 text-ink text-xs font-semibold animate-rise"
        >
          <Trophy size={14} className="text-sage-700" /> New personal record!
        </div>
      )}
    </div>
  );
}
