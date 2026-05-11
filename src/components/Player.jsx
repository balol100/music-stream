import React from "react";
import { songEmbed, songSource, songWatchUrl } from "../data/songs.js";

export default function Player({
  song,
  isFavorite,
  isShuffle,
  isRepeat,
  onPrev,
  onNext,
  onRandom,
  onToggleShuffle,
  onToggleRepeat,
  onToggleFavorite,
}) {
  if (!song) return null;
  const source = songSource(song);
  const isSoundCloud = source === "soundcloud";
  return (
    <section className="player-card" aria-label="נגן פעיל">
      <div className={`player-frame ${isSoundCloud ? "player-frame-sc" : ""}`}>
        <iframe
          key={song.id}
          title={`${song.title} — ${song.artist}`}
          src={songEmbed(song)}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          loading="lazy"
        />
      </div>

      <div className="player-info" aria-live="polite">
        <div className="player-titles">
          <h2 className="player-title">{song.title}</h2>
          <p className="player-meta">
            <span>{song.artist}</span>
            {song.year && (
              <>
                <span className="dot" aria-hidden="true">·</span>
                <span>{song.year}</span>
              </>
            )}
            {song.mood && (
              <>
                <span className="dot" aria-hidden="true">·</span>
                <span className="chip-mini">{song.mood}</span>
              </>
            )}
            <span
              className={`source-badge ${isSoundCloud ? "src-sc" : "src-yt"}`}
              title={isSoundCloud ? "מוזרם מ-SoundCloud (ניגון ברקע במובייל)" : "מוזרם מ-YouTube"}
            >
              {isSoundCloud ? "SoundCloud" : "YouTube"}
            </span>
          </p>
        </div>
        <button
          type="button"
          className={`heart ${isFavorite ? "active" : ""}`}
          onClick={onToggleFavorite}
          aria-pressed={isFavorite}
          aria-label={isFavorite ? "הסר ממועדפים" : "הוסף למועדפים"}
          title={isFavorite ? "הסר ממועדפים (F)" : "הוסף למועדפים (F)"}
        >
          <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false">
            <path
              d="M12 21s-7.5-4.7-9.6-9.2C.7 8.2 3 4.5 6.6 4.5c2 0 3.4 1 4.4 2.4 1-1.4 2.4-2.4 4.4-2.4 3.6 0 5.9 3.7 4.2 7.3C19.5 16.3 12 21 12 21Z"
              fill={isFavorite ? "currentColor" : "none"}
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      <div className="player-controls" role="group" aria-label="פקדי ניגון">
        <button type="button" onClick={onPrev} className="icon-btn" aria-label="השיר הקודם" title="הקודם (←)">
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M19 5v14L8 12l11-7Zm-13 0h2v14H6V5Z" fill="currentColor"/></svg>
        </button>
        <button type="button" onClick={onRandom} className="icon-btn primary" aria-label="נגן שיר אקראי" title="אקראי (R)">
          <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M17 3h4v4M21 3 12 12M3 21l9-9M3 7l5 5M21 17v4h-4M17 17l4 4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
        <button type="button" onClick={onNext} className="icon-btn" aria-label="השיר הבא" title="הבא (→)">
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M5 5v14l11-7L5 5Zm13 0h-2v14h2V5Z" fill="currentColor"/></svg>
        </button>

        <span className="control-divider" aria-hidden="true"></span>

        <button
          type="button"
          onClick={onToggleShuffle}
          className={`icon-btn ${isShuffle ? "active" : ""}`}
          aria-pressed={isShuffle}
          aria-label="ערבוב"
          title="ערבוב (S)"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M16 3h5v5M4 20l17-17M4 4l5 5M21 16v5h-5M14 14l7 7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
        <button
          type="button"
          onClick={onToggleRepeat}
          className={`icon-btn ${isRepeat ? "active" : ""}`}
          aria-pressed={isRepeat}
          aria-label="חזור"
          title="חזור"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M17 2l4 4-4 4M7 22l-4-4 4-4M21 6H9a6 6 0 0 0-6 6M3 18h12a6 6 0 0 0 6-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>

        {songWatchUrl(song) && (
          <a
            href={songWatchUrl(song)}
            target="_blank"
            rel="noreferrer"
            className="icon-btn"
            aria-label={isSoundCloud ? "פתח ב-SoundCloud" : "פתח ב-YouTube"}
            title={isSoundCloud ? "פתח ב-SoundCloud" : "פתח ב-YouTube"}
          >
            <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M14 3h7v7M10 14 21 3M19 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </a>
        )}
      </div>

      {isSoundCloud && (
        <p className="sc-bg-hint" role="note">
          ✓ SoundCloud ממשיך לנגן ברקע במובייל גם כשהמסך נעול
        </p>
      )}
    </section>
  );
}
