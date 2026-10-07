// Cloudflare Pages Function: /api/auth/register-duo
// Registers primary user and partner, establishes duo pairing, seeds initial workout split,
// and issues JWT + 30-minute HttpOnly refresh token cookie.

import { drizzle } from 'drizzle-orm/d1';
import { eq, or, sql } from 'drizzle-orm';
import * as schema from '../../../src/db/schema';
import {
  hashPassword,
  signJwt,
  createRefreshTokenCookie,
} from '../../_lib/auth';
import { WORKOUT_PLAN_DATA, DAY_SCHEDULES } from '../../../src/data/initialWorkoutPlan';

interface Env {
  DB?: any;
  JWT_SECRET?: string;
}

async function sha256Hex(str: string): Promise<string> {
  const enc = new TextEncoder();
  const digest = await crypto.subtle.digest('SHA-256', enc.encode(str));
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export const onRequestPost = async (context: { request: Request; env: Env }) => {
  const { request, env } = context;

  if (!env.DB) {
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Database binding (DB) is unavailable.',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const body = await request.json();
    const { primary, partner } = body;

    if (!primary || !partner) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Registration requires details for both primary user and partner.',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const p1Username = String(primary.username || '').trim().toLowerCase();
    const p1Password = String(primary.password || '').trim();
    const p1Name = String(primary.name || '').trim();

    const p2Username = String(partner.username || '').trim().toLowerCase();
    const p2Password = String(partner.password || '').trim();
    const p2Name = String(partner.name || '').trim();

    if (!p1Username || p1Username.length < 3) {
      return new Response(
        JSON.stringify({ success: false, error: 'Your username must be at least 3 characters.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!p1Password || p1Password.length < 6) {
      return new Response(
        JSON.stringify({ success: false, error: 'Your password must be at least 6 characters.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!p2Username || p2Username.length < 3) {
      return new Response(
        JSON.stringify({ success: false, error: 'Partner username must be at least 3 characters.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!p2Password || p2Password.length < 6) {
      return new Response(
        JSON.stringify({ success: false, error: 'Partner password must be at least 6 characters.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (p1Username === p2Username) {
      return new Response(
        JSON.stringify({ success: false, error: 'Primary and partner usernames must be different.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const db = drizzle(env.DB, { schema });

    // Check if either username already exists
    const existing = await db
      .select({ id: schema.users.id, username: schema.users.username })
      .from(schema.users)
      .where(or(eq(schema.users.username, p1Username), eq(schema.users.username, p2Username)));

    if (existing.length > 0) {
      const takenUsernames = existing.map((u) => u.username).join(', ');
      return new Response(
        JSON.stringify({
          success: false,
          error: `Username already taken: ${takenUsernames}. Please pick a unique username.`,
        }),
        { status: 409, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Generate keys
    const pairId = 'pair_' + crypto.randomUUID().slice(0, 8);
    const p1Id = 'user_' + crypto.randomUUID().slice(0, 8);
    const p2Id = 'user_' + crypto.randomUUID().slice(0, 8);

    // Hash passwords using PBKDF2 WebCrypto
    const p1Hash = await hashPassword(p1Password);
    const p2Hash = await hashPassword(p2Password);

    // Refresh token generation
    const refreshToken = 'refr_' + crypto.randomUUID() + '_' + Date.now();
    const refreshTokenHash = await sha256Hex(refreshToken);

    const nowIso = new Date().toISOString();

    const p1Record = {
      id: p1Id,
      username: p1Username,
      passwordHash: p1Hash.hash,
      salt: p1Hash.salt,
      isPrimary: true,
      partnerId: p2Id,
      pairId: pairId,
      name: p1Name || p1Username,
      title: String(primary.title || `${p1Name || p1Username} (Lead)`).trim(),
      gender: String(primary.gender || 'Male'),
      age: Number(primary.age) || 28,
      stats: String(primary.stats || '').trim(),
      bio: String(primary.bio || 'Strength, hypertrophy & progressive overload.').trim(),
      avatarEmoji: String(primary.avatarEmoji || '⚡').trim(),
      themeColor: String(primary.themeColor || '#0284c7').trim(),
      refreshTokenHash: refreshTokenHash,
      lastActiveAt: nowIso,
      createdAt: nowIso,
    };

    const p2Record = {
      id: p2Id,
      username: p2Username,
      passwordHash: p2Hash.hash,
      salt: p2Hash.salt,
      isPrimary: false,
      partnerId: p1Id,
      pairId: pairId,
      name: p2Name || p2Username,
      title: String(partner.title || `${p2Name || p2Username} (Partner)`).trim(),
      gender: String(partner.gender || 'Female'),
      age: Number(partner.age) || 26,
      stats: String(partner.stats || '').trim(),
      bio: String(partner.bio || 'Motor control, mobility & conditioning.').trim(),
      avatarEmoji: String(partner.avatarEmoji || '✨').trim(),
      themeColor: String(partner.themeColor || '#e11d48').trim(),
      refreshTokenHash: null,
      lastActiveAt: nowIso,
      createdAt: nowIso,
    };

    // Insert both users
    await db.insert(schema.users).values([p1Record, p2Record]);

    // Initialize user streaks for duo roles ('person_1' & 'person_2')
    await db.insert(schema.userStreaks).values([
      { profileId: 'person_1', currentStreak: 0, longestStreak: 0, totalWorkouts: 0 },
      { profileId: 'person_2', currentStreak: 0, longestStreak: 0, totalWorkouts: 0 },
    ]).onConflictDoNothing();

    // Seed workout splits for both person_1 and person_2
    const splitsToInsert: (typeof schema.workoutSplits.$inferInsert)[] = [];
    for (const schedule of DAY_SCHEDULES) {
      splitsToInsert.push({
        id: `split_person_1_${schedule.key}`,
        profileId: 'person_1',
        dayKey: schedule.key,
        splitTitle: schedule.splitTitle,
        focusDescription: schedule.focusDescription,
        isRest: schedule.isRest,
      });
      splitsToInsert.push({
        id: `split_person_2_${schedule.key}`,
        profileId: 'person_2',
        dayKey: schedule.key,
        splitTitle: schedule.splitTitle,
        focusDescription: schedule.focusDescription,
        isRest: schedule.isRest,
      });
    }
    if (splitsToInsert.length > 0) {
      const SPLIT_CHUNK_SIZE = 10;
      for (let i = 0; i < splitsToInsert.length; i += SPLIT_CHUNK_SIZE) {
        await db.insert(schema.workoutSplits).values(splitsToInsert.slice(i, i + SPLIT_CHUNK_SIZE)).onConflictDoNothing();
      }
    }

    // Workout plan remains empty until explicitly loaded via "Reload 5-Day Workout Plan"

    // Generate JWT Access Token for primary user (15 mins)
    const token = await signJwt(
      {
        sub: p1Id,
        username: p1Username,
        pairId: pairId,
        isPrimary: true,
        partnerId: p2Id,
      },
      env,
      900
    );

    // Safe sanitized user outputs (exclude passwordHash, salt, refreshTokenHash)
    const sanitizedUser = {
      id: p1Record.id,
      username: p1Record.username,
      name: p1Record.name,
      title: p1Record.title,
      gender: p1Record.gender,
      age: p1Record.age,
      stats: p1Record.stats,
      bio: p1Record.bio,
      avatarEmoji: p1Record.avatarEmoji,
      themeColor: p1Record.themeColor,
      isPrimary: p1Record.isPrimary,
      partnerId: p1Record.partnerId,
      pairId: p1Record.pairId,
    };

    const sanitizedPartner = {
      id: p2Record.id,
      username: p2Record.username,
      name: p2Record.name,
      title: p2Record.title,
      gender: p2Record.gender,
      age: p2Record.age,
      stats: p2Record.stats,
      bio: p2Record.bio,
      avatarEmoji: p2Record.avatarEmoji,
      themeColor: p2Record.themeColor,
      isPrimary: p2Record.isPrimary,
      partnerId: p2Record.partnerId,
      pairId: p2Record.pairId,
    };

    // Return response with 30-minute HttpOnly refresh cookie
    const cookieHeader = createRefreshTokenCookie(refreshToken, 1800);

    return new Response(
      JSON.stringify({
        success: true,
        token,
        user: sanitizedUser,
        partner: sanitizedPartner,
      }),
      {
        status: 201,
        headers: {
          'Content-Type': 'application/json',
          'Set-Cookie': cookieHeader,
        },
      }
    );
  } catch (error: any) {
    console.error('[/api/auth/register-duo POST] Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error?.message || 'Registration failed. Please check your inputs.',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
