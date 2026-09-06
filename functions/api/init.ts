// Cloudflare Pages Function: /api/init
// Diagnostic and schema bootstrap endpoint

interface D1Database {
  exec(query: string): Promise<{ count: number; duration: number }>;
}

interface Env {
  DB?: D1Database;
}

export const onRequestGet = async (context: { env: Env }) => {
  const { env } = context;

  if (!env.DB) {
    return new Response(
      JSON.stringify({
        status: 'warning',
        message: 'D1 binding (DB) is not attached. Running in local browser storage mode.',
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    // Bootstrap core D1 tables if not present
    await env.DB.exec(`
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
        UNIQUE(profile_id, workout_date, exercise_id, set_number)
      );

      CREATE TABLE IF NOT EXISTS user_streaks (
        profile_id TEXT PRIMARY KEY,
        current_streak INTEGER DEFAULT 0,
        longest_streak INTEGER DEFAULT 0,
        total_workouts INTEGER DEFAULT 0,
        last_workout_date TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      INSERT OR IGNORE INTO profiles (id, name, title, gender, age, stats, bio, avatar_emoji, theme_color)
      VALUES 
        ('person_1', 'Krish', 'Person 1 (Male, 29)', 'Male', 29, '181 cm, 80 kg', 'Returning after a 2-year gap. Rebuild tendon strength, progressive overload, RPE 7-8 target.', '⚡', '#0284c7'),
        ('person_2', 'Partner', 'Person 2 (Female, 27)', 'Female', 27, '165 cm, 60 kg', 'Complete beginner. Focus: Motor control, bodyweight progressions, 2s eccentric tempo.', '✨', '#e11d48');
    `);

    return new Response(
      JSON.stringify({
        status: 'ready',
        message: 'Cloudflare D1 tables initialized successfully.',
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'D1 schema initialization failed';
    return new Response(
      JSON.stringify({ status: 'error', error: message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
