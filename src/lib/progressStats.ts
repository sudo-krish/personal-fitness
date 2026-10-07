import type { WorkoutDayLog, SetRecord } from '../types/workout';

/** Per-day aggregate derived from a persisted log. */
export interface DaySummary {
  dateStr: string;
  dayKey: string;
  sets: number;
  volumeKg: number;
  finished: boolean;
}

/** Best estimated-1RM set for a given exercise. */
export interface ExerciseBest {
  exerciseId: string;
  dateStr: string;
  weightKg: number;
  reps: number;
  e1rm: number;
}

/** Most recent completed performance of an exercise before a date. */
export interface LastPerformance {
  dateStr: string;
  weightKg: number;
  reps: number;
  sets: number;
}

function num(value: string | undefined): number {
  const n = parseFloat(value ?? '');
  return Number.isFinite(n) ? n : 0;
}

/**
 * Epley estimated one-rep max.
 * @param weightKg - Load lifted
 * @param reps - Repetitions completed
 */
export function epley(weightKg: number, reps: number): number {
  if (weightKg <= 0 || reps <= 0) return 0;
  return reps === 1 ? weightKg : weightKg * (1 + reps / 30);
}

function completedSets(log: WorkoutDayLog): Array<{ exerciseId: string; set: SetRecord }> {
  const out: Array<{ exerciseId: string; set: SetRecord }> = [];
  for (const progress of Object.values(log.exercisesProgress)) {
    for (const set of progress.sets) {
      if (set.isCompleted) out.push({ exerciseId: progress.exerciseId, set });
    }
  }
  return out;
}

/**
 * Summarise one log into set count and tonnage.
 * @param log - Persisted day log
 */
export function summarizeLog(log: WorkoutDayLog): DaySummary {
  let sets = 0;
  let volumeKg = 0;
  for (const { set } of completedSets(log)) {
    sets += 1;
    volumeKg += num(set.weightKg) * num(set.repsCompleted);
  }
  return { dateStr: log.dateStr, dayKey: log.dayKey, sets, volumeKg, finished: log.isWorkoutFinished };
}

/** Format a Date as local YYYY-MM-DD. */
export function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Monday of the week containing `ref`, offset by `weeksBack`. */
export function weekStart(ref: Date, weeksBack = 0): Date {
  const idx = (ref.getDay() + 6) % 7;
  return new Date(ref.getFullYear(), ref.getMonth(), ref.getDate() - idx - weeksBack * 7);
}

/**
 * Tonnage and session counts per Monday-start week, oldest first.
 * @param logs - All logs for a profile
 * @param weeks - Number of weeks including the current one
 * @param ref - Reference date
 */
export function weeklyTotals(
  logs: WorkoutDayLog[],
  weeks: number,
  ref: Date = new Date(),
): Array<{ weekStart: string; volumeKg: number; sets: number; sessions: number }> {
  const buckets = Array.from({ length: weeks }, (_, i) => {
    const start = weekStart(ref, weeks - 1 - i);
    const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 7);
    return { start: toDateStr(start), end: toDateStr(end), volumeKg: 0, sets: 0, sessions: 0 };
  });
  for (const log of logs) {
    const bucket = buckets.find(b => log.dateStr >= b.start && log.dateStr < b.end);
    if (!bucket) continue;
    const s = summarizeLog(log);
    bucket.volumeKg += s.volumeKg;
    bucket.sets += s.sets;
    if (s.sets > 0) bucket.sessions += 1;
  }
  return buckets.map(b => ({ weekStart: b.start, volumeKg: b.volumeKg, sets: b.sets, sessions: b.sessions }));
}

/**
 * Consecutive training days ending today (or yesterday), skipping scheduled rest days.
 * @param logs - All logs for a profile
 * @param restDayKeys - Weekday keys that don't break a streak
 * @param ref - Reference date
 */
