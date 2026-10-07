import { useState } from 'react';
import { useRouter } from '../router/Router';
import { useAuth } from '../context/AuthContext';
import { useRestTimer } from '../hooks/useRestTimer';
import { useWorkoutSession } from '../hooks/useWorkoutSession';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Segmented } from '../components/ui/Segmented';
import { RestTimerHUD } from '../features/workout/RestTimerHUD';
import { ExerciseRow } from '../features/workout/ExerciseRow';
import { ThemeToggle } from '../components/ui/ThemeToggle';
import { getSplitCoverPath } from '../lib/assetsMap';
import { DAY_SCHEDULES } from '../data/initialWorkoutPlan';
import { StorageService } from '../services/storageService';
import { bestByExercise, lastPerformance, epley, formatVolume } from '../lib/progressStats';
import type { Exercise, WorkoutDayLog } from '../types/workout';
import { ChevronLeft, ChevronRight, Trophy, Leaf, Timer, Dumbbell, Layers } from 'lucide-react';
import { haptics } from '../lib/haptics';

interface TrainPageProps {
  onOpenVideo?: (url: string, title: string) => void;
}

type Role = 'person_1' | 'person_2';
interface RowRef {
  role: Role;
  exercise: Exercise;
}

const rowKey = (r: RowRef) => `${r.role}:${r.exercise.id}`;

