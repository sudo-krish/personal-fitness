import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { useExerciseCatalog } from '../src/hooks/useExerciseCatalog';
import { PlanService } from '../src/services/planService';
import { Exercise } from '../src/types/workout';

const internals = (
  React as unknown as {
    __CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE: { H: unknown };
  }
).__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;

describe('useExerciseCatalog', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    internals.H = null;
  });

  it('manages filters, loads data in effect, and performs actions', async () => {
    const states = new Map<number, unknown>();
    const setters = new Map<number, (val: unknown) => void>();
    let stateIndex = 0;
    let effectCallback: (() => (() => void) | void) | null = null;

    internals.H = {
      useState: vi.fn((initial: unknown) => {
        const id = ++stateIndex;
        if (!states.has(id)) {
          states.set(id, initial);
          setters.set(
            id,
            vi.fn((val: unknown) => {
              states.set(
                id,
                typeof val === 'function'
                  ? (val as (prev: unknown) => unknown)(states.get(id))
                  : val,
              );
            }),
          );
        }
        return [states.get(id), setters.get(id)];
      }),
      useEffect: vi.fn((fn: unknown) => {
        effectCallback = fn as () => (() => void) | void;
      }),
    };

    const mockExercises: Exercise[] = [
      {
        id: 'ex-1',
        day: 'monday',
        pair: '1A',
        name: 'Bench Press',
        muscle: 'Chest',
        targetSets: 3,
        targetReps: '10',
      },
    ];

    vi.spyOn(PlanService, 'getLibraryExercises').mockResolvedValue({
      exercises: mockExercises,
      total: 1,
    });
    vi.spyOn(PlanService, 'updateExerciseProfile').mockResolvedValue(true);
    vi.spyOn(PlanService, 'resolveYouTubeVideo').mockResolvedValue(
      'https://youtube.com/watch?v=123',
    );
    vi.spyOn(PlanService, 'updateExerciseVideo').mockResolvedValue(true);

    const catalog = useExerciseCatalog(20);

    // Test setters
    catalog.setSearch('Press');
    catalog.setSelectedMuscle('Chest');
    catalog.setSelectedEquipment('Barbell');
    catalog.setSelectedProfileTab('person_1');
    catalog.setVideoFilter('has');
    catalog.setPage(1);

    expect(catalog.totalPages).toBeDefined();

    // Trigger effect
    if (effectCallback) {
      const cleanup = (effectCallback as () => () => void)();
      await Promise.resolve();
      if (typeof cleanup === 'function') cleanup();
    }

    // Assign profile
    await catalog.assignProfile('ex-1', 'person_2', 'Jordan');
    expect(PlanService.updateExerciseProfile).toHaveBeenCalledWith('ex-1', 'person_2');

    // Resolve video
    const videoUrl = await catalog.resolveVideo(mockExercises[0]!);
    expect(videoUrl).toBe('https://youtube.com/watch?v=123');

    // Update video URL
    const updateRes = await catalog.updateVideoUrl('ex-1', 'https://youtube.com/custom');
    expect(updateRes).toBe(true);

    // Negative branch: resolveVideo returns null
    vi.spyOn(PlanService, 'resolveYouTubeVideo').mockResolvedValue(null);
    const missingUrl = await catalog.resolveVideo(mockExercises[0]!);
    expect(missingUrl).toBeNull();

    // Negative branch: updateVideoUrl fails
    vi.spyOn(PlanService, 'updateExerciseVideo').mockResolvedValue(false);
    const failUpdate = await catalog.updateVideoUrl('ex-1', 'https://fail');
    expect(failUpdate).toBe(false);

    // Negative branch: assignProfile to unassigned
    await catalog.assignProfile('ex-1', null);
    expect(PlanService.updateExerciseProfile).toHaveBeenCalledWith('ex-1', null);
  });

  it('handles query with missing filter and load errors', async () => {
    let effectCallback: (() => (() => void) | void) | null = null;
    internals.H = {
      useState: vi.fn((initial: unknown) => [initial, vi.fn()]),
      useEffect: vi.fn((fn: unknown) => {
        effectCallback = fn as () => (() => void) | void;
      }),
    };

    vi.spyOn(PlanService, 'getLibraryExercises').mockRejectedValue(new Error('Fetch error'));
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const catalog = useExerciseCatalog(10);
    catalog.setVideoFilter('missing');

    if (effectCallback) {
      (effectCallback as () => () => void)();
      await Promise.resolve();
      await Promise.resolve();
      expect(consoleErrorSpy).toHaveBeenCalled();
    }
  });
});
