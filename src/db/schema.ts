import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// 1. Users & Profiles (Multi-tenant with Duo Pair Linking & Auth)
export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  username: text('username').unique().notNull(),
  passwordHash: text('password_hash').notNull(),
  salt: text('salt').notNull(),
  isPrimary: integer('is_primary', { mode: 'boolean' }).default(false).notNull(),
  partnerId: text('partner_id'),
  pairId: text('pair_id').notNull(),
  name: text('name').notNull(),
  title: text('title').notNull(),
  gender: text('gender').notNull(),
  age: integer('age').notNull(),
  stats: text('stats').notNull(),
  bio: text('bio').notNull(),
  avatarEmoji: text('avatar_emoji').notNull(),
  themeColor: text('theme_color').notNull(),
  refreshTokenHash: text('refresh_token_hash'),
  lastActiveAt: text('last_active_at').default(sql`CURRENT_TIMESTAMP`),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

// Alias for existing references
export const profiles = users;

// 2. Workout Splits
export const workoutSplits = sqliteTable('workout_splits', {
  id: text('id').primaryKey(),
  profileId: text('profile_id').notNull(),
  dayKey: text('day_key').notNull(),
  splitTitle: text('split_title').notNull(),
  focusDescription: text('focus_description').notNull(),
  isRest: integer('is_rest', { mode: 'boolean' }).default(false),
});

// 3. Exercises
export const exercises = sqliteTable('exercises', {
  id: text('id').primaryKey(),
  profileId: text('profile_id'), // 'person_1' | 'person_2' | null
  dayKey: text('day_key').notNull(),
  pairTag: text('pair_tag').notNull(),
  name: text('name').notNull(),
  muscle: text('muscle').notNull(),
  targetSets: integer('target_sets').notNull(),
  targetReps: text('target_reps').notNull(),
  targetRpe: text('target_rpe').default('7-8'),
  notes: text('notes'),
  videoUrl: text('video_url'),
  sortOrder: integer('sort_order').default(0),
});

// 4. Set Logs (Gym Daily Todo Checklist)
export const setLogs = sqliteTable('set_logs', {
  id: text('id').primaryKey(),
  profileId: text('profile_id').notNull(),
  workoutDate: text('workout_date').notNull(),
  exerciseId: text('exercise_id').notNull(),
  setNumber: integer('set_number').notNull(),
  weightKg: real('weight_kg'),
  repsCompleted: text('reps_completed'),
  rpeAchieved: text('rpe_achieved'),
  isCompleted: integer('is_completed', { mode: 'boolean' }).default(false),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
});

// 5. User Streaks
export const userStreaks = sqliteTable('user_streaks', {
  profileId: text('profile_id').primaryKey(),
  currentStreak: integer('current_streak').default(0),
  longestStreak: integer('longest_streak').default(0),
  totalWorkouts: integer('total_workouts').default(0),
  lastWorkoutDate: text('last_workout_date'),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
});

export type Profile = typeof profiles.$inferSelect;
export type NewProfile = typeof profiles.$inferInsert;
export type SetLog = typeof setLogs.$inferSelect;
export type NewSetLog = typeof setLogs.$inferInsert;
export type UserStreak = typeof userStreaks.$inferSelect;
export type NewUserStreak = typeof userStreaks.$inferInsert;
