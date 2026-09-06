import {
  UserProfile,
  WorkoutDayLog,
  UserStats,
  ExerciseProgress,
  SetRecord,
} from '../types/workout';
import {
  DEFAULT_PROFILES,
  WORKOUT_PLAN_DATA,
} from '../data/initialWorkoutPlan';

const STORAGE_KEYS = {
  ACTIVE_PROFILE_ID: 'liquid_fitness_active_profile',
  PROFILES: 'liquid_fitness_profiles',
  WORKOUT_LOGS: 'liquid_fitness_logs', // key: `${profileId}_${dateStr}`
  STATS: 'liquid_fitness_stats', // key: `${profileId}`
};

export class StorageService {
  /**
   * Get all user profiles
   */
  static getProfiles(): UserProfile[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.PROFILES);
      if (stored) {
        const parsed: UserProfile[] = JSON.parse(stored);
        // Ensure modern light theme colors are applied
        const updated = parsed.map((p) => {
          const defaultMatch = DEFAULT_PROFILES.find((d) => d.id === p.id);
          if (defaultMatch) {
            return {
              ...p,
              themeColor: defaultMatch.themeColor,
              accentGradient: defaultMatch.accentGradient,
              glowColor: defaultMatch.glowColor,
              avatarEmoji: defaultMatch.avatarEmoji,
            };
          }
          return p;
        });
        return updated;
      }
    } catch {
      // Fallback
    }
    this.saveProfiles(DEFAULT_PROFILES);
    return DEFAULT_PROFILES;
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
    return DEFAULT_PROFILES[0].id;
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
    const days = [
      'sunday',
      'monday',
      'tuesday',
      'wednesday',
      'thursday',
      'friday',
      'saturday',
    ];
    return days[new Date().getDay()];
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

    // Initialize clean log based on the plan
    const dayExercises = WORKOUT_PLAN_DATA[profileId]?.[dayKey] || [];
    const initialProgress: Record<string, ExerciseProgress> = {};

    dayExercises.forEach((ex) => {
      const sets: SetRecord[] = [];
      for (let i = 1; i <= ex.targetSets; i++) {
        sets.push({
          setNumber: i,
          weightKg: '',
          repsCompleted: '',
          rpeAchieved: ex.targetRpe || '7-8',
          isCompleted: false,
        });
      }
      initialProgress[ex.id] = {
        exerciseId: ex.id,
        sets,
        isFullyCompleted: false,
        userNotes: '',
      };
    });

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
    dayKey: string
  ): Promise<WorkoutDayLog | null> {
    if (typeof window === 'undefined') return null;

    try {
      const res = await fetch(`/api/sync?profileId=${encodeURIComponent(profileId)}&dateStr=${encodeURIComponent(dateStr)}`);
      if (!res.ok) return null;
      const data = await res.json();
      if (!data.success || !Array.isArray(data.sets) || data.sets.length === 0) {
        return null;
      }

      // Merge saved sets from SQLite into dayLog
      const baseLog = this.getDayLog(profileId, dateStr, dayKey);
      data.sets.forEach((s: any) => {
        const exId = s.exerciseId || s.exercise_id;
        const setNum = s.setNumber || s.set_number;
        const exProgress = baseLog.exercisesProgress[exId];
        if (exProgress && setNum && exProgress.sets[setNum - 1]) {
          const targetSet = exProgress.sets[setNum - 1];
          const weight = s.weightKg ?? s.weight_kg;
          if (weight !== null && weight !== undefined) {
            targetSet.weightKg = weight;
          }
          const reps = s.repsCompleted ?? s.reps_completed;
          if (reps) {
            targetSet.repsCompleted = reps;
          }
          const rpe = s.rpeAchieved ?? s.rpe_achieved;
          if (rpe) {
            targetSet.rpeAchieved = rpe;
          }
          targetSet.isCompleted = Boolean(s.isCompleted ?? s.is_completed);
        }
      });

      this.saveDayLog(baseLog);
      return baseLog;
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

    exercises.forEach((ex) => {
      let allSetsDone = ex.sets.length > 0;
      ex.sets.forEach((s) => {
        totalSets++;
        if (s.isCompleted) {
          completedSets++;
        } else {
          allSetsDone = false;
        }
      });
      ex.isFullyCompleted = allSetsDone;
    });

    log.completedPercentage =
      totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0;
    log.isWorkoutFinished =
      totalSets > 0 && completedSets === totalSets;
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

        Object.values(log.exercisesProgress).forEach((ex) => {
          ex.sets.forEach((s) => {
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
    Object.values(log.exercisesProgress).forEach((ex) => {
      ex.sets.forEach((s) => {
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
   * Play crystal gym audio chime using Web Audio API
   */
  static playChime(type: 'rest-done' | 'set-complete' | 'all-done' = 'rest-done'): void {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;

      if (type === 'set-complete') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, now); // D5
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.15); // A5
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.35);
      } else if (type === 'rest-done') {
        [0, 0.16, 0.32].forEach((offset, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const freqs = [523.25, 659.25, 783.99]; // C5, E5, G5
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freqs[idx], now + offset);
          gain.gain.setValueAtTime(0.25, now + offset);
          gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.4);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + offset);
          osc.stop(now + offset + 0.45);
        });
      } else if (type === 'all-done') {
        [0, 0.12, 0.24, 0.38].forEach((offset, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const freqs = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freqs[idx], now + offset);
          gain.gain.setValueAtTime(0.3, now + offset);
          gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.6);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + offset);
          osc.stop(now + offset + 0.65);
        });
      }
    } catch {
      // AudioContext may be restricted before user interaction
    }
  }
}
