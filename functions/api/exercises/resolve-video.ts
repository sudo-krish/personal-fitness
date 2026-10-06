// Cloudflare Pages Function: /api/exercises/resolve-video
// Scrapes YouTube for tutorial videos on-demand without official YouTube Data API keys.
// Persists the resolved video_url directly into Cloudflare D1.

import { drizzle } from 'drizzle-orm/d1';
import { eq } from 'drizzle-orm';
import * as schema from '../../../src/db/schema';

interface Env {
  DB?: any;
}

interface ResolveRequest {
  exerciseId: string;
  query?: string;
  exerciseName?: string;
}

interface VideoResult {
  videoId: string;
  title: string;
  videoUrl: string;
}

// Tier 1: Direct Edge Fetch + ytInitialData extraction
async function searchYouTubeDirect(searchTerm: string): Promise<VideoResult | null> {
  const query = encodeURIComponent(`${searchTerm} exercise tutorial form`);
  const url = `https://www.youtube.com/results?search_query=${query}`;

  const res = await fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      'Accept-Language': 'en-US,en;q=0.9',
      'Cookie': 'PREF=f6=40000000&hl=en;', // Suppresses European GDPR consent redirect
      'Sec-Fetch-Mode': 'navigate',
    },
  });

  if (!res.ok) {
    return null;
  }

  const html = await res.text();

  // Extract embedded ytInitialData JSON
  const match = html.match(/var ytInitialData = ({.*?});<\/script>/s) || html.match(/ytInitialData\s*=\s*({.+?});/);
  if (!match) {
    return null;
  }

  try {
    const data = JSON.parse(match[1]);
    const sections =
      data?.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents;

    if (Array.isArray(sections)) {
      for (const section of sections) {
        const itemSection = section?.itemSectionRenderer?.contents;
        if (Array.isArray(itemSection)) {
          for (const item of itemSection) {
            const v = item?.videoRenderer;
            if (v && v.videoId) {
              const videoId = v.videoId;
              const title =
                v.title?.runs?.[0]?.text ||
                v.title?.simpleText ||
                `${searchTerm} Tutorial`;
              return {
                videoId,
                title,
                videoUrl: `https://www.youtube.com/watch?v=${videoId}`,
              };
            }
          }
        }
      }
    }
  } catch (err) {
    console.warn('[resolve-video] Error parsing ytInitialData:', err);
  }

  return null;
}

// Tier 2: Public Privacy Proxies (Invidious / Piped) Fallback
async function searchYouTubeFallback(searchTerm: string): Promise<VideoResult | null> {
  const query = encodeURIComponent(`${searchTerm} exercise tutorial`);
  
  // Try Invidious public instance
  try {
    const invidiousRes = await fetch(
      `https://vid.puffyan.us/api/v1/search?q=${query}&type=video`,
      {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(4000),
      }
    );
    if (invidiousRes.ok) {
      const results = await invidiousRes.json();
      if (Array.isArray(results) && results.length > 0 && results[0].videoId) {
        return {
          videoId: results[0].videoId,
          title: results[0].title || `${searchTerm} Tutorial`,
          videoUrl: `https://www.youtube.com/watch?v=${results[0].videoId}`,
        };
      }
    }
  } catch {
    // Continue to next fallback
  }

  // Try Piped instance
  try {
    const pipedRes = await fetch(
      `https://pipedapi.kavin.rocks/search?q=${query}&filter=videos`,
      {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(4000),
      }
    );
    if (pipedRes.ok) {
      const data = await pipedRes.json();
      const items = data.items || [];
      if (items.length > 0 && items[0].url) {
        const videoId = items[0].url.replace('/watch?v=', '');
        return {
          videoId,
          title: items[0].title || `${searchTerm} Tutorial`,
          videoUrl: `https://www.youtube.com/watch?v=${videoId}`,
        };
      }
    }
  } catch {
    // Both failed
  }

  return null;
}

export const onRequestPost = async (context: { request: Request; env: Env }) => {
  const { request, env } = context;

  try {
    const body: ResolveRequest = await request.json();
    const { exerciseId, query, exerciseName } = body;

    if (!exerciseId) {
      return new Response(
        JSON.stringify({ success: false, error: 'exerciseId is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const searchTerm = query || exerciseName || exerciseId.replace(/_/g, ' ');

    // 1. Try Tier 1 Scraper
    let result = await searchYouTubeDirect(searchTerm);

    // 2. If Tier 1 returned null, try Tier 2 Fallback
    if (!result) {
      result = await searchYouTubeFallback(searchTerm);
    }

    if (!result) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Could not resolve a tutorial video automatically. You can paste a manual link.',
          searchQuery: searchTerm,
        }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 3. Persist to Cloudflare D1 if binding exists
    if (env.DB) {
      try {
        const db = drizzle(env.DB, { schema });
        await db
          .update(schema.exercises)
          .set({ videoUrl: result.videoUrl })
          .where(eq(schema.exercises.id, exerciseId));
      } catch (dbErr) {
        console.warn('[resolve-video] Warning: could not persist to D1:', dbErr);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        exerciseId,
        videoId: result.videoId,
        title: result.title,
        videoUrl: result.videoUrl,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ success: false, error: error?.message || 'Internal error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
