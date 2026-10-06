// Cloudflare Pages Function: /api/plan/seed
// Provisions the curated 5-day split plan for the pair (Partner 1 & Partner 2),
// wipes set logs and resets workout streaks to restart progress cleanly.

import { drizzle } from 'drizzle-orm/d1';
import { isNotNull, sql } from 'drizzle-orm';
import * as schema from '../../../src/db/schema';
import { WORKOUT_PLAN_DATA } from '../../../src/data/initialWorkoutPlan';

interface Env {
  DB?: any;
}

export const onRequestPost = async (context: { request: Request; env: Env }) => {
  const { request, env } = context;

  if (!env.DB) {
    return new Response(
      JSON.stringify({
        success: true,
        source: 'local-mock',
        message: 'D1 not bound. Operating in offline mode.',
        count: 56,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    let wipeProgress = true;
    try {
      const body = await request.json();
      if (typeof body.wipeProgress === 'boolean') {
        wipeProgress = body.wipeProgress;
      }
    } catch {
      // Use defaults if empty body
    }

    const db = drizzle(env.DB, { schema });

    // 1. Wipe previous set logs and reset streak progress if requested
    if (wipeProgress) {
      await db.delete(schema.setLogs);
      await db
        .insert(schema.userStreaks)
        .values([
          { profileId: 'person_1', currentStreak: 0, longestStreak: 0, totalWorkouts: 0 },
          { profileId: 'person_2', currentStreak: 0, longestStreak: 0, totalWorkouts: 0 },
        ])
        .onConflictDoUpdate({
          target: [schema.userStreaks.profileId],
          set: {
            currentStreak: 0,
            longestStreak: 0,
            totalWorkouts: 0,
            lastWorkoutDate: null,
            updatedAt: sql`CURRENT_TIMESTAMP`,
          },
        });
    }

    // 2. Remove previously assigned profile exercises (preserves unassigned library exercises where profile_id IS NULL)
    await db.delete(schema.exercises).where(isNotNull(schema.exercises.profileId));

    // 3. Collect and batch insert the curated 5-day workout split for Partner 1 (person_1) and Partner 2 (person_2)
    const exercisesToInsert: (typeof schema.exercises.$inferInsert)[] = [];

    for (const [profileId, days] of Object.entries(WORKOUT_PLAN_DATA)) {
      for (const [dayKey, dayExercises] of Object.entries(days)) {
        if (!Array.isArray(dayExercises)) continue;

        for (let i = 0; i < dayExercises.length; i++) {
          const ex = dayExercises[i];
          exercisesToInsert.push({
            id: ex.id,
            profileId,
            dayKey,
            pairTag: ex.pair,
            name: ex.name,
            muscle: ex.muscle,
            targetSets: ex.targetSets,
            targetReps: ex.targetReps,
            targetRpe: ex.targetRpe || '7-8',
            notes: ex.notes || '',
            videoUrl: ex.videoUrl || null,
            sortOrder: i + 1,
          });
        }
      }
    }

    // Insert in safe batches of 5 to stay well below D1 parameter limits
    const CHUNK_SIZE = 5;
    for (let i = 0; i < exercisesToInsert.length; i += CHUNK_SIZE) {
      const chunk = exercisesToInsert.slice(i, i + CHUNK_SIZE);
      await db.insert(schema.exercises).values(chunk);
    }

    const seededCount = exercisesToInsert.length;

    return new Response(
      JSON.stringify({
        success: true,
        count: seededCount,
        wipedProgress: wipeProgress,
        message: 'Pre-workout plan provisioned and progress restarted successfully.',
        timestamp: new Date().toISOString(),
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('[/api/plan/seed] Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error?.message || 'Failed to seed plan',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
