import { useState } from 'react';
import { useRouter } from '../router/Router';
import { useAuth } from '../context/AuthContext';
import { useWorkoutSession } from '../hooks/useWorkoutSession';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Avatar } from '../components/ui/Avatar';
import { WeekThread } from '../components/art/WeekThread';
import { Swash } from '../components/art/Swash';
import { Ring } from '../components/art/Ring';
import { ExerciseThumb } from '../components/ui/ExerciseThumb';
import { ThemeToggle } from '../components/ui/ThemeToggle';
import { StatTile, VolumeBars, ConsistencyGrid } from '../features/progress/ProgressWidgets';
import { getSplitCoverPath } from '../lib/assetsMap';
import { DAY_SCHEDULES, WORKOUT_PLAN_DATA } from '../data/initialWorkoutPlan';
import { StorageService } from '../services/storageService';
import {
  computeStreak,
  weeklyTotals,
  recentRecords,
  summarizeLog,
  formatVolume,
  toDateStr,
} from '../lib/progressStats';
import { Play, Dumbbell, Check, Flame, CalendarCheck, TrendingUp, Layers, Trophy, Leaf } from 'lucide-react';
import { PlanService } from '../services/planService';
import { haptics } from '../lib/haptics';

interface HomePageProps {
  onOpenVideo?: (url: string, title: string) => void;
}

const REST_ITEMS = [
  { key: 'walk', label: '20–30 min brisk walk or light movement' },
  { key: 'mobility', label: '10 min hip and spinal mobility flow' },
  { key: 'hydrate', label: 'Hit hydration and protein targets' },
];

const REST_DAY_KEYS = DAY_SCHEDULES.filter(d => d.isRest).map(d => d.key);
const TRAINING_DAYS_PER_WEEK = DAY_SCHEDULES.length - REST_DAY_KEYS.length;

function restStorageKey(dateStr: string) {
  return `liquid_fitness_rest_${dateStr}`;
}

function readRestChecklist(dateStr: string): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(restStorageKey(dateStr));
    return raw ? (JSON.parse(raw) as Record<string, boolean>) : {};
  } catch {
    return {};
  }
}

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

