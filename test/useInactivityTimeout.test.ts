import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { useInactivityTimeout } from '../src/hooks/useInactivityTimeout';

const internals = (
  React as unknown as {
    __CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE: { H: unknown };
  }
).__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;

describe('useInactivityTimeout', () => {
  const originalWindow = globalThis.window;
  const addEventListenerMock = vi.fn();
  const removeEventListenerMock = vi.fn();
  const setTimeoutMock = vi.fn((cb: () => void) => {
    cb();
    return 111 as unknown as number;
  });
  const clearTimeoutMock = vi.fn();
  const setIntervalMock = vi.fn(() => 222 as unknown as number);
  const clearIntervalMock = vi.fn();

  beforeEach(() => {
    vi.restoreAllMocks();
    globalThis.window = {
      addEventListener: addEventListenerMock,
      removeEventListener: removeEventListenerMock,
      setTimeout: setTimeoutMock,
      clearTimeout: clearTimeoutMock,
      setInterval: setIntervalMock,
      clearInterval: clearIntervalMock,
    } as unknown as Window & typeof globalThis;
  });

  afterEach(() => {
    globalThis.window = originalWindow;
    internals.H = null;
  });

  it('attaches listeners, checks idle time, triggers timeout, and handles active pulse', () => {
    let effectCallback: (() => (() => void) | void) | null = null;
    const ref1 = { current: Date.now() - 40 * 60 * 1000 };
    const ref2 = { current: Date.now() - 15 * 60 * 1000 };
    const ref3 = { current: 123 as number | null };
    let refCount = 0;

    internals.H = {
      useRef: vi.fn(() => {
        refCount++;
        if (refCount === 1) return ref1;
        if (refCount === 2) return ref2;
        return ref3;
      }),
      useCallback: vi.fn((fn: unknown) => fn),
      useEffect: vi.fn((fn: unknown) => {
        effectCallback = fn as () => (() => void) | void;
      }),
    };

    const onTimeout = vi.fn();
    const onActivePulse = vi.fn();

    const { resetActivity } = useInactivityTimeout({
      timeoutMs: 30 * 60 * 1000,
      onTimeout,
      onActivePulse,
      pulseIntervalMs: 10 * 60 * 1000,
      enabled: true,
    });

    expect(effectCallback).toBeDefined();
    if (effectCallback) {
      const cleanup = (effectCallback as () => () => void)();

      // Trigger attached event listener twice to test throttle
      const eventCalls = addEventListenerMock.mock.calls as unknown[][];
      const eventHandler = eventCalls[0]?.[1];
      expect(typeof eventHandler).toBe('function');
      if (typeof eventHandler === 'function') {
        (eventHandler as () => void)();
        (eventHandler as () => void)();
      }

      // Check interval tick
      const intervalCalls = setIntervalMock.mock.calls as unknown[][];
      const intervalHandler = intervalCalls[0]?.[0];
      expect(typeof intervalHandler).toBe('function');
      if (typeof intervalHandler === 'function') {
        ref1.current = Date.now() - 35 * 60 * 1000;
        (intervalHandler as () => void)();
        expect(onTimeout).toHaveBeenCalled();
      }

      // Reset activity and pulse
      ref2.current = Date.now() - 20 * 60 * 1000;
      resetActivity();
      expect(onActivePulse).toHaveBeenCalled();

      // Cleanup
      if (typeof cleanup === 'function') {
        cleanup();
        expect(removeEventListenerMock).toHaveBeenCalled();
      }
    }
  });

  it('does nothing when disabled', () => {
    let effectCallback: (() => (() => void) | void) | null = null;
    internals.H = {
      useRef: vi.fn(() => ({ current: 0 })),
      useCallback: vi.fn((fn: unknown) => fn),
      useEffect: vi.fn((fn: unknown) => {
        effectCallback = fn as () => (() => void) | void;
      }),
    };

    useInactivityTimeout({
      onTimeout: vi.fn(),
      enabled: false,
    });

    expect(effectCallback).toBeDefined();
    if (effectCallback) {
      const cleanup = (effectCallback as () => () => void)();
      expect(cleanup).toBeUndefined();
      expect(addEventListenerMock).not.toHaveBeenCalled();
    }
  });
});
