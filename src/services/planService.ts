import { Exercise, UserProfile } from '../types/workout';
import { StorageService } from './storageService';
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
  const profileIdRaw = toSafeString(e.profileId);
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
    profileId: profileIdRaw.length > 0 ? profileIdRaw : null,
  };
}

export interface LibraryQueryParams {
  profileId?: string;
  search?: string;
  muscle?: string;
  equipment?: string;
  hasVideo?: string;
  limit?: number;
  offset?: number;
}

function appendParam(query: URLSearchParams, key: string, value?: string, ignore?: string) {
  if (value && value !== ignore) {
    query.set(key, value);
  }
}

function buildLibraryQuery(params: LibraryQueryParams): string {
  const query = new URLSearchParams();
  appendParam(query, 'profileId', params.profileId);
  appendParam(query, 'search', params.search);
  appendParam(query, 'muscle', params.muscle, 'All');
  appendParam(query, 'pairTag', params.equipment, 'All');
  appendParam(query, 'hasVideo', params.hasVideo, 'all');
  if (params.limit) query.set('limit', String(params.limit));
  if (params.offset !== undefined) query.set('offset', String(params.offset));
  return query.toString();
}

export class PlanService {
  /**
   * Fetch exercises from SQLite API (/api/exercises)
   * Falls back to WORKOUT_PLAN_DATA if offline
   */
  static async getExercises(profileId: string, dayKey: string): Promise<Exercise[]> {
    try {
      const res = await fetch(
        `/api/exercises?profileId=${encodeURIComponent(profileId)}&dayKey=${encodeURIComponent(dayKey)}`,
      );
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.exercises) && data.exercises.length > 0) {
          return data.exercises.map(mapExerciseDto);
        }
      }
    } catch (e) {
      console.warn('[PlanService] Error fetching from /api/exercises:', e);
    }

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
    }>,
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
   * Seed curated 5-day pre-workout plan for both partners, wiping set logs and restarting progress
   */
  static async seedPreWorkoutPlan(wipeProgress = true): Promise<boolean> {
    try {
      const res = await fetch('/api/plan/seed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wipeProgress }),
      });
      if (res.ok && wipeProgress) {
        StorageService.clearWorkoutLogs();
      }
      return res.ok;
    } catch (e) {
      console.error('[PlanService] Error seeding pre-workout plan:', e);
      return false;
    }
  }

  /**
   * Fetch library exercises with search, profile filter (tri-state), muscle, and pagination
   */
  static async getLibraryExercises(
    params: LibraryQueryParams,
  ): Promise<{ exercises: Exercise[]; total: number }> {
    try {
      const queryString = buildLibraryQuery(params);
      const res = await fetch(`/api/exercises?${queryString}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.exercises)) {
          const exercises = data.exercises.map(mapExerciseDto);
          const total = data.total ?? data.count ?? exercises.length;
          return { exercises, total };
        }
      }
    } catch (e) {
      console.warn('[PlanService] Error fetching library exercises:', e);
    }
    return { exercises: [], total: 0 };
  }

  /**
   * Resolve YouTube tutorial on-demand and persist to D1
   */
  static async resolveYouTubeVideo(
    exerciseId: string,
    exerciseName: string,
  ): Promise<string | null> {
    try {
      const res = await fetch('/api/exercises/resolve-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ exerciseId, exerciseName }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.videoUrl) {
          return data.videoUrl;
        }
      }
    } catch (e) {
      console.warn('[PlanService] Error resolving YouTube video:', e);
    }
    return null;
  }

  /**
   * Update profile assignment for an exercise ('person_1', 'person_2', or null)
   */
  static async updateExerciseProfile(
    exerciseId: string,
    profileId: 'person_1' | 'person_2' | null,
  ): Promise<boolean> {
    try {
      const res = await fetch(`/api/exercises/${encodeURIComponent(exerciseId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileId: profileId ?? 'null' }),
      });
      return res.ok;
    } catch (e) {
      console.error('[PlanService] Error updating exercise profile:', e);
      return false;
    }
  }

  /**
   * Manually update the YouTube URL for an exercise
   */
  static async updateExerciseVideo(exerciseId: string, videoUrl: string): Promise<boolean> {
    try {
      const res = await fetch(`/api/exercises/${encodeURIComponent(exerciseId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoUrl }),
      });
      return res.ok;
    } catch (e) {
      console.error('[PlanService] Error updating video url:', e);
      return false;
    }
  }

  /**
   * Fetch profiles from Cloudflare D1 (/api/profiles)
   */
  static async getProfiles(): Promise<UserProfile[]> {
    try {
      const res = await fetch('/api/profiles');
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.profiles) && data.profiles.length > 0) {
          return data.profiles;
        }
      }
    } catch (e) {
      console.warn('[PlanService] Error fetching /api/profiles:', e);
    }
    return [];
  }

  /**
   * Save both partner profiles to Cloudflare D1 (/api/profiles)
   */
  static async saveProfiles(
    partner1: Partial<UserProfile>,
    partner2: Partial<UserProfile>,
  ): Promise<UserProfile[]> {
    const res = await fetch('/api/profiles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ partner1, partner2 }),
    });
    if (!res.ok) {
      throw new Error(`Failed to save profiles: ${res.statusText}`);
    }
    const data = await res.json();
    if (!data.success) {
      throw new Error(data.error || 'Failed to save profiles');
    }
    return data.profiles;
  }
}
