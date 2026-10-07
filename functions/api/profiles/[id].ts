// Cloudflare Pages Function: /api/profiles/[id]
// PATCH: Updates profile details (name, age, gender, stats, bio, etc.)

import { drizzle } from 'drizzle-orm/d1';
import { eq } from 'drizzle-orm';
import * as schema from '../../../src/db/schema';
import { verifyJwt, parseCookie } from '../../_lib/auth';

interface Env {
  DB?: any;
  JWT_SECRET?: string;
}

export const onRequestPatch = async (context: {
  request: Request;
  params: { id: string };
  env: Env;
}) => {
  const { request, params, env } = context;

  if (!env.DB) {
    return new Response(
      JSON.stringify({ success: false, error: 'Database unavailable' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Verify auth token
  const authHeader = request.headers.get('Authorization') || '';
  let authUserId: string | null = null;

  if (authHeader.startsWith('Bearer ')) {
    const rawToken = authHeader.substring(7).trim();
    const payload = await verifyJwt(rawToken, env);
    if (payload?.sub) {
      authUserId = payload.sub;
    }
  }

  const db = drizzle(env.DB, { schema });

  if (!authUserId) {
    const rawRefreshToken = parseCookie(request, 'fitness_refresh_token');
    if (rawRefreshToken) {
      const enc = new TextEncoder();
      const digest = await crypto.subtle.digest('SHA-256', enc.encode(rawRefreshToken));
      const tokenHash = Array.from(new Uint8Array(digest))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');

      const userFromCookie = await db
        .select()
        .from(schema.users)
        .where(eq(schema.users.refreshTokenHash, tokenHash))
        .limit(1);

      if (userFromCookie.length > 0) {
        authUserId = userFromCookie[0].id;
      }
    }
  }

  if (!authUserId) {
    return new Response(
      JSON.stringify({ success: false, error: 'Unauthorized' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const profileId = params.id;
    const body = await request.json() as Record<string, unknown>;

    // Scoped update: ensure target profile is either current user or their registered partner
    const currentUser = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, authUserId))
      .limit(1);

    if (currentUser.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'User not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const cur = currentUser[0];
    const isSelf = profileId === cur.id;
    const isPartner = profileId === cur.partnerId;

    if (!isSelf && !isPartner) {
      return new Response(
        JSON.stringify({ success: false, error: 'Forbidden' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const updates: Record<string, unknown> = {};
    if (typeof body.name === 'string' && body.name.trim()) updates.name = body.name.trim();
    if (typeof body.age === 'number' && body.age > 0) updates.age = body.age;
    if (typeof body.gender === 'string') updates.gender = body.gender;
    if (typeof body.stats === 'string') updates.stats = body.stats.trim();
    if (typeof body.bio === 'string') updates.bio = body.bio.trim();
    if (typeof body.avatarEmoji === 'string') updates.avatarEmoji = body.avatarEmoji;
    if (typeof body.themeColor === 'string') updates.themeColor = body.themeColor;

    if (Object.keys(updates).length > 0) {
      await db
        .update(schema.users)
        .set(updates)
        .where(eq(schema.users.id, profileId));
    }

    const updated = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, profileId))
      .limit(1);

    return new Response(
      JSON.stringify({ success: true, profile: updated[0] }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Update failed';
    return new Response(
      JSON.stringify({ success: false, error: msg }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
