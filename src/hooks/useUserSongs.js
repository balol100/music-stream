import { useCallback } from "react";
import { useLocalStorage } from "./useLocalStorage.js";

// Normalises a YouTube search result into a Song record compatible with the
// rest of the app. Tagged so it can be filtered with "השירים שלי".
function eraFromYear(year) {
  if (!year) return "new";
  if (year >= 2018) return "new";
  if (year >= 2010) return "2010s";
  if (year >= 2000) return "2000s";
  if (year >= 1980) return "80s-90s";
  return "60s-70s";
}

export function ytResultToSong(result) {
  return {
    id: result.id,
    title: result.title,
    artist: result.artist || "YouTube",
    year: result.publishedYear ?? null,
    era: eraFromYear(result.publishedYear),
    mood: "YouTube",
    tags: ["user"],
    addedAt: Date.now(),
    thumbOverride: result.thumb || null,
  };
}

export function useUserSongs() {
  const [songs, setSongs] = useLocalStorage("musicstream:user-songs", []);

  const addFromYt = useCallback(
    (ytResult) => {
      let already = false;
      setSongs((prev) => {
        if (prev.some((s) => s.id === ytResult.id)) {
          already = true;
          return prev;
        }
        return [ytResultToSong(ytResult), ...prev];
      });
      return !already;
    },
    [setSongs],
  );

  const remove = useCallback(
    (id) => setSongs((prev) => prev.filter((s) => s.id !== id)),
    [setSongs],
  );

  const has = useCallback((id) => songs.some((s) => s.id === id), [songs]);

  return { userSongs: songs, addFromYt, remove, has };
}
