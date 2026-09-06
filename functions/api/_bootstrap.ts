// functions/api/_bootstrap.ts
// Automatic zero-config D1 schema bootstrap and seeding for Cloudflare Pages Functions

import { WORKOUT_PLAN_DATA } from '../../src/data/initialWorkoutPlan';

let isBootstrapped = false;

const TABLE_SQL = [
  'CREATE TABLE IF NOT EXISTS profiles (id TEXT PRIMARY KEY, name TEXT NOT NULL, title TEXT NOT NULL, gender TEXT NOT NULL, age INTEGER NOT NULL, stats TEXT NOT NULL, bio TEXT NOT NULL, avatar_emoji TEXT NOT NULL, theme_color TEXT NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)',
  'CREATE TABLE IF NOT EXISTS workout_splits (id TEXT PRIMARY KEY, profile_id TEXT NOT NULL, day_key TEXT NOT NULL, split_title TEXT NOT NULL, focus_description TEXT NOT NULL, is_rest BOOLEAN DEFAULT 0, FOREIGN KEY (profile_id) REFERENCES profiles(id))',
  'CREATE TABLE IF NOT EXISTS exercises (id TEXT PRIMARY KEY, profile_id TEXT NOT NULL, day_key TEXT NOT NULL, pair_tag TEXT NOT NULL, name TEXT NOT NULL, muscle TEXT NOT NULL, target_sets INTEGER NOT NULL, target_reps TEXT NOT NULL, target_rpe TEXT DEFAULT \'7-8\', notes TEXT, video_url TEXT, sort_order INTEGER DEFAULT 0, FOREIGN KEY (profile_id) REFERENCES profiles(id))',
  'CREATE TABLE IF NOT EXISTS set_logs (id TEXT PRIMARY KEY, profile_id TEXT NOT NULL, workout_date TEXT NOT NULL, exercise_id TEXT NOT NULL, set_number INTEGER NOT NULL, weight_kg REAL, reps_completed TEXT, rpe_achieved TEXT, is_completed BOOLEAN DEFAULT 0, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (profile_id) REFERENCES profiles(id), UNIQUE(profile_id, workout_date, exercise_id, set_number))',
  'CREATE TABLE IF NOT EXISTS user_streaks (profile_id TEXT PRIMARY KEY, current_streak INTEGER DEFAULT 0, longest_streak INTEGER DEFAULT 0, total_workouts INTEGER DEFAULT 0, last_workout_date TEXT, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (profile_id) REFERENCES profiles(id))',
];

const SEED_SQL = [
  "INSERT OR IGNORE INTO profiles (id, name, title, gender, age, stats, bio, avatar_emoji, theme_color) VALUES ('person_1', 'Krish', 'Person 1 (Male, 29)', 'Male', 29, '181 cm, 80 kg', 'Returning after a 2-year gap. Rebuild tendon strength, progressive overload, RPE 7-8 target.', '⚡', '#0284c7')",
  "INSERT OR IGNORE INTO profiles (id, name, title, gender, age, stats, bio, avatar_emoji, theme_color) VALUES ('person_2', 'Theju', 'Person 2 (Female, 27)', 'Female', 27, '165 cm, 60 kg', 'Complete beginner. Focus: Motor control, bodyweight progressions, 2s eccentric tempo.', '✨', '#e11d48')",
  "INSERT OR IGNORE INTO user_streaks (profile_id, current_streak, longest_streak, total_workouts) VALUES ('person_1', 3, 5, 12)",
  "INSERT OR IGNORE INTO user_streaks (profile_id, current_streak, longest_streak, total_workouts) VALUES ('person_2', 3, 4, 10)",
];

export async function ensureDbReady(d1: any): Promise<void> {
  if (!d1 || isBootstrapped) {
    return;
  }

  try {
    // Create tables — one exec() per statement (D1 requirement)
    for (const sql of TABLE_SQL) {
      await d1.exec(sql);
    }

    // Seed profiles and streaks
    for (const sql of SEED_SQL) {
      await d1.exec(sql);
    }

    // Seed exercises if table is empty
    const checkEx = await d1.prepare('SELECT count(*) as cnt FROM exercises').first();
    const count = Number(checkEx?.cnt || 0);

    if (count === 0) {
      const days = ['monday', 'tuesday', 'thursday', 'friday', 'saturday'];

      for (const profileId of ['person_1', 'person_2']) {
        for (const dayKey of days) {
          const dayList = WORKOUT_PLAN_DATA[profileId]?.[dayKey] || [];
          for (let i = 0; i < dayList.length; i++) {
            const e = dayList[i];
            await d1.prepare(
              'INSERT OR IGNORE INTO exercises (id, profile_id, day_key, pair_tag, name, muscle, target_sets, target_reps, target_rpe, notes, video_url, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
            ).bind(
              e.id,
              profileId,
              dayKey,
              e.pair || '',
              e.name || '',
              e.muscle || '',
              Number(e.targetSets) || 3,
              e.targetReps || '8-12',
              e.targetRpe || '7-8',
              e.notes || '',
              e.videoUrl || '',
              i + 1
            ).run();
          }
        }
      }
    }

    isBootstrapped = true;
    console.log('[_bootstrap] D1 tables created and seeded successfully.');
  } catch (err) {
    console.error('[_bootstrap] Auto-migration error:', err);
  }
}
