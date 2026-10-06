// Cloudflare Pages Function: /api/auth/me
// Returns current authenticated user and their duo partner details

import { drizzle } from 'drizzle-orm/d1';
import { eq, and, ne } from 'drizzle-orm';
import * as schema from '../../../src/db/schema';
import { verifyJwt, parseCookie } from '../../lib/auth';

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

export const onRequestGet = async (context: { request: Request; env: Env }) => {
  const { request, env } = context;

  if (!env.DB) {
    return new Response(
      JSON.stringify({ success: false, error: 'Database binding (DB) is unavailable.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // 1. Try Bearer token
  const authHeader = request.headers.get('Authorization') || '';
  let userId: string | null = null;

  if (authHeader.startsWith('Bearer ')) {
    const rawToken = authHeader.substring(7).trim();
    const payload = await verifyJwt(rawToken, env);
    if (payload && payload.sub) {
      userId = payload.sub;
    }
  }

  const db = drizzle(env.DB, { schema });

  // 2. Fallback to HttpOnly refresh cookie if Bearer token missing/expired
  if (!userId) {
    const rawRefreshToken = parseCookie(request, 'fitness_refresh_token');
    if (rawRefreshToken) {
      const tokenHash = await sha256Hex(rawRefreshToken);
      const userFromCookie = await db
        .select()
        .from(schema.users)
        .where(eq(schema.users.refreshTokenHash, tokenHash))
        .limit(1);

      if (userFromCookie.length > 0) {
        // Check inactivity
        const lastActiveTime = userFromCookie[0].lastActiveAt
          ? new Date(userFromCookie[0].lastActiveAt).getTime()
          : 0;
        if (Date.now() - lastActiveTime <= 30 * 60 * 1000) {
          userId = userFromCookie[0].id;
        }
      }
    }
  }

  if (!userId) {
    return new Response(
      JSON.stringify({ success: false, error: 'Unauthorized. Please log in.' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const usersFound = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, userId))
      .limit(1);

    if (usersFound.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'User not found.' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const user = usersFound[0];

    // Find partner
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

    return new Response(
      JSON.stringify({
        success: true,
        user: sanitizeUser(user),
        partner: sanitizeUser(partner),
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('[/api/auth/me GET] Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error?.message || 'Failed to fetch session.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
