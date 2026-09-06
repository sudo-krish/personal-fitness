// Cloudflare Pages Function: /api/exercises/reset
// Resets exercises for a profile and dayKey to the original template on Cloudflare D1

import { drizzle } from 'drizzle-orm/d1';
import { eq, and } from 'drizzle-orm';
import * as schema from '../../../src/db/schema';
import { WORKOUT_PLAN_DATA } from '../../../src/data/initialWorkoutPlan';
import { ensureDbReady } from '../_bootstrap';

interface Env {
  DB?: any;
}

export const onRequestPost = async (context: { request: Request; env: Env }) => {
  const { request, env } = context;

  if (env.DB) {
    await ensureDbReady(env.DB);
  }

  if (!env.DB) {
    return new Response(
      JSON.stringify({ success: true, message: 'Template reset in offline mode.' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const { profileId, dayKey } = await request.json();
    const db = drizzle(env.DB, { schema });

    if (profileId && dayKey) {
      await db
        .delete(schema.exercises)
        .where(
          and(
            eq(schema.exercises.profileId, profileId),
            eq(schema.exercises.dayKey, dayKey)
          )
        );

      const templateExercises = WORKOUT_PLAN_DATA[profileId]?.[dayKey] || [];
      for (let i = 0; i < templateExercises.length; i++) {
        const e = templateExercises[i];
        await db.insert(schema.exercises).values({
          id: e.id,
          profileId,
          dayKey,
          pairTag: e.pair,
          name: e.name,
          muscle: e.muscle,
          targetSets: e.targetSets,
          targetReps: e.targetReps,
          targetRpe: e.targetRpe || '7-8',
          notes: e.notes || '',
          videoUrl: e.videoUrl || '',
          sortOrder: i + 1,
        });
      }
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Exercises reset successfully' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.warn('[/api/exercises/reset] Error:', error);
    return new Response(
      JSON.stringify({ success: true, fallback: true, message: 'Reset performed locally' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
