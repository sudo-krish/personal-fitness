#!/usr/bin/env node
/**
 * scripts/truncate-and-load-db.js
 * 
 * Atomically clears the exercises table and reloads all 876 exercises from
 * data/exercises-library.json with profile_id = NULL and video_url = NULL.
 * 
 * Usage:
 *   node scripts/truncate-and-load-db.js                # Generate migrations/truncate_and_load.sql
 *   node scripts/truncate-and-load-db.js --remote       # Execute against deployed Cloudflare D1
 *   node scripts/truncate-and-load-db.js --local        # Execute against local D1 (miniflare)
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
  console.log(`[Truncate & Load] Loaded ${rawList.length} exercises from dataset.`);

  const sqlStatements = [
    `-- ==============================================================================`,
    `-- Atomic Truncate & Load for Cloudflare D1 exercises table`,
    `-- Generated: ${new Date().toISOString()}`,
    `-- Total Library Exercises: ${rawList.length}`,
    `-- ==============================================================================`,
    `PRAGMA foreign_keys = OFF;`,
    ``,
    `-- 1. Wipe all unassigned library exercises`,
    `DELETE FROM exercises WHERE profile_id IS NULL;`,
    ``,
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
      `VALUES (${escapeSql(id)}, ${escapeSql(profileId)}, ${escapeSql(dayKey)}, ${escapeSql(pairTag)}, ${escapeSql(name)}, ${escapeSql(muscle)}, ${escapeSql(targetSets)}, ${escapeSql(targetReps)}, ${escapeSql(targetRpe)}, ${escapeSql(notes)}, ${escapeSql(videoUrl)}, ${escapeSql(sortOrder)}) ` +
      `ON CONFLICT(id) DO UPDATE SET ` +
      `name=excluded.name, muscle=excluded.muscle, pair_tag=excluded.pair_tag, notes=excluded.notes;`
    );
  });

  sqlStatements.push(
    ``,
    `PRAGMA foreign_keys = ON;`,
    ``
  );

  const outFilePath = path.join(ROOT_DIR, 'data', 'truncate_and_load.sql');
  fs.writeFileSync(outFilePath, sqlStatements.join('\n'), 'utf8');
  console.log(`[Truncate & Load] Generated SQL file: ${outFilePath}`);

  if (isRemote || isLocal) {
    const target = isRemote ? '--remote' : '--local';
    console.log(`[Truncate & Load] Executing against Cloudflare D1 (${target})...`);
    try {
      execSync(`npx wrangler d1 execute ${DB_NAME} ${target} --file="${outFilePath}" -y`, {
        stdio: 'inherit',
      });
      console.log(`[Truncate & Load] Successfully truncated and loaded D1 database!`);
    } catch (e) {
      console.error(`[Truncate & Load] Error executing wrangler command:`, e.message);
      process.exit(1);
    }
  } else {
    console.log(`\nTo run against D1:`);
    console.log(`  npx wrangler d1 execute ${DB_NAME} --remote --file=data/truncate_and_load.sql -y`);
    console.log(`  npx wrangler d1 execute ${DB_NAME} --local --file=data/truncate_and_load.sql -y`);
  }
}

main().catch(console.error);