export function computeStreak(logs: WorkoutDayLog[], restDayKeys: string[], ref: Date = new Date()): number {
  const trained = new Set(logs.filter(l => summarizeLog(l).sets > 0).map(l => l.dateStr));
  const names = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  let streak = 0;
  const cursor = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate());
  // Today not trained yet doesn't break the streak.
  if (!trained.has(toDateStr(cursor))) cursor.setDate(cursor.getDate() - 1);
  for (let guard = 0; guard < 400; guard++) {
    const key = toDateStr(cursor);
    const dayName = names[cursor.getDay()] ?? '';
    if (trained.has(key)) streak += 1;
    else if (!restDayKeys.includes(dayName)) break;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

/**
 * Best e1RM set per exercise across all logs.
 * @param logs - All logs for a profile
 */
export function bestByExercise(logs: WorkoutDayLog[]): Map<string, ExerciseBest> {
  const best = new Map<string, ExerciseBest>();
  for (const log of logs) {
    for (const { exerciseId, set } of completedSets(log)) {
      const weightKg = num(set.weightKg);
      const reps = num(set.repsCompleted);
      const e1rm = epley(weightKg, reps);
      const prev = best.get(exerciseId);
      if (e1rm > 0 && (!prev || e1rm > prev.e1rm)) {
        best.set(exerciseId, { exerciseId, dateStr: log.dateStr, weightKg, reps, e1rm });
      }
    }
  }
  return best;
}

/**
 * Personal records set within the last `days` days, newest first.
 * A PR is the all-time best e1RM that was achieved inside the window.
 */
export function recentRecords(logs: WorkoutDayLog[], days: number, ref: Date = new Date()): ExerciseBest[] {
  const cutoff = toDateStr(new Date(ref.getFullYear(), ref.getMonth(), ref.getDate() - days));
  return [...bestByExercise(logs).values()]
    .filter(b => b.dateStr >= cutoff)
    .sort((a, b) => b.dateStr.localeCompare(a.dateStr) || b.e1rm - a.e1rm);
}

/**
 * Latest prior session's top set for an exercise.
 * @param logs - All logs for a profile
 * @param exerciseId - Exercise to look up
 * @param beforeDateStr - Exclusive upper bound date
 */
export function lastPerformance(
  logs: WorkoutDayLog[],
  exerciseId: string,
  beforeDateStr: string,
): LastPerformance | null {
  for (let i = logs.length - 1; i >= 0; i--) {
    const log = logs[i];
    if (!log || log.dateStr >= beforeDateStr) continue;
    const sets = log.exercisesProgress[exerciseId]?.sets.filter(s => s.isCompleted && num(s.weightKg) > 0) ?? [];
    if (sets.length === 0) continue;
    const top = sets.reduce((a, b) => (epley(num(b.weightKg), num(b.repsCompleted)) > epley(num(a.weightKg), num(a.repsCompleted)) ? b : a));
    return { dateStr: log.dateStr, weightKg: num(top.weightKg), reps: num(top.repsCompleted), sets: sets.length };
  }
  return null;
}

/**
 * Per-exercise history rows (newest first) for detail views.
 */
export function exerciseHistory(
  logs: WorkoutDayLog[],
  exerciseId: string,
  limit = 5,
): Array<{ dateStr: string; sets: Array<{ weightKg: number; reps: number }> }> {
  const rows: Array<{ dateStr: string; sets: Array<{ weightKg: number; reps: number }> }> = [];
  for (let i = logs.length - 1; i >= 0 && rows.length < limit; i--) {
    const log = logs[i];
    const sets = log?.exercisesProgress[exerciseId]?.sets.filter(s => s.isCompleted) ?? [];
    if (!log || sets.length === 0) continue;
    rows.push({ dateStr: log.dateStr, sets: sets.map(s => ({ weightKg: num(s.weightKg), reps: num(s.repsCompleted) })) });
  }
  return rows;
}

/** Compact tonnage label, e.g. 12.4t or 840kg. */
export function formatVolume(kg: number): string {
  if (kg >= 1000) return `${(kg / 1000).toFixed(kg >= 10000 ? 0 : 1)}t`;
  return `${Math.round(kg)}kg`;
}
