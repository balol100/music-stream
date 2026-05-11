import React, { useCallback, useMemo, useRef, useState } from "react";
import { SONGS, MOODS } from "./data/songs.js";
import { useLocalStorage } from "./hooks/useLocalStorage.js";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts.js";
import Header from "./components/Header.jsx";
import Player from "./components/Player.jsx";
import Filters from "./components/Filters.jsx";
import SongGrid from "./components/SongGrid.jsx";
import Toast from "./components/Toast.jsx";
import Footer from "./components/Footer.jsx";
import MoodAI from "./components/MoodAI.jsx";
import AIPlaylistCard from "./components/AIPlaylistCard.jsx";
import PlaylistsPanel from "./components/PlaylistsPanel.jsx";
import { savePlaylist, incrementPlayCount } from "./lib/api.js";

export default function App() {
  const [selectedEra, setSelectedEra] = useState("all");
  const [selectedMood, setSelectedMood] = useState(null);
  const [query, setQuery] = useState("");
  const [currentSong, setCurrentSong] = useState(SONGS[0]);
  const [favorites, setFavorites] = useLocalStorage("musicstream:favorites", []);
  const [view, setView] = useLocalStorage("musicstream:view", "grid");
  const [activeTab, setActiveTab] = useState("library"); // library | favorites | playlists
  const [isShuffle, setIsShuffle] = useLocalStorage("musicstream:shuffle", false);
  const [isRepeat, setIsRepeat] = useLocalStorage("musicstream:repeat", false);
  const [toast, setToast] = useState("");

  const [aiPlaylist, setAiPlaylist] = useState(null);
  const [aiSavedId, setAiSavedId] = useState(null);
  const [queue, setQueue] = useState(null); // {name, songIds[]} when playing a playlist
  const [selectedSongIds, setSelectedSongIds] = useState([]);
  const [playlistsRefresh, setPlaylistsRefresh] = useState(0);

  const searchRef = useRef(null);
  const playerRef = useRef(null);

  const filteredSongs = useMemo(() => {
    const q = query.trim().toLowerCase();
    return SONGS.filter((song) => {
      if (activeTab === "favorites" && !favorites.includes(song.id)) return false;
      if (selectedEra !== "all" && song.era !== selectedEra) return false;
      if (selectedMood && song.mood !== selectedMood) return false;
      if (q) {
        const haystack = `${song.title} ${song.artist} ${song.mood}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [query, selectedEra, selectedMood, favorites, activeTab]);

  const playPool = useMemo(() => {
    if (queue && queue.songs.length) return queue.songs;
    return filteredSongs.length ? filteredSongs : SONGS;
  }, [queue, filteredSongs]);

  const pickNext = useCallback(
    (direction) => {
      if (playPool.length === 0) return currentSong;
      if (isShuffle && playPool.length > 1) {
        let next;
        do {
          next = playPool[Math.floor(Math.random() * playPool.length)];
        } while (next.id === currentSong.id);
        return next;
      }
      const idx = playPool.findIndex((s) => s.id === currentSong.id);
      if (idx === -1) return playPool[0];
      const max = playPool.length;
      if (direction === "next") {
        if (idx + 1 >= max && !isRepeat) return playPool[max - 1];
        return playPool[(idx + 1) % max];
      }
      if (idx - 1 < 0 && !isRepeat) return playPool[0];
      return playPool[(idx - 1 + max) % max];
    },
    [isShuffle, isRepeat, playPool, currentSong],
  );

  const playNext = useCallback(() => setCurrentSong(pickNext("next")), [pickNext]);
  const playPrev = useCallback(() => setCurrentSong(pickNext("prev")), [pickNext]);

  const playRandom = useCallback(() => {
    if (playPool.length === 0) return;
    if (playPool.length === 1) {
      setCurrentSong(playPool[0]);
      return;
    }
    let next;
    do {
      next = playPool[Math.floor(Math.random() * playPool.length)];
    } while (next.id === currentSong.id);
    setCurrentSong(next);
  }, [playPool, currentSong]);

  const toggleFavorite = useCallback(
    (id) => {
      setFavorites((prev) => {
        const isFav = prev.includes(id);
        const next = isFav ? prev.filter((x) => x !== id) : [...prev, id];
        setToast(isFav ? "הוסר מהמועדפים" : "נוסף למועדפים ♥");
        return next;
      });
    },
    [setFavorites],
  );

  const toggleSelection = useCallback((id) => {
    setSelectedSongIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      return [...prev, id];
    });
  }, []);

  const handleSelectSong = useCallback((song) => {
    setCurrentSong(song);
    if (window.matchMedia("(max-width: 980px)").matches) {
      playerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  const handleAIPlaylist = useCallback((playlist) => {
    setAiPlaylist(playlist);
    setAiSavedId(null);
    const songMap = new Map(SONGS.map((s) => [s.id, s]));
    const queueSongs = (playlist.songs ?? []).map((x) => songMap.get(x.id)).filter(Boolean);
    if (queueSongs.length === 0) {
      setToast("ה-AI לא מצא שירים מתאימים — נסה שוב.");
      return;
    }
    setQueue({ name: playlist.playlistName, songs: queueSongs, isAi: true });
    setCurrentSong(queueSongs[0]);
    setToast(`▶ ${playlist.playlistName}`);
    if (window.matchMedia("(max-width: 980px)").matches) {
      setTimeout(() => playerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
    }
  }, []);

  const handleAIError = useCallback((err) => {
    const msg = err?.code === "rate_limited"
      ? (err.message || "הגעת למכסה היומית של AI.")
      : (err?.message || "ה-AI לא הצליח להגיב.");
    setToast(msg);
  }, []);

  const handleSaveAIPlaylist = useCallback(async () => {
    if (!aiPlaylist) return;
    try {
      const created = await savePlaylist({
        name: aiPlaylist.playlistName,
        description: aiPlaylist.description,
        mood: aiPlaylist.presetLabel,
        isAiGenerated: true,
        isPublic: false,
        songIds: aiPlaylist.songs.map((x) => ({ id: x.id, reason: x.reason })),
      });
      setAiSavedId(created.id);
      setPlaylistsRefresh((n) => n + 1);
      setToast("הפלייליסט נשמר ✓");
    } catch (err) {
      handleAIError(err);
    }
  }, [aiPlaylist, handleAIError]);

  const handlePlayPlaylist = useCallback(async (playlist, queueSongs) => {
    setQueue({ name: playlist.name, songs: queueSongs, isAi: !!playlist.is_ai_generated });
    setCurrentSong(queueSongs[0]);
    setToast(`▶ ${playlist.name}`);
    incrementPlayCount(playlist.id).catch(() => {});
    if (window.matchMedia("(max-width: 980px)").matches) {
      setTimeout(() => playerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
    }
  }, []);

  const handlePlayOneAISong = useCallback((song) => {
    setCurrentSong(song);
  }, []);

  const clearQueue = useCallback(() => {
    setQueue(null);
    setToast("היציאה ממצב פלייליסט");
  }, []);

  useKeyboardShortcuts({
    onArrowLeft: playPrev,
    onArrowRight: playNext,
    onRandom: playRandom,
    onToggleShuffle: () => {
      setIsShuffle((s) => {
        setToast(!s ? "ערבוב הופעל" : "ערבוב כובה");
        return !s;
      });
    },
    onToggleFavorite: () => toggleFavorite(currentSong.id),
    onFocusSearch: () => searchRef.current?.focus(),
    onEscape: (e) => e.target.blur && e.target.blur(),
  });

  const currentIsFavorite = favorites.includes(currentSong.id);
  const showLibraryUI = activeTab !== "playlists";

  return (
    <>
      <a href="#main" className="skip-link">דלג לתוכן הראשי</a>
      <div className="app-shell">
        <Header
          totalCount={SONGS.length}
          favoritesCount={favorites.length}
          view={activeTab}
          onChangeView={(v) => {
            setActiveTab(v);
            if (v === "library") setSelectedEra("all");
          }}
        />

        <main id="main" className="app">
          <section className="hero" ref={playerRef}>
            <div className="hero-copy">
              <p className="eyebrow">MusicStream · בעברית · RTL · עם AI</p>
              <h2 className="hero-title">
                שירים מכל הזמנים, <span className="grad">בלחיצה אחת.</span>
              </h2>
              <p className="hero-sub">
                ספרייה עם {SONGS.length} להיטים — קלאסיקות, עברית, פופ עכשווי. תן ל-AI לבחור פלייליסט לפי מצב הרוח, או בנה אחד בעצמך.
              </p>
              <div className="hero-actions">
                <button type="button" onClick={playRandom} className="btn btn-primary">
                  <span aria-hidden="true">🎲</span> נגן שיר אקראי
                </button>
                {queue && (
                  <button type="button" onClick={clearQueue} className="btn btn-ghost">
                    <span aria-hidden="true">✕</span> צא ממצב פלייליסט
                  </button>
                )}
              </div>
              {queue && (
                <p className="queue-status" aria-live="polite">
                  ▶ נגן {queue.isAi ? "פלייליסט AI" : "פלייליסט"}: <strong>{queue.name}</strong>
                </p>
              )}
            </div>

            <Player
              song={currentSong}
              isFavorite={currentIsFavorite}
              isShuffle={isShuffle}
              isRepeat={isRepeat}
              onPrev={playPrev}
              onNext={playNext}
              onRandom={playRandom}
              onToggleShuffle={() => setIsShuffle((s) => !s)}
              onToggleRepeat={() => setIsRepeat((r) => !r)}
              onToggleFavorite={() => toggleFavorite(currentSong.id)}
            />
          </section>

          <MoodAI
            catalog={SONGS}
            onPlaylistGenerated={handleAIPlaylist}
            onError={handleAIError}
          />

          {aiPlaylist && (
            <AIPlaylistCard
              playlist={aiPlaylist}
              songs={SONGS}
              currentId={currentSong.id}
              saved={!!aiSavedId}
              onPlayAll={() => {
                const songMap = new Map(SONGS.map((s) => [s.id, s]));
                const queueSongs = (aiPlaylist.songs ?? []).map((x) => songMap.get(x.id)).filter(Boolean);
                if (queueSongs.length) {
                  setQueue({ name: aiPlaylist.playlistName, songs: queueSongs, isAi: true });
                  setCurrentSong(queueSongs[0]);
                }
              }}
              onPlayOne={handlePlayOneAISong}
              onSave={handleSaveAIPlaylist}
              onDismiss={() => setAiPlaylist(null)}
            />
          )}

          {showLibraryUI ? (
            <>
              <Filters
                ref={searchRef}
                query={query}
                onQueryChange={setQuery}
                era={selectedEra}
                onEraChange={setSelectedEra}
                moods={MOODS}
                activeMood={selectedMood}
                onMoodChange={setSelectedMood}
                view={view}
                onViewChange={setView}
                resultCount={filteredSongs.length}
              />

              {selectedSongIds.length > 0 && (
                <div className="selection-bar" role="status">
                  <span>
                    נבחרו <strong>{selectedSongIds.length}</strong> שירים לפלייליסט חדש
                  </span>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => setActiveTab("playlists")}>
                    שמור פלייליסט →
                  </button>
                  <button type="button" className="btn btn-sm btn-ghost" onClick={() => setSelectedSongIds([])}>
                    נקה
                  </button>
                </div>
              )}

              <SongGrid
                songs={filteredSongs}
                currentId={currentSong.id}
                favorites={favorites}
                selectedIds={selectedSongIds}
                selectionMode={true}
                onSelect={handleSelectSong}
                onToggleFavorite={toggleFavorite}
                onToggleSelection={toggleSelection}
                view={view}
                emptyMessage={
                  activeTab === "favorites"
                    ? "עדיין לא הוספת מועדפים. לחץ על הלב בכרטיס שיר כדי לשמור."
                    : "לא נמצאו שירים תואמים. נסה לשנות את החיפוש או הסינון."
                }
              />
            </>
          ) : (
            <PlaylistsPanel
              songs={SONGS}
              selectedSongIds={selectedSongIds}
              refreshSignal={playlistsRefresh}
              onPlayPlaylist={handlePlayPlaylist}
              onClearSelection={() => setSelectedSongIds([])}
              onError={handleAIError}
              onSaved={() => setToast("הפלייליסט נשמר ✓")}
            />
          )}
        </main>

        <Footer />
      </div>

      <Toast message={toast} onDismiss={() => setToast("")} />
    </>
  );
}
