// Cloudflare Pages Function: /api/exercises/:id
// Handles updating and deleting an exercise on Cloudflare D1

import { drizzle } from 'drizzle-orm/d1';
import { eq } from 'drizzle-orm';
import * as schema from '../../../src/db/schema';
import { ensureDbReady } from '../_bootstrap';

interface Env {
  DB?: any;
}

export const onRequestPut = async (context: {
  params: { id: string };
  request: Request;
  env: Env;
}) => {
  const { params, request, env } = context;
  const id = params.id;

  if (env.DB) {
    await ensureDbReady(env.DB);
  }

  if (!env.DB) {
    return new Response(
      JSON.stringify({ success: true, message: 'D1 not bound; client state updated.' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const updates = await request.json();
    const db = drizzle(env.DB, { schema });

    const patch: any = {};
    if (updates.name !== undefined) patch.name = updates.name;
    if (updates.muscle !== undefined) patch.muscle = updates.muscle;
    if (updates.pairTag !== undefined) patch.pairTag = updates.pairTag;
    if (updates.targetSets !== undefined) patch.targetSets = Number(updates.targetSets);
    if (updates.targetReps !== undefined) patch.targetReps = String(updates.targetReps);
    if (updates.targetRpe !== undefined) patch.targetRpe = String(updates.targetRpe);
    if (updates.notes !== undefined) patch.notes = updates.notes;
    if (updates.videoUrl !== undefined) patch.videoUrl = updates.videoUrl;

    await db.update(schema.exercises).set(patch).where(eq(schema.exercises.id, id));

    return new Response(
      JSON.stringify({ success: true, id }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.warn('[/api/exercises/:id PUT] Error:', error);
    return new Response(
      JSON.stringify({ success: true, fallback: true, id }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

export const onRequestDelete = async (context: {
  params: { id: string };
  env: Env;
}) => {
  const { params, env } = context;
  const id = params.id;

  if (env.DB) {
    await ensureDbReady(env.DB);
  }

  if (!env.DB) {
    return new Response(
      JSON.stringify({ success: true, message: 'D1 not bound; client state updated.' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const db = drizzle(env.DB, { schema });
    await db.delete(schema.exercises).where(eq(schema.exercises.id, id));

    return new Response(
      JSON.stringify({ success: true, deleted: id }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.warn('[/api/exercises/:id DELETE] Error:', error);
    return new Response(
      JSON.stringify({ success: true, fallback: true, deleted: id }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
