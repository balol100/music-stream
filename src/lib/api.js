import { supabase, FUNCTIONS_BASE, DEVICE_ID } from "./supabase.js";

export async function generateMoodPlaylist({ mood, prompt, songs }) {
  const { data: session } = await supabase.auth.getSession();
  const token = session?.session?.access_token ?? supabase.supabaseKey;
  const res = await fetch(`${FUNCTIONS_BASE}/music-mood`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      apikey: supabase.supabaseKey,
    },
    body: JSON.stringify({ mood, prompt, songs }),
  });
  const data = await res.json().catch(() => ({ error: "bad_json" }));
  if (!res.ok) {
    const err = new Error(data?.message || data?.error || `HTTP ${res.status}`);
    err.code = data?.error;
    err.status = res.status;
    throw err;
  }
  return data;
}

// ---- Playlist persistence ----

export async function savePlaylist({ name, description = "", mood = null, isAiGenerated = false, isPublic = false, songIds = [] }) {
  const { data, error } = await supabase
    .from("music_playlists")
    .insert({
      name,
      description,
      mood,
      is_ai_generated: isAiGenerated,
      is_public: isPublic,
      created_by: DEVICE_ID,
      songs: songIds,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function listMyPlaylists() {
  const { data, error } = await supabase
    .from("music_playlists")
    .select("*")
    .eq("created_by", DEVICE_ID)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function listPopularPlaylists(limit = 12) {
  const { data, error } = await supabase
    .from("music_playlists")
    .select("*")
    .eq("is_public", true)
    .order("play_count", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}

export async function deletePlaylist(id) {
  const { error } = await supabase
    .from("music_playlists")
    .delete()
    .eq("id", id)
    .eq("created_by", DEVICE_ID);
  if (error) throw error;
}

export async function setPlaylistPublic(id, isPublic) {
  const { data, error } = await supabase
    .from("music_playlists")
    .update({ is_public: isPublic })
    .eq("id", id)
    .eq("created_by", DEVICE_ID)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function incrementPlayCount(id) {
  // Best-effort fire-and-forget; ignore concurrency since exact ordering doesn't matter.
  const { data } = await supabase
    .from("music_playlists")
    .select("play_count")
    .eq("id", id)
    .single();
  if (!data) return;
  await supabase
    .from("music_playlists")
    .update({ play_count: (data.play_count ?? 0) + 1 })
    .eq("id", id);
}
