# State Management & Edge Data Flow

Pulse is engineered with a **dual-layer storage architecture** to guarantee zero downtime and instantaneous responsiveness inside gym basements or spots with patchy cellular reception.

---

## 🗄️ 1. Dual-Layer Storage Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                           User Action                           │
│                (e.g., Set Marked Completed / Reps Changed)      │
└────────────────────────────────┬────────────────────────────────┘
                                 │
                                 ▼
         ┌───────────────────────────────────────────────┐
         │ 1. Synchronous Optimistic Update              │
         │    • Update React Local State (Instant Render)│
         │    • Play Audio Chime + Fire Haptic Pulse     │
         │    • Persist to Browser LocalStorage          │
         └───────────────────────┬───────────────────────┘
                                 │
                                 ▼
         ┌───────────────────────────────────────────────┐
         │ 2. Asynchronous Edge Background Sync          │
         │    • POST /api/sync payload                   │
         │    • Cloudflare Pages Function (Edge Worker)  │
         │    • Drizzle ORM -> Cloudflare D1 SQLite      │
         └───────────────────────────────────────────────┘
```

### Storage Services Breakdown

1. **`StorageService` ([`src/services/storageService.ts`](../../src/services/storageService.ts))**:
   - Manages browser `localStorage` keys partitioned by `${profileId}_${dateStr}_${dayKey}`.
   - Synchronously writes set progress immediately upon input change.
   - Dispatches remote sync calls in the background without blocking the UI thread.

2. **`PlanService` ([`src/services/planService.ts`](../../src/services/planService.ts))**:
   - Manages custom exercise programs stored in Cloudflare D1 tables (`exercises`, `workout_splits`).
   - Hydrates workout definitions dynamically on day selection.
   - Falls back gracefully to [`src/data/initialWorkoutPlan.ts`](../../src/data/initialWorkoutPlan.ts) if the database is unreachable or running purely offline.

---

## ⏱️ 2. Rest Timer State Engine

The synchronized rest countdown runs as a controlled interval in [`src/App.tsx`](../../src/App.tsx#L105-L125):

- **State Elements**: `restSecondsRemaining: number`, `isRestTimerRunning: boolean`.
- **Interval Mechanics**: Managed by `useRef<number | null>(null)` to prevent race conditions during rapid state transitions.
- **Audio/Haptic Trigger**: At `prev <= 1`, the interval automatically clears, fires `audio.playRestComplete()`, and emits `haptics.alarm()`.
- **Micro-Adjustments**: `onAdjustRest(+15)` and `onAdjustRest(-15)` allow athletes to tweak rest time without restarting the timer.

---

## 🔊 3. Sensory Feedback Pipelines

Physical feedback is essential when lifting heavy weights where visual focus cannot remain glued to a screen.

### Web Audio Synthesizer (`src/lib/audio.ts`)
Avoids external audio asset loading latencies by synthesizing tones directly through the browser's `AudioContext`:
- **`playSetComplete()`**: Dual-sine wave chord with sharp attack and soft exponential release.
- **`playRestComplete()`**: Triple rising beep pattern signaling the start of the next working set.
- **`playCelebration()`**: Rapid arpeggio chime triggered on workout completion.

### Haptic Feedback Driver (`src/lib/haptics.ts`)
Utilizes `navigator.vibrate` with graceful fallback for iOS Safari:
- **`tap()`**: 10ms micro-pulse for button clicks.
- **`success()`**: Double pulse `[40ms, 60ms, 40ms]` for completed sets.
- **`alarm()`**: Strong triple pulse `[150ms, 80ms, 150ms, 80ms, 250ms]` for rest completion.
- **`heavy()`**: 80ms heavy thump for major actions.
