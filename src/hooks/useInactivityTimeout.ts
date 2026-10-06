import { useEffect, useRef, useCallback } from 'react';

interface UseInactivityTimeoutOptions {
  timeoutMs?: number; // Default 30 mins (1,800,000 ms)
  onTimeout: () => void;
  onActivePulse?: () => void; // Periodic pulse to keep active session alive on server
  pulseIntervalMs?: number; // Default 10 mins (600,000 ms)
  enabled?: boolean;
}

/**
 * useInactivityTimeout
 * Tracks user interaction across mouse, keyboard, touch, and scroll.
 * If 30 minutes elapse with no user activity, triggers the onTimeout callback.
 */
export function useInactivityTimeout({
  timeoutMs = 30 * 60 * 1000, // 30 minutes
  onTimeout,
  onActivePulse,
  pulseIntervalMs = 10 * 60 * 1000, // 10 minutes
  enabled = true,
}: UseInactivityTimeoutOptions) {
  const lastActivityRef = useRef<number>(Date.now());
  const lastPulseRef = useRef<number>(Date.now());
  const timerCheckRef = useRef<number | null>(null);

  const resetActivity = useCallback(() => {
    const now = Date.now();
    lastActivityRef.current = now;

    // Trigger active pulse to server if interval has passed and user is active
    if (onActivePulse && now - lastPulseRef.current >= pulseIntervalMs) {
      lastPulseRef.current = now;
      onActivePulse();
    }
  }, [onActivePulse, pulseIntervalMs]);

  useEffect(() => {
    if (!enabled) return;

    lastActivityRef.current = Date.now();
    lastPulseRef.current = Date.now();

    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click'];

    // Throttle activity event recording to avoid heavy re-renders
    let throttleTimeout: number | null = null;
    const handleEvent = () => {
      if (!throttleTimeout) {
        throttleTimeout = window.setTimeout(() => {
          resetActivity();
          throttleTimeout = null;
        }, 1000);
      }
    };

    events.forEach(ev => window.addEventListener(ev, handleEvent, { passive: true }));

    // Periodic check every 15 seconds
    timerCheckRef.current = window.setInterval(() => {
      const idleTime = Date.now() - lastActivityRef.current;
      if (idleTime >= timeoutMs) {
        if (timerCheckRef.current) clearInterval(timerCheckRef.current);
        onTimeout();
      }
    }, 15000);

    return () => {
      events.forEach(ev => window.removeEventListener(ev, handleEvent));
      if (timerCheckRef.current) clearInterval(timerCheckRef.current);
      if (throttleTimeout) clearTimeout(throttleTimeout);
    };
  }, [enabled, timeoutMs, onTimeout, resetActivity]);

  return { resetActivity };
}
