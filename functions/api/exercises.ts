// Cloudflare Pages Function: /api/exercises
// Handles listing exercises and adding new exercises on Cloudflare D1

import { drizzle } from 'drizzle-orm/d1';
import { eq, and, asc } from 'drizzle-orm';
import * as schema from '../../src/db/schema';
import { WORKOUT_PLAN_DATA } from '../../src/data/initialWorkoutPlan';
import { ensureDbReady } from './_bootstrap';

interface Env {
  DB?: any;
}

export const onRequestGet = async (context: { request: Request; env: Env }) => {
  const { request, env } = context;
  const url = new URL(request.url);
  const profileId = url.searchParams.get('profileId') || url.searchParams.get('profile');
  const dayKey = url.searchParams.get('dayKey') || url.searchParams.get('day');

  // Ensure tables and seed data exist in D1
  if (env.DB) {
    await ensureDbReady(env.DB);
  }

  // Template fallback helper
  const getTemplateList = () => {
    let list: any[] = [];
    if (profileId && dayKey) {
      list = WORKOUT_PLAN_DATA[profileId]?.[dayKey] || [];
    } else if (profileId) {
      Object.values(WORKOUT_PLAN_DATA[profileId] || {}).forEach((dayExs) => {
        list.push(...dayExs);
      });
    } else {
      Object.values(WORKOUT_PLAN_DATA).forEach((prof) => {
        Object.values(prof).forEach((dayExs) => {
          list.push(...dayExs);
        });
      });
    }
    return list.map((e) => ({
      id: e.id,
      profileId: profileId || 'person_1',
      dayKey: e.day,
      pairTag: e.pair,
      name: e.name,
      muscle: e.muscle,
      targetSets: e.targetSets,
      targetReps: e.targetReps,
      targetRpe: e.targetRpe || '7-8',
      notes: e.notes || '',
      videoUrl: e.videoUrl || '',
    }));
  };

  if (!env.DB) {
    const list = getTemplateList();
    return new Response(
      JSON.stringify({
        success: true,
        count: list.length,
        source: 'template-fallback',
        exercises: list,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const db = drizzle(env.DB, { schema });
    let query = db.select().from(schema.exercises);

    const conditions = [];
    if (profileId) {
      conditions.push(eq(schema.exercises.profileId, profileId));
    }
    if (dayKey) {
      conditions.push(eq(schema.exercises.dayKey, dayKey));
    }

    const rows = conditions.length > 0
      ? await query.where(and(...conditions)).orderBy(asc(schema.exercises.sortOrder))
      : await query.orderBy(asc(schema.exercises.sortOrder));

    // If D1 returned empty, use template list
    if (rows.length === 0) {
      const list = getTemplateList();
      return new Response(
        JSON.stringify({
          success: true,
          count: list.length,
          source: 'template-seed-fallback',
          exercises: list,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        count: rows.length,
        source: 'd1',
        exercises: rows,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('[/api/exercises] D1 query error, falling back to template:', error);
    const list = getTemplateList();
    return new Response(
      JSON.stringify({
        success: true,
        count: list.length,
        source: 'template-error-fallback',
        exercises: list,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

export const onRequestPost = async (context: { request: Request; env: Env }) => {
  const { request, env } = context;

  if (env.DB) {
    await ensureDbReady(env.DB);
  }

  if (!env.DB) {
    return new Response(
      JSON.stringify({
        success: true,
        message: 'D1 binding not attached; operating in browser client mode.',
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const body = await request.json();
    const db = drizzle(env.DB, { schema });

    const newExercise = {
      id: body.id || `cf_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      profileId: body.profileId || 'person_1',
      dayKey: body.dayKey || 'monday',
      pairTag: body.pairTag || 'Custom',
      name: body.name || 'New Exercise',
      muscle: body.muscle || 'General',
      targetSets: Number(body.targetSets) || 3,
      targetReps: String(body.targetReps || '10-12'),
      targetRpe: String(body.targetRpe || '7-8'),
      notes: body.notes || '',
      videoUrl: body.videoUrl || '',
      sortOrder: Number(body.sortOrder) || 99,
    };

    await db.insert(schema.exercises).values(newExercise);

    return new Response(
      JSON.stringify({ success: true, exercise: newExercise }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ success: false, error: error?.message || 'Insert error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
