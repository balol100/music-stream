// youtube-search: scrapes YouTube search HTML directly (parses ytInitialData).
// No API key, no public proxies (Invidious/Piped were all blocked at deploy time).
// Rate-limited to 20 calls per IP per 24h via yt_search_log.

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

// sp=EgIQAQ%3D%3D → filter to videos only.
// hl=he and gl=IL bias for Hebrew/Israeli results.
const YT_SEARCH_BASE = "https://www.youtube.com/results";

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

interface NormalizedSong {
  id: string;
  title: string;
  artist: string;
  thumb: string;
  duration: string;
  durationSeconds: number;
  viewCount: number;
  publishedAt: string;
  publishedYear: number | null;
}

function durationToSeconds(text: string): number {
  if (!text) return 0;
  const parts = text.split(":").map((p) => parseInt(p, 10) || 0);
  let s = 0;
  for (const p of parts) s = s * 60 + p;
  return s;
}

function parseViewCount(text: string): number {
  if (!text) return 0;
  const m = text.replace(/[^\d.kKmMbB]/g, "");
  const num = parseFloat(m);
  if (isNaN(num)) return 0;
  if (/m/i.test(m)) return Math.round(num * 1_000_000);
  if (/k/i.test(m)) return Math.round(num * 1_000);
  if (/b/i.test(m)) return Math.round(num * 1_000_000_000);
  return Math.round(num);
}

function parseYear(text: string): number | null {
  if (!text) return null;
  // "Streamed 2 years ago" / "3 months ago" — approximate via current year minus N years.
  const now = new Date();
  const ym = text.match(/(\d+)\s*year/i);
  if (ym) return now.getFullYear() - parseInt(ym[1], 10);
  const mm = text.match(/(\d+)\s*month/i);
  if (mm) return now.getFullYear();
  if (/week|day|hour|minute|second/i.test(text)) return now.getFullYear();
  return null;
}

interface VideoRenderer {
  videoId: string;
  title?: { runs?: { text: string }[]; simpleText?: string };
  ownerText?: { runs?: { text: string }[] };
  longBylineText?: { runs?: { text: string }[] };
  shortBylineText?: { runs?: { text: string }[] };
  thumbnail?: { thumbnails?: { url: string; width?: number; height?: number }[] };
  lengthText?: { simpleText?: string; accessibility?: unknown };
  viewCountText?: { simpleText?: string; runs?: { text: string }[] };
  shortViewCountText?: { simpleText?: string; runs?: { text: string }[] };
  publishedTimeText?: { simpleText?: string };
}

function getText(o?: { simpleText?: string; runs?: { text: string }[] }): string {
  if (!o) return "";
  if (o.simpleText) return o.simpleText;
  if (Array.isArray(o.runs)) return o.runs.map((r) => r.text).join("");
  return "";
}

function pickThumb(thumbs?: { url: string; width?: number; height?: number }[]): string {
  if (!thumbs || thumbs.length === 0) return "";
  // YouTube returns ascending sizes; the last is usually the highest quality.
  const last = thumbs[thumbs.length - 1].url;
  // Strip query string so we get a stable hqdefault-ish URL.
  return last.split("?")[0];
}

function extractVideosFromYtInitialData(data: unknown): VideoRenderer[] {
  const out: VideoRenderer[] = [];
  function walk(node: unknown) {
    if (!node || typeof node !== "object") return;
    if (Array.isArray(node)) { for (const n of node) walk(n); return; }
    const obj = node as Record<string, unknown>;
    const vr = obj["videoRenderer"] as VideoRenderer | undefined;
    if (vr && typeof vr.videoId === "string") {
      out.push(vr);
      return;
    }
    for (const k of Object.keys(obj)) walk(obj[k]);
  }
  walk(data);
  return out;
}

async function scrapeYouTube(query: string): Promise<NormalizedSong[]> {
  const url = `${YT_SEARCH_BASE}?search_query=${encodeURIComponent(query)}&sp=EgIQAQ%3D%3D&hl=he&gl=IL`;
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      "Accept-Language": "he,en;q=0.9",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    },
  });
  if (!res.ok) throw new Error(`youtube HTTP ${res.status}`);
  const html = await res.text();

  // The page embeds: var ytInitialData = {...};
  const marker = "var ytInitialData = ";
  const start = html.indexOf(marker);
  if (start === -1) throw new Error("ytInitialData marker not found");
  let i = start + marker.length;
  // Find the matching closing brace for the JSON object.
  if (html[i] !== "{") throw new Error("ytInitialData not an object");
  let depth = 0;
  let inString = false;
  let escape = false;
  const end = (() => {
    for (let j = i; j < html.length; j++) {
      const c = html[j];
      if (inString) {
        if (escape) { escape = false; continue; }
        if (c === "\\") { escape = true; continue; }
        if (c === '"') { inString = false; }
        continue;
      }
      if (c === '"') { inString = true; continue; }
      if (c === "{") depth++;
      else if (c === "}") { depth--; if (depth === 0) return j + 1; }
    }
    return -1;
  })();
  if (end === -1) throw new Error("ytInitialData JSON not closed");

  const jsonText = html.slice(i, end);
  const data = JSON.parse(jsonText);

  const renderers = extractVideosFromYtInitialData(data).slice(0, 25);
  return renderers.map((v) => {
    const title = getText(v.title);
    const artist =
      getText(v.ownerText) || getText(v.longBylineText) || getText(v.shortBylineText) || "";
    const lengthText = v.lengthText?.simpleText ?? "";
    const viewText = getText(v.shortViewCountText) || getText(v.viewCountText) || "";
    const published = v.publishedTimeText?.simpleText ?? "";
    return {
      id: v.videoId,
      title,
      artist,
      thumb: pickThumb(v.thumbnail?.thumbnails),
      duration: lengthText,
      durationSeconds: durationToSeconds(lengthText),
      viewCount: parseViewCount(viewText),
      publishedAt: published,
      publishedYear: parseYear(published),
    };
  }).filter((s) => s.id && s.title);
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

  let results: NormalizedSong[];
  try {
    results = await scrapeYouTube(query);
  } catch (err) {
    console.error("scrape error", err instanceof Error ? err.message : err);
    return json({ error: "search_failed", message: "החיפוש נכשל. נסה שוב בעוד רגע." }, 502);
  }

  if (results.length === 0) {
    return json({ results: [], message: "לא נמצאו תוצאות. נסה ניסוח אחר." });
  }

  await supabase.from("yt_search_log").insert({ ip, query });
  return json({ results });
});
