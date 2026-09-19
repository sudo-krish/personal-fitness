import { useState, useEffect, useRef, useCallback } from 'react';
import { audio } from '../lib/audio';
import { haptics } from '../lib/haptics';

export interface UseRestTimerReturn {
  restSecondsRemaining: number;
  isRestTimerRunning: boolean;
  startRestTimer: (duration?: number) => void;
  adjustRestTime: (delta: number) => void;
  skipRest: () => void;
}

/**
 * Custom hook to manage workout rest timer countdown with audio and haptic cues
 */
export function useRestTimer(): UseRestTimerReturn {
  const [restSecondsRemaining, setRestSecondsRemaining] = useState<number>(0);
  const [isRestTimerRunning, setIsRestTimerRunning] = useState<boolean>(false);
  const restTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (isRestTimerRunning && restSecondsRemaining > 0) {
      restTimerRef.current = window.setInterval(() => {
        setRestSecondsRemaining(prev => {
          if (prev <= 1) {
            setIsRestTimerRunning(false);
            if (restTimerRef.current) clearInterval(restTimerRef.current);
            audio.playRestComplete();
            haptics.alarm();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (restTimerRef.current) clearInterval(restTimerRef.current);
    }

    return () => {
      if (restTimerRef.current) clearInterval(restTimerRef.current);
    };
  }, [isRestTimerRunning, restSecondsRemaining]);

  const startRestTimer = useCallback((duration: number = 60) => {
    setRestSecondsRemaining(duration);
    setIsRestTimerRunning(true);
  }, []);

  const adjustRestTime = useCallback((delta: number) => {
    setRestSecondsRemaining(prev => Math.max(0, prev + delta));
  }, []);

  const skipRest = useCallback(() => {
    setIsRestTimerRunning(false);
    setRestSecondsRemaining(0);
    haptics.tap();
  }, []);

  return {
    restSecondsRemaining,
    isRestTimerRunning,
    startRestTimer,
    adjustRestTime,
    skipRest,
  };
}
