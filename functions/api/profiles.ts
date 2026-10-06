// Cloudflare Pages Function: /api/profiles
// Manages duo profiles (Partner 1 & Partner 2) backed by Cloudflare D1

import { drizzle } from 'drizzle-orm/d1';
import { eq } from 'drizzle-orm';
import * as schema from '../../src/db/schema';
import { DEFAULT_PROFILES } from '../../src/data/initialWorkoutPlan';

interface Env {
  DB?: any;
}

export const onRequestGet = async (context: { request: Request; env: Env }) => {
  const { env } = context;

  if (!env.DB) {
    return new Response(
      JSON.stringify({
        success: true,
        source: 'offline-mock',
        profiles: DEFAULT_PROFILES,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const db = drizzle(env.DB, { schema });
    const rows = await db.select().from(schema.profiles);

    return new Response(
      JSON.stringify({
        success: true,
        profiles: rows,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('[/api/profiles GET] Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error?.message || 'Failed to fetch profiles',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

export const onRequestPost = async (context: { request: Request; env: Env }) => {
  const { request, env } = context;

  try {
    const body = await request.json();
    const p1Raw = body.partner1 || body.profiles?.[0] || {};
    const p2Raw = body.partner2 || body.profiles?.[1] || {};

    if (!p1Raw.name || !p2Raw.name) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Both Partner 1 and Partner 2 must have a valid name.',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const p1Record = {
      id: 'person_1',
      username: p1Raw.username || 'partner_1',
      passwordHash: 'not_set',
      salt: 'not_set',
      isPrimary: true,
      partnerId: 'person_2',
      pairId: 'pair_default',
      name: String(p1Raw.name).trim(),
      title: String(p1Raw.title || `${p1Raw.name} (P1)`).trim(),
      gender: String(p1Raw.gender || 'Male'),
      age: Number(p1Raw.age) || 28,
      stats: String(p1Raw.stats || '').trim(),
      bio: String(p1Raw.bio || '').trim(),
      avatarEmoji: String(p1Raw.avatarEmoji || p1Raw.name.charAt(0).toUpperCase() || '1').trim(),
      themeColor: String(p1Raw.themeColor || '#0284c7').trim(),
    };

    const p2Record = {
      id: 'person_2',
      username: p2Raw.username || 'partner_2',
      passwordHash: 'not_set',
      salt: 'not_set',
      isPrimary: false,
      partnerId: 'person_1',
      pairId: 'pair_default',
      name: String(p2Raw.name).trim(),
      title: String(p2Raw.title || `${p2Raw.name} (P2)`).trim(),
      gender: String(p2Raw.gender || 'Female'),
      age: Number(p2Raw.age) || 26,
      stats: String(p2Raw.stats || '').trim(),
      bio: String(p2Raw.bio || '').trim(),
      avatarEmoji: String(p2Raw.avatarEmoji || p2Raw.name.charAt(0).toUpperCase() || '2').trim(),
      themeColor: String(p2Raw.themeColor || '#e11d48').trim(),
    };

    if (env.DB) {
      const db = drizzle(env.DB, { schema });

      // Upsert partner 1 (only update display fields on conflict)
      await db
        .insert(schema.profiles)
        .values(p1Record)
        .onConflictDoUpdate({
          target: [schema.profiles.id],
          set: {
            name: p1Record.name,
            title: p1Record.title,
            gender: p1Record.gender,
            age: p1Record.age,
            stats: p1Record.stats,
            bio: p1Record.bio,
            avatarEmoji: p1Record.avatarEmoji,
            themeColor: p1Record.themeColor,
          },
        });

      // Upsert partner 2 (only update display fields on conflict)
      await db
        .insert(schema.profiles)
        .values(p2Record)
        .onConflictDoUpdate({
          target: [schema.profiles.id],
          set: {
            name: p2Record.name,
            title: p2Record.title,
            gender: p2Record.gender,
            age: p2Record.age,
            stats: p2Record.stats,
            bio: p2Record.bio,
            avatarEmoji: p2Record.avatarEmoji,
            themeColor: p2Record.themeColor,
          },
        });

      // Initialize streaks if not present
      for (const pid of ['person_1', 'person_2']) {
        await db
          .insert(schema.userStreaks)
          .values({
            profileId: pid,
            currentStreak: 0,
            longestStreak: 0,
            totalWorkouts: 0,
          })
          .onConflictDoNothing();
      }

      // Workout plan is not auto-seeded here; explicitly loaded via /api/plan/seed
    }

    return new Response(
      JSON.stringify({
        success: true,
        profiles: [p1Record, p2Record],
        message: 'Duo profiles saved successfully.',
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('[/api/profiles POST] Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error?.message || 'Failed to save profiles',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
