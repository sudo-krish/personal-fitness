import { Exercise } from '../types/workout';
import { WORKOUT_PLAN_DATA } from '../data/initialWorkoutPlan';

function toSafeString(val: unknown, fallback = ''): string {
  if (typeof val === 'string' && val.length > 0) {
    return val;
  }
  if (val !== undefined && val !== null && typeof val !== 'object') {
    return String(val);
  }
  return fallback;
}

function toSafeNumber(val: unknown, fallback = 0): number {
  const n = Number(val);
  return Number.isFinite(n) ? n : fallback;
}

function mapExerciseDto(e: Record<string, unknown>): Exercise {
  return {
    id: toSafeString(e.id),
    day: toSafeString(e.dayKey),
    pair: toSafeString(e.pairTag),
    name: toSafeString(e.name),
    muscle: toSafeString(e.muscle),
    targetSets: toSafeNumber(e.targetSets),
    targetReps: toSafeString(e.targetReps),
    targetRpe: toSafeString(e.targetRpe, '7-8'),
    notes: toSafeString(e.notes),
    videoUrl: toSafeString(e.videoUrl),
  };
}

export class PlanService {
  /**
   * Fetch exercises from SQLite API (/api/exercises)
   * Falls back to WORKOUT_PLAN_DATA if offline
   */
  static async getExercises(profileId: string, dayKey: string): Promise<Exercise[]> {
    try {
      const res = await fetch(
        `/api/exercises?profileId=${encodeURIComponent(profileId)}&dayKey=${encodeURIComponent(dayKey)}`
      );
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.exercises) && data.exercises.length > 0) {
          return data.exercises.map(mapExerciseDto);
        }
      }
    } catch (e) {
      console.warn('[PlanService] Error fetching from /api/exercises, using local fallback:', e);
    }

    // Fallback to initial plan data
    const profilePlans = Object.prototype.hasOwnProperty.call(WORKOUT_PLAN_DATA, profileId)
      ? (Reflect.get(WORKOUT_PLAN_DATA, profileId) as Record<string, Exercise[]> | undefined)
      : undefined;
    if (profilePlans && Object.prototype.hasOwnProperty.call(profilePlans, dayKey)) {
      const plan = Reflect.get(profilePlans, dayKey) as Exercise[] | undefined;
      return Array.isArray(plan) ? plan : [];
    }
    return [];
  }

  /**
   * Update exercise in SQLite via PUT /api/exercises/:id
   */
  static async updateExercise(
    id: string,
    updates: Partial<{
      name: string;
      muscle: string;
      pairTag: string;
      targetSets: number;
      targetReps: string;
      targetRpe: string;
      notes: string;
      videoUrl: string;
    }>
  ): Promise<boolean> {
    try {
      const res = await fetch(`/api/exercises/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      return res.ok;
    } catch (e) {
      console.error('[PlanService] Error updating exercise:', e);
      return false;
    }
  }

  /**
   * Add a new exercise to SQLite via POST /api/exercises
   */
  static async addExercise(data: {
    profileId: string;
    dayKey: string;
    name: string;
    muscle: string;
    pairTag: string;
    targetSets: number;
    targetReps: string;
    targetRpe: string;
    notes?: string;
    videoUrl?: string;
  }): Promise<Exercise | null> {
    try {
      const res = await fetch('/api/exercises', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.exercise) {
          const e = json.exercise;
          return {
            id: e.id,
            day: e.dayKey,
            pair: e.pairTag,
            name: e.name,
            muscle: e.muscle,
            targetSets: e.targetSets,
            targetReps: e.targetReps,
            targetRpe: e.targetRpe || '7-8',
            notes: e.notes || '',
            videoUrl: e.videoUrl || '',
          };
        }
      }
    } catch (e) {
      console.error('[PlanService] Error adding exercise:', e);
    }
    return null;
  }

  /**
   * Delete an exercise from SQLite via DELETE /api/exercises/:id
   */
  static async deleteExercise(id: string): Promise<boolean> {
    try {
      const res = await fetch(`/api/exercises/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      return res.ok;
    } catch (e) {
      console.error('[PlanService] Error deleting exercise:', e);
      return false;
    }
  }

  /**
   * Reset a profile's day plan back to original template
   */
  static async resetDayPlan(profileId: string, dayKey: string): Promise<boolean> {
    try {
      const res = await fetch('/api/exercises/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileId, dayKey }),
      });
      return res.ok;
    } catch (e) {
      console.error('[PlanService] Error resetting day plan:', e);
      return false;
    }
  }
}
