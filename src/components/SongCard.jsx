import React, { useState } from "react";
import { youtubeThumb } from "../data/songs.js";

export default function SongCard({ song, isActive, isFavorite, onSelect, onToggleFavorite, view }) {
  const [imgFailed, setImgFailed] = useState(false);

  function handleKeyDown(e) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onSelect();
    }
  }

  return (
    <article
      className={`song ${isActive ? "is-active" : ""} ${view === "list" ? "song-list" : ""}`}
      onClick={onSelect}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-pressed={isActive}
      aria-label={`נגן ${song.title} של ${song.artist}`}
    >
      <div className="song-thumb">
        {!imgFailed ? (
          <img
            src={youtubeThumb(song.id)}
            alt=""
            loading="lazy"
            decoding="async"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <div className="song-thumb-fallback" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="36" height="36"><path d="M9 18V6l10-2v12M9 18a3 3 0 1 1-3-3 3 3 0 0 1 3 3Zm10-2a3 3 0 1 1-3-3 3 3 0 0 1 3 3Z" fill="none" stroke="currentColor" strokeWidth="1.5"/></svg>
          </div>
        )}
        {isActive && (
          <span className="now-playing" aria-hidden="true">
            <span></span><span></span><span></span>
          </span>
        )}
      </div>
      <div className="song-body">
        <h3 className="song-title">{song.title}</h3>
        <p className="song-artist">{song.artist}</p>
        <div className="song-meta">
          <span className="badge">{song.year}</span>
          <span className="badge badge-soft">{song.mood}</span>
        </div>
      </div>
      <button
        type="button"
        className={`song-heart ${isFavorite ? "active" : ""}`}
        onClick={(e) => {
          e.stopPropagation();
          onToggleFavorite();
        }}
        aria-pressed={isFavorite}
        aria-label={isFavorite ? `הסר את ${song.title} ממועדפים` : `הוסף את ${song.title} למועדפים`}
      >
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
          <path
            d="M12 21s-7.5-4.7-9.6-9.2C.7 8.2 3 4.5 6.6 4.5c2 0 3.4 1 4.4 2.4 1-1.4 2.4-2.4 4.4-2.4 3.6 0 5.9 3.7 4.2 7.3C19.5 16.3 12 21 12 21Z"
            fill={isFavorite ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </article>
  );
}
