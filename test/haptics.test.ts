import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { haptics } from '../src/lib/haptics';

describe('haptics', () => {
  const originalNavigator = globalThis.navigator;
  const originalWindow = globalThis.window;

  beforeEach(() => {
    vi.restoreAllMocks();
    globalThis.window = {} as unknown as Window & typeof globalThis;
  });

  afterEach(() => {
    globalThis.window = originalWindow;
    Object.defineProperty(globalThis, 'navigator', {
      value: originalNavigator,
      configurable: true,
      writable: true,
    });
  });

  it('triggers tap vibration if supported', () => {
    const vibrateMock = vi.fn();
    Object.defineProperty(globalThis, 'navigator', {
      value: { vibrate: vibrateMock },
      configurable: true,
      writable: true,
    });

    haptics.tap();
    expect(vibrateMock).toHaveBeenCalledWith(12);
  });

  it('triggers success vibration if supported', () => {
    const vibrateMock = vi.fn();
    Object.defineProperty(globalThis, 'navigator', {
      value: { vibrate: vibrateMock },
      configurable: true,
      writable: true,
    });

    haptics.success();
    expect(vibrateMock).toHaveBeenCalledWith(35);
  });

  it('triggers alarm vibration pattern', () => {
    const vibrateMock = vi.fn();
    Object.defineProperty(globalThis, 'navigator', {
      value: { vibrate: vibrateMock },
      configurable: true,
      writable: true,
    });

    haptics.alarm();
    expect(vibrateMock).toHaveBeenCalledWith([60, 40, 80]);
  });

  it('triggers celebration vibration pattern', () => {
    const vibrateMock = vi.fn();
    Object.defineProperty(globalThis, 'navigator', {
      value: { vibrate: vibrateMock },
      configurable: true,
      writable: true,
    });

    haptics.celebration();
    expect(vibrateMock).toHaveBeenCalledWith([50, 30, 50, 30, 100]);
  });

  it('handles gracefully when vibrate throws or is missing', () => {
    const faultyVibrateMock = vi.fn().mockImplementation(() => {
      throw new Error('Not allowed');
    });
    Object.defineProperty(globalThis, 'navigator', {
      value: { vibrate: faultyVibrateMock },
      configurable: true,
      writable: true,
    });

    expect(() => haptics.tap()).not.toThrow();
    expect(() => haptics.success()).not.toThrow();
    expect(() => haptics.alarm()).not.toThrow();
    expect(() => haptics.celebration()).not.toThrow();
  });
});
