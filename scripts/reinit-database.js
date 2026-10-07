#!/usr/bin/env node
/**
 * scripts/reinit-database.js
 * 
 * Completely wipes all application data (profiles, set_logs, user_streaks,
 * workout_splits, and profile-assigned exercises), and reloads the clean,
 * unassigned 876-exercise library from data/exercises-library.json.
 * 
 * Usage:
 *   node scripts/reinit-database.js                 # Output SQL to migrations/reinit_database.sql
 *   node scripts/reinit-database.js --remote        # Wipe and reinit deployed Cloudflare D1
 *   node scripts/reinit-database.js --local         # Wipe and reinit local D1 (miniflare)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const DB_NAME = 'fitness-db';

function escapeSql(val) {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'number') return String(val);
  if (typeof val === 'boolean') return val ? '1' : '0';
  return `'${String(val).replace(/'/g, "''")}'`;
}

function capitalizeWords(str) {
  if (!str) return '';
  return str
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

function mapMuscleToDayKey(muscles) {
  const m = (muscles[0] || '').toLowerCase();
  if (['chest'].includes(m)) return 'chest';
  if (['lats', 'middle back', 'lower back', 'traps', 'neck'].includes(m)) return 'back';
  if (['quadriceps', 'hamstrings', 'glutes', 'calves', 'adductors', 'abductors'].includes(m)) return 'legs';
  if (['shoulders'].includes(m)) return 'shoulders';
  if (['biceps', 'triceps', 'forearms'].includes(m)) return 'arms';
  if (['abdominals'].includes(m)) return 'core';
  if (['cardio'].includes(m)) return 'cardio';
  return 'general';
}

function formatEquipment(eq) {
  if (!eq) return 'Bodyweight';
  if (eq === 'body only') return 'Bodyweight';
  return capitalizeWords(eq);
}

function formatInstructions(instructions, meta) {
  const parts = [];
  if (meta.equipment) parts.push(`Equipment: ${capitalizeWords(meta.equipment)}`);
  if (meta.level) parts.push(`Level: ${capitalizeWords(meta.level)}`);
  if (meta.category) parts.push(`Category: ${capitalizeWords(meta.category)}`);

  const header = parts.join(' • ');
  const steps = (instructions || [])
    .map((step, i) => `${i + 1}. ${step.trim()}`)
    .join('\n');

  return header ? `${header}\n\n${steps}` : steps;
}

async function main() {
  const args = process.argv.slice(2);
  const isRemote = args.includes('--remote');
  const isLocal = args.includes('--local');

  const jsonPath = path.join(ROOT_DIR, 'data', 'exercises-library.json');
  if (!fs.existsSync(jsonPath)) {
    console.error(`Error: ${jsonPath} not found.`);
    process.exit(1);
  }

  const rawList = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  console.log(`[Reinit] Loaded ${rawList.length} library exercises.`);

  const sqlStatements = [
    `-- ==============================================================================`,
    `-- COMPLETE APPLICATION RE-INITIALIZATION SCRIPT`,
    `-- Generated: ${new Date().toISOString()}`,
    `-- Wipes: set_logs, user_streaks, workout_splits, exercises, profiles`,
    `-- Reloads: 876 unassigned exercise library items`,
    `-- ==============================================================================`,
    `PRAGMA foreign_keys = OFF;`,
    ``,
    `-- Drop existing tables to guarantee pristine schema`,
    `DROP TABLE IF EXISTS set_logs;`,
    `DROP TABLE IF EXISTS user_streaks;`,
    `DROP TABLE IF EXISTS workout_splits;`,
    `DROP TABLE IF EXISTS exercises;`,
    `DROP TABLE IF EXISTS profiles;`,
    `DROP TABLE IF EXISTS users;`,
    ``,
    `-- 1. Users table (Primary & Partner authentication and Duo Linking)`,
    `CREATE TABLE users (`,
    `  id TEXT PRIMARY KEY,`,
    `  username TEXT UNIQUE NOT NULL,`,
    `  password_hash TEXT NOT NULL,`,
    `  salt TEXT NOT NULL,`,
    `  is_primary INTEGER DEFAULT 0 NOT NULL,`,
    `  partner_id TEXT,`,
    `  pair_id TEXT NOT NULL,`,
    `  name TEXT NOT NULL,`,
    `  title TEXT NOT NULL,`,
    `  gender TEXT NOT NULL,`,
    `  age INTEGER NOT NULL,`,
    `  stats TEXT NOT NULL,`,
    `  bio TEXT NOT NULL,`,
    `  avatar_emoji TEXT NOT NULL,`,
    `  theme_color TEXT NOT NULL,`,
    `  refresh_token_hash TEXT,`,
    `  last_active_at TEXT DEFAULT CURRENT_TIMESTAMP,`,
    `  created_at TEXT DEFAULT CURRENT_TIMESTAMP`,
    `);`,
    `CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);`,
    `CREATE INDEX IF NOT EXISTS idx_users_pair_id ON users(pair_id);`,
    `CREATE INDEX IF NOT EXISTS idx_users_partner_id ON users(partner_id);`,
    ``,
    `-- 2. Workout Splits`,
    `CREATE TABLE workout_splits (`,
    `  id TEXT PRIMARY KEY,`,
    `  profile_id TEXT NOT NULL,`,
    `  day_key TEXT NOT NULL,`,
    `  split_title TEXT NOT NULL,`,
    `  focus_description TEXT NOT NULL,`,
    `  is_rest INTEGER DEFAULT 0`,
    `);`,
    ``,
    `-- 3. Exercises`,
    `CREATE TABLE exercises (`,
    `  id TEXT PRIMARY KEY,`,
    `  profile_id TEXT,`,
    `  day_key TEXT NOT NULL,`,
    `  pair_tag TEXT NOT NULL,`,
    `  name TEXT NOT NULL,`,
    `  muscle TEXT NOT NULL,`,
    `  target_sets INTEGER NOT NULL,`,
    `  target_reps TEXT NOT NULL,`,
    `  target_rpe TEXT DEFAULT '7-8',`,
    `  notes TEXT,`,
    `  video_url TEXT,`,
    `  sort_order INTEGER DEFAULT 0`,
    `);`,
    ``,
    `-- 4. Set Logs (Gym Daily Todo Checklist)`,
    `CREATE TABLE set_logs (`,
    `  id TEXT PRIMARY KEY,`,
    `  profile_id TEXT NOT NULL,`,
    `  workout_date TEXT NOT NULL,`,
    `  exercise_id TEXT NOT NULL,`,
    `  set_number INTEGER NOT NULL,`,
    `  weight_kg REAL,`,
    `  reps_completed TEXT,`,
    `  rpe_achieved TEXT,`,
    `  is_completed INTEGER DEFAULT 0,`,
    `  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,`,
    `  UNIQUE(profile_id, workout_date, exercise_id, set_number)`,
    `);`,
    ``,
    `-- 5. User Streaks`,
    `CREATE TABLE user_streaks (`,
    `  profile_id TEXT PRIMARY KEY,`,
    `  current_streak INTEGER DEFAULT 0,`,
    `  longest_streak INTEGER DEFAULT 0,`,
    `  total_workouts INTEGER DEFAULT 0,`,
    `  last_workout_date TEXT,`,
    `  updated_at TEXT DEFAULT CURRENT_TIMESTAMP`,
    `);`,
    ``,
    `-- 6. Seed unassigned library exercises (${rawList.length} items)`,
  ];

  rawList.forEach((item, index) => {
    const id = item.id;
    const profileId = null;
    const dayKey = mapMuscleToDayKey(item.primaryMuscles || []);
    const pairTag = formatEquipment(item.equipment);
    const name = item.name.trim();

    const allMuscles = [
      ...(item.primaryMuscles || []).map(capitalizeWords),
      ...(item.secondaryMuscles || []).map(capitalizeWords),
    ];
    const muscle = allMuscles.length > 0 ? allMuscles.join(', ') : 'Full Body';

    const targetSets = 3;
    const targetReps = item.category === 'stretching' ? '30s hold' : item.category === 'cardio' ? '15-20 min' : '10-12';
    const targetRpe = '7-8';
    const notes = formatInstructions(item.instructions, {
      equipment: item.equipment,
      level: item.level,
      category: item.category,
    });
    const videoUrl = null;
    const sortOrder = index + 1;

    sqlStatements.push(
      `INSERT INTO exercises (id, profile_id, day_key, pair_tag, name, muscle, target_sets, target_reps, target_rpe, notes, video_url, sort_order) ` +
      `VALUES (${escapeSql(id)}, ${escapeSql(profileId)}, ${escapeSql(dayKey)}, ${escapeSql(pairTag)}, ${escapeSql(name)}, ${escapeSql(muscle)}, ${escapeSql(targetSets)}, ${escapeSql(targetReps)}, ${escapeSql(targetRpe)}, ${escapeSql(notes)}, ${escapeSql(videoUrl)}, ${escapeSql(sortOrder)});`
    );
  });

  sqlStatements.push(
    ``,
    `PRAGMA foreign_keys = ON;`,
    ``
  );

  const outFilePath = path.join(ROOT_DIR, 'data', 'reinit_database.sql');
  fs.writeFileSync(outFilePath, sqlStatements.join('\n'), 'utf8');
  console.log(`[Reinit] Generated complete re-initialization SQL: ${outFilePath}`);

  if (isRemote || isLocal) {
    const target = isRemote ? '--remote' : '--local';
    console.log(`[Reinit] Executing atomic reinit against Cloudflare D1 (${target})...`);
    try {
      execSync(`npx wrangler d1 execute ${DB_NAME} ${target} --file="${outFilePath}" -y`, {
        stdio: 'inherit',
      });
      console.log(`[Reinit] Application database successfully re-initialized!`);
    } catch (e) {
      console.error(`[Reinit] Error executing wrangler command:`, e.message);
      process.exit(1);
    }
  } else {
    console.log(`\nTo run against D1:`);
    console.log(`  npx wrangler d1 execute ${DB_NAME} --remote --file=data/reinit_database.sql -y`);
    console.log(`  npx wrangler d1 execute ${DB_NAME} --local --file=data/reinit_database.sql -y`);
  }
}

main().catch(console.error);
