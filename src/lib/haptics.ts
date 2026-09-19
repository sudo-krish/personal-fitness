// Mobile Navigator Vibration API wrapper for tactile gym feedback
export const haptics = {
  // Light touch for stepper +/- buttons
  tap() {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(12);
      } catch {
        // Fallback gracefully if vibration is disabled or unsupported
      }
    }
  },

  // Satisfying pulse when checking off a set
  success() {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(35);
      } catch {
        // Fallback gracefully if vibration is disabled or unsupported
      }
    }
  },

  // Double pulse when timer completes or station swaps
  alarm() {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([60, 40, 80]);
      } catch {
        // Fallback gracefully if vibration is disabled or unsupported
      }
    }
  },

  // Tri-pulse celebration for Personal Records
  celebration() {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([50, 30, 50, 30, 100]);
      } catch {
        // Fallback gracefully if vibration is disabled or unsupported
      }
    }
  },
};
