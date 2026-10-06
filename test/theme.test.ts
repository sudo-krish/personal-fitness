import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { ThemeProvider, useTheme, ThemePreference } from '../src/context/ThemeContext';

const internals = (
  React as unknown as {
    __CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE: { H: unknown };
  }
).__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;

describe('ThemeContext', () => {
  const originalWindow = globalThis.window;
  const originalDocument = globalThis.document;
  const originalLocalStorage = globalThis.localStorage;

  let localStorageStore: Record<string, string> = {};
  let setAttributeMock: ReturnType<typeof vi.fn>;
  let classListToggleMock: ReturnType<typeof vi.fn>;
  let addEventListenerMock: ReturnType<typeof vi.fn>;
  let removeEventListenerMock: ReturnType<typeof vi.fn>;
  let matchMediaMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.restoreAllMocks();
    localStorageStore = {};

    setAttributeMock = vi.fn();
    classListToggleMock = vi.fn();
    addEventListenerMock = vi.fn();
    removeEventListenerMock = vi.fn();

    const mediaQueryList = {
      matches: true,
      addEventListener: addEventListenerMock,
      removeEventListener: removeEventListenerMock,
    };
    matchMediaMock = vi.fn(() => mediaQueryList);

    const mockStorage = {
      getItem: vi.fn((key: string) => localStorageStore[key] || null),
      setItem: vi.fn((key: string, val: string) => {
        localStorageStore[key] = val;
      }),
      removeItem: vi.fn((key: string) => {
        delete localStorageStore[key];
      }),
      clear: vi.fn(() => {
        localStorageStore = {};
      }),
      length: 0,
      key: vi.fn(() => null),
    };

    globalThis.localStorage = mockStorage as unknown as Storage;

    globalThis.document = {
      documentElement: {
        setAttribute: setAttributeMock,
        classList: {
          toggle: classListToggleMock,
        },
      },
    } as unknown as Document;

    globalThis.window = {
      matchMedia: matchMediaMock,
      localStorage: mockStorage,
    } as unknown as Window & typeof globalThis;
  });

  afterEach(() => {
    globalThis.window = originalWindow;
    globalThis.document = originalDocument;
    globalThis.localStorage = originalLocalStorage;
    internals.H = null;
  });

  it('throws when useTheme is called outside ThemeProvider', () => {
    internals.H = {
      use: vi.fn(() => null),
    };

    expect(() => useTheme()).toThrow('useTheme must be used within a ThemeProvider');
  });

  it('renders ThemeProvider and provides theme state and functions', () => {
    let effectCallback: (() => (() => void) | void) | null = null;
    let themeState: ThemePreference = 'system';
    let resolvedState = 'dark';

    const setThemeState = vi.fn((val: ThemePreference) => {
      themeState = val;
    });
    const setResolvedTheme = vi.fn((val: string) => {
      resolvedState = val;
    });

    let stateCount = 0;
    internals.H = {
      useState: vi.fn((initial: unknown) => {
        stateCount++;
        if (stateCount === 1) {
          const initVal = typeof initial === 'function' ? (initial as () => unknown)() : initial;
          return [initVal ?? themeState, setThemeState];
        }
        const initVal = typeof initial === 'function' ? (initial as () => unknown)() : initial;
        return [initVal ?? resolvedState, setResolvedTheme];
      }),
      useEffect: vi.fn((fn: unknown) => {
        effectCallback = fn as () => (() => void) | void;
      }),
    };

    const rendered = ThemeProvider({ children: 'Child Content' });
    expect(rendered).toBeDefined();

    // Verify effect execution
    if (effectCallback) {
      const cleanup = (effectCallback as () => () => void)();
      expect(setAttributeMock).toHaveBeenCalledWith('data-theme', 'dark');
      expect(classListToggleMock).toHaveBeenCalledWith('dark', true);

      // Verify system change handler
      const calls = addEventListenerMock.mock.calls as unknown[][];
      const changeHandler = calls[0]?.[1];
      expect(typeof changeHandler).toBe('function');
      if (typeof changeHandler === 'function') {
        (changeHandler as () => void)();
      }

      if (typeof cleanup === 'function') {
        cleanup();
        expect(removeEventListenerMock).toHaveBeenCalledWith('change', changeHandler);
      }
    }
  });

  it('handles saved theme from localStorage and toggleTheme logic', () => {
    localStorageStore['app-theme'] = 'light';

    let effectCallback: (() => (() => void) | void) | null = null;
    let themeState: ThemePreference = 'light';
    let resolvedState = 'light';

    const setThemeState = vi.fn((val: ThemePreference) => {
      themeState = val;
    });
    const setResolvedTheme = vi.fn((val: string) => {
      resolvedState = val;
    });

    let stateCount = 0;
    internals.H = {
      useState: vi.fn((initial: unknown) => {
        stateCount++;
        if (stateCount === 1) {
          const initVal = typeof initial === 'function' ? (initial as () => unknown)() : initial;
          return [initVal, setThemeState];
        }
        const initVal = typeof initial === 'function' ? (initial as () => unknown)() : initial;
        return [initVal, setResolvedTheme];
      }),
      useEffect: vi.fn((fn: unknown) => {
        effectCallback = fn as () => (() => void) | void;
      }),
    };

    const element = ThemeProvider({ children: null });
    expect(element).toBeDefined();

    const providerProps = (
      element as {
        props: {
          value: {
            theme: ThemePreference;
            resolvedTheme: string;
            setTheme: (t: ThemePreference) => void;
            toggleTheme: () => void;
          };
        };
      }
    ).props.value;

    expect(providerProps.theme).toBe('light');

    // Test setTheme
    providerProps.setTheme('dark');
    expect(setThemeState).toHaveBeenCalledWith('dark');
    expect(globalThis.localStorage.setItem).toHaveBeenCalledWith('app-theme', 'dark');

    // Test toggleTheme
    providerProps.toggleTheme();
    expect(setThemeState).toHaveBeenCalledWith('dark');
    expect(themeState).toBe('dark');
    expect(resolvedState).toBe('light');

    if (effectCallback) {
      (effectCallback as () => void)();
      expect(setAttributeMock).toHaveBeenCalledWith('data-theme', 'light');
      expect(classListToggleMock).toHaveBeenCalledWith('dark', false);
    }
  });
});
