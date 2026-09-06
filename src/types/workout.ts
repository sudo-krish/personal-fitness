export type MuscleGroup =
  | 'Chest'
  | 'Triceps'
  | 'Chest, Triceps'
  | 'Back'
  | 'Biceps'
  | 'Back, Biceps'
  | 'Back, Grip'
  | 'Mid Back'
  | 'Lats & Upper Back'
  | 'Shoulders'
  | 'Side Delts'
  | 'Hamstrings, Glutes, Lower Back'
  | 'Glutes & Hamstrings'
  | 'Quads, Glutes'
  | 'Quads & Glutes'
  | 'Quads / Hamstrings'
  | 'Quads'
  | 'Calves'
  | 'Core'
  | 'Obliques'
  | 'Core, Cardio'
  | 'Cardio';

export interface Exercise {
  id: string;
  day: string;
  pair: string; // e.g. "Pair 1A", "Pair 1B", "Pair 2A", "Pair 3", "Finisher"
  name: string;
  muscle: MuscleGroup | string;
  targetSets: number;
  targetReps: string; // e.g. "8-12", "10-12", "30-45s", "8-10/leg"
  targetRpe?: string; // e.g. "7-8"
  notes?: string;
  videoUrl?: string;
}

export interface SetRecord {
  setNumber: number;
  weightKg: string;
  repsCompleted: string;
  rpeAchieved: string;
  isCompleted: boolean;
  completedAt?: string;
}

export interface ExerciseProgress {
  exerciseId: string;
  sets: SetRecord[];
  isFullyCompleted: boolean;
  userNotes?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  title: string; // e.g. "Person 1 (Male, 29)"
  gender: 'Male' | 'Female' | 'Other';
  age: number;
  stats: string; // e.g. "181 cm, 80 kg"
  bio: string;
  avatarEmoji: string;
  themeColor: string; // Hex color
  accentGradient: string;
  glowColor: string;
}

export interface DaySchedule {
  key: string; // 'monday', 'tuesday', etc.
  name: string; // "Monday"
  splitTitle: string; // "Push (Chest, Shoulders, Triceps)"
  shortName: string; // "Mon"
  isRest: boolean;
  focusDescription: string;
}

export interface WorkoutDayLog {
  profileId: string;
  dateStr: string; // YYYY-MM-DD
  dayKey: string; // 'monday', etc.
  exercisesProgress: Record<string, ExerciseProgress>; // key is exerciseId
  completedPercentage: number;
  isWorkoutFinished: boolean;
  updatedAt: string;
}

export interface UserStats {
  profileId: string;
  currentStreak: number;
  longestStreak: number;
  totalWorkoutsCompleted: number;
  totalSetsCompleted: number;
  lastWorkoutDate?: string;
}
