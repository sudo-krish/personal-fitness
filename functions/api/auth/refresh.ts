// Cloudflare Pages Function: /api/auth/refresh
// Validates HttpOnly refresh token cookie, enforces 30-minute idle inactivity timeout,
// and issues refreshed JWT access token + sliding 30-minute cookie.

import { drizzle } from 'drizzle-orm/d1';
import { eq, and, ne } from 'drizzle-orm';
import * as schema from '../../../src/db/schema';
import {
  parseCookie,
  signJwt,
  createRefreshTokenCookie,
  clearRefreshTokenCookie,
} from '../../_lib/auth';

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

  const rawRefreshToken = parseCookie(request, 'fitness_refresh_token');
  if (!rawRefreshToken) {
    return new Response(
      JSON.stringify({
        success: false,
        error: 'No active session or refresh token found.',
      }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const db = drizzle(env.DB, { schema });
    const tokenHash = await sha256Hex(rawRefreshToken);

    const usersFound = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.refreshTokenHash, tokenHash))
      .limit(1);

    if (usersFound.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid or revoked session.',
        }),
        {
          status: 401,
          headers: {
            'Content-Type': 'application/json',
            'Set-Cookie': clearRefreshTokenCookie(),
          },
        }
      );
    }

    const user = usersFound[0];

    // Enforce 30-minute idle inactivity timeout
    const now = Date.now();
    const lastActiveTime = user.lastActiveAt ? new Date(user.lastActiveAt).getTime() : 0;
    const idleDurationMs = now - lastActiveTime;
    const MAX_IDLE_MS = 30 * 60 * 1000; // 30 minutes

    if (lastActiveTime > 0 && idleDurationMs > MAX_IDLE_MS) {
      // Inactivity timeout exceeded - invalidate session
      await db
        .update(schema.users)
        .set({ refreshTokenHash: null })
        .where(eq(schema.users.id, user.id));

      return new Response(
        JSON.stringify({
          success: false,
          error: 'Session expired due to 30 minutes of inactivity.',
          reason: 'idle_timeout',
        }),
        {
          status: 401,
          headers: {
            'Content-Type': 'application/json',
            'Set-Cookie': clearRefreshTokenCookie(),
          },
        }
      );
    }

    // Still active: update lastActiveAt
    const nowIso = new Date().toISOString();
    await db
      .update(schema.users)
      .set({ lastActiveAt: nowIso })
      .where(eq(schema.users.id, user.id));

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

    // Sign new JWT
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

    // Refresh sliding 30-minute HttpOnly cookie
    const cookieHeader = createRefreshTokenCookie(rawRefreshToken, 1800);

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
    console.error('[/api/auth/refresh POST] Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error?.message || 'Token refresh failed.',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
