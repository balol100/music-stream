// soundcloud-search: queries SoundCloud's internal v2 API.
//
// SoundCloud's search page is a client-side React app — the HTML only hydrates
// generic globals and fetches results via XHR to api-v2.soundcloud.com. That
// API requires a `client_id` query param, which is baked into a JS bundle the
// page loads from a-v2.sndcdn.com. We extract it once (with caching) and
// then call the search endpoint directly.
//
// Shares the existing yt_search_log rate-limit table (20 / IP / 24h, prefixed
// with "sc:" so YouTube + SoundCloud share the daily quota).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const RATE_LIMIT = 20;
const RATE_WINDOW_HOURS = 24;

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

// In-memory cache — fresh per cold start. SoundCloud rotates client_id roughly
// daily; we re-extract on cache miss or on a 401/403 from the API.
let cachedClientId: { value: string; ts: number } | null = null;
const CLIENT_ID_TTL_MS = 6 * 60 * 60 * 1000;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

function clientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return req.headers.get("cf-connecting-ip") ?? req.headers.get("x-real-ip") ?? "unknown";
}

async function fetchClientId(): Promise<string> {
  if (cachedClientId && Date.now() - cachedClientId.ts < CLIENT_ID_TTL_MS) {
    return cachedClientId.value;
  }
  const pageRes = await fetch("https://soundcloud.com/", {
    headers: { "User-Agent": UA, "Accept-Language": "en;q=0.9" },
  });
  if (!pageRes.ok) throw new Error(`soundcloud home HTTP ${pageRes.status}`);
  const html = await pageRes.text();

  // Pick out every JS asset the page loads. The client_id lives in one of them
  // (usually the last in source order, but we try them all if needed).
  const scriptUrls: string[] = [];
  const re = /<script[^>]+src="(https:\/\/[^"]*sndcdn\.com\/assets\/[^"]+\.js)"/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    scriptUrls.push(m[1]);
  }
  if (scriptUrls.length === 0) throw new Error("no sndcdn scripts in page");

  // Walk in reverse — empirically the bundle containing client_id is one of
  // the later ones.
  for (const url of [...scriptUrls].reverse()) {
    try {
      const r = await fetch(url, { headers: { "User-Agent": UA } });
      if (!r.ok) continue;
      const js = await r.text();
      const idMatch = /client_id\s*[:=]\s*["']([a-zA-Z0-9]{16,40})["']/.exec(js);
      if (idMatch) {
        cachedClientId = { value: idMatch[1], ts: Date.now() };
        return idMatch[1];
      }
    } catch (_e) {
      // try the next bundle
    }
  }
  throw new Error("client_id not found in any asset bundle");
}

interface NormalisedTrack {
  id: string;             // "sc:" + numeric track id
  trackId: number;
  source: "soundcloud";
  title: string;
  artist: string;
  permalinkUrl: string;
  artworkUrl: string;
  durationSeconds: number;
  publishedYear: number | null;
  playbackCount: number;
}

interface ScUser {
  username?: string;
  permalink_url?: string;
}

interface ScTrack {
  kind?: string;
  id?: number;
  title?: string;
  permalink_url?: string;
  artwork_url?: string;
  duration?: number;
  full_duration?: number;
  created_at?: string;
  release_date?: string | null;
  playback_count?: number;
  user?: ScUser;
}

function biggerArtwork(url: string): string {
  if (!url) return "";
  return url.replace("-large.", "-t500x500.");
}

function parseYear(s?: string | null): number | null {
  if (!s) return null;
  const m = /(\d{4})/.exec(s);
  return m ? parseInt(m[1], 10) : null;
}

function normalise(t: ScTrack): NormalisedTrack | null {
  if (!t || (t.kind && t.kind !== "track") || typeof t.id !== "number" || !t.title) return null;
  const durMs = t.full_duration ?? t.duration ?? 0;
  return {
    id: `sc:${t.id}`,
    trackId: t.id,
    source: "soundcloud",
    title: t.title,
    artist: t.user?.username || "",
    permalinkUrl: t.permalink_url || "",
    artworkUrl: biggerArtwork(t.artwork_url || ""),
    durationSeconds: Math.round(durMs / 1000),
    publishedYear: parseYear(t.release_date) ?? parseYear(t.created_at),
    playbackCount: t.playback_count ?? 0,
  };
}

async function searchSoundCloud(query: string): Promise<NormalisedTrack[]> {
  async function callApi(clientId: string) {
    const url =
      `https://api-v2.soundcloud.com/search/tracks` +
      `?q=${encodeURIComponent(query)}` +
      `&client_id=${clientId}&limit=25&offset=0&app_locale=en`;
    return fetch(url, {
      headers: {
        "User-Agent": UA,
        "Accept": "application/json",
        "Origin": "https://soundcloud.com",
        "Referer": "https://soundcloud.com/",
      },
    });
  }

  let clientId = await fetchClientId();
  let res = await callApi(clientId);

  // If the cached client_id died, force a refresh once.
  if (res.status === 401 || res.status === 403) {
    cachedClientId = null;
    clientId = await fetchClientId();
    res = await callApi(clientId);
  }

  if (!res.ok) throw new Error(`sc api HTTP ${res.status}`);
  const data = await res.json() as { collection?: ScTrack[] };
  const collection = Array.isArray(data?.collection) ? data.collection : [];
  return collection
    .map(normalise)
    .filter((t): t is NormalisedTrack => !!t)
    .slice(0, 25);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS_HEADERS });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  let body: { query?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: "invalid_json" }, 400);
  }

  const query = (body.query ?? "").trim().slice(0, 120);
  if (!query) return json({ error: "missing_query" }, 400);

  const ip = clientIp(req);
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  const since = new Date(Date.now() - RATE_WINDOW_HOURS * 3600 * 1000).toISOString();
  const { count, error: countError } = await supabase
    .from("yt_search_log")
    .select("id", { count: "exact", head: true })
    .eq("ip", ip)
    .gte("created_at", since);

  if (countError) {
    console.error("rate-limit count error", countError);
  } else if ((count ?? 0) >= RATE_LIMIT) {
    return json({
      error: "rate_limited",
      message: `הגעת למכסה היומית של ${RATE_LIMIT} חיפושים. נסה שוב מחר.`,
      retryAfterHours: RATE_WINDOW_HOURS,
    }, 429);
  }

  let results: NormalisedTrack[];
  try {
    results = await searchSoundCloud(query);
  } catch (err) {
    console.error("soundcloud search error", err instanceof Error ? err.message : err);
    return json({ error: "search_failed", message: "החיפוש ב-SoundCloud נכשל." }, 502);
  }

  if (results.length === 0) {
    return json({ results: [], message: "לא נמצאו תוצאות ב-SoundCloud." });
  }

  await supabase.from("yt_search_log").insert({ ip, query: `sc:${query}` });
  return json({ results });
});
