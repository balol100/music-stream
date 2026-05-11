// music-mood: curate a Hebrew playlist with Claude Haiku.
// One-shot: receives the catalog + a mood (preset or free text), returns 5–8 songs with reasons.
// Rate-limited to 5 calls per IP per 24h via the music_mood_log table.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const RATE_LIMIT = 5;
const RATE_WINDOW_HOURS = 24;

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

interface IncomingSong {
  id: string;
  title: string;
  artist: string;
  mood?: string;
  era?: string;
  year?: number;
}

interface RequestBody {
  mood?: string;        // preset label, e.g. "מסיבה"
  prompt?: string;      // free-text user prompt
  songs: IncomingSong[];
}

interface CuratedSong {
  id: string;
  reason: string;
}

interface ClaudeResponse {
  playlistName: string;
  description: string;
  songs: CuratedSong[];
}

async function callClaude(catalog: IncomingSong[], moodLabel: string, freeText: string): Promise<ClaudeResponse> {
  const catalogLines = catalog.map((s, i) =>
    `${i + 1}. id=${s.id} | "${s.title}" — ${s.artist}${s.year ? ` (${s.year})` : ""}${s.mood ? ` · ${s.mood}` : ""}${s.era ? ` · ${s.era}` : ""}`,
  ).join("\n");

  const userIntent = freeText
    ? `המשתמש ביקש: "${freeText}"`
    : `מצב הרוח של המשתמש: "${moodLabel}"`;

  const systemPrompt = `אתה אוצר מוזיקלי בעברית. אתה מקבל קטלוג שירים וצריך להרכיב פלייליסט קטן (5–8 שירים) שמתאים למצב הרוח של המשתמש.
חוקים:
- בחר *רק* מתוך הקטלוג. השתמש ב-id המדויק שמופיע בקטלוג.
- אל תמציא שירים שלא קיימים.
- תן שם קצר, קולע וכייפי לפלייליסט (בעברית).
- תן תיאור של משפט אחד לפלייליסט.
- לכל שיר, תן סיבה קצרה (משפט אחד, בעברית) למה הוא מתאים.
- החזר אך ורק JSON תקין, ללא שום טקסט מסביב, ללא קוד-בלוק, ללא הסברים.
פורמט בדיוק:
{"playlistName": "...", "description": "...", "songs": [{"id": "ID_FROM_CATALOG", "reason": "..."}]}`;

  const userMessage = `${userIntent}

קטלוג השירים הזמינים:
${catalogLines}

החזר JSON תקין בלבד.`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1200,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Claude API error ${res.status}: ${errText}`);
  }

  const data = await res.json();
  const text: string = data.content?.[0]?.text ?? "";

  // Tolerate a stray code-fence even though the prompt forbids it
  const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "").trim();

  let parsed: ClaudeResponse;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    // Last-ditch: extract the outermost {...}
    const m = cleaned.match(/\{[\s\S]*\}/);
    if (!m) throw new Error("Claude returned non-JSON: " + text.slice(0, 200));
    parsed = JSON.parse(m[0]);
  }

  if (!parsed?.songs || !Array.isArray(parsed.songs) || parsed.songs.length === 0) {
    throw new Error("Claude returned no songs");
  }

  // Filter out hallucinated ids and clamp to 8
  const validIds = new Set(catalog.map((s) => s.id));
  parsed.songs = parsed.songs
    .filter((s) => s && typeof s.id === "string" && validIds.has(s.id))
    .slice(0, 8);

  if (parsed.songs.length === 0) {
    throw new Error("Claude picked only invalid ids");
  }

  parsed.playlistName = String(parsed.playlistName ?? "פלייליסט חדש").slice(0, 60);
  parsed.description = String(parsed.description ?? "").slice(0, 280);

  return parsed;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS_HEADERS });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  let body: RequestBody;
  try {
    body = await req.json();
  } catch {
    return json({ error: "invalid_json" }, 400);
  }

  const moodLabel = (body.mood ?? "").trim().slice(0, 60);
  const freeText = (body.prompt ?? "").trim().slice(0, 240);
  if (!moodLabel && !freeText) return json({ error: "missing_mood_or_prompt" }, 400);

  if (!Array.isArray(body.songs) || body.songs.length === 0) {
    return json({ error: "missing_catalog" }, 400);
  }
  if (body.songs.length > 200) return json({ error: "catalog_too_large" }, 400);

  const ip = clientIp(req);
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  // Rate limit: count entries from this IP in the last 24h
  const since = new Date(Date.now() - RATE_WINDOW_HOURS * 3600 * 1000).toISOString();
  const { count, error: countError } = await supabase
    .from("music_mood_log")
    .select("id", { count: "exact", head: true })
    .eq("ip", ip)
    .gte("created_at", since);

  if (countError) {
    console.error("rate-limit count error", countError);
  } else if ((count ?? 0) >= RATE_LIMIT) {
    return json({
      error: "rate_limited",
      message: `הגעת למכסה היומית של ${RATE_LIMIT} בקשות. נסה שוב מחר.`,
      retryAfterHours: RATE_WINDOW_HOURS,
    }, 429);
  }

  let result: ClaudeResponse;
  try {
    result = await callClaude(body.songs, moodLabel, freeText);
  } catch (err) {
    console.error("claude error", err);
    return json({ error: "ai_failed", message: String(err instanceof Error ? err.message : err) }, 502);
  }

  // Log AFTER success so failed attempts don't burn the quota
  await supabase.from("music_mood_log").insert({
    ip,
    mood: moodLabel || null,
    custom_prompt: freeText || null,
  });

  return json(result);
});