export function TrainPage({ onOpenVideo }: TrainPageProps) {
  const { navigate } = useRouter();
  const { user, partner } = useAuth();

  const { restSecondsRemaining, isRestTimerRunning, startRestTimer, adjustRestTime, skipRest } = useRestTimer();

  const {
    p1Name,
    p2Name,
    myRole,
    selectedDayKey,
    selectedDateStr,
    setSelectedDayKey,
    currentSchedule,
    p1Exercises,
    p2Exercises,
    p1DayLog,
    p2DayLog,
    updateSet,
  } = useWorkoutSession({ user, partner, onStartRest: () => startRestTimer(60) });

  const [mode, setMode] = useState<'together' | 'solo'>(partner ? 'together' : 'solo');
  const [focusKey, setFocusKey] = useState<string | null>(null);

  const logFor = (role: Role): WorkoutDayLog => (role === 'person_1' ? p1DayLog : p2DayLog);
  const nameFor = (role: Role) => (role === 'person_1' ? p1Name : p2Name);
  const setsFor = (r: RowRef) => logFor(r.role).exercisesProgress[r.exercise.id]?.sets ?? [];
  const isRowDone = (r: RowRef) => Boolean(logFor(r.role).exercisesProgress[r.exercise.id]?.isFullyCompleted);

  // Prior history (excluding the day being edited) drives last-session hints and PR detection.
  const priorLogs = {
    person_1: StorageService.listDayLogs('person_1').filter(l => l.dateStr !== selectedDateStr),
    person_2: StorageService.listDayLogs('person_2').filter(l => l.dateStr !== selectedDateStr),
  };
  const priorBest = { person_1: bestByExercise(priorLogs.person_1), person_2: bestByExercise(priorLogs.person_2) };

  // Ordered rows for the current mode: solo = my list, together = station-interleaved.
  const myExercises = myRole === 'person_1' ? p1Exercises : p2Exercises;
  const maxStations = Math.max(p1Exercises.length, p2Exercises.length);
  const orderedRows: RowRef[] =
    mode === 'solo'
      ? myExercises.map(exercise => ({ role: myRole, exercise }))
      : Array.from({ length: maxStations }).flatMap((_, i) => {
          const rows: RowRef[] = [];
          const a = p1Exercises[i];
          const b = p2Exercises[i];
          if (a) rows.push({ role: 'person_1', exercise: a });
          if (b) rows.push({ role: 'person_2', exercise: b });
          return rows;
        });

  const firstOpen = orderedRows.find(r => !isRowDone(r));
  const activeKey = focusKey ?? (firstOpen ? rowKey(firstOpen) : null);

  const advanceFrom = (current: RowRef) => {
    const idx = orderedRows.findIndex(r => rowKey(r) === rowKey(current));
    const after = [...orderedRows.slice(idx + 1), ...orderedRows.slice(0, idx)];
    const next = after.find(r => !isRowDone(r));
    if (!next) {
      setFocusKey(null);
      return;
    }
    setFocusKey(rowKey(next));
    window.setTimeout(() => {
      document
        .getElementById(`row-${next.role}-${next.exercise.id}`)
        ?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
    }, 120);
  };

  const handleLog = (r: RowRef, setNumber: number, weightKg: number, reps: number) => {
    haptics.success();
    updateSet(r.role, r.exercise.id, setNumber, {
      isCompleted: true,
      weightKg: String(weightKg),
      repsCompleted: String(reps),
      completedAt: new Date().toISOString(),
    });
  };

  const handleUndo = (r: RowRef, setNumber: number) => {
    updateSet(r.role, r.exercise.id, setNumber, { isCompleted: false, completedAt: undefined });
  };

  // Day navigation
  const currentDayIndex = DAY_SCHEDULES.findIndex(d => d.key === selectedDayKey);
  const shiftDay = (delta: 1 | -1) => {
    haptics.tap();
    const target = DAY_SCHEDULES[(currentDayIndex + delta + DAY_SCHEDULES.length) % DAY_SCHEDULES.length];
    if (target) {
      setSelectedDayKey(target.key);
      setFocusKey(null);
    }
  };

  // Session metrics for the visible scope
  const scopeRows = orderedRows;
  const totalSets = scopeRows.reduce((a, r) => a + r.exercise.targetSets, 0);
  const doneSets = scopeRows.reduce((a, r) => a + setsFor(r).filter(s => s.isCompleted).length, 0);
  const progressPct = totalSets > 0 ? Math.round((doneSets / totalSets) * 100) : 0;
  const isSessionFinished = totalSets > 0 && doneSets >= totalSets;

  const summary = (() => {
    let volume = 0;
    let prs = 0;
    const stamps: number[] = [];
    for (const r of scopeRows) {
      const best = priorBest[r.role].get(r.exercise.id);
      let rowTop = 0;
      for (const s of setsFor(r)) {
        if (!s.isCompleted) continue;
        const w = parseFloat(s.weightKg) || 0;
        const reps = parseFloat(s.repsCompleted) || 0;
        volume += w * reps;
        rowTop = Math.max(rowTop, epley(w, reps));
        if (s.completedAt) stamps.push(Date.parse(s.completedAt));
      }
      if (best && rowTop > best.e1rm) prs += 1;
    }
    const minutes = stamps.length > 1 ? Math.round((Math.max(...stamps) - Math.min(...stamps)) / 60000) : null;
    return { volume, prs, minutes };
  })();

  const stations =
    mode === 'together'
      ? Array.from({ length: maxStations }).map((_, i) => ({
          label: p1Exercises[i]?.pair || p2Exercises[i]?.pair || `Station ${i + 1}`,
          rows: orderedRows.filter(r => p1Exercises[i] === r.exercise || p2Exercises[i] === r.exercise),
        }))
      : [{ label: '', rows: orderedRows }];

  return (
    <div className="w-full max-w-[560px] mx-auto px-5 pt-4 pb-40 animate-rise">
      {/* Header */}
      <header className="relative w-full h-36 rounded-[28px] overflow-hidden mb-4 bg-sunk">
        <img
          src={getSplitCoverPath(selectedDayKey)}
          alt=""
          aria-hidden
          className="absolute inset-0 w-full h-full object-cover"
          draggable={false}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/75 via-ink/30 to-ink/10" />
        <div className="absolute top-3 right-3 z-10">
          <ThemeToggle />
        </div>
        <div className="absolute inset-x-0 bottom-0 p-4 flex items-end justify-between gap-3 z-10">
          <button
            type="button"
            onClick={() => shiftDay(-1)}
            className="glass size-11 rounded-full flex items-center justify-center text-ink active:scale-95 transition cursor-pointer"
            aria-label="Previous day"
          >
            <ChevronLeft size={18} />
          </button>
          <div className="text-center text-white min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/75">
              {currentSchedule.name}
            </p>
            <h1 className="font-display text-2xl font-medium leading-tight truncate">
              {currentSchedule.splitTitle.split('(')[0]?.trim()}
            </h1>
          </div>
          <button
            type="button"
            onClick={() => shiftDay(1)}
            className="glass size-11 rounded-full flex items-center justify-center text-ink active:scale-95 transition cursor-pointer"
            aria-label="Next day"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </header>

      {/* Mode + progress */}
      {!currentSchedule.isRest && orderedRows.length > 0 && (
        <div className="sticky top-2 z-20 mb-5 flex flex-col gap-2.5 glass-strong rounded-[22px] p-2.5 shadow-float">
          {partner && (
            <Segmented
              label="Training mode"
              value={mode}
              onChange={val => {
                haptics.tap();
                setMode(val);
                setFocusKey(null);
              }}
              options={[
                { value: 'together', label: 'Together' },
                { value: 'solo', label: 'Just me' },
              ]}
            />
          )}
          <div className="flex items-center gap-3 px-1.5">
            <div
              className="h-2 flex-1 rounded-full bg-sunk overflow-hidden"
              role="progressbar"
              aria-valuenow={progressPct}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Session progress"
            >
              <div
                className="h-full rounded-full bg-gradient-to-r from-sage-300 to-sage-500 transition-[width] duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <span className="text-xs font-mono font-semibold tabular-nums text-ink">
              {doneSets}/{totalSets}
            </span>
          </div>
        </div>
      )}

      {currentSchedule.isRest ? (
        <Card variant="tinted" className="p-8 text-center flex flex-col items-center gap-3">
          <span className="size-12 rounded-full bg-sage-100 text-sage-700 flex items-center justify-center">
            <Leaf size={22} />
          </span>
          <h2 className="font-display text-xl font-medium text-ink">Scheduled rest day</h2>
          <p className="text-xs text-ink-muted max-w-xs">Recovery is part of the program. Use the arrows to log ahead.</p>
          <Button variant="glass" size="sm" onClick={() => navigate('/')}>
            Back to today
          </Button>
        </Card>
      ) : orderedRows.length === 0 ? (
        <Card variant="tinted" className="p-8 text-center flex flex-col items-center gap-3">
          <h2 className="font-display text-xl font-medium text-ink">No exercises scheduled</h2>
          <p className="text-xs text-ink-muted">Load the 5-day duo split from the Today tab.</p>
          <Button variant="primary" size="sm" onClick={() => navigate('/')}>
            Go to today
          </Button>
        </Card>
      ) : (
        <div className="flex flex-col gap-6">
          {stations.map((station, si) => (
            <section key={station.label || si} className="flex flex-col gap-2.5" aria-label={station.label || 'Exercises'}>
              {mode === 'together' && (
                <div className="flex items-center gap-2 px-1">
                  <span className="size-6 rounded-full bg-ink text-surface flex items-center justify-center text-[11px] font-bold">
                    {si + 1}
                  </span>
                  <h2 className="text-[11px] font-bold uppercase tracking-[0.14em] text-ink-muted">{station.label}</h2>
                  {station.rows.every(isRowDone) && (
                    <span className="ml-auto text-[11px] font-semibold text-sage-700">Station complete</span>
                  )}
                </div>
              )}
              {station.rows.map(r => {
                const key = rowKey(r);
                return (
                  <ExerciseRow
                    key={key}
                    exercise={r.exercise}
                    sets={setsFor(r)}
                    role={r.role}
                    ownerName={nameFor(r.role)}
                    showOwner={mode === 'together'}
                    isExpanded={activeKey === key}
                    isDone={isRowDone(r)}
                    last={lastPerformance(priorLogs[r.role], r.exercise.id, selectedDateStr)}
                    best={priorBest[r.role].get(r.exercise.id)}
                    dateStr={selectedDateStr}
                    onExpand={() => setFocusKey(activeKey === key ? '' : key)}
                    onLog={(n, w, reps) => handleLog(r, n, w, reps)}
                    onUndo={n => handleUndo(r, n)}
                    onExerciseComplete={() => advanceFrom(r)}
                    onOpenVideo={onOpenVideo}
                  />
                );
              })}
            </section>
          ))}
        </div>
      )}

      <RestTimerHUD
        secondsRemaining={restSecondsRemaining}
        isRunning={isRestTimerRunning}
        onAdjust={adjustRestTime}
        onSkip={skipRest}
      />

      {isSessionFinished && (
        <Card variant="tinted" className="mt-8 p-6 flex flex-col items-center gap-4 text-center animate-rise">
          <span className="size-14 rounded-full bg-butter/70 flex items-center justify-center">
            <Trophy size={26} className="text-sage-700" />
          </span>
          <div>
            <h2 className="font-display text-2xl font-medium text-ink">Session complete</h2>
            <p className="text-xs text-ink-muted mt-1">
              {mode === 'together' ? 'Both of you hit every set.' : 'Every target set logged.'}
            </p>
          </div>
          <dl className="grid grid-cols-3 gap-2 w-full">
            {[
              { icon: <Dumbbell size={14} />, label: 'Volume', value: formatVolume(summary.volume) },
              { icon: <Layers size={14} />, label: 'Sets', value: String(doneSets) },
              summary.prs > 0
                ? { icon: <Trophy size={14} />, label: 'PRs', value: String(summary.prs) }
                : { icon: <Timer size={14} />, label: 'Minutes', value: summary.minutes !== null ? String(summary.minutes) : '—' },
            ].map(stat => (
              <div key={stat.label} className="rounded-2xl bg-surface/80 border border-hairline p-3">
                <dt className="flex items-center justify-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-ink-muted">
                  {stat.icon}
                  {stat.label}
                </dt>
                <dd className="font-display text-xl text-ink tabular-nums mt-0.5">{stat.value}</dd>
              </div>
            ))}
          </dl>
          <Button variant="primary" onClick={() => navigate('/')} className="w-full">
            View progress
          </Button>
        </Card>
      )}
    </div>
  );
}
