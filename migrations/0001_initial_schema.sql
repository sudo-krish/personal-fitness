-- Cloudflare D1 Migration 0001: Initial Schema
-- Profiles, Workout Splits, Exercises, Set Logs, and Streaks

-- 1. User Profiles
CREATE TABLE IF NOT EXISTS profiles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  title TEXT NOT NULL,
  gender TEXT NOT NULL,
  age INTEGER NOT NULL,
  stats TEXT NOT NULL,
  bio TEXT NOT NULL,
  avatar_emoji TEXT NOT NULL,
  theme_color TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Workout Plans & Splits
CREATE TABLE IF NOT EXISTS workout_splits (
  id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL,
  day_key TEXT NOT NULL,
  split_title TEXT NOT NULL,
  focus_description TEXT NOT NULL,
  is_rest BOOLEAN DEFAULT 0,
  FOREIGN KEY (profile_id) REFERENCES profiles(id)
);

-- 3. Exercises
CREATE TABLE IF NOT EXISTS exercises (
  id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL,
  day_key TEXT NOT NULL,
  pair_tag TEXT NOT NULL,
  name TEXT NOT NULL,
  muscle TEXT NOT NULL,
  target_sets INTEGER NOT NULL,
  target_reps TEXT NOT NULL,
  target_rpe TEXT DEFAULT '7-8',
  notes TEXT,
  video_url TEXT,
  sort_order INTEGER DEFAULT 0,
  FOREIGN KEY (profile_id) REFERENCES profiles(id)
);

-- 4. Set Logs (Per Day & Per Profile)
CREATE TABLE IF NOT EXISTS set_logs (
  id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL,
  workout_date TEXT NOT NULL,
  exercise_id TEXT NOT NULL,
  set_number INTEGER NOT NULL,
  weight_kg REAL,
  reps_completed TEXT,
  rpe_achieved TEXT,
  is_completed BOOLEAN DEFAULT 0,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (profile_id) REFERENCES profiles(id),
  FOREIGN KEY (exercise_id) REFERENCES exercises(id),
  UNIQUE(profile_id, workout_date, exercise_id, set_number)
);

-- 5. User Streaks
CREATE TABLE IF NOT EXISTS user_streaks (
  profile_id TEXT PRIMARY KEY,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  total_workouts INTEGER DEFAULT 0,
  last_workout_date TEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (profile_id) REFERENCES profiles(id)
);

-- Default Seed Data for Profiles
INSERT OR IGNORE INTO profiles (id, name, title, gender, age, stats, bio, avatar_emoji, theme_color)
VALUES 
  ('person_1', 'Krish', 'Person 1 (Male, 29)', 'Male', 29, '181 cm, 80 kg', 'Returning after a 2-year gap. Rebuild tendon strength, progressive overload, RPE 7-8 target.', '⚡', '#0284c7'),
  ('person_2', 'Partner', 'Person 2 (Female, 27)', 'Female', 27, '165 cm, 60 kg', 'Complete beginner. Focus: Motor control, bodyweight progressions, 2s eccentric tempo.', '✨', '#e11d48');
