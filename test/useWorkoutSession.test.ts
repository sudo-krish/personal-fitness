import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { useWorkoutSession } from '../src/hooks/useWorkoutSession';
import { StorageService } from '../src/services/storageService';
import { PlanService } from '../src/services/planService';
import { UserProfile, Exercise } from '../src/types/workout';
import { audio } from '../src/lib/audio';
import { haptics } from '../src/lib/haptics';

const internals = (
  React as unknown as {
    __CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE: { H: unknown };
  }
).__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;

describe('useWorkoutSession', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    const store = new Map<string, string>();
    globalThis.localStorage = {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => store.set(k, v),
      removeItem: (k: string) => store.delete(k),
      clear: () => store.clear(),
      key: (i: number) => Array.from(store.keys())[i] ?? null,
      length: 0,
    } as unknown as Storage;
    vi.spyOn(audio, 'playCelebration').mockImplementation(() => {});
    vi.spyOn(audio, 'playSetComplete').mockImplementation(() => {});
    vi.spyOn(haptics, 'celebration').mockImplementation(() => {});
    vi.spyOn(haptics, 'success').mockImplementation(() => {});
    vi.spyOn(StorageService, 'getActiveProfileId').mockReturnValue('person_1');
    vi.spyOn(StorageService, 'setActiveProfileId').mockImplementation(() => {});
    vi.spyOn(StorageService, 'getTodayDayKey').mockReturnValue('monday');
    vi.spyOn(StorageService, 'getTodayDateStr').mockReturnValue('2026-10-06');
  });

  afterEach(() => {
    internals.H = null;
  });

  const mockUser: UserProfile = {
    id: 'person_1',
    name: 'Alex',
    title: 'P1',
    gender: 'Male',
    age: 28,
    stats: 'Stats',
    bio: 'Bio',
    avatarEmoji: '⚡',
    themeColor: '#0284c7',
    isPrimary: true,
  };

  const mockPartner: UserProfile = {
    id: 'person_2',
    name: 'Jordan',
    title: 'P2',
    gender: 'Female',
    age: 26,
    stats: 'Stats',
    bio: 'Bio',
    avatarEmoji: '🌸',
    themeColor: '#e11d48',
    isPrimary: false,
  };

  const mockExercises: Exercise[] = [
    {
      id: 'ex-1',
      day: 'monday',
      pair: '1A',
      name: 'Pushup',
      muscle: 'Chest',
      targetSets: 2,
      targetReps: '10',
    },
  ];

  it('initializes session, toggles active profile, runs effects, and updates sets', async () => {
    const states = new Map<number, unknown>();
    const setters = new Map<number, (val: unknown) => void>();
    let stateIndex = 0;
    const effectCallbacks: Array<() => (() => void) | void> = [];

    internals.H = {
      useState: vi.fn((initial: unknown) => {
        const id = ++stateIndex;
        if (!states.has(id)) {
          let val = typeof initial === 'function' ? (initial as () => unknown)() : initial;
          if (id === 5 || id === 6) val = mockExercises;
          states.set(id, val);
          setters.set(
            id,
            vi.fn((newVal: unknown) => {
              const resolved =
                typeof newVal === 'function'
                  ? (newVal as (prev: unknown) => unknown)(states.get(id))
                  : newVal;
              states.set(id, resolved);
            }),
          );
        }
        return [states.get(id), setters.get(id)];
      }),
      useEffect: vi.fn((fn: unknown) => {
        effectCallbacks.push(fn as () => (() => void) | void);
      }),
    };

    vi.spyOn(PlanService, 'getExercises').mockResolvedValue(mockExercises);
    vi.spyOn(StorageService, 'fetchRemoteDayLog').mockResolvedValue(null);
    vi.spyOn(StorageService, 'saveDayLog').mockImplementation(() => {});

    const onStartRest = vi.fn();
    const session = useWorkoutSession({
      user: mockUser,
      partner: mockPartner,
      onStartRest,
    });

    expect(session.p1Name).toBe('Alex');
    expect(session.p2Name).toBe('Jordan');
    expect(session.activeProfileId).toBe('person_1');

    // Toggle active profile
    session.toggleActiveProfile();
    expect(StorageService.setActiveProfileId).toHaveBeenCalledWith('person_2');

    // Run effects
    for (const cb of effectCallbacks) {
      const cleanup = cb();
      await Promise.resolve();
      if (typeof cleanup === 'function') cleanup();
    }

    // Update set 1 completion for person_1 and person_2
    session.updateSet('person_1', 'ex-1', 1, { isCompleted: true });
    session.updateSet('person_2', 'ex-1', 1, { isCompleted: true });
    expect(StorageService.saveDayLog).toHaveBeenCalled();
    expect(onStartRest).toHaveBeenCalled();
    expect(audio.playSetComplete).toHaveBeenCalled();
    expect(haptics.success).toHaveBeenCalled();

    // Re-render component with updated state
    stateIndex = 0;
    const sessionRerender = useWorkoutSession({
      user: mockUser,
      partner: mockPartner,
      onStartRest,
    });

    // Complete set 2 to trigger celebration
    sessionRerender.updateSet('person_1', 'ex-1', 2, { isCompleted: true });
    expect(audio.playCelebration).toHaveBeenCalled();

    // Reload plan
    sessionRerender.reloadPlan();
  });

  it('handles sunday fallback, non-primary partner, and remote hydrate', async () => {
    vi.spyOn(StorageService, 'getTodayDayKey').mockReturnValue('sunday');
    vi.spyOn(StorageService, 'getActiveProfileId').mockReturnValue('person_2');

    const remoteLog = {
      profileId: 'person_2',
      dateStr: '2026-10-06',
      dayKey: 'monday',
      exercisesProgress: {},
      completedPercentage: 0,
      isWorkoutFinished: false,
      updatedAt: '2026-10-06T00:00:00.000Z',
    };
    vi.spyOn(StorageService, 'fetchRemoteDayLog').mockResolvedValue(remoteLog);

    let effectCallback: (() => (() => void) | void) | null = null;
    internals.H = {
      useState: vi.fn((initial: unknown) => {
        const val = typeof initial === 'function' ? (initial as () => unknown)() : initial;
        return [val, vi.fn()];
      }),
      useEffect: vi.fn((fn: unknown) => {
        effectCallback = fn as () => (() => void) | void;
      }),
    };

    const session = useWorkoutSession({
      user: { ...mockUser, isPrimary: false },
      partner: mockPartner,
    });

    expect(session.selectedDayKey).toBe('monday');
    expect(session.activeProfileId).toBe('person_2');

    if (effectCallback) {
      (effectCallback as () => () => void)();
      await Promise.resolve();
    }
  });
});
