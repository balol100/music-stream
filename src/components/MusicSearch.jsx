import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  searchYouTube,
  searchSoundCloud,
  listMyPlaylists,
  appendSongsToPlaylist,
} from "../lib/api.js";

function formatViews(n) {
  if (!n) return "";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M השמעות`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K השמעות`;
  return `${n} השמעות`;
}

function formatSeconds(sec) {
  if (!sec) return "";
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

const PROVIDERS = [
  { id: "youtube", label: "YouTube", color: "src-yt", hint: "🎬 הקטלוג הכי גדול. במובייל הניגון נעצר כשמנעלים את המסך." },
  { id: "soundcloud", label: "SoundCloud", color: "src-sc", hint: "🔊 ניגון ברקע במובייל גם כשהמסך נעול." },
];

export default function MusicSearch({
  provider,
  onProviderChange,
  onPlayYt,
  onPlaySc,
  onAddYt,
  onAddSc,
  isInCatalog,
  onError,
  onToast,
}) {
  const [query, setQuery] = useState("");
  const [submitted, setSubmitted] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [emptyMessage, setEmptyMessage] = useState("");
  const [pickerFor, setPickerFor] = useState(null);
  const [playlists, setPlaylists] = useState([]);
  const [loadingPlaylists, setLoadingPlaylists] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  // When the user switches providers mid-result-display, clear stale results.
  useEffect(() => {
    setResults([]);
    setSubmitted("");
    setEmptyMessage("");
  }, [provider]);

  async function handleSubmit(e) {
    e.preventDefault();
    const q = query.trim();
    if (!q || loading) return;
    setSubmitted(q);
    setLoading(true);
    setEmptyMessage("");
    setResults([]);
    try {
      const data = provider === "soundcloud" ? await searchSoundCloud(q) : await searchYouTube(q);
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
      onToast?.(r.added === 0 ? `השיר כבר היה ב"${playlist.name}"` : `נוסף ל"${playlist.name}" ✓`);
    } catch (err) {
      onError?.(err);
    } finally {
      setPickerFor(null);
    }
  }

  const providerInfo = PROVIDERS.find((p) => p.id === provider) || PROVIDERS[0];

  return (
    <section className="yt-search" aria-label="חיפוש מוזיקה">
      <div className="provider-toggle" role="tablist" aria-label="בחר מקור">
        {PROVIDERS.map((p) => (
          <button
            key={p.id}
            type="button"
            role="tab"
            aria-selected={provider === p.id}
            className={`provider-btn ${p.color} ${provider === p.id ? "active" : ""}`}
            onClick={() => onProviderChange(p.id)}
          >
            <span className="provider-name">{p.label}</span>
          </button>
        ))}
      </div>

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
            placeholder={
              provider === "soundcloud"
                ? "חפש שיר, אמן או רמיקס ב-SoundCloud…"
                : "חפש שיר, זמר, או אלבום ב-YouTube…"
            }
            maxLength={120}
            aria-label="שאילתת חיפוש מוזיקה"
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
        <strong>{providerInfo.hint}</strong> חיפוש מוגבל ל-20 פעמים ביום (משותף לשני המקורות). כל התוכן מוזרם בהתאם לתנאי השירות של ספקי המוזיקה.
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
          {results.map((r) => (
            <ResultRow
              key={r.id}
              result={r}
              provider={provider}
              inCatalog={isInCatalog(r.id)}
              onPlay={() => (provider === "soundcloud" ? onPlaySc(r) : onPlayYt(r))}
              onAdd={() => (provider === "soundcloud" ? onAddSc(r) : onAddYt(r))}
              onPickPlaylist={() => openPicker(r)}
            />
          ))}
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

function ResultRow({ result, provider, inCatalog, onPlay, onAdd, onPickPlaylist }) {
  const isSc = provider === "soundcloud";
  const thumbUrl = isSc ? result.artworkUrl : result.thumb;
  const externalUrl = isSc ? result.permalinkUrl : `https://www.youtube.com/watch?v=${result.id}`;
  const externalLabel = isSc ? "פתח ב-SoundCloud" : "פתח ב-YouTube";
  const meta = isSc
    ? [result.artist, result.publishedYear && String(result.publishedYear), result.playbackCount && formatViews(result.playbackCount)].filter(Boolean).join(" · ")
    : [result.artist, result.publishedAt, result.viewCount && formatViews(result.viewCount).replace("השמעות", "צפיות")].filter(Boolean).join(" · ");
  const durationLabel = isSc ? formatSeconds(result.durationSeconds) : result.duration;
  return (
    <li className="yt-result">
      <button type="button" className="yt-result-thumb" onClick={onPlay} aria-label={`נגן ${result.title}`}>
        {thumbUrl ? <img src={thumbUrl} alt="" loading="lazy" /> : <div className="yt-thumb-fallback" />}
        {durationLabel && <span className="yt-duration">{durationLabel}</span>}
        <span className="yt-play-overlay" aria-hidden="true">▶</span>
        <span className={`yt-result-srcbadge ${isSc ? "src-sc" : "src-yt"}`}>{isSc ? "SC" : "YT"}</span>
      </button>
      <div className="yt-result-body">
        <h4 className="yt-result-title">{result.title}</h4>
        <p className="yt-result-meta">{meta}</p>
        <div className="yt-result-actions">
          <button type="button" className="btn btn-primary btn-sm" onClick={onPlay}>▶ נגן</button>
          <button
            type="button"
            className={`btn btn-sm ${inCatalog ? "btn-ghost active" : "btn-ghost"}`}
            onClick={onAdd}
            aria-pressed={inCatalog}
          >
            {inCatalog ? "✓ בקטלוג" : "＋ הוסף לקטלוג"}
          </button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={onPickPlaylist}>
            ≡ הוסף לפלייליסט
          </button>
          <a
            className="btn btn-ghost btn-sm yt-external"
            href={externalUrl}
            target="_blank"
            rel="noreferrer"
            aria-label={externalLabel}
            title={externalLabel}
          >↗</a>
        </div>
      </div>
    </li>
  );
}
