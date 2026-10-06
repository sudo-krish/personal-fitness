// Cloudflare Pages Function: /api/auth/logout
// Clears HttpOnly refresh token cookie and invalidates user session in D1

import { drizzle } from 'drizzle-orm/d1';
import { eq } from 'drizzle-orm';
import * as schema from '../../../src/db/schema';
import { parseCookie, clearRefreshTokenCookie } from '../../lib/auth';

interface Env {
  DB?: any;
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

  try {
    const rawRefreshToken = parseCookie(request, 'fitness_refresh_token');

    if (rawRefreshToken && env.DB) {
      const db = drizzle(env.DB, { schema });
      const tokenHash = await sha256Hex(rawRefreshToken);
      await db
        .update(schema.users)
        .set({ refreshTokenHash: null })
        .where(eq(schema.users.refreshTokenHash, tokenHash));
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Successfully logged out.',
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Set-Cookie': clearRefreshTokenCookie(),
        },
      }
    );
  } catch (error: any) {
    console.error('[/api/auth/logout POST] Error:', error);
    // Still clear the cookie regardless of DB errors
    return new Response(
      JSON.stringify({ success: true, message: 'Logged out.' }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Set-Cookie': clearRefreshTokenCookie(),
        },
      }
    );
  }
};