function humanizeId(id: string): string {
  return id.replace(/^p[12]_|^[a-z]+_\d+_/, '').replace(/[_-]+/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

export function HomePage({ onOpenVideo }: HomePageProps) {
  const { navigate } = useRouter();
  const { user, partner } = useAuth();

  const {
    p1Name,
    p2Name,
    myRole,
    todayKey,
    selectedDayKey,
    selectedDateStr,
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
  const [restChecklist, setRestChecklist] = useState<Record<string, boolean>>(() => readRestChecklist(selectedDateStr));
  const [restDate, setRestDate] = useState(selectedDateStr);
  if (restDate !== selectedDateStr) {
    // Re-read when the user browses to another day (render-phase state sync).
    setRestDate(selectedDateStr);
    setRestChecklist(readRestChecklist(selectedDateStr));
  }

  const isPrimary = myRole === 'person_1';
  const partnerRole = isPrimary ? 'person_2' : 'person_1';
  const myName = isPrimary ? p1Name : p2Name;
  const partnerName = isPrimary ? p2Name : p1Name;
  const myExercises = isPrimary ? p1Exercises : p2Exercises;
  const myLog = isPrimary ? p1DayLog : p2DayLog;

  // Day metrics
  const myTotalSets = myExercises.reduce((acc, ex) => acc + ex.targetSets, 0);
  const myCompletedSets = myExercises.reduce(
    (acc, ex) => acc + (myLog?.exercisesProgress[ex.id]?.sets.filter(s => s.isCompleted).length || 0),
    0,
  );
  const myCompletedExercises = myExercises.filter(ex => myLog?.exercisesProgress[ex.id]?.isFullyCompleted).length;
  const setsPct = myTotalSets > 0 ? myCompletedSets / myTotalSets : 0;
  const exercisesPct = myExercises.length > 0 ? myCompletedExercises / myExercises.length : 0;
  const estMinutes = Math.round((myTotalSets * 2.5) / 5) * 5;
  const upNextExercise = myExercises.find(ex => !myLog?.exercisesProgress[ex.id]?.isFullyCompleted);

  // History metrics
  const myLogs = StorageService.listDayLogs(myRole);
  const partnerLogs = StorageService.listDayLogs(partnerRole);
  const streak = computeStreak(myLogs, REST_DAY_KEYS);
  const weeks = weeklyTotals(myLogs, 6);
  const thisWeek = weeks[weeks.length - 1] ?? { volumeKg: 0, sets: 0, sessions: 0, weekStart: '' };
  const lastWeek = weeks[weeks.length - 2];
  const volumeDelta =
    lastWeek && lastWeek.volumeKg > 0 ? Math.round(((thisWeek.volumeKg - lastWeek.volumeKg) / lastWeek.volumeKg) * 100) : null;
  const partnerWeek = weeklyTotals(partnerLogs, 1)[0] ?? { volumeKg: 0, sets: 0, sessions: 0, weekStart: '' };
  const todayStr = toDateStr(new Date());
  const todaySets = myLogs.filter(l => l.dateStr === todayStr).reduce((a, l) => a + summarizeLog(l).sets, 0);
  const trainedDates = new Set(myLogs.filter(l => summarizeLog(l).sets > 0).map(l => l.dateStr));
  const hasHistory = myLogs.some(l => summarizeLog(l).sets > 0);

  const nameById = new Map<string, string>();
  for (const plan of Object.values(WORKOUT_PLAN_DATA)) {
    for (const list of Object.values(plan)) for (const ex of list) nameById.set(ex.id, ex.name);
  }
  for (const ex of [...p1Exercises, ...p2Exercises]) nameById.set(ex.id, ex.name);
  const records = recentRecords(myLogs, 14).slice(0, 3);

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
    const next = { ...restChecklist, [key]: !restChecklist[key] };
    setRestChecklist(next);
    try {
      localStorage.setItem(restStorageKey(selectedDateStr), JSON.stringify(next));
    } catch {
      // Non-critical
    }
  };

  const duoMax = Math.max(1, thisWeek.volumeKg, partnerWeek.volumeKg);

  return (
    <div className="w-full max-w-[560px] mx-auto pb-36 animate-rise">
      {/* HERO */}
      <section className="relative w-full h-[34vh] min-h-[260px] max-h-[340px] overflow-hidden">
        <img src={coverPath} alt="" aria-hidden className="absolute inset-0 w-full h-full object-cover" draggable={false} />
        <div className="absolute inset-0 bg-gradient-to-t from-canvas via-canvas/40 to-ink/20" />

        <div className="absolute top-5 left-5 right-5 flex items-center justify-between z-10">
          <span className="glass px-3.5 py-1.5 rounded-full text-xs font-semibold text-ink">
            {greeting()}, {myName.split(' ')[0]}
          </span>
          <div className="flex items-center gap-2">
            {isOffDay && (
              <button
                type="button"
                onClick={() => {
                  haptics.tap();
                  setSelectedDayKey(todayKey);
                }}
                className="glass h-9 px-3.5 rounded-full text-xs font-semibold text-ink active:scale-95 transition cursor-pointer"
              >
                Today ↺
              </button>
            )}
            <ThemeToggle />
          </div>
        </div>

        <div className="absolute bottom-4 left-5 right-5 z-10">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-sage-700">
            {currentSchedule.name}
            {isOffDay ? '' : ' · Today'}
          </p>
          <h1 className="font-display text-[40px] sm:text-[48px] font-medium leading-[1.02] tracking-tight text-ink">
            {currentSchedule.isRest ? (
              <Swash>Rest</Swash>
            ) : (
              <>
                <Swash>{currentSchedule.splitTitle.split(' ')[0]}</Swash>{' '}
                <span className="text-ink/80 text-[0.6em] align-middle">
                  {currentSchedule.splitTitle.split(' ').slice(1).join(' ')}
                </span>
              </>
            )}
          </h1>
        </div>
      </section>

      <div className="px-5 flex flex-col gap-5">
        <WeekThread
          selectedDayKey={selectedDayKey}
          todayKey={todayKey}
          completionStatus={dayCompletionStatus}
          onSelectDay={setSelectedDayKey}
        />

        {/* SESSION CARD */}
        {currentSchedule.isRest ? (
          <Card variant="tinted" className="p-5 flex flex-col gap-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-sage-700">Recovery</span>
                <h2 className="font-display text-2xl font-medium text-ink mt-0.5">Active recharge</h2>
              </div>
              <span className="size-10 rounded-full bg-sage-100 flex items-center justify-center text-sage-700">
                <Leaf size={18} />
              </span>
            </div>
            <div className="flex flex-col gap-2">
              {REST_ITEMS.map(({ key, label }) => {
                const checked = Boolean(restChecklist[key]);
                return (
                  <button
                    key={key}
                    type="button"
                    role="checkbox"
                    aria-checked={checked}
                    onClick={() => toggleRestItem(key)}
                    className="flex items-center gap-3 p-3 min-h-11 rounded-2xl bg-surface/70 border border-hairline text-left transition cursor-pointer hover:bg-surface active:scale-[0.99]"
                  >
                    <span
                      className={`size-6 rounded-full flex items-center justify-center border transition ${
                        checked ? 'bg-sage-300 border-sage-500 text-sage-700' : 'border-ink/20 bg-surface'
                      }`}
                    >
                      {checked && <Check size={13} strokeWidth={2.5} />}
                    </span>
                    <span className={`text-sm ${checked ? 'line-through text-ink-muted' : 'text-ink'}`}>{label}</span>
                  </button>
                );
              })}
            </div>
          </Card>
        ) : myExercises.length === 0 ? (
          <Card variant="tinted" className="p-8 text-center flex flex-col items-center gap-4">
            <div className="size-14 rounded-full bg-surface border border-hairline flex items-center justify-center text-sage-700">
              <Dumbbell size={24} strokeWidth={1.5} />
            </div>
            <div>
              <h2 className="font-display text-xl font-medium text-ink">No plan for this day</h2>
              <p className="text-xs text-ink-muted max-w-xs mt-1">
                Load the curated 5-day duo hypertrophy split for both partners.
              </p>
            </div>
            <Button variant="primary" isLoading={isSeeding} onClick={handleSeedPlan} className="w-full max-w-xs">
              Load 5-day duo plan
            </Button>
          </Card>
        ) : (
          <Card variant="tinted" className="p-5 flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <Ring
                size={84}
                stroke={6}
                gap={3}
                label={`${Math.round(setsPct * 100)}% session progress`}
                tracks={[
                  { value: setsPct, className: 'text-sage-500' },
                  { value: exercisesPct, className: 'text-sage-300' },
                ]}
              >
                <span className="font-mono text-sm font-bold text-ink tabular-nums">{Math.round(setsPct * 100)}%</span>
              </Ring>
              <div className="flex-1 min-w-0">
                <span className="text-[11px] font-bold uppercase tracking-wider text-sage-700">
                  {isOffDay ? `${currentSchedule.name}'s session` : "Today's session"}
                </span>
                <h2 className="font-display text-2xl font-medium text-ink leading-tight">
                  {myExercises.length} exercises
                </h2>
                <p className="text-xs text-ink-muted mt-0.5 tabular-nums">
                  {myCompletedSets}/{myTotalSets} sets · ~{estMinutes} min
                </p>
              </div>
            </div>

            {upNextExercise && (
              <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-surface/80 border border-hairline">
                <div className="size-12 rounded-xl overflow-hidden shrink-0">
                  <ExerciseThumb exercise={upNextExercise} className="size-full" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-ink-muted">Up next</p>
                  <p className="text-sm font-semibold text-ink truncate">{upNextExercise.name}</p>
                  <p className="text-[11px] text-ink-muted tabular-nums">
                    {upNextExercise.targetSets} × {upNextExercise.targetReps}
                  </p>
                </div>
                {upNextExercise.videoUrl && onOpenVideo && (
                  <button
                    type="button"
                    onClick={() => onOpenVideo(upNextExercise.videoUrl ?? '', upNextExercise.name)}
                    className="glass size-11 rounded-full flex items-center justify-center text-ink shrink-0 active:scale-95 transition cursor-pointer"
                    aria-label={`Watch technique for ${upNextExercise.name}`}
                  >
                    <Play size={14} className="fill-current ml-0.5" />
                  </button>
                )}
              </div>
            )}

            <Button variant="primary" onClick={() => navigate('/train')} className="w-full" rightIcon={<span aria-hidden>→</span>}>
              {myCompletedSets === 0 ? 'Start training' : myCompletedSets < myTotalSets ? 'Continue training' : 'Review session'}
            </Button>
          </Card>
        )}

        {/* METRICS STRIP */}
        <section aria-labelledby="progress-heading" className="flex flex-col gap-3">
          <h2 id="progress-heading" className="text-[11px] font-bold uppercase tracking-[0.14em] text-ink-muted px-1">
            Your progress
          </h2>
          <div className="grid grid-cols-2 gap-2.5">
            <StatTile
              icon={<Flame size={13} />}
              label="Streak"
              value={`${streak}d`}
              hint={streak > 0 ? 'Rest days don’t break it' : 'Log a set to start'}
            />
            <StatTile
              icon={<CalendarCheck size={13} />}
              label="This week"
              value={`${thisWeek.sessions}/${TRAINING_DAYS_PER_WEEK}`}
              hint="sessions"
            />
            <StatTile
              icon={<TrendingUp size={13} />}
              label="Volume"
              value={formatVolume(thisWeek.volumeKg)}
              hint={volumeDelta === null ? 'this week' : `${volumeDelta >= 0 ? '+' : ''}${volumeDelta}% vs last week`}
              hintTone={volumeDelta === null ? 'neutral' : volumeDelta >= 0 ? 'up' : 'down'}
            />
            <StatTile icon={<Layers size={13} />} label="Sets today" value={String(todaySets)} hint={`${thisWeek.sets} this week`} />
          </div>
        </section>

        {hasHistory ? (
          <>
            <Card variant="plain" className="p-5 flex flex-col gap-4">
              <div className="flex items-baseline justify-between">
                <h3 className="font-display text-lg text-ink">Weekly volume</h3>
                <span className="text-[11px] text-ink-muted">last 6 weeks</span>
              </div>
              <VolumeBars weeks={weeks} />
            </Card>

            <div className="grid sm:grid-cols-2 gap-4">
              <Card variant="plain" className="p-5 flex flex-col gap-3">
                <h3 className="font-display text-lg text-ink">Consistency</h3>
                <ConsistencyGrid trainedDates={trainedDates} restDayKeys={REST_DAY_KEYS} />
              </Card>

              <Card variant="plain" className="p-5 flex flex-col gap-3">
                <h3 className="font-display text-lg text-ink flex items-center gap-2">
                  <Trophy size={16} className="text-sage-700" /> Recent records
                </h3>
                {records.length === 0 ? (
                  <p className="text-xs text-ink-muted">Beat a previous best and it shows up here.</p>
                ) : (
                  <ul className="flex flex-col gap-2">
                    {records.map(r => (
                      <li key={r.exerciseId} className="flex items-center justify-between gap-2 text-sm">
                        <span className="truncate text-ink">{nameById.get(r.exerciseId) ?? humanizeId(r.exerciseId)}</span>
                        <span className="font-mono text-xs tabular-nums text-ink-muted shrink-0">
                          {r.weightKg}×{r.reps}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            </div>
          </>
        ) : (
          <Card variant="plain" className="p-5 text-center flex flex-col items-center gap-2">
            <TrendingUp size={20} className="text-sage-500" />
            <p className="text-sm text-ink font-medium">Your charts appear after the first logged set</p>
            <p className="text-xs text-ink-muted">Weekly volume, consistency and personal records are tracked automatically.</p>
          </Card>
        )}

        {/* DUO */}
        {partner && (
          <Card variant="plain" className="p-5 flex flex-col gap-3.5">
            <div className="flex items-baseline justify-between">
              <h3 className="font-display text-lg text-ink">Duo this week</h3>
              <span className="text-[11px] text-ink-muted">volume · sessions</span>
            </div>
            {[
              { name: myName, role: isPrimary ? 'p1' : 'p2', week: thisWeek },
              { name: partnerName, role: isPrimary ? 'p2' : 'p1', week: partnerWeek },
            ].map(row => (
              <div key={row.name} className="flex items-center gap-3">
                <Avatar name={row.name} role={row.role as 'p1' | 'p2'} size={32} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-semibold text-ink truncate">{row.name}</span>
                    <span className="font-mono tabular-nums text-ink-muted">
                      {formatVolume(row.week.volumeKg)} · {row.week.sessions}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-sunk overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-[width] duration-700 ${row.role === 'p1' ? 'bg-p1-ink/70' : 'bg-p2-ink/70'}`}
                      style={{ width: `${(row.week.volumeKg / duoMax) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </Card>
        )}
      </div>
    </div>
  );
}
