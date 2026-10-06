// Cloudflare Pages Function: /api/auth/login
// Authenticates either primary user or partner, sets 30-min HttpOnly refresh token cookie,
// issues JWT access token, and returns user + partner identities.

import { drizzle } from 'drizzle-orm/d1';
import { eq, and, ne } from 'drizzle-orm';
import * as schema from '../../../src/db/schema';
import {
  verifyPassword,
  signJwt,
  createRefreshTokenCookie,
} from '../../lib/auth';

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

function sanitizeUser(u: any) {
  if (!u) return null;
  return {
    id: u.id,
    username: u.username,
    name: u.name,
    title: u.title,
    gender: u.gender,
    age: u.age,
    stats: u.stats,
    bio: u.bio,
    avatarEmoji: u.avatarEmoji,
    themeColor: u.themeColor,
    isPrimary: u.isPrimary,
    partnerId: u.partnerId,
    pairId: u.pairId,
  };
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
    const username = String(body.username || '').trim().toLowerCase();
    const password = String(body.password || '').trim();

    if (!username || !password) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Please enter both username and password.',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const db = drizzle(env.DB, { schema });

    // Look up user
    const usersFound = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.username, username))
      .limit(1);

    if (usersFound.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid username or password.',
        }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const user = usersFound[0];

    // Verify password with PBKDF2 WebCrypto
    const isValid = await verifyPassword(password, user.passwordHash, user.salt);
    if (!isValid) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid username or password.',
        }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Look up partner in the same duo pair
    let partner = null;
    if (user.partnerId) {
      const pFound = await db
        .select()
        .from(schema.users)
        .where(eq(schema.users.id, user.partnerId))
        .limit(1);
      if (pFound.length > 0) {
        partner = pFound[0];
      }
    } else {
      const pFound = await db
        .select()
        .from(schema.users)
        .where(and(eq(schema.users.pairId, user.pairId), ne(schema.users.id, user.id)))
        .limit(1);
      if (pFound.length > 0) {
        partner = pFound[0];
      }
    }

    // Generate fresh refresh token
    const refreshToken = 'refr_' + crypto.randomUUID() + '_' + Date.now();
    const refreshTokenHash = await sha256Hex(refreshToken);
    const nowIso = new Date().toISOString();

    // Update user session & activity timestamp
    await db
      .update(schema.users)
      .set({
        refreshTokenHash,
        lastActiveAt: nowIso,
      })
      .where(eq(schema.users.id, user.id));

    // Sign JWT access token (15 mins)
    const token = await signJwt(
      {
        sub: user.id,
        username: user.username,
        pairId: user.pairId,
        isPrimary: Boolean(user.isPrimary),
        partnerId: partner ? partner.id : null,
      },
      env,
      900
    );

    // HttpOnly refresh cookie (30 minutes = 1800s)
    const cookieHeader = createRefreshTokenCookie(refreshToken, 1800);

    return new Response(
      JSON.stringify({
        success: true,
        token,
        user: sanitizeUser(user),
        partner: sanitizeUser(partner),
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Set-Cookie': cookieHeader,
        },
      }
    );
  } catch (error: any) {
    console.error('[/api/auth/login POST] Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error?.message || 'Login failed.',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
