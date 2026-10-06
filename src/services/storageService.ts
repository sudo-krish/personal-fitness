import { UserProfile, WorkoutDayLog, ExerciseProgress, SetRecord, UserStats } from '../types/workout';
import { DEFAULT_PROFILES } from '../data/initialWorkoutPlan';

const STORAGE_KEYS = {
  ACTIVE_PROFILE_ID: 'liquid_fitness_active_profile',
  PROFILES: 'liquid_fitness_profiles',
  WORKOUT_LOGS: 'liquid_fitness_logs', // key: `${profileId}_${dateStr}`
  STATS: 'liquid_fitness_stats', // key: `${profileId}`
};

type RemoteSet = {
  exerciseId?: string;
  exercise_id?: string;
  setNumber?: number;
  set_number?: number;
  weightKg?: string | number | null;
  weight_kg?: string | number | null;
  repsCompleted?: string | null;
  reps_completed?: string | null;
  rpeAchieved?: string | null;
  rpe_achieved?: string | null;
  isCompleted?: boolean | number;
  is_completed?: boolean | number;
};

function resolveString(val1: unknown, val2: unknown, fallback = ''): string {
  const val = val1 ?? val2;
  return val !== null && val !== undefined ? String(val) : fallback;
}

function parseRemoteSet(s: RemoteSet): { exId: string; setRecord: SetRecord } | null {
  const exId = s.exerciseId ?? s.exercise_id;
  const setNum = s.setNumber ?? s.set_number;
  if (!exId || !setNum) return null;

  return {
    exId,
    setRecord: {
      setNumber: setNum,
      weightKg: resolveString(s.weightKg, s.weight_kg),
      repsCompleted: resolveString(s.repsCompleted, s.reps_completed),
      rpeAchieved: resolveString(s.rpeAchieved, s.rpe_achieved, '7-8'),
      isCompleted: Boolean(s.isCompleted ?? s.is_completed),
    },
  };
}

function buildCleanProgress(remoteSets: RemoteSet[]): Record<string, ExerciseProgress> {
  const cleanProgress: Record<string, ExerciseProgress> = {};
  for (const s of remoteSets) {
    const parsed = parseRemoteSet(s);
    if (!parsed) continue;
    const { exId, setRecord } = parsed;
    if (!cleanProgress[exId]) {
      cleanProgress[exId] = {
        exerciseId: exId,
        sets: [],
        isFullyCompleted: false,
        userNotes: '',
      };
    }
    cleanProgress[exId].sets.push(setRecord);
  }
  return cleanProgress;
}

function purgeLocalDayLogCache(profileId: string, dateStr: string): void {
  const storageKey = `${STORAGE_KEYS.WORKOUT_LOGS}_${profileId}_${dateStr}`;
  try {
    localStorage.removeItem(storageKey);
  } catch {
    // ignore
  }
}

