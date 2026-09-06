// Mobile Navigator Vibration API wrapper for tactile gym feedback
export const haptics = {
  // Light touch for stepper +/- buttons
  tap() {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(12);
      } catch {}
    }
  },

  // Satisfying pulse when checking off a set
  success() {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(35);
      } catch {}
    }
  },

  // Double pulse when timer completes or station swaps
  alarm() {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([60, 40, 80]);
      } catch {}
    }
  },

  // Tri-pulse celebration for Personal Records
  celebration() {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([50, 30, 50, 30, 100]);
      } catch {}
    }
  }
};
