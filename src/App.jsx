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

export default function App() {
  const [selectedEra, setSelectedEra] = useState("all");
  const [selectedMood, setSelectedMood] = useState(null);
  const [query, setQuery] = useState("");
  const [currentSong, setCurrentSong] = useState(SONGS[0]);
  const [favorites, setFavorites] = useLocalStorage("musicstream:favorites", []);
  const [view, setView] = useLocalStorage("musicstream:view", "grid");
  const [showingFavorites, setShowingFavorites] = useState(false);
  const [isShuffle, setIsShuffle] = useLocalStorage("musicstream:shuffle", false);
  const [isRepeat, setIsRepeat] = useLocalStorage("musicstream:repeat", false);
  const [toast, setToast] = useState("");
  const searchRef = useRef(null);
  const playerRef = useRef(null);

  const filteredSongs = useMemo(() => {
    const q = query.trim().toLowerCase();
    return SONGS.filter((song) => {
      if (showingFavorites && !favorites.includes(song.id)) return false;
      if (selectedEra !== "all" && song.era !== selectedEra) return false;
      if (selectedMood && song.mood !== selectedMood) return false;
      if (q) {
        const haystack = `${song.title} ${song.artist} ${song.mood}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [query, selectedEra, selectedMood, favorites, showingFavorites]);

  const playPool = filteredSongs.length ? filteredSongs : SONGS;

  const pickNext = useCallback(
    (direction) => {
      if (isShuffle) {
        if (playPool.length <= 1) return playPool[0] || currentSong;
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
    [isShuffle, isRepeat, playPool, currentSong]
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
    [setFavorites]
  );

  const handleSelectSong = useCallback((song) => {
    setCurrentSong(song);
    if (window.matchMedia("(max-width: 900px)").matches) {
      playerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
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

  return (
    <>
      <a href="#main" className="skip-link">דלג לתוכן הראשי</a>
      <div className="app-shell">
        <Header
          totalCount={SONGS.length}
          favoritesCount={favorites.length}
          showingFavorites={showingFavorites}
          onShowFavorites={(v) => {
            setShowingFavorites(v);
            if (v) setSelectedEra("all");
          }}
        />

        <main id="main" className="app">
          <section className="hero" ref={playerRef}>
            <div className="hero-copy">
              <p className="eyebrow">MusicStream · בעברית · RTL</p>
              <h2 className="hero-title">
                שירים מכל הזמנים, <span className="grad">בלחיצה אחת.</span>
              </h2>
              <p className="hero-sub">
                ספריית להיטים מהשנים 60–70, 80–90, 2000, 2010 ועד היום. ניגון חוקי דרך
                נגן YouTube רשמי, חיפוש מהיר וסינון לפי תקופה וסגנון.
              </p>
              <div className="hero-actions">
                <button type="button" onClick={playRandom} className="btn btn-primary">
                  <span aria-hidden="true">🎲</span> נגן שיר אקראי
                </button>
                <a
                  href="https://www.youtube.com/results?search_query=hits+playlist"
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-ghost"
                >
                  חפש עוד ביוטיוב
                </a>
              </div>
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

          <SongGrid
            songs={filteredSongs}
            currentId={currentSong.id}
            favorites={favorites}
            onSelect={handleSelectSong}
            onToggleFavorite={toggleFavorite}
            view={view}
            emptyMessage={
              showingFavorites
                ? "עדיין לא הוספת מועדפים. לחץ על הלב בכרטיס שיר כדי לשמור."
                : "לא נמצאו שירים תואמים. נסה לשנות את החיפוש או הסינון."
            }
          />
        </main>

        <Footer />
      </div>

      <Toast message={toast} onDismiss={() => setToast("")} />
    </>
  );
}
