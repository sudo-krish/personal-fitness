import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { useRestTimer } from '../src/hooks/useRestTimer';
import { audio } from '../src/lib/audio';
import { haptics } from '../src/lib/haptics';

const internals = (React as unknown as {
  __CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE: { H: unknown };
}).__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;

describe('useRestTimer', () => {
  const originalWindow = globalThis.window;
  const mockSetInterval = vi.fn((_cb: () => void, _ms: number) => 123 as unknown as NodeJS.Timeout);
  const mockClearInterval = vi.fn((_id?: unknown) => {});

  beforeEach(() => {
    vi.restoreAllMocks();
    mockSetInterval.mockClear();
    mockClearInterval.mockClear();
    vi.spyOn(globalThis, 'clearInterval').mockImplementation((id) => {
      mockClearInterval(id);
    });
    globalThis.window = {
      setInterval: mockSetInterval,
      clearInterval: mockClearInterval,
    } as unknown as Window & typeof globalThis;
    vi.spyOn(audio, 'playRestComplete').mockImplementation(() => {});
    vi.spyOn(haptics, 'alarm').mockImplementation(() => {});
    vi.spyOn(haptics, 'tap').mockImplementation(() => {});
  });

  afterEach(() => {
    globalThis.window = originalWindow;
    internals.H = null;
  });

  it('runs countdown interval when timer is active and decrements', () => {
    let effectCallback: (() => (() => void) | void) | null = null;
    const setSecondsSpy = vi.fn();
    const setRunningSpy = vi.fn();
    let stateCalls = 0;
    const refObj = { current: null as number | null };

    internals.H = {
      useState: vi.fn(() => {
        stateCalls++;
        if (stateCalls === 1) return [5, setSecondsSpy];
        return [true, setRunningSpy];
      }),
      useRef: vi.fn(() => refObj),
      useCallback: vi.fn((fn: unknown) => fn),
      useEffect: vi.fn((fn: unknown) => {
        effectCallback = fn as () => (() => void) | void;
      }),
    };

    useRestTimer();

    expect(effectCallback).toBeDefined();
    if (!effectCallback) return;

    const cleanup = (effectCallback as () => () => void)();
    expect(mockSetInterval).toHaveBeenCalledWith(expect.any(Function), 1000);
    expect(refObj.current).toBe(123);

    const intervalCb = mockSetInterval.mock.calls[0]?.[0];
    expect(typeof intervalCb).toBe('function');
    if (typeof intervalCb !== 'function') return;

    // Test decrementation branch (prev > 1)
    intervalCb();
    expect(setSecondsSpy).toHaveBeenCalled();
    const updater1 = setSecondsSpy.mock.calls[0]?.[0];
    expect(typeof updater1).toBe('function');
    if (typeof updater1 === 'function') {
      expect(updater1(5)).toBe(4);
    }

    // Test timer completion branch (prev <= 1)
    const updater2 = setSecondsSpy.mock.calls[0]?.[0];
    expect(typeof updater2).toBe('function');
    if (typeof updater2 === 'function') {
      expect(updater2(1)).toBe(0);
      expect(setRunningSpy).toHaveBeenCalledWith(false);
      expect(mockClearInterval).toHaveBeenCalledWith(123);
      expect(audio.playRestComplete).toHaveBeenCalled();
      expect(haptics.alarm).toHaveBeenCalled();

      // Test completion when ref.current is null
      refObj.current = null;
      expect(updater2(0)).toBe(0);
    }

    // Test cleanup
    refObj.current = 123;
    if (typeof cleanup === 'function') {
      cleanup();
      expect(mockClearInterval).toHaveBeenCalledWith(123);
    }
  });

  it('clears interval when timer is not running or reaches 0', () => {
    let effectCallback: (() => (() => void) | void) | null = null;
    let stateCalls = 0;
    const refObj = { current: 456 as number | null };

    internals.H = {
      useState: vi.fn(() => {
        stateCalls++;
        if (stateCalls === 1) return [0, vi.fn()];
        return [false, vi.fn()];
      }),
      useRef: vi.fn(() => refObj),
      useCallback: vi.fn((fn: unknown) => fn),
      useEffect: vi.fn((fn: unknown) => {
        effectCallback = fn as () => (() => void) | void;
      }),
    };

    useRestTimer();

    expect(effectCallback).toBeDefined();
    if (effectCallback) {
      const cleanup = (effectCallback as () => () => void)();
      expect(mockClearInterval).toHaveBeenCalledWith(456);
      if (typeof cleanup === 'function') {
        cleanup();
      }
    }
  });

  it('exercises startRestTimer, adjustRestTime, and skipRest callbacks', () => {
    const setSecondsSpy = vi.fn();
    const setRunningSpy = vi.fn();
    let stateCalls = 0;

    internals.H = {
      useState: vi.fn(() => {
        stateCalls++;
        if (stateCalls === 1) return [0, setSecondsSpy];
        return [false, setRunningSpy];
      }),
      useRef: vi.fn(() => ({ current: null })),
      useCallback: vi.fn((fn: unknown) => fn),
      useEffect: vi.fn(() => {}),
    };

    const timer = useRestTimer();

    // startRestTimer with custom duration
    timer.startRestTimer(45);
    expect(setSecondsSpy).toHaveBeenCalledWith(45);
    expect(setRunningSpy).toHaveBeenCalledWith(true);

    // startRestTimer with default duration (60)
    timer.startRestTimer();
    expect(setSecondsSpy).toHaveBeenCalledWith(60);

    // adjustRestTime positive delta
    timer.adjustRestTime(15);
    const adjustUpdater1 = setSecondsSpy.mock.calls[2]?.[0];
    expect(typeof adjustUpdater1).toBe('function');
    if (typeof adjustUpdater1 === 'function') {
      expect(adjustUpdater1(30)).toBe(45);
    }

    // adjustRestTime negative delta clamped to 0
    timer.adjustRestTime(-50);
    const adjustUpdater2 = setSecondsSpy.mock.calls[3]?.[0];
    expect(typeof adjustUpdater2).toBe('function');
    if (typeof adjustUpdater2 === 'function') {
      expect(adjustUpdater2(20)).toBe(0);
    }

    // skipRest
    timer.skipRest();
    expect(setRunningSpy).toHaveBeenCalledWith(false);
    expect(setSecondsSpy).toHaveBeenCalledWith(0);
    expect(haptics.tap).toHaveBeenCalled();
  });
});
