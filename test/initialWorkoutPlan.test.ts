import { describe, it, expect } from 'vitest';
import { DEFAULT_PROFILES, WORKOUT_PLAN_DATA, DAY_SCHEDULES } from '../src/data/initialWorkoutPlan';
import { UserProfile, Exercise, DaySchedule } from '../src/types/workout';

describe('initialWorkoutPlan', () => {
  it('contains valid default profiles', () => {
    expect(DEFAULT_PROFILES.length).toBeGreaterThan(0);
    DEFAULT_PROFILES.forEach((profile: UserProfile) => {
      expect(profile.id).toBeDefined();
      expect(profile.name).toBeDefined();
      expect(profile.title).toBeDefined();
      expect(profile.avatarEmoji).toBeDefined();
    });
  });

  it('contains valid day schedule metadata', () => {
    expect(DAY_SCHEDULES.length).toBe(7);
    DAY_SCHEDULES.forEach((day: DaySchedule) => {
      expect(day.key).toBeDefined();
      expect(day.name).toBeDefined();
      expect(day.splitTitle).toBeDefined();
    });
  });

  it('contains workout plan data for each default profile', () => {
    DEFAULT_PROFILES.forEach((profile: UserProfile) => {
      const plan = WORKOUT_PLAN_DATA[profile.id];
      expect(plan).toBeDefined();
      DAY_SCHEDULES.forEach((day: DaySchedule) => {
        expect(Array.isArray(plan?.[day.key])).toBe(true);
      });
    });
  });

  it('validates exercise structure inside workout plan', () => {
    const plan = WORKOUT_PLAN_DATA['person_1'];
    expect(plan).toBeDefined();
    if (plan) {
      Object.entries(plan).forEach(([_dayKey, exercises]: [string, Exercise[]]) => {
        exercises.forEach((ex: Exercise) => {
          expect(ex.id).toBeDefined();
          expect(ex.name).toBeDefined();
          expect(ex.muscle).toBeDefined();
          expect(ex.targetSets).toBeGreaterThan(0);
        });
      });
    }
  });
});
