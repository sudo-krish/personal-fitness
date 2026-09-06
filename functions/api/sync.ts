// Cloudflare Pages Function: /api/sync
// Powered by Drizzle ORM on Cloudflare D1

import { drizzle } from 'drizzle-orm/d1';
import { eq, and, sql } from 'drizzle-orm';
import * as schema from '../../src/db/schema';

interface Env {
  DB?: any;
}

interface SetLogItem {
  exerciseId: string;
  setNumber: number;
  weightKg?: number | null;
  repsCompleted?: string | null;
  rpeAchieved?: string | null;
  isCompleted: boolean;
}

interface SyncPayload {
  profileId: string;
  dateStr: string;
  dayKey: string;
  isWorkoutFinished?: boolean;
  sets: SetLogItem[];
}

export const onRequestGet = async (context: { request: Request; env: Env }) => {
  const { request, env } = context;
  const url = new URL(request.url);
  const profileId = url.searchParams.get('profileId');
  const dateStr = url.searchParams.get('dateStr');

  if (!env.DB) {
    return new Response(
      JSON.stringify({
        success: false,
        source: 'local-only',
        message: 'D1 database binding (DB) not configured yet in Cloudflare.',
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }

  if (!profileId || !dateStr) {
    return new Response(
      JSON.stringify({ success: false, error: 'Missing profileId or dateStr parameter' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const db = drizzle(env.DB, { schema });

    const [setsResult, streakResult] = await Promise.all([
      db
        .select()
        .from(schema.setLogs)
        .where(
          and(
            eq(schema.setLogs.profileId, profileId),
            eq(schema.setLogs.workoutDate, dateStr)
          )
        ),
      db
        .select()
        .from(schema.userStreaks)
        .where(eq(schema.userStreaks.profileId, profileId))
        .limit(1),
    ]);

    return new Response(
      JSON.stringify({
        success: true,
        profileId,
        dateStr,
        sets: setsResult,
        streak: streakResult[0] || null,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Drizzle D1 query failed';
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

export const onRequestPost = async (context: { request: Request; env: Env }) => {
  const { request, env } = context;

  if (!env.DB) {
    return new Response(
      JSON.stringify({
        success: false,
        source: 'local-only',
        message: 'D1 database binding (DB) not configured yet in Cloudflare.',
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const payload: SyncPayload = await request.json();
    const { profileId, dateStr, dayKey, isWorkoutFinished, sets } = payload;

    if (!profileId || !dateStr || !dayKey || !Array.isArray(sets)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid payload schema' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const db = drizzle(env.DB, { schema });

    // Upsert each set with Drizzle ORM
    for (const item of sets) {
      if (!item.exerciseId || typeof item.setNumber !== 'number') continue;

      const id = `${profileId}_${dateStr}_${item.exerciseId}_${item.setNumber}`;
      const weight = typeof item.weightKg === 'number' ? item.weightKg : null;
      const reps = item.repsCompleted ? String(item.repsCompleted).slice(0, 20) : null;
      const rpe = item.rpeAchieved ? String(item.rpeAchieved).slice(0, 10) : null;
      const isDone = Boolean(item.isCompleted);

      await db
        .insert(schema.setLogs)
        .values({
          id,
          profileId,
          workoutDate: dateStr,
          exerciseId: item.exerciseId,
          setNumber: item.setNumber,
          weightKg: weight,
          repsCompleted: reps,
          rpeAchieved: rpe,
          isCompleted: isDone,
        })
        .onConflictDoUpdate({
          target: [
            schema.setLogs.profileId,
            schema.setLogs.workoutDate,
            schema.setLogs.exerciseId,
            schema.setLogs.setNumber,
          ],
          set: {
            weightKg: weight,
            repsCompleted: reps,
            rpeAchieved: rpe,
            isCompleted: isDone,
            updatedAt: sql`CURRENT_TIMESTAMP`,
          },
        });
    }

    // Update streak if session completed
    if (isWorkoutFinished) {
      await db
        .insert(schema.userStreaks)
        .values({
          profileId,
          currentStreak: 1,
          longestStreak: 1,
          totalWorkouts: 1,
          lastWorkoutDate: dateStr,
        })
        .onConflictDoUpdate({
          target: [schema.userStreaks.profileId],
          set: {
            currentStreak: sql`CASE 
              WHEN last_workout_date = date('now', '-1 day') THEN current_streak + 1 
              WHEN last_workout_date = ${dateStr} THEN current_streak
              ELSE 1 
            END`,
            longestStreak: sql`MAX(longest_streak, current_streak + 1)`,
            totalWorkouts: sql`total_workouts + 1`,
            lastWorkoutDate: dateStr,
            updatedAt: sql`CURRENT_TIMESTAMP`,
          },
        });
    }

    return new Response(
      JSON.stringify({
        success: true,
        syncedSets: sets.length,
        isWorkoutFinished: Boolean(isWorkoutFinished),
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Drizzle sync failed';
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
