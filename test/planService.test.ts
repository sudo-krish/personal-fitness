import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PlanService } from '../src/services/planService';
import { WORKOUT_PLAN_DATA } from '../src/data/initialWorkoutPlan';

describe('PlanService', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  describe('getExercises', () => {
    it('returns exercises from API when available', async () => {
      const mockExercise = {
        id: 'ex-1',
        dayKey: 'monday',
        pairTag: 'A',
        name: 'Bench Press',
        muscle: 'Chest',
        targetSets: 3,
        targetReps: '8-10',
        targetRpe: '8',
        notes: 'Control tempo',
        videoUrl: 'https://example.com/video',
      };

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, exercises: [mockExercise] }),
      } as Response);

      const exercises = await PlanService.getExercises('user_1', 'monday');
      expect(exercises).toHaveLength(1);
      expect(exercises[0]?.name).toBe('Bench Press');
      expect(exercises[0]?.targetRpe).toBe('8');
    });

    it('handles mapping of exercises with fallback or numeric values', async () => {
      const mockExercise = {
        id: 123,
        dayKey: 'tuesday',
        pairTag: '',
        name: 'Squat',
        muscle: 'Legs',
        targetSets: 'invalid',
        targetReps: '',
        targetRpe: undefined,
        notes: null,
        videoUrl: {},
      };

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, exercises: [mockExercise] }),
      } as Response);

      const exercises = await PlanService.getExercises('user_1', 'tuesday');
      expect(exercises[0]?.id).toBe('123');
      expect(exercises[0]?.targetSets).toBe(0);
      expect(exercises[0]?.targetRpe).toBe('7-8');
      expect(exercises[0]?.notes).toBe('');
      expect(exercises[0]?.videoUrl).toBe('');
    });

    it('falls back to WORKOUT_PLAN_DATA when API call fails', async () => {
      globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      const exercises = await PlanService.getExercises('person_1', 'monday');
      expect(exercises).toEqual(WORKOUT_PLAN_DATA['person_1']?.['monday'] || []);
      expect(exercises.length).toBeGreaterThan(0);
    });

    it('returns empty array when profile or day does not exist in fallback', async () => {
      globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      const exercises = await PlanService.getExercises('nonexistent', 'unknown-day');
      expect(exercises).toEqual([]);
    });

    it('falls back to WORKOUT_PLAN_DATA when API returns unsuccessful or empty data', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: false, exercises: [] }),
      } as Response);

      const exercises = await PlanService.getExercises('person_1', 'monday');
      expect(exercises.length).toBeGreaterThan(0);
    });
  });

  describe('updateExercise', () => {
    it('returns true when update succeeds', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({ ok: true } as Response);

      const res = await PlanService.updateExercise('ex-1', { name: 'Incline Bench Press' });
      expect(res).toBe(true);
    });

    it('returns false when update fails', async () => {
      globalThis.fetch = vi.fn().mockRejectedValue(new Error('DB error'));

      const res = await PlanService.updateExercise('ex-1', { name: 'Fail' });
      expect(res).toBe(false);
    });
  });

  describe('addExercise', () => {
    it('returns created exercise when API succeeds', async () => {
      const newEx = {
        id: 'new-1',
        dayKey: 'monday',
        pairTag: 'B',
        name: 'Incline DB Press',
        muscle: 'Upper Chest',
        targetSets: 3,
        targetReps: '10-12',
        targetRpe: '8',
        notes: 'Full stretch',
        videoUrl: '',
      };

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, exercise: newEx }),
      } as Response);

      const result = await PlanService.addExercise({
        profileId: 'user_1',
        dayKey: 'monday',
        name: 'Incline DB Press',
        muscle: 'Upper Chest',
        pairTag: 'B',
        targetSets: 3,
        targetReps: '10-12',
        targetRpe: '8',
      });
      expect(result).not.toBeNull();
      expect(result?.id).toBe('new-1');
      expect(result?.name).toBe('Incline DB Press');
    });

    it('returns null on failure', async () => {
      globalThis.fetch = vi.fn().mockRejectedValue(new Error('Server error'));

      const result = await PlanService.addExercise({
        profileId: 'user_1',
        dayKey: 'monday',
        name: 'Fail',
        muscle: 'Chest',
        pairTag: 'A',
        targetSets: 3,
        targetReps: '10',
        targetRpe: '7',
      });
      expect(result).toBeNull();
    });
  });

  describe('deleteExercise', () => {
    it('returns true on successful deletion', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({ ok: true } as Response);

      const res = await PlanService.deleteExercise('ex-1');
      expect(res).toBe(true);
    });

    it('returns false on failed deletion', async () => {
      globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      const res = await PlanService.deleteExercise('ex-1');
      expect(res).toBe(false);
    });
  });

  describe('resetDayPlan', () => {
    it('returns true when reset succeeds', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({ ok: true } as Response);

      const res = await PlanService.resetDayPlan('user_1', 'monday');
      expect(res).toBe(true);
    });

    it('returns false when reset fails', async () => {
      globalThis.fetch = vi.fn().mockRejectedValue(new Error('Server error'));

      const res = await PlanService.resetDayPlan('user_1', 'monday');
      expect(res).toBe(false);
    });
  });
});
