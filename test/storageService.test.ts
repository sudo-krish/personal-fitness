import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { StorageService } from '../src/services/storageService';
import { DEFAULT_PROFILES } from '../src/data/initialWorkoutPlan';

const createLocalStorageMock = () => {
  const store = new Map<string, string>();
  return {
    getItem: vi.fn((key: string) => store.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store.set(key, String(value));
    }),
    removeItem: vi.fn((key: string) => {
      store.delete(key);
    }),
    clear: vi.fn(() => {
      store.clear();
    }),
    get length() {
      return store.size;
    },
    key: vi.fn((index: number) => Array.from(store.keys()).at(index) ?? null),
  };
};

describe('StorageService', () => {
  const originalFetch = globalThis.fetch;
  const originalNavigator = globalThis.navigator;
  const originalLocalStorage = globalThis.localStorage;
  const originalWindow = globalThis.window;

  beforeEach(() => {
    globalThis.localStorage = createLocalStorageMock() as unknown as Storage;
    globalThis.window = globalThis as unknown as Window & typeof globalThis;
    Object.defineProperty(globalThis, 'navigator', {
      value: { onLine: true },
      configurable: true,
      writable: true,
    });
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    globalThis.localStorage = originalLocalStorage;
    globalThis.window = originalWindow;
    Object.defineProperty(globalThis, 'navigator', {
      value: originalNavigator,
      configurable: true,
      writable: true,
    });
  });

  describe('profiles', () => {
    it('returns DEFAULT_PROFILES when localStorage is empty', () => {
      const profiles = StorageService.getProfiles();
      expect(profiles).toHaveLength(DEFAULT_PROFILES.length);
      expect(profiles[0]?.id).toBe(DEFAULT_PROFILES[0]?.id);
    });

    it('saves and retrieves profiles correctly', () => {
      const base = DEFAULT_PROFILES[0];
      if (!base) throw new Error('No default profile');
      const customProfiles = [{ ...base, name: 'Custom User' }];
      StorageService.saveProfiles(customProfiles);
      const retrieved = StorageService.getProfiles();
      expect(retrieved[0]?.name).toBe('Custom User');
    });

    it('gets and sets active profile ID', () => {
      expect(StorageService.getActiveProfileId()).toBe(DEFAULT_PROFILES[0]?.id);
      StorageService.setActiveProfileId('profile-2');
      expect(StorageService.getActiveProfileId()).toBe('profile-2');
    });
  });

  describe('dates', () => {
    it('generates a valid YYYY-MM-DD date string', () => {
      const dateStr = StorageService.getTodayDateStr();
      expect(dateStr).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('returns a valid day key', () => {
      const dayKey = StorageService.getTodayDayKey();
      const validDays = [
        'sunday',
        'monday',
        'tuesday',
        'wednesday',
        'thursday',
        'friday',
        'saturday',
      ];
      expect(validDays).toContain(dayKey);
    });
  });

  describe('dayLog', () => {
    it('initializes a clean day log when no saved log exists', () => {
      const log = StorageService.getDayLog('person_1', '2026-09-19', 'monday');
      expect(log.profileId).toBe('person_1');
      expect(log.dateStr).toBe('2026-09-19');
      expect(log.dayKey).toBe('monday');
      expect(log.completedPercentage).toBe(0);
      expect(log.isWorkoutFinished).toBe(false);
    });

    it('saves and recalculates completion percentage', () => {
      const log = StorageService.getDayLog('person_1', '2026-09-19', 'monday');
      const firstProgress = Object.values(log.exercisesProgress)[0];
      if (firstProgress?.sets[0]) {
        firstProgress.sets[0].isCompleted = true;
      }
      StorageService.saveDayLog(log);

      const reloaded = StorageService.getDayLog('person_1', '2026-09-19', 'monday');
      expect(reloaded.completedPercentage).toBeGreaterThan(0);
    });
  });

  describe('stats', () => {
    it('returns default stats for new profile', () => {
      const stats = StorageService.getUserStats('new-user');
      expect(stats.profileId).toBe('new-user');
      expect(stats.currentStreak).toBe(1);
      expect(stats.totalWorkoutsCompleted).toBe(0);
    });
  });

  describe('remote sync', () => {
    it('returns null from fetchRemoteDayLog if API responds with non-ok', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({ ok: false } as Response);
      const res = await StorageService.fetchRemoteDayLog('person_1', '2026-09-19', 'monday');
      expect(res).toBeNull();
    });

    it('merges remote sets when fetchRemoteDayLog succeeds', async () => {
      const mockSet = {
        exerciseId: 'person_1_1',
        setNumber: 1,
        weightKg: 80,
        repsCompleted: '10',
        rpeAchieved: '8',
        isCompleted: 1,
      };
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, sets: [mockSet] }),
      } as Response);

      const res = await StorageService.fetchRemoteDayLog('person_1', '2026-09-19', 'monday');
      expect(res).not.toBeNull();
    });

    it('syncs dayLog to remote D1 with debounce', async () => {
      vi.useFakeTimers();
      const mockFetch = vi
        .fn()
        .mockResolvedValue({ ok: true, json: async () => ({ success: true }) });
      globalThis.fetch = mockFetch;
      const log = StorageService.getDayLog('person_1', '2026-09-19', 'monday');

      StorageService.syncToRemoteD1(log);
      StorageService.syncToRemoteD1(log);
      expect(mockFetch).not.toHaveBeenCalled();

      await vi.advanceTimersByTimeAsync(1500);
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/sync',
        expect.objectContaining({
          method: 'POST',
        }),
      );
      vi.useRealTimers();
    });

    it('skips remote sync if offline', () => {
      const originalNav = globalThis.navigator;
      Object.defineProperty(globalThis, 'navigator', {
        value: { onLine: false },
        configurable: true,
      });
      const mockFetch = vi.fn();
      globalThis.fetch = mockFetch;
      const log = StorageService.getDayLog('person_1', '2026-09-19', 'monday');
      StorageService.syncToRemoteD1(log);
      expect(mockFetch).not.toHaveBeenCalled();
      Object.defineProperty(globalThis, 'navigator', {
        value: originalNav,
        configurable: true,
      });
    });

    it('updates streak and workout stats on completed workout', () => {
      const log = StorageService.getDayLog('person_1', '2026-09-19', 'monday');
      Object.values(log.exercisesProgress).forEach(ex => {
        ex.sets.forEach(s => {
          s.isCompleted = true;
        });
      });
      StorageService.saveDayLog(log);

      const stats = StorageService.getUserStats('person_1');
      expect(stats.totalWorkoutsCompleted).toBe(1);
      expect(stats.currentStreak).toBe(2);
      expect(stats.lastWorkoutDate).toBe('2026-09-19');
    });

    it('handles custom profiles without default match', () => {
      const customProfile = {
        id: 'custom_99',
        name: 'Custom',
        title: 'Athlete',
        gender: 'Male',
        age: 28,
        stats: 'None',
        bio: 'Bio',
        avatarEmoji: '⚡',
        themeColor: '#000000',
        accentGradient: 'none',
        glowColor: 'none',
      };
      localStorage.setItem('liquid_fitness_profiles', JSON.stringify([customProfile]));
      const profiles = StorageService.getProfiles();
      expect(profiles[0]?.id).toBe('custom_99');
    });

    it('handles localStorage errors gracefully in getDayLog and saveProfiles', () => {
      const errorStorage = {
        ...localStorage,
        getItem: vi.fn(() => {
          throw new Error('QuotaExceeded');
        }),
        setItem: vi.fn(() => {
          throw new Error('QuotaExceeded');
        }),
      };
      globalThis.localStorage = errorStorage as unknown as Storage;
      expect(() => StorageService.saveProfiles([])).not.toThrow();
      const log = StorageService.getDayLog('person_1', '2026-09-19', 'monday');
      expect(log).toBeDefined();
    });

    it('returns null from fetchRemoteDayLog if API responds with invalid data or throws', async () => {
      // API error throw
      globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network failure'));
      expect(await StorageService.fetchRemoteDayLog('person_1', '2026-09-19', 'monday')).toBeNull();

      // data.success is false
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: false }),
      } as Response);
      expect(await StorageService.fetchRemoteDayLog('person_1', '2026-09-19', 'monday')).toBeNull();

      // data.sets is empty
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, sets: [] }),
      } as Response);
      expect(await StorageService.fetchRemoteDayLog('person_1', '2026-09-19', 'monday')).toBeNull();

      // window is undefined
      const win = globalThis.window;
      // @ts-expect-error test window undefined
      delete globalThis.window;
      expect(await StorageService.fetchRemoteDayLog('person_1', '2026-09-19', 'monday')).toBeNull();
      globalThis.window = win;
    });

    it('merges remote sets with snake_case fields and skips invalid entries', async () => {
      const mockSets = [
        {
          exercise_id: 'person_1_1',
          set_number: 1,
          weight_kg: 85,
          reps_completed: '12',
          rpe_achieved: '9',
          is_completed: 1,
        },
        {
          exercise_id: 'person_1_1',
          set_number: 2,
          weight_kg: null,
          reps_completed: null,
          rpe_achieved: null,
          is_completed: 0,
        },
        { set_number: 1 },
        { exercise_id: 'person_1_1', set_number: 999 },
      ];
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, sets: mockSets }),
      } as Response);

      const res = await StorageService.fetchRemoteDayLog('person_1', '2026-09-19', 'monday');
      expect(res).not.toBeNull();
    });

    it('handles remote sync errors and missing window', async () => {
      vi.useFakeTimers();
      globalThis.fetch = vi.fn().mockRejectedValue(new Error('Sync failure'));
      const log = StorageService.getDayLog('person_1', '2026-09-19', 'monday');
      StorageService.syncToRemoteD1(log);
      await vi.advanceTimersByTimeAsync(1500);
      vi.useRealTimers();

      const win = globalThis.window;
      // @ts-expect-error test window undefined
      delete globalThis.window;
      expect(() => StorageService.syncToRemoteD1(log)).not.toThrow();
      globalThis.window = win;
    });

    it('updates longestStreak when currentStreak exceeds it', () => {
      const initialStats = {
        profileId: 'person_1',
        currentStreak: 4,
        longestStreak: 4,
        totalWorkoutsCompleted: 3,
        totalSetsCompleted: 10,
        lastWorkoutDate: '2026-09-18',
      };
      localStorage.setItem('liquid_fitness_stats_person_1', JSON.stringify(initialStats));

      const log = StorageService.getDayLog('person_1', '2026-09-19', 'monday');
      Object.values(log.exercisesProgress).forEach(ex => {
        ex.sets.forEach(s => {
          s.isCompleted = true;
        });
      });
      StorageService.saveDayLog(log);

      const stats = StorageService.getUserStats('person_1');
      expect(stats.currentStreak).toBe(5);
      expect(stats.longestStreak).toBe(5);
      expect(stats.totalWorkoutsCompleted).toBe(4);
    });

    it('handles localStorage errors when updating and retrieving stats', () => {
      const errorStorage = {
        ...localStorage,
        getItem: vi.fn(() => {
          throw new Error('QuotaExceeded');
        }),
        setItem: vi.fn(() => {
          throw new Error('QuotaExceeded');
        }),
      };
      globalThis.localStorage = errorStorage as unknown as Storage;
      const fallbackStats = StorageService.getUserStats('person_1');
      expect(fallbackStats.currentStreak).toBe(1);
    });
  });
});
