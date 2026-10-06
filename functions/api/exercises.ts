// Cloudflare Pages Function: /api/exercises
// Handles listing exercises and adding new exercises on Cloudflare D1

import { drizzle } from 'drizzle-orm/d1';
import { eq, and, asc, isNull, isNotNull, like, or, sql } from 'drizzle-orm';
import * as schema from '../../src/db/schema';
import { WORKOUT_PLAN_DATA } from '../../src/data/initialWorkoutPlan';

interface Env {
  DB?: any;
}

export const onRequestGet = async (context: { request: Request; env: Env }) => {
  const { request, env } = context;
  const url = new URL(request.url);
  const profileId = url.searchParams.get('profileId') || url.searchParams.get('profile');
  const dayKey = url.searchParams.get('dayKey') || url.searchParams.get('day');
  const search = url.searchParams.get('search')?.trim();
  const muscle = url.searchParams.get('muscle')?.trim();
  const pairTag = url.searchParams.get('pairTag') || url.searchParams.get('equipment');
  const hasVideo = url.searchParams.get('hasVideo');
  const limitParam = url.searchParams.get('limit');
  const offsetParam = url.searchParams.get('offset');

  const limit = limitParam ? Math.min(Math.max(Number(limitParam) || 50, 1), 500) : undefined;
  const offset = offsetParam ? Math.max(Number(offsetParam) || 0, 0) : undefined;

  // Template fallback helper
  const getTemplateList = () => {
    let list: any[] = [];
    if (profileId && profileId !== 'null' && profileId !== 'unassigned' && dayKey) {
      list = WORKOUT_PLAN_DATA[profileId]?.[dayKey] || [];
    } else if (profileId && profileId !== 'null' && profileId !== 'unassigned') {
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
    let mapped = list.map((e) => ({
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
      sortOrder: 0,
    }));

    if (search) {
      const q = search.toLowerCase();
      mapped = mapped.filter((e) => e.name.toLowerCase().includes(q) || e.muscle.toLowerCase().includes(q));
    }
    if (muscle && muscle !== 'All') {
      mapped = mapped.filter((e) => e.muscle.toLowerCase().includes(muscle.toLowerCase()));
    }
    if (hasVideo === 'true') {
      mapped = mapped.filter((e) => Boolean(e.videoUrl));
    } else if (hasVideo === 'false') {
      mapped = mapped.filter((e) => !e.videoUrl);
    }
    return mapped;
  };

  if (!env.DB) {
    const list = getTemplateList();
    const paginated = limit !== undefined ? list.slice(offset || 0, (offset || 0) + limit) : list;
    return new Response(
      JSON.stringify({
        success: true,
        count: paginated.length,
        total: list.length,
        source: 'template-fallback',
        exercises: paginated,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const db = drizzle(env.DB, { schema });
    let query = db.select().from(schema.exercises);

    const conditions = [];

    // Profile handling: 'null' / 'unassigned' vs 'person_1' / 'person_2' vs 'all'
    if (profileId === 'null' || profileId === 'unassigned') {
      conditions.push(isNull(schema.exercises.profileId));
    } else if (profileId && profileId !== 'all') {
      conditions.push(eq(schema.exercises.profileId, profileId));
    }

    if (dayKey && dayKey !== 'all') {
      conditions.push(eq(schema.exercises.dayKey, dayKey));
    }

    if (search) {
      conditions.push(
        or(
          like(schema.exercises.name, `%${search}%`),
          like(schema.exercises.muscle, `%${search}%`)
        )
      );
    }

    if (muscle && muscle !== 'All') {
      conditions.push(like(schema.exercises.muscle, `%${muscle}%`));
    }

    if (pairTag && pairTag !== 'All') {
      conditions.push(eq(schema.exercises.pairTag, pairTag));
    }

    if (hasVideo === 'true') {
      conditions.push(isNotNull(schema.exercises.videoUrl));
    } else if (hasVideo === 'false') {
      conditions.push(isNull(schema.exercises.videoUrl));
    }

    let chainedQuery = conditions.length > 0
      ? query.where(and(...conditions)).orderBy(asc(schema.exercises.sortOrder))
      : query.orderBy(asc(schema.exercises.sortOrder));

    if (limit !== undefined) {
      chainedQuery = chainedQuery.limit(limit) as any;
    }
    if (offset !== undefined) {
      chainedQuery = chainedQuery.offset(offset) as any;
    }

    const rows = await chainedQuery;

    // Calculate total count matching filters for accurate pagination
    let totalCount = rows.length;
    if (limit !== undefined) {
      const countQuery = conditions.length > 0
        ? db.select({ total: sql<number>`count(*)` }).from(schema.exercises).where(and(...conditions))
        : db.select({ total: sql<number>`count(*)` }).from(schema.exercises);
      const countRes = await countQuery;
      totalCount = Number(countRes[0]?.total) || 0;
    }

    return new Response(
      JSON.stringify({
        success: true,
        count: rows.length,
        total: totalCount,
        source: 'd1',
        exercises: rows,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('[/api/exercises] D1 query error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error?.message || 'Database query error',
        exercises: [],
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

export const onRequestPost = async (context: { request: Request; env: Env }) => {
  const { request, env } = context;

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
