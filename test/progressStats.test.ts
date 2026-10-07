import { describe, it, expect } from 'vitest';
import { StorageService } from '../src/services/storageService';
import {
  epley,
  summarizeLog,
  weeklyTotals,
  computeStreak,
  bestByExercise,
  lastPerformance,
  recentRecords,
  exerciseHistory,
  formatVolume,
} from '../src/lib/progressStats';
import type { WorkoutDayLog } from '../src/types/workout';

function log(
  dateStr: string,
  sets: Array<[string, number, number, boolean?]>,
  finished = true,
): WorkoutDayLog {
  const exercisesProgress: WorkoutDayLog['exercisesProgress'] = {};
  sets.forEach(([id, w, r, done = true], i) => {
    const p = (exercisesProgress[id] ??= { exerciseId: id, sets: [], isFullyCompleted: false });
    p.sets.push({
      setNumber: i + 1,
      weightKg: String(w),
      repsCompleted: String(r),
      rpeAchieved: '',
      isCompleted: done,
    });
  });
  return {
    profileId: 'person_1',
    dateStr,
    dayKey: 'monday',
    exercisesProgress,
    completedPercentage: 0,
    isWorkoutFinished: finished,
    updatedAt: '',
  };
}

describe('getDateForDayKey', () => {
  it('resolves weekdays inside the Monday-start week', () => {
    const wed = new Date(2026, 9, 7); // Wed 7 Oct 2026
    expect(StorageService.getDateForDayKey('monday', wed)).toBe('2026-10-05');
    expect(StorageService.getDateForDayKey('wednesday', wed)).toBe('2026-10-07');
    expect(StorageService.getDateForDayKey('sunday', wed)).toBe('2026-10-11');
  });
  it('treats Sunday as end of week', () => {
    const sun = new Date(2026, 9, 11);
    expect(StorageService.getDateForDayKey('monday', sun)).toBe('2026-10-05');
  });
});

describe('progressStats', () => {
  const logs = [
    log('2026-09-28', [
      ['bench', 60, 8],
      ['bench', 60, 8],
    ]),
    log('2026-10-05', [
      ['bench', 65, 8],
      ['row', 50, 10],
      ['row', 0, 0, false],
    ]),
    log('2026-10-06', [['squat', 100, 5]]),
  ];
  const ref = new Date(2026, 9, 7);

  it('epley', () => {
    expect(epley(100, 1)).toBe(100);
    expect(epley(0, 5)).toBe(0);
    expect(Math.round(epley(100, 5))).toBe(117);
  });

  it('summarizes only completed sets', () => {
    expect(summarizeLog(logs[1]!)).toMatchObject({ sets: 2, volumeKg: 65 * 8 + 500 });
  });

  it('buckets weekly totals', () => {
    const w = weeklyTotals(logs, 2, ref);
    expect(w[0]).toMatchObject({ weekStart: '2026-09-28', sets: 2, sessions: 1 });
    expect(w[1]).toMatchObject({ weekStart: '2026-10-05', sets: 3, sessions: 2 });
  });

  it('computes streak skipping rest days and an untrained today', () => {
    expect(computeStreak(logs, ['sunday', 'wednesday'], ref)).toBe(2);
    expect(computeStreak(logs, [], ref)).toBe(0);
  });

  it('finds bests, records and last performance', () => {
    expect(bestByExercise(logs).get('bench')?.weightKg).toBe(65);
    expect(recentRecords(logs, 3, ref).map(r => r.exerciseId)).toEqual(['squat', 'bench', 'row']);
    expect(lastPerformance(logs, 'bench', '2026-10-05')).toMatchObject({ weightKg: 60, sets: 2 });
    expect(lastPerformance(logs, 'bench', '2026-09-28')).toBeNull();
    expect(exerciseHistory(logs, 'bench')).toHaveLength(2);
  });

  it('formats volume', () => {
    expect(formatVolume(840)).toBe('840kg');
    expect(formatVolume(12400)).toBe('12t');
    expect(formatVolume(1500)).toBe('1.5t');
  });
});
