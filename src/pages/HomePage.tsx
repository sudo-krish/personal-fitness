import { useState } from 'react';
import { useRouter } from '../router/Router';
import { useAuth } from '../context/AuthContext';
import { useWorkoutSession } from '../hooks/useWorkoutSession';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Avatar } from '../components/ui/Avatar';
import { WeekThread } from '../components/art/WeekThread';
import { Contours } from '../components/art/Contours';
import { CropMarks } from '../components/art/CropMarks';
import { Swash } from '../components/art/Swash';
import { Ring } from '../components/art/Ring';
import { ExerciseThumb } from '../components/ui/ExerciseThumb';
import { ThemeToggle } from '../components/ui/ThemeToggle';
import { getSplitCoverPath } from '../lib/assetsMap';
import { Play, Dumbbell, Check } from 'lucide-react';
import { PlanService } from '../services/planService';
import { haptics } from '../lib/haptics';

interface HomePageProps {
  onOpenVideo?: (url: string, title: string) => void;
}

export function HomePage({ onOpenVideo }: HomePageProps) {
  const { navigate } = useRouter();
  const { user, partner } = useAuth();
  const isPrimary = user?.isPrimary ?? true;

  const {
    p1Name,
    p2Name,
    todayKey,
    selectedDayKey,
    setSelectedDayKey,
    currentSchedule,
    p1Exercises,
    p2Exercises,
    p1DayLog,
    p2DayLog,
    dayCompletionStatus,
    reloadPlan,
  } = useWorkoutSession({ user, partner });

  const [isSeeding, setIsSeeding] = useState(false);
  const [restChecklist, setRestChecklist] = useState<Record<string, boolean>>({
    walk: false,
    mobility: false,
    hydrate: true,
  });

  // Determine current user's exercises vs partner's exercises
  const myExercises = isPrimary ? p1Exercises : p2Exercises;
  const myLog = isPrimary ? p1DayLog : p2DayLog;
  const partnerLog = isPrimary ? p2DayLog : p1DayLog;
  const partnerName = isPrimary ? p2Name : p1Name;

  const myTotalSets = myExercises.reduce((acc, ex) => acc + ex.targetSets, 0);
  const myCompletedSets = myExercises.reduce((acc, ex) => {
    const prog = myLog?.exercisesProgress[ex.id];
    return acc + (prog?.sets.filter((s) => s.isCompleted).length || 0);
  }, 0);

  const myCompletedExercises = myExercises.filter(
    (ex) => myLog?.exercisesProgress[ex.id]?.isFullyCompleted
  ).length;

  const partnerTotalSets = (isPrimary ? p2Exercises : p1Exercises).reduce((acc, ex) => acc + ex.targetSets, 0);
  const partnerCompletedSets = (isPrimary ? p2Exercises : p1Exercises).reduce((acc, ex) => {
    const prog = partnerLog?.exercisesProgress[ex.id];
    return acc + (prog?.sets.filter((s) => s.isCompleted).length || 0);
  }, 0);

  const partnerPct = partnerTotalSets > 0 ? Math.round((partnerCompletedSets / partnerTotalSets) * 100) : 0;
  const setsPct = myTotalSets > 0 ? myCompletedSets / myTotalSets : 0;
  const exercisesPct = myExercises.length > 0 ? myCompletedExercises / myExercises.length : 0;

  // First incomplete exercise for "Up Next"
  const upNextExercise = myExercises.find((ex) => !myLog?.exercisesProgress[ex.id]?.isFullyCompleted) || myExercises[0];

  const coverPath = getSplitCoverPath(selectedDayKey);
  const isOffDay = selectedDayKey !== todayKey;

  const handleSeedPlan = async () => {
    setIsSeeding(true);
    await PlanService.seedPreWorkoutPlan(true);
    setIsSeeding(false);
    reloadPlan();
  };

  const toggleRestItem = (key: string) => {
    haptics.tap();
    setRestChecklist((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="w-full max-w-[560px] mx-auto pb-32 animate-rise">
      {/* T1: DAY BANNER */}
      <section className="relative w-full h-[48vh] min-h-[380px] max-h-[460px] overflow-hidden bg-canvas">
        {/* Cover Photo */}
        <div className="absolute inset-0">
          <img
            src={coverPath}
            alt={currentSchedule.splitTitle}
            className="w-full h-full object-cover object-center"
            draggable={false}
          />
          {/* Paper grain & Contours */}
          <Contours seed={selectedDayKey} lines={7} drift className="text-white/20" />
          <CropMarks offset={10} length={16} className="text-white/40" />

          {/* Smooth gradient fade into canvas */}
          <div className="absolute inset-0 bg-gradient-to-t from-canvas via-canvas/50 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-canvas to-transparent" />
        </div>

        {/* Date Chip & Controls */}
        <div className="absolute top-6 left-6 right-6 flex items-center justify-between z-10">
          <span className="glass px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wide text-ink">
            {currentSchedule.name} • {selectedDayKey.toUpperCase().slice(0, 3)}
          </span>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            {isOffDay && (
              <button
                type="button"
                onClick={() => {
                  haptics.tap();
                  setSelectedDayKey(todayKey);
                }}
                className="glass px-3 py-1.5 rounded-full text-xs font-medium text-ink hover:bg-white/80 active:scale-95 transition-all cursor-pointer"
              >
                Back to Today ↺
              </button>
            )}
          </div>
        </div>

        {/* Banner Title & Muscles */}
        <div className="absolute bottom-6 left-6 right-6 z-10 flex flex-col gap-1">
          <h1 className="font-display text-[44px] sm:text-[52px] font-medium leading-[1.05] tracking-tight text-ink">
            {currentSchedule.isRest ? (
              <Swash>Rest</Swash>
            ) : (
              <>
                <Swash>{currentSchedule.splitTitle.split(' ')[0]}</Swash>{' '}
                {currentSchedule.splitTitle.split(' ').slice(1).join(' ')}
              </>
            )}
          </h1>
          <p className="text-[13px] text-ink-muted line-clamp-1">
            {currentSchedule.focusDescription}
          </p>
        </div>
      </section>

      {/* Main Content Area */}
      <div className="px-5 mt-4 flex flex-col gap-5">
        {/* T6: WEEK THREAD */}
        <WeekThread
          selectedDayKey={selectedDayKey}
          todayKey={todayKey}
          completionStatus={dayCompletionStatus}
          onSelectDay={setSelectedDayKey}
        />

        {/* T7: YOUR SESSION CARD / RECOVERY CARD / EMPTY STATE */}
        {currentSchedule.isRest ? (
          /* REST DAY RECOVERY CARD */
          <Card variant="tinted" className="p-6 flex flex-col gap-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-sage-700">Recovery Protocol</span>
                <h2 className="font-display text-2xl font-medium text-ink mt-0.5">Active Recharge</h2>
              </div>
              <span className="glass size-10 rounded-full flex items-center justify-center text-sage-700">
                🌿
              </span>
            </div>

            <p className="text-sm text-ink-muted leading-relaxed">
              Rest days allow your central nervous system and muscle fibers to repair and grow stronger. Keep mobility light today.
            </p>

            {/* Checkbox list */}
            <div className="flex flex-col gap-2.5 pt-1">
              {[
                { key: 'walk', label: '20-30 min brisk walk or light movement' },
                { key: 'mobility', label: '10 min hip and spinal mobility flow' },
                { key: 'hydrate', label: 'Hit hydration & protein targets' },
              ].map(({ key, label }) => {
                const checked = restChecklist[key];
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => toggleRestItem(key)}
                    className="flex items-center gap-3 p-3 rounded-2xl bg-surface/70 border border-hairline text-left transition-all cursor-pointer hover:bg-surface active:scale-[0.99]"
                  >
                    <span
                      className={`size-6 rounded-full flex items-center justify-center border transition-all ${
                        checked ? 'bg-sage-300 border-sage-500 text-sage-700' : 'border-ink/20 bg-surface'
                      }`}
                    >
                      {checked && <Check size={13} strokeWidth={2.5} />}
                    </span>
                    <span className={`text-xs font-medium ${checked ? 'line-through text-ink-muted' : 'text-ink'}`}>
                      {label}
                    </span>
                  </button>
                );
              })}
            </div>
          </Card>
        ) : myExercises.length === 0 ? (
          /* EMPTY STATE */
          <Card variant="tinted" className="p-8 text-center flex flex-col items-center gap-4">
            <div className="size-14 rounded-full bg-surface border border-hairline flex items-center justify-center text-sage-700">
              <Dumbbell size={24} strokeWidth={1.5} />
            </div>
            <div>
              <h2 className="font-display text-xl font-medium text-ink">No Plan Assigned for this Day</h2>
              <p className="text-xs text-ink-muted max-w-xs mt-1">
                Load the curated 5-day duo hypertrophy split to populate supersets for both partners.
              </p>
            </div>
            <Button variant="primary" isLoading={isSeeding} onClick={handleSeedPlan} className="w-full max-w-xs mt-1">
              Load 5-Day Duo Plan
            </Button>
          </Card>
        ) : (
          /* ACTIVE SESSION SUMMARY CARD */
          <Card variant="tinted" className="p-6 flex flex-col gap-5">
            <div className="flex items-center justify-between gap-4">
              {/* Concentric Progress Ring */}
              <Ring
                size={88}
                stroke={6}
                gap={3}
                label={`${Math.round(setsPct * 100)}% session progress`}
                tracks={[
                  { value: setsPct, className: 'text-sage-500' },
                  { value: exercisesPct, className: 'text-sage-300' },
                ]}
              >
                <span className="font-mono text-sm font-bold text-ink tabular-nums">
                  {Math.round(setsPct * 100)}%
                </span>
              </Ring>

              {/* Stats */}
              <div className="flex-1 flex flex-col justify-center">
                <span className="text-[11px] font-bold uppercase tracking-wider text-sage-700">Your Routine</span>
                <h2 className="font-display text-2xl font-medium text-ink leading-tight">
                  {myExercises.length} Exercises
                </h2>
                <p className="text-xs text-ink-muted mt-1 tabular-nums">
                  {myCompletedSets} of {myTotalSets} sets completed • ~50 min
                </p>
              </div>
            </div>

            {/* Overlapping Thumbnails Stack */}
            <div className="flex items-center justify-between pt-2 border-t border-hairline">
              <div className="flex items-center -space-x-3">
                {myExercises.slice(0, 3).map((ex) => (
                  <div key={ex.id} className="size-11 rounded-xl overflow-hidden ring-2 ring-surface shadow-xs">
                    <ExerciseThumb exercise={ex} className="size-full" />
                  </div>
                ))}
                {myExercises.length > 3 && (
                  <span className="size-11 rounded-xl glass flex items-center justify-center text-xs font-semibold text-ink ring-2 ring-surface">
                    +{myExercises.length - 3}
                  </span>
                )}
              </div>

              {/* Primary Start/Continue Action */}
              <Button
                variant="primary"
                onClick={() => navigate('/train')}
                className="px-6"
                rightIcon={<span>→</span>}
              >
                {myCompletedSets === 0
                  ? 'Start Training'
                  : myCompletedSets < myTotalSets
                  ? 'Continue Training'
                  : 'Review Session'}
              </Button>
            </div>
          </Card>
        )}

        {/* T10: UP NEXT EXERCISE CARD */}
        {upNextExercise && !currentSchedule.isRest && (
          <div className="flex flex-col gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-ink-muted px-1">Up Next</span>
            <Card
              variant="plain"
              className="p-3.5 flex items-center justify-between gap-3 cursor-pointer hover:border-ink/20 transition-all"
              onClick={() => navigate('/train')}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="size-14 rounded-2xl overflow-hidden shrink-0">
                  <ExerciseThumb exercise={upNextExercise} className="size-full" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-ink truncate">{upNextExercise.name}</h3>
                  <p className="text-xs text-ink-muted mt-0.5 tabular-nums">
                    {upNextExercise.targetSets} sets × {upNextExercise.targetReps} • {upNextExercise.muscle}
                  </p>
                </div>
              </div>

              {upNextExercise.videoUrl && onOpenVideo && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenVideo(upNextExercise.videoUrl!, upNextExercise.name);
                  }}
                  className="glass size-10 rounded-full flex items-center justify-center text-ink shrink-0 hover:bg-white active:scale-95 transition-all cursor-pointer"
                  title="Watch technique"
                  aria-label={`Watch tutorial for ${upNextExercise.name}`}
                >
                  <Play size={14} className="fill-current ml-0.5" />
                </button>
              )}
            </Card>
          </div>
        )}

        {/* T11: PARTNER GLANCE CARD */}
        {partner && (
          <Card
            variant="plain"
            className="p-4 flex items-center justify-between gap-3 cursor-pointer hover:border-ink/20 transition-all"
            onClick={() => navigate('/train')}
          >
            <div className="flex items-center gap-3">
              <Avatar name={partnerName} role={isPrimary ? 'p2' : 'p1'} size={38} />
              <div>
                <h4 className="text-sm font-semibold text-ink leading-tight">{partnerName}</h4>
                <p className="text-xs text-ink-muted mt-0.5 tabular-nums">
                  {partnerCompletedSets} of {partnerTotalSets} sets logged
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="w-20 h-1.5 rounded-full bg-sunk overflow-hidden">
                <div
                  className="h-full bg-sage-500 rounded-full transition-all duration-300"
                  style={{ width: `${partnerPct}%` }}
                />
              </div>
              <span className="font-mono text-xs font-semibold text-ink tabular-nums">{partnerPct}%</span>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
