# Pulse Component Catalog & Reference

This document provides a comprehensive technical breakdown of all primary UI components in [`src/components/mobile/`](../../src/components/mobile/).

---

## 1. `PairWorkoutView`
**File**: [`src/components/mobile/PairWorkoutView.tsx`](../../src/components/mobile/PairWorkoutView.tsx)  
**Role**: The core workout tracking screen. Displays a synchronized station-by-station split view comparing Krish's and Theju's workouts side-by-side or stacked on narrow viewports.

### Props Interface
```typescript
interface PairWorkoutViewProps {
  schedule: DaySchedule;
  krishExercises: Exercise[];
  thejuExercises: Exercise[];
  krishLog: WorkoutDayLog;
  thejuLog: WorkoutDayLog;
  activeProfile: 'krish' | 'theju';
  onUpdateSet: (
    profileId: 'person_1' | 'person_2',
    exerciseId: string,
    setNumber: number,
    updates: Partial<SetRecord>
  ) => void;
  onOpenVideo: (url: string, title: string) => void;
  restSecondsRemaining: number;
  isRestRunning: boolean;
  onStartRest: (duration?: number) => void;
  onAdjustRest: (delta: number) => void;
  onSkipRest: () => void;
  coverImage: string;
}
```

### Key Architectural Invariants
- **Station Pair Grouping**: Computes `stations` array using `useMemo`. It pairs Krish's and Theju's exercises by matching `pair` tags (e.g. `Pair 1A`, `Pair 1B`) or falls back to matching sequential array indices.
- **Equipment Synergy Detection**: Evaluates whether both partners use shared equipment (e.g. barbell rack, cable crossover) or have conflicting stations using `getEquipmentInfo()`.
- **Synchronized Rest Bar**: Anchors an interactive countdown timer dock displaying elapsed rest time, with instant `+15s`, `-15s`, and `Skip` controls.

---

## 2. `FullWorkoutListView`
**File**: [`src/components/mobile/FullWorkoutListView.tsx`](../../src/components/mobile/FullWorkoutListView.tsx)  
**Role**: Alternative linear view for single-athlete focus. Allows scrolling through all exercises for the active profile with collapsible set cards.

### Props Interface
```typescript
interface FullWorkoutListViewProps {
  exercises: Exercise[];
  dayLog: WorkoutDayLog;
  activeProfile: 'krish' | 'theju';
  onUpdateSet: (exerciseId: string, setNumber: number, updates: Partial<SetRecord>) => void;
  onOpenVideo: (url: string, title: string) => void;
  onSelectFocusExercise: (index: number) => void;
  coverImage: string;
  splitTitle: string;
  dayName: string;
  focusDescription: string;
}
```

### Key Architectural Invariants
- **Individual Collapse State**: Stores collapsed cards in `collapsedExercises: Record<string, boolean>`.
- **Bulk Set Completion**: Includes "Complete All Sets" button triggering batch status updates and confetti celebration.

---

## 3. `PlanEditorView`
**File**: [`src/components/mobile/PlanEditorView.tsx`](../../src/components/mobile/PlanEditorView.tsx)  
**Role**: Live interactive workout program customizer. Enables modifying exercise names, target sets, rep ranges, RPE targets, notes, and video links across all 5 training days.

### Props Interface
```typescript
interface PlanEditorViewProps {
  initialProfile: 'krish' | 'theju';
  onBackToWorkout: () => void;
  onOpenVideo: (url: string, title: string) => void;
  onPlanChanged?: () => void;
}
```

### Key Architectural Invariants
- **Dynamic Day & Profile Switching**: Internal state tracks `activeProfile` and `selectedDayKey` independently from the tracker.
- **Remote D1 Synchronization**: Modifying exercises invokes [`PlanService.updateExercise()`](../../src/services/planService.ts) or [`PlanService.addExercise()`](../../src/services/planService.ts) with rollback toast notifications.
- **Template Reset**: Provides a "Reset to Defaults" action to re-seed initial templates from [`src/data/initialWorkoutPlan.ts`](../../src/data/initialWorkoutPlan.ts).

---

## 4. `TopAppBar`
**File**: [`src/components/mobile/TopAppBar.tsx`](../../src/components/mobile/TopAppBar.tsx)  
**Role**: Liquid glass top navigation bar displaying active profile pill, view mode toggle (Pair vs List), offline sync badge, and sidebar trigger.

### Key Props & Behaviors
- Smoothly animates profile switch between **Krish** (`#0284C7`) and **Theju** (`#E11D48`).
- Displays pulsating cloud icon when background sync with Cloudflare D1 is actively writing.

---

## 5. `DaysBottomNav`
**File**: [`src/components/mobile/DaysBottomNav.tsx`](../../src/components/mobile/DaysBottomNav.tsx)  
**Role**: Fixed bottom navigation bar featuring 5 training days (Mon: Push, Tue: Pull, Wed: Legs, Thu: Upper, Fri: Lower/Full).

### Key Props & Behaviors
- Highlights today's day key automatically.
- Smooth Motion sliding indicator beneath the selected day tab.
- Integrated safe area spacing (`pb-safe`) for edge-to-edge iOS displays.

---

## 6. Drawers (`VideoDrawer` & `ExerciseListDrawer`)
- **`VideoDrawer.tsx`**: Embeds YouTube technique guides with responsive 16:9 iframe, form cues, and coach notes.
- **`ExerciseListDrawer.tsx`**: Quick jump sheet displaying all exercises in the current session with completion percentage badges.
