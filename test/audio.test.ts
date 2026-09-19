import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { audio } from '../src/lib/audio';

describe('audio engine', () => {
  const originalWindow = globalThis.window;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.window = originalWindow;
  });

  it('runs safely without window/AudioContext', () => {
    expect(() => audio.playSetComplete()).not.toThrow();
    expect(() => audio.playCountdownTick()).not.toThrow();
    expect(() => audio.playRestComplete()).not.toThrow();
    expect(() => audio.playCelebration()).not.toThrow();
  });

  it('synthesizes sounds when AudioContext is present', () => {
    const mockOscillator = {
      type: 'sine',
      frequency: { setValueAtTime: vi.fn() },
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
    };

    const mockGain = {
      gain: {
        setValueAtTime: vi.fn(),
        linearRampToValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
      },
      connect: vi.fn(),
    };

    const mockCtx = {
      state: 'suspended',
      currentTime: 0,
      createOscillator: vi.fn().mockReturnValue(mockOscillator),
      createGain: vi.fn().mockReturnValue(mockGain),
      destination: {},
      resume: vi.fn().mockResolvedValue(undefined),
    };

    // Mock window with AudioContext constructor
    const mockAudioContextConstructor = vi.fn().mockImplementation(function () {
      return mockCtx;
    });
    globalThis.window = {
      AudioContext: mockAudioContextConstructor,
    } as unknown as Window & typeof globalThis;

    audio.playSetComplete();
    expect(mockCtx.createOscillator).toHaveBeenCalled();
    expect(mockCtx.createGain).toHaveBeenCalled();

    audio.playCountdownTick();
    expect(mockCtx.createOscillator).toHaveBeenCalled();

    audio.playRestComplete();
    expect(mockCtx.createOscillator).toHaveBeenCalled();

    audio.playCelebration();
    expect(mockCtx.createOscillator).toHaveBeenCalled();
  });
});
