#!/usr/bin/env node
/**
 * scripts/ingest-library.js
 * 
 * Transforms data/exercises-library.json (from yuhonas/free-exercise-db)
 * into D1 SQL insert statements conforming to the exact exercises table schema.
 * 
 * Usage:
 *   node scripts/ingest-library.js                  # Generate migrations/seed_exercise_library.sql
 *   node scripts/ingest-library.js --remote         # Execute against deployed Cloudflare D1
 *   node scripts/ingest-library.js --local          # Execute against local D1 (miniflare)
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

// Map primary muscle into day/split key
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

  const raw = fs.readFileSync(jsonPath, 'utf8');
  const rawList = JSON.parse(raw);
  console.log(`[Ingest] Loaded ${rawList.length} exercises from ${jsonPath}`);

  const sqlStatements = [
    `-- Auto-generated Seed SQL for Free Exercise DB (yuhonas/free-exercise-db)`,
    `-- Generated: ${new Date().toISOString()}`,
    `-- Total Exercises: ${rawList.length}`,
    `-- profile_id is NULL (unassigned by default)`,
    `-- video_url is NULL (resolved on-demand)`,
    ``,
    `BEGIN TRANSACTION;`,
    ``,
  ];

  rawList.forEach((item, index) => {
    const id = item.id;
    const profileId = null; // Unassigned by default
    const dayKey = mapMuscleToDayKey(item.primaryMuscles || []);
    const pairTag = formatEquipment(item.equipment);
    const name = item.name.trim();
    
    // Capitalized primary + secondary muscles
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
      `VALUES (${escapeSql(id)}, ${escapeSql(profileId)}, ${escapeSql(dayKey)}, ${escapeSql(pairTag)}, ${escapeSql(name)}, ${escapeSql(muscle)}, ${escapeSql(targetSets)}, ${escapeSql(targetReps)}, ${escapeSql(targetRpe)}, ${escapeSql(notes)}, ${escapeSql(videoUrl)}, ${escapeSql(sortOrder)}) ` +
      `ON CONFLICT(id) DO UPDATE SET ` +
      `name=excluded.name, muscle=excluded.muscle, pair_tag=excluded.pair_tag, notes=excluded.notes;`
    );
  });

  sqlStatements.push(``, `COMMIT;`, ``);

  const outFilePath = path.join(ROOT_DIR, 'data', 'seed_exercise_library.sql');
  fs.writeFileSync(outFilePath, sqlStatements.join('\n'), 'utf8');
  console.log(`[Ingest] Successfully wrote ${rawList.length} SQL insert statements to: ${outFilePath}`);

  if (isRemote || isLocal) {
    const target = isRemote ? '--remote' : '--local';
    console.log(`[Ingest] Executing against Cloudflare D1 (${target})...`);
    try {
      execSync(`npx wrangler d1 execute ${DB_NAME} ${target} --file="${outFilePath}" -y`, {
        stdio: 'inherit',
      });
      console.log(`[Ingest] Successfully seeded database!`);
    } catch (e) {
      console.error(`[Ingest] Wrangler execution error:`, e.message);
    }
  } else {
    console.log(`\nTo execute against D1, run:`);
    console.log(`  npx wrangler d1 execute ${DB_NAME} --remote --file=data/seed_exercise_library.sql -y`);
    console.log(`  npx wrangler d1 execute ${DB_NAME} --local --file=data/seed_exercise_library.sql -y`);
  }
}

main().catch(console.error);
