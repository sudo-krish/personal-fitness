import { useState } from 'react';
import { useRouter } from '../router/Router';
import { useAuth } from '../context/AuthContext';
import { useRestTimer } from '../hooks/useRestTimer';
import { useWorkoutSession } from '../hooks/useWorkoutSession';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Avatar } from '../components/ui/Avatar';
import { Segmented } from '../components/ui/Segmented';
import { Stepper } from '../components/ui/Stepper';
import { SetBeads } from '../components/art/SetBeads';
import { RestTimerHUD } from '../features/workout/RestTimerHUD';
import { CropMarks } from '../components/art/CropMarks';
import { ExerciseThumb } from '../components/ui/ExerciseThumb';
import { ThemeToggle } from '../components/ui/ThemeToggle';
import { getSplitCoverPath } from '../lib/assetsMap';
import { DAY_SCHEDULES } from '../data/initialWorkoutPlan';
import { Exercise } from '../types/workout';
import { ChevronLeft, ChevronRight, Play, CheckCircle2, Trophy } from 'lucide-react';
import { haptics } from '../lib/haptics';

interface TrainPageProps {
  onOpenVideo?: (url: string, title: string) => void;
}

export function TrainPage({ onOpenVideo }: TrainPageProps) {
  const { navigate } = useRouter();
  const { user, partner } = useAuth();
  const isPrimary = user?.isPrimary ?? true;

  const {
    restSecondsRemaining,
    isRestTimerRunning,
    startRestTimer,
    adjustRestTime,
    skipRest,
  } = useRestTimer();

  const {
    p1Name,
    p2Name,
    selectedDayKey,
    setSelectedDayKey,
    currentSchedule,
    p1Exercises,
    p2Exercises,
    p1DayLog,
    p2DayLog,
    updateSet,
  } = useWorkoutSession({
    user,
    partner,
    onStartRest: () => startRestTimer(60),
  });

  const [mode, setMode] = useState<'together' | 'solo'>('together');
  const [activeStationIdx, setActiveStationIdx] = useState<number>(0);
  const [activePartnerRow, setActivePartnerRow] = useState<'person_1' | 'person_2'>('person_1');
  const [activeSetNum, setActiveSetNum] = useState<number>(1);

  // Stepper draft values for current active set
  const [draftWeight, setDraftWeight] = useState<number>(20);
  const [draftReps, setDraftReps] = useState<number>(10);

  const myRole = isPrimary ? 'person_1' : 'person_2';

  const myExercises = isPrimary ? p1Exercises : p2Exercises;
  const myLog = isPrimary ? p1DayLog : p2DayLog;

  const maxStations = Math.max(p1Exercises.length, p2Exercises.length);

  // Day navigation cycling
  const currentDayIndex = DAY_SCHEDULES.findIndex((d) => d.key === selectedDayKey);
  const nextDay = () => {
    haptics.tap();
    const nextIdx = (currentDayIndex + 1) % DAY_SCHEDULES.length;
    const target = DAY_SCHEDULES[nextIdx];
    if (target) setSelectedDayKey(target.key);
  };
  const prevDay = () => {
    haptics.tap();
    const prevIdx = (currentDayIndex - 1 + DAY_SCHEDULES.length) % DAY_SCHEDULES.length;
    const target = DAY_SCHEDULES[prevIdx];
    if (target) setSelectedDayKey(target.key);
  };

  // Completion metrics
  const totalCombinedSets = p1Exercises.reduce((a, b) => a + b.targetSets, 0) + p2Exercises.reduce((a, b) => a + b.targetSets, 0);
  const completedCombinedSets =
    p1Exercises.reduce((acc, ex) => acc + (p1DayLog?.exercisesProgress[ex.id]?.sets.filter((s) => s.isCompleted).length || 0), 0) +
    p2Exercises.reduce((acc, ex) => acc + (p2DayLog?.exercisesProgress[ex.id]?.sets.filter((s) => s.isCompleted).length || 0), 0);

  const myTotalSets = myExercises.reduce((a, b) => a + b.targetSets, 0);
  const myCompletedSets = myExercises.reduce(
    (acc, ex) => acc + (myLog?.exercisesProgress[ex.id]?.sets.filter((s) => s.isCompleted).length || 0),
    0
  );

  const displaySets = mode === 'together' ? completedCombinedSets : myCompletedSets;
  const displayTotal = mode === 'together' ? totalCombinedSets : myTotalSets;
  const progressPct = displayTotal > 0 ? Math.round((displaySets / displayTotal) * 100) : 0;

  // Handle logging a set for an exercise
  const handleLogSet = (role: 'person_1' | 'person_2', exercise: Exercise, setNum: number) => {
    haptics.success();
    const targetLog = role === 'person_1' ? p1DayLog : p2DayLog;
    const existingSets = targetLog?.exercisesProgress[exercise.id]?.sets || [];
    const existing = existingSets.find((s) => s.setNumber === setNum);
    const willBeCompleted = !existing?.isCompleted;

    updateSet(role, exercise.id, setNum, {
      isCompleted: willBeCompleted,
      weightKg: String(draftWeight),
      repsCompleted: String(draftReps),
    });

    if (willBeCompleted && setNum < exercise.targetSets) {
      setActiveSetNum(setNum + 1);
    }
  };

  const isSessionFinished = displayTotal > 0 && displaySets >= displayTotal;

  return (
    <div className="w-full max-w-[560px] mx-auto px-5 pt-4 pb-36 animate-rise">
      {/* Top Header Controls */}
      <div className="flex items-center justify-between mb-3 px-1">
        <span className="text-[11px] font-bold uppercase tracking-wider text-ink-muted">
          Duo Training Session
        </span>
        <ThemeToggle />
      </div>

      {/* R1: SLIM DAY STRIP */}
      <div className="relative w-full h-32 rounded-3xl overflow-hidden bg-canvas mb-4">
        <img
          src={getSplitCoverPath(selectedDayKey)}
          alt={currentSchedule.splitTitle}
          className="w-full h-full object-cover"
          draggable={false}
        />
        <CropMarks offset={6} length={14} className="text-white/40" />
        <div className="absolute inset-0 bg-gradient-to-r from-canvas/80 via-transparent to-canvas/80" />

        {/* Day Header with Chevrons */}
        <div className="absolute inset-0 flex items-center justify-between px-4 z-10">
          <button
            type="button"
            onClick={prevDay}
            className="glass size-10 rounded-full flex items-center justify-center text-ink hover:bg-white active:scale-95 transition-all cursor-pointer"
            aria-label="Previous Day"
          >
            <ChevronLeft size={18} />
          </button>

          <div className="glass px-5 py-2 rounded-full flex flex-col items-center">
            <h1 className="font-display text-xl font-medium text-ink leading-tight">
              {currentSchedule.name}
            </h1>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-sage-700">
              {currentSchedule.splitTitle.split('(')[0]?.trim()}
            </span>
          </div>

          <button
            type="button"
            onClick={nextDay}
            className="glass size-10 rounded-full flex items-center justify-center text-ink hover:bg-white active:scale-95 transition-all cursor-pointer"
            aria-label="Next Day"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* R2: MODE SWITCH (Together / Solo) */}
      <div className="flex flex-col gap-2.5 mb-5">
        <Segmented
          label="Training Mode"
          value={mode}
          onChange={(val) => {
            haptics.tap();
            setMode(val);
          }}
          options={[
            { value: 'together', label: 'Together (Supersets)' },
            { value: 'solo', label: 'Solo (Your Routine)' },
          ]}
        />

        {/* R3: Session meter */}
        <div className="flex items-center justify-between text-xs font-semibold px-1 text-ink-muted">
          <span>{mode === 'together' ? 'Duo Progress' : 'My Progress'}</span>
          <span className="tabular-nums font-mono">
            {displaySets} / {displayTotal} sets ({progressPct}%)
          </span>
        </div>
        <div className="w-full h-1.5 rounded-full bg-sunk overflow-hidden">
          <div
            className="h-full bg-sage-500 rounded-full transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* SESSION CONTENT */}
      {currentSchedule.isRest ? (
        <Card variant="tinted" className="p-8 text-center flex flex-col items-center gap-3">
          <span className="text-3xl">🌿</span>
          <h2 className="font-display text-xl font-medium text-ink">Scheduled Rest Day</h2>
          <p className="text-xs text-ink-muted max-w-xs">
            Rest and hydration day. Use the arrows above to view another day or log ahead.
          </p>
          <Button variant="glass" size="sm" onClick={() => navigate('/')}>
            Back to Today
          </Button>
        </Card>
      ) : maxStations === 0 ? (
        <Card variant="tinted" className="p-8 text-center flex flex-col items-center gap-3">
          <h2 className="font-display text-xl font-medium text-ink">No Exercises Scheduled</h2>
          <p className="text-xs text-ink-muted">Go to Today to reload the 5-day duo split.</p>
          <Button variant="primary" size="sm" onClick={() => navigate('/')}>
            Go to Today
          </Button>
        </Card>
      ) : mode === 'solo' ? (
        /* SOLO MODE: User's individual exercises with journey line */
        <div className="relative flex flex-col gap-4 pl-8">
          {/* Journey Line Gutter */}
          <div className="absolute top-6 bottom-6 left-3 w-[1.5px] bg-ink/10" aria-hidden />

          {myExercises.map((exercise, idx) => {
            const isExpanded = activeStationIdx === idx;
            const progress = myLog?.exercisesProgress[exercise.id];
            const sets = progress?.sets || [];
            const isDone = Boolean(progress?.isFullyCompleted);

            return (
              <div key={exercise.id} className="relative">
                {/* Numbered node on journey line */}
                <button
                  type="button"
                  onClick={() => {
                    haptics.tap();
                    setActiveStationIdx(idx);
                  }}
                  className={`absolute -left-8 top-5 size-6 rounded-full flex items-center justify-center text-[11px] font-bold transition-all cursor-pointer ${
                    isDone
                      ? 'bg-sage-300 text-sage-700 ring-2 ring-sage-500'
                      : isExpanded
                      ? 'bg-ink text-surface ring-2 ring-sage-500'
                      : 'bg-surface text-ink-muted border border-hairline'
                  }`}
                >
                  {isDone ? <CheckCircle2 size={14} /> : idx + 1}
                </button>

                {/* Card: Expanded vs Collapsed */}
                <Card
                  variant="plain"
                  className={`transition-all ${
                    isExpanded ? 'p-5 ring-1 ring-sage-300 shadow-card' : 'p-3.5 cursor-pointer hover:border-ink/20'
                  }`}
                  onClick={() => {
                    if (!isExpanded) {
                      haptics.tap();
                      setActiveStationIdx(idx);
                    }
                  }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="size-14 rounded-2xl overflow-hidden shrink-0">
                        <ExerciseThumb exercise={exercise} className="size-full" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-base font-semibold text-ink leading-tight truncate">
                          {exercise.name}
                        </h3>
                        <p className="text-xs text-ink-muted mt-0.5 tabular-nums">
                          {exercise.targetSets} sets × {exercise.targetReps} • {exercise.muscle}
                        </p>
                      </div>
                    </div>

                    {exercise.videoUrl && onOpenVideo && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenVideo(exercise.videoUrl!, exercise.name);
                        }}
                        className="glass size-9 rounded-full flex items-center justify-center text-ink shrink-0 hover:bg-white active:scale-95 transition-all cursor-pointer"
                        title="Watch video"
                      >
                        <Play size={13} className="fill-current ml-0.5" />
                      </button>
                    )}
                  </div>

                  {/* Expanded set logger controls */}
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-hairline flex flex-col gap-4">
                      {/* Set Beads timeline */}
                      <SetBeads
                        targetSets={exercise.targetSets}
                        sets={sets}
                        activeSetNumber={activeSetNum}
                        onSelectSet={(sNum) => {
                          setActiveSetNum(sNum);
                          const existing = sets.find((s) => s.setNumber === sNum);
                          if (existing && existing.weightKg !== '0') setDraftWeight(parseFloat(existing.weightKg) || 20);
                          if (existing && existing.repsCompleted !== '0') setDraftReps(parseInt(existing.repsCompleted, 10) || 10);
                        }}
                        onToggleComplete={(sNum) => handleLogSet(myRole, exercise, sNum)}
                      />

                      {/* Steppers */}
                      <div className="flex items-center gap-3">
                        <Stepper
                          label={`Set ${activeSetNum} Weight`}
                          value={draftWeight}
                          onChange={setDraftWeight}
                          step={2.5}
                          min={0}
                          max={300}
                          unit="kg"
                        />
                        <Stepper
                          label={`Set ${activeSetNum} Reps`}
                          value={draftReps}
                          onChange={setDraftReps}
                          step={1}
                          min={1}
                          max={50}
                          unit="reps"
                        />
                      </div>

                      {/* Log Set CTA */}
                      <Button
                        variant="primary"
                        onClick={() => handleLogSet(myRole, exercise, activeSetNum)}
                        className="w-full"
                      >
                        {sets.find((s) => s.setNumber === activeSetNum)?.isCompleted
                          ? `Update Set ${activeSetNum}`
                          : `Log Set ${activeSetNum} (${draftWeight}kg × ${draftReps})`}
                      </Button>
                    </div>
                  )}
                </Card>
              </div>
            );
          })}
        </div>
      ) : (
        /* TOGETHER MODE: Synced partner superset stations */
        <div className="flex flex-col gap-4">
          {Array.from({ length: maxStations }).map((_, stationIdx) => {
            const p1Ex = p1Exercises[stationIdx];
            const p2Ex = p2Exercises[stationIdx];
            const stationLabel = p1Ex?.pair || p2Ex?.pair || `Station ${stationIdx + 1}`;

            const p1Sets = p1Ex ? p1DayLog?.exercisesProgress[p1Ex.id]?.sets || [] : [];
            const p2Sets = p2Ex ? p2DayLog?.exercisesProgress[p2Ex.id]?.sets || [] : [];

            const p1Done = p1Ex ? Boolean(p1DayLog?.exercisesProgress[p1Ex.id]?.isFullyCompleted) : true;
            const p2Done = p2Ex ? Boolean(p2DayLog?.exercisesProgress[p2Ex.id]?.isFullyCompleted) : true;
            const isStationComplete = p1Done && p2Done;

            return (
              <Card
                key={stationIdx}
                variant={isStationComplete ? 'tinted' : 'plain'}
                className="p-4 sm:p-5 flex flex-col gap-3.5 transition-all"
              >
                {/* Station Header */}
                <div className="flex items-center justify-between pb-2 border-b border-hairline">
                  <div className="flex items-center gap-2">
                    <span className="size-6 rounded-full bg-surface border border-hairline flex items-center justify-center text-xs font-bold text-ink">
                      {stationIdx + 1}
                    </span>
                    <span className="text-xs font-bold uppercase tracking-wider text-ink">
                      {stationLabel}
                    </span>
                  </div>

                  {isStationComplete && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-sage-700 bg-sage-200/60 px-2.5 py-0.5 rounded-full">
                      <CheckCircle2 size={12} /> Complete
                    </span>
                  )}
                </div>

                {/* Partner 1 Row */}
                {p1Ex && (
                  <div
                    className={`p-3.5 rounded-2xl bg-surface/80 border-l-[3.5px] border-p1-ink/60 border border-hairline flex flex-col gap-3 transition-all ${
                      activePartnerRow === 'person_1' && activeStationIdx === stationIdx ? 'ring-1 ring-p1-ink/30' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Avatar name={p1Name} role="p1" size={32} />
                        <div className="min-w-0">
                          <h4 className="text-sm font-semibold text-ink leading-tight truncate">{p1Ex.name}</h4>
                          <p className="text-[11px] text-ink-muted tabular-nums">
                            {p1Ex.targetSets} sets × {p1Ex.targetReps} • {p1Ex.muscle}
                          </p>
                        </div>
                      </div>

                      {p1Ex.videoUrl && onOpenVideo && (
                        <button
                          type="button"
                          onClick={() => onOpenVideo(p1Ex.videoUrl!, p1Ex.name)}
                          className="glass size-8 rounded-full flex items-center justify-center text-ink shrink-0 hover:bg-white active:scale-95 transition-all cursor-pointer"
                        >
                          <Play size={12} className="fill-current ml-0.5" />
                        </button>
                      )}
                    </div>

                    {/* Set Beads */}
                    <SetBeads
                      targetSets={p1Ex.targetSets}
                      sets={p1Sets}
                      activeSetNumber={activeStationIdx === stationIdx && activePartnerRow === 'person_1' ? activeSetNum : 1}
                      onSelectSet={(sNum) => {
                        setActiveStationIdx(stationIdx);
                        setActivePartnerRow('person_1');
                        setActiveSetNum(sNum);
                      }}
                      onToggleComplete={(sNum) => handleLogSet('person_1', p1Ex, sNum)}
                      roleTint="p1"
                    />

                    {/* Inline Stepper if selected */}
                    {activeStationIdx === stationIdx && activePartnerRow === 'person_1' && (
                      <div className="pt-2 flex flex-col gap-2.5 border-t border-hairline">
                        <div className="flex items-center gap-2">
                          <Stepper label="Weight" value={draftWeight} onChange={setDraftWeight} step={2.5} unit="kg" />
                          <Stepper label="Reps" value={draftReps} onChange={setDraftReps} step={1} unit="reps" />
                        </div>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleLogSet('person_1', p1Ex, activeSetNum)}
                        >
                          Log Set {activeSetNum} for {p1Name}
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {/* Partner 2 Row */}
                {p2Ex && (
                  <div
                    className={`p-3.5 rounded-2xl bg-surface/80 border-l-[3.5px] border-p2-ink/60 border border-hairline flex flex-col gap-3 transition-all ${
                      activePartnerRow === 'person_2' && activeStationIdx === stationIdx ? 'ring-1 ring-p2-ink/30' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Avatar name={p2Name} role="p2" size={32} />
                        <div className="min-w-0">
                          <h4 className="text-sm font-semibold text-ink leading-tight truncate">{p2Ex.name}</h4>
                          <p className="text-[11px] text-ink-muted tabular-nums">
                            {p2Ex.targetSets} sets × {p2Ex.targetReps} • {p2Ex.muscle}
                          </p>
                        </div>
                      </div>

                      {p2Ex.videoUrl && onOpenVideo && (
                        <button
                          type="button"
                          onClick={() => onOpenVideo(p2Ex.videoUrl!, p2Ex.name)}
                          className="glass size-8 rounded-full flex items-center justify-center text-ink shrink-0 hover:bg-white active:scale-95 transition-all cursor-pointer"
                        >
                          <Play size={12} className="fill-current ml-0.5" />
                        </button>
                      )}
                    </div>

                    {/* Set Beads */}
                    <SetBeads
                      targetSets={p2Ex.targetSets}
                      sets={p2Sets}
                      activeSetNumber={activeStationIdx === stationIdx && activePartnerRow === 'person_2' ? activeSetNum : 1}
                      onSelectSet={(sNum) => {
                        setActiveStationIdx(stationIdx);
                        setActivePartnerRow('person_2');
                        setActiveSetNum(sNum);
                      }}
                      onToggleComplete={(sNum) => handleLogSet('person_2', p2Ex, sNum)}
                      roleTint="p2"
                    />

                    {/* Inline Stepper if selected */}
                    {activeStationIdx === stationIdx && activePartnerRow === 'person_2' && (
                      <div className="pt-2 flex flex-col gap-2.5 border-t border-hairline">
                        <div className="flex items-center gap-2">
                          <Stepper label="Weight" value={draftWeight} onChange={setDraftWeight} step={2.5} unit="kg" />
                          <Stepper label="Reps" value={draftReps} onChange={setDraftReps} step={1} unit="reps" />
                        </div>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleLogSet('person_2', p2Ex, activeSetNum)}
                        >
                          Log Set {activeSetNum} for {p2Name}
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Floating Rest Timer HUD */}
      <RestTimerHUD
        secondsRemaining={restSecondsRemaining}
        isRunning={isRestTimerRunning}
        onAdjust={adjustRestTime}
        onSkip={skipRest}
      />

      {/* SESSION COMPLETE TROPHY CARD */}
      {isSessionFinished && (
        <Card variant="tinted" className="mt-8 p-6 text-center flex flex-col items-center gap-3 animate-rise">
          <div className="size-14 rounded-full bg-butter/60 flex items-center justify-center text-ink">
            <Trophy size={28} className="text-sage-700" />
          </div>
          <h2 className="font-display text-2xl font-medium text-ink">Session Complete!</h2>
          <p className="text-xs text-ink-muted max-w-xs">
            All target sets for today have been logged. Great work training together.
          </p>
          <Button variant="primary" onClick={() => navigate('/')} className="mt-2">
            Back to Today Summary
          </Button>
        </Card>
      )}
    </div>
  );
}
