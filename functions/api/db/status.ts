// Cloudflare Pages Function: /api/db/status
// Reports D1 database status and record metrics

import { drizzle } from 'drizzle-orm/d1';
import { sql } from 'drizzle-orm';
import * as schema from '../../../src/db/schema';

interface Env {
  DB?: any;
}

export const onRequestGet = async (context: { env: Env }) => {
  const { env } = context;

  if (!env.DB) {
    return new Response(
      JSON.stringify({
        success: true,
        connected: false,
        environment: 'cloudflare-pages',
        database: 'Cloudflare D1 (Pending Binding)',
        isNativeSqlite: true,
        message: 'D1 binding (DB) not yet configured. Operating with local template fallback.',
        profiles: ['Krish', 'Theju'],
        updatedAt: new Date().toISOString(),
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const db = drizzle(env.DB, { schema });
    const [exCount, logCount] = await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(schema.exercises),
      db.select({ count: sql<number>`count(*)` }).from(schema.setLogs),
    ]);

    return new Response(
      JSON.stringify({
        success: true,
        connected: true,
        environment: 'cloudflare-pages',
        database: 'Cloudflare D1 (SQLite Edge)',
        isNativeSqlite: true,
        totalExercises: exCount[0]?.count ?? 0,
        totalSetLogs: logCount[0]?.count ?? 0,
        profiles: ['Krish', 'Theju'],
        updatedAt: new Date().toISOString(),
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({
        success: true,
        connected: false,
        environment: 'cloudflare-pages',
        error: error?.message || 'Failed to query D1 database',
        profiles: ['Krish', 'Theju'],
        updatedAt: new Date().toISOString(),
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
