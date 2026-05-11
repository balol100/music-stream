import { useCallback } from "react";
import { useLocalStorage } from "./useLocalStorage.js";

function eraFromYear(year) {
  if (!year) return "new";
  if (year >= 2018) return "new";
  if (year >= 2010) return "2010s";
  if (year >= 2000) return "2000s";
  if (year >= 1980) return "80s-90s";
  return "60s-70s";
}

// Normalises a YouTube search result into a Song record.
export function ytResultToSong(result) {
  return {
    id: result.id,
    source: "youtube",
    title: result.title,
    artist: result.artist || "YouTube",
    year: result.publishedYear ?? null,
    era: eraFromYear(result.publishedYear),
    mood: "YouTube",
    tags: ["user", "youtube"],
    addedAt: Date.now(),
    thumbOverride: result.thumb || null,
  };
}

// Normalises a SoundCloud search result into a Song record.
export function scResultToSong(result) {
  return {
    id: result.id, // already "sc:NUMERIC_ID"
    source: "soundcloud",
    soundcloudTrackId: String(result.trackId),
    soundcloudUrl: result.permalinkUrl,
    title: result.title,
    artist: result.artist || "SoundCloud",
    year: result.publishedYear ?? null,
    era: eraFromYear(result.publishedYear),
    mood: "SoundCloud",
    tags: ["user", "soundcloud"],
    addedAt: Date.now(),
    thumbOverride: result.artworkUrl || null,
  };
}

export function useUserSongs() {
  const [songs, setSongs] = useLocalStorage("musicstream:user-songs", []);

  const addSong = useCallback(
    (songRecord) => {
      let already = false;
      setSongs((prev) => {
        if (prev.some((s) => s.id === songRecord.id)) {
          already = true;
          return prev;
        }
        return [songRecord, ...prev];
      });
      return !already;
    },
    [setSongs],
  );

  const addFromYt = useCallback(
    (ytResult) => addSong(ytResultToSong(ytResult)),
    [addSong],
  );

  const addFromSc = useCallback(
    (scResult) => addSong(scResultToSong(scResult)),
    [addSong],
  );

  const remove = useCallback(
    (id) => setSongs((prev) => prev.filter((s) => s.id !== id)),
    [setSongs],
  );

  const has = useCallback((id) => songs.some((s) => s.id === id), [songs]);

  return { userSongs: songs, addFromYt, addFromSc, addSong, remove, has };
}
