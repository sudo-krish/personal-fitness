# Work Packages Guide for Pulse UI

This guide demonstrates how to apply the **Work Package (WP)** decomposition methodology when planning, refactoring, or building UI and full-stack features in Pulse.

---

## 🎯 Purpose of Work Packages in Pulse

Pulse contains dense, mission-critical components like [`PairWorkoutView.tsx`](../../src/components/mobile/PairWorkoutView.tsx) (~1,300 lines of code) and [`PlanEditorView.tsx`](../../src/components/mobile/PlanEditorView.tsx) (~1,100 lines of code). Large, monolithic edits to these files frequently introduce regressions:
- Breaking station pair synchronization logic.
- Degrading 60fps mobile scroll performance.
- Desynchronizing local storage and edge Cloudflare D1 state.

By splitting initiatives into modular Work Packages, each AI agent or human engineer focuses on **one bounded problem at a time**.

---

## 📋 The Work Package Structure for UI Changes

When decomposing a UI feature, break work into three discrete layers:

```
┌─────────────────────────────────────────────────────────────┐
│  WP-01: Data Model & Edge API Contracts                    │
│  (src/types/workout.ts, functions/api/*, schema.sql)        │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│  WP-02: Isolated Component & Layout Implementation          │
│  (New atomic subcomponents, hooks, or styles)               │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│  WP-03: View Integration & End-to-End Verification          │
│  (Wire into PairWorkoutView / App.tsx, test audio & haptics)│
└─────────────────────────────────────────────────────────────┘
```

---

## 🔍 Task Formatting Rules

Each task within a Work Package must follow these strict guidelines:

1. **One Crisp Sentence**: Start with a single active-voice sentence specifying the exact change.
2. **Target File Links**: Provide clickable Markdown file links to target locations.
3. **Inference Points**: Outline technical trade-offs, state hydration risks, or rendering considerations.
4. **Verification Step**: Provide an unambiguous verification command or manual check.

### Example Decomposition: Adding 1-Rep Max (1RM) Estimator

#### 📦 Work Package WP-01: 1RM Math & Progress Types
- [ ] **Task 01.1**: Add a utility function in `src/lib/calculations.ts` implementing the Epley and Brzycki 1RM estimation formulas.
  - **Files**: `src/lib/calculations.ts`
  - **Verification**: Run unit tests asserting calculated 1RM matches known reference tables.

#### 📦 Work Package WP-02: 1RM Micro-Badge in Pair Workout View
- [ ] **Task 02.1**: Render an estimated 1RM pill badge next to the highest completed weight in `PairWorkoutView.tsx`.
  - **Files**: [`src/components/mobile/PairWorkoutView.tsx`](../../src/components/mobile/PairWorkoutView.tsx)
  - **Inference Note**: Memoize calculations with `useMemo` so re-rendering the rest timer countdown doesn't re-execute formula loops.
  - **Verification**: Log a set of 80kg x 8 reps; assert pill displays estimated 1RM of 100kg.
