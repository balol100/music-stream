import React, { useCallback, useEffect, useRef, useState } from "react";
import { searchYouTube, listMyPlaylists, appendSongsToPlaylist } from "../lib/api.js";

function formatDuration(seconds) {
  if (!seconds) return "";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function formatViews(n) {
  if (!n) return "";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M צפיות`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K צפיות`;
  return `${n} צפיות`;
}

export default function YouTubeSearch({ onPlay, onAddToCatalog, isInCatalog, onError, onToast }) {
  const [query, setQuery] = useState("");
  const [submitted, setSubmitted] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [emptyMessage, setEmptyMessage] = useState("");
  const [pickerFor, setPickerFor] = useState(null); // search result whose "add to playlist" menu is open
  const [playlists, setPlaylists] = useState([]);
  const [loadingPlaylists, setLoadingPlaylists] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    const q = query.trim();
    if (!q || loading) return;
    setSubmitted(q);
    setLoading(true);
    setEmptyMessage("");
    setResults([]);
    try {
      const data = await searchYouTube(q);
      setResults(data.results ?? []);
      if ((data.results ?? []).length === 0) setEmptyMessage(data.message || "לא נמצאו תוצאות.");
    } catch (err) {
      onError?.(err);
      setEmptyMessage(err?.message || "החיפוש נכשל. נסה שוב.");
    } finally {
      setLoading(false);
    }
  }

  const openPicker = useCallback(async (result) => {
    setPickerFor(result);
    setLoadingPlaylists(true);
    try {
      setPlaylists(await listMyPlaylists());
    } catch (err) {
      onError?.(err);
    } finally {
      setLoadingPlaylists(false);
    }
  }, [onError]);

  async function addToPlaylist(playlist) {
    if (!pickerFor) return;
    try {
      const r = await appendSongsToPlaylist(playlist.id, [{ id: pickerFor.id }]);
      if (r.added === 0) {
        onToast?.(`השיר כבר היה ב"${playlist.name}"`);
      } else {
        onToast?.(`נוסף ל"${playlist.name}" ✓`);
      }
    } catch (err) {
      onError?.(err);
    } finally {
      setPickerFor(null);
    }
  }

  return (
    <section className="yt-search" aria-label="חיפוש ב-YouTube">
      <form className="yt-search-form" onSubmit={handleSubmit}>
        <div className="yt-search-input-wrap">
          <span className="yt-search-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="20" height="20"><circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="2"/><path d="m20 20-3.5-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
          </span>
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="חפש שיר, זמר, או אלבום…"
            maxLength={120}
            aria-label="שאילתת חיפוש ב-YouTube"
            inputMode="search"
            enterKeyHint="search"
          />
          {query && (
            <button
              type="button"
              className="yt-search-clear"
              onClick={() => { setQuery(""); inputRef.current?.focus(); }}
              aria-label="נקה חיפוש"
            >×</button>
          )}
        </div>
        <button type="submit" className="btn btn-primary" disabled={loading || !query.trim()}>
          {loading ? "מחפש…" : "חפש"}
        </button>
      </form>

      <p className="yt-search-hint">
        מחפש ישירות ב-YouTube. מוגבל ל-20 חיפושים ביום. <strong>כל התוכן מוזרם מ-YouTube</strong> בהתאם לתנאי השירות.
      </p>

      {submitted && !loading && results.length === 0 && (
        <div className="yt-search-empty">
          <p>{emptyMessage || `לא נמצאו תוצאות עבור "${submitted}".`}</p>
        </div>
      )}

      {loading && (
        <div className="yt-search-skeleton" aria-hidden="true">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="yt-skel-row"><div className="yt-skel-img" /><div className="yt-skel-text"><div /><div /></div></div>
          ))}
        </div>
      )}

      {results.length > 0 && (
        <ul className="yt-results" aria-label="תוצאות חיפוש">
          {results.map((r) => {
            const inCat = isInCatalog(r.id);
            return (
              <li key={r.id} className="yt-result">
                <button
                  type="button"
                  className="yt-result-thumb"
                  onClick={() => onPlay(r)}
                  aria-label={`נגן ${r.title}`}
                >
                  {r.thumb ? <img src={r.thumb} alt="" loading="lazy" /> : <div className="yt-thumb-fallback" />}
                  {r.duration && <span className="yt-duration">{r.duration || formatDuration(r.durationSeconds)}</span>}
                  <span className="yt-play-overlay" aria-hidden="true">▶</span>
                </button>
                <div className="yt-result-body">
                  <h4 className="yt-result-title">{r.title}</h4>
                  <p className="yt-result-meta">
                    {r.artist}
                    {r.publishedAt && <> · {r.publishedAt}</>}
                    {r.viewCount > 0 && <> · {formatViews(r.viewCount)}</>}
                  </p>
                  <div className="yt-result-actions">
                    <button type="button" className="btn btn-primary btn-sm" onClick={() => onPlay(r)}>
                      ▶ נגן
                    </button>
                    <button
                      type="button"
                      className={`btn btn-sm ${inCat ? "btn-ghost active" : "btn-ghost"}`}
                      onClick={() => onAddToCatalog(r)}
                      aria-pressed={inCat}
                    >
                      {inCat ? "✓ בקטלוג" : "＋ הוסף לקטלוג"}
                    </button>
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => openPicker(r)}>
                      ≡ הוסף לפלייליסט
                    </button>
                    <a
                      className="btn btn-ghost btn-sm yt-external"
                      href={`https://www.youtube.com/watch?v=${r.id}`}
                      target="_blank"
                      rel="noreferrer"
                      aria-label="פתח ב-YouTube"
                      title="פתח ב-YouTube"
                    >
                      ↗
                    </a>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {pickerFor && (
        <div
          className="yt-picker-backdrop"
          role="dialog"
          aria-modal="true"
          aria-label="בחר פלייליסט"
          onClick={(e) => { if (e.target === e.currentTarget) setPickerFor(null); }}
        >
          <div className="yt-picker">
            <header>
              <h3>הוסף ל…</h3>
              <button type="button" className="icon-btn" onClick={() => setPickerFor(null)} aria-label="סגור">
                <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
              </button>
            </header>
            <p className="yt-picker-song">{pickerFor.title}</p>
            {loadingPlaylists ? (
              <p className="yt-picker-loading">טוען…</p>
            ) : playlists.length === 0 ? (
              <p className="yt-picker-empty">עוד אין לך פלייליסטים. צור אחד תחילה דרך הטאב "פלייליסטים".</p>
            ) : (
              <ul className="yt-picker-list">
                {playlists.map((p) => (
                  <li key={p.id}>
                    <button type="button" onClick={() => addToPlaylist(p)}>
                      <span className="yt-picker-name">
                        {p.is_ai_generated && <span className="playlist-ai-tag" aria-hidden="true">✨ AI</span>}
                        {p.name}
                      </span>
                      <span className="yt-picker-count">{(p.songs ?? []).length} שירים</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