export class StorageService {
  /**
   * Get all user profiles
   */
  static getProfiles(): UserProfile[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.PROFILES);
      if (stored) {
        const parsed: UserProfile[] = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map(p => {
            const themeColor = p.themeColor || (p.id === 'person_1' ? '#0284c7' : '#e11d48');
            return {
              ...p,
              themeColor,
              accentGradient:
                p.accentGradient ||
                (p.id === 'person_1'
                  ? 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)'
                  : 'linear-gradient(135deg, #e11d48 0%, #f43f5e 100%)'),
              glowColor:
                p.glowColor ||
                (p.id === 'person_1' ? 'rgba(2, 132, 199, 0.22)' : 'rgba(225, 29, 72, 0.22)'),
            };
          });
        }
      }
    } catch {
      // Fallback
    }
    return DEFAULT_PROFILES;
  }

  /**
   * Check if user has explicitly initiated their duo profiles
   */
  static hasInitiatedProfiles(): boolean {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.PROFILES);
      if (!stored) return false;
      const parsed = JSON.parse(stored);
      if (!Array.isArray(parsed) || parsed.length < 2) return false;
      const p1 = parsed[0]?.name;
      const p2 = parsed[1]?.name;
      return Boolean(p1 && p2 && p1 !== 'Partner 1' && p2 !== 'Partner 2');
    } catch {
      return false;
    }
  }

  /**
   * Clear all local fitness data for fresh restart
   */
  static clearAll(): void {
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith('liquid_fitness_')) {
          keysToRemove.push(k);
        }
      }
      keysToRemove.forEach(k => localStorage.removeItem(k));
    } catch (e) {
      console.warn('Storage clear error:', e);
    }
  }

  /**
   * Save user profiles
   */
  static saveProfiles(profiles: UserProfile[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(profiles));
    } catch (e) {
      console.warn('Storage error:', e);
    }
  }

  /**
   * Get active profile ID
   */
  static getActiveProfileId(): string {
    const saved = localStorage.getItem(STORAGE_KEYS.ACTIVE_PROFILE_ID);
    if (saved) return saved;
    return 'person_1';
  }

  /**
   * Set active profile ID
   */
  static setActiveProfileId(id: string): void {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_PROFILE_ID, id);
  }

  /**
   * Generate today's date formatted as YYYY-MM-DD
   */
  static getTodayDateStr(): string {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Determine today's day key (monday, tuesday, etc.)
   */
  static getTodayDayKey(): string {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return days[new Date().getDay()] ?? 'monday';
  }

  /**
   * Load workout log for given profile and date
   */
  static getDayLog(profileId: string, dateStr: string, dayKey: string): WorkoutDayLog {
    const storageKey = `${STORAGE_KEYS.WORKOUT_LOGS}_${profileId}_${dateStr}`;
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Error reading day log:', e);
    }

    // Clean empty progress map (populated dynamically as exercises are logged)
    const initialProgress: Record<string, ExerciseProgress> = {};

    const newLog: WorkoutDayLog = {
      profileId,
      dateStr,
      dayKey,
      exercisesProgress: initialProgress,
      completedPercentage: 0,
      isWorkoutFinished: false,
      updatedAt: new Date().toISOString(),
    };

    this.saveDayLog(newLog);
    return newLog;
  }


  /**
   * Hydrate workout log directly from SQLite (Local or Cloudflare D1)
   */
  static async fetchRemoteDayLog(
    profileId: string,
    dateStr: string,
    dayKey: string,
  ): Promise<WorkoutDayLog | null> {
    if (typeof window === 'undefined') return null;

    try {
      const res = await fetch(
        `/api/sync?profileId=${encodeURIComponent(profileId)}&dateStr=${encodeURIComponent(dateStr)}`,
      );
      if (!res.ok) return null;
      const data = await res.json();
      if (!data.success || !Array.isArray(data.sets)) {
        return null;
      }

      // If SQLite D1 returned 0 sets (e.g. after reinit, truncate, or fresh day),
      // purge any stale localStorage cache and return a pristine empty log
      if (data.sets.length === 0) {
        purgeLocalDayLogCache(profileId, dateStr);
        return {
          profileId,
          dateStr,
          dayKey,
          exercisesProgress: {},
          completedPercentage: 0,
          isWorkoutFinished: false,
          updatedAt: new Date().toISOString(),
        };
      }

      const cleanProgress = buildCleanProgress(data.sets as RemoteSet[]);
      const syncedLog: WorkoutDayLog = {
        profileId,
        dateStr,
        dayKey,
        exercisesProgress: cleanProgress,
        completedPercentage: 0,
        isWorkoutFinished: false,
        updatedAt: new Date().toISOString(),
      };
      this.saveDayLog(syncedLog);
      return syncedLog;
    } catch {
      return null;
    }
  }

  /**
   * Save workout day log and recalculate streaks & percentages
   */
  static saveDayLog(log: WorkoutDayLog): void {
    // Calculate completion percentage
    const exercises = Object.values(log.exercisesProgress);
    let totalSets = 0;
    let completedSets = 0;

    exercises.forEach(ex => {
      let allSetsDone = ex.sets.length > 0;
      ex.sets.forEach(s => {
        totalSets++;
        if (s.isCompleted) {
          completedSets++;
        } else {
          allSetsDone = false;
        }
      });
      ex.isFullyCompleted = allSetsDone;
    });

    log.completedPercentage = totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0;
    log.isWorkoutFinished = totalSets > 0 && completedSets === totalSets;
    log.updatedAt = new Date().toISOString();

    const storageKey = `${STORAGE_KEYS.WORKOUT_LOGS}_${log.profileId}_${log.dateStr}`;
    try {
      localStorage.setItem(storageKey, JSON.stringify(log));
      this.updateStats(log.profileId, log);
      this.syncToRemoteD1(log);
    } catch (e) {
      console.warn('Error saving workout log:', e);
    }
  }

  private static syncDebounceTimer: number | null = null;

  /**
   * Non-blocking background sync to Cloudflare D1 edge database
   */
  static syncToRemoteD1(log: WorkoutDayLog): void {
    if (typeof window === 'undefined' || !navigator.onLine) return;

    if (this.syncDebounceTimer) {
      window.clearTimeout(this.syncDebounceTimer);
    }

    this.syncDebounceTimer = window.setTimeout(async () => {
      try {
        const flattenedSets: {
          exerciseId: string;
          setNumber: number;
          weightKg: number | null;
          repsCompleted: string | null;
          rpeAchieved: string | null;
          isCompleted: boolean;
        }[] = [];

        Object.values(log.exercisesProgress).forEach(ex => {
          ex.sets.forEach(s => {
            flattenedSets.push({
              exerciseId: ex.exerciseId,
              setNumber: s.setNumber,
              weightKg: s.weightKg ? Number(s.weightKg) : null,
              repsCompleted: s.repsCompleted ? String(s.repsCompleted) : null,
              rpeAchieved: s.rpeAchieved ? String(s.rpeAchieved) : null,
              isCompleted: Boolean(s.isCompleted),
            });
          });
        });

        await fetch('/api/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            profileId: log.profileId,
            dateStr: log.dateStr,
            dayKey: log.dayKey,
            isWorkoutFinished: log.isWorkoutFinished,
            sets: flattenedSets,
          }),
        });
      } catch {
        // Silently preserve local-first reliability in case endpoint is not active yet
      }
    }, 1200);
  }

  /**
   * Retrieve user stats & streak
   */
  static getUserStats(profileId: string): UserStats {
    const storageKey = `${STORAGE_KEYS.STATS}_${profileId}`;
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // Fallback
    }

    return {
      profileId,
      currentStreak: 1, // Start with encouraging streak
      longestStreak: 3,
      totalWorkoutsCompleted: 0,
      totalSetsCompleted: 0,
    };
  }

  /**
   * Update stats upon workout progress
   */
  private static updateStats(profileId: string, log: WorkoutDayLog): void {
    const stats = this.getUserStats(profileId);
    if (log.isWorkoutFinished && stats.lastWorkoutDate !== log.dateStr) {
      stats.currentStreak += 1;
      if (stats.currentStreak > stats.longestStreak) {
        stats.longestStreak = stats.currentStreak;
      }
      stats.totalWorkoutsCompleted += 1;
      stats.lastWorkoutDate = log.dateStr;
    }

    // Count total sets completed
    let completedSetsCount = 0;
    Object.values(log.exercisesProgress).forEach(ex => {
      ex.sets.forEach(s => {
        if (s.isCompleted) completedSetsCount++;
      });
    });
    stats.totalSetsCompleted = Math.max(stats.totalSetsCompleted, completedSetsCount);

    const storageKey = `${STORAGE_KEYS.STATS}_${profileId}`;
    try {
      localStorage.setItem(storageKey, JSON.stringify(stats));
    } catch (e) {
      console.warn('Error saving stats:', e);
    }
  }

  /**
   * Clear all cached day logs and streak stats from localStorage
   */
  static clearWorkoutLogs(): void {
    if (typeof window === 'undefined') return;
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (
          key &&
          (key.startsWith(STORAGE_KEYS.WORKOUT_LOGS) || key.startsWith(STORAGE_KEYS.STATS))
        ) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(k => localStorage.removeItem(k));
    } catch (e) {
      console.warn('Error clearing workout logs:', e);
    }
  }
}
