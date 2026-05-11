import React from "react";
import { youtubeThumb } from "../data/songs.js";

export default function AIPlaylistCard({ playlist, songs, currentId, onPlayAll, onPlayOne, onSave, onDismiss, saved }) {
  if (!playlist) return null;
  const songMap = new Map(songs.map((s) => [s.id, s]));
  const items = (playlist.songs ?? [])
    .map((entry) => ({ song: songMap.get(entry.id), reason: entry.reason }))
    .filter((x) => x.song);

  if (items.length === 0) return null;

  return (
    <section className="ai-playlist" aria-label="פלייליסט שנוצר על-ידי AI">
      <div className="ai-playlist-head">
        <div className="ai-playlist-title-block">
          <span className="ai-badge">
            <span aria-hidden="true">✨</span> AI · {playlist.presetEmoji} {playlist.presetLabel}
          </span>
          <h2 className="ai-playlist-name">{playlist.playlistName}</h2>
          {playlist.description && <p className="ai-playlist-desc">{playlist.description}</p>}
        </div>
        <div className="ai-playlist-actions">
          <button type="button" className="btn btn-primary" onClick={onPlayAll}>
            <span aria-hidden="true">▶</span> נגן הכל
          </button>
          {!saved ? (
            <button type="button" className="btn btn-ghost" onClick={onSave}>
              <span aria-hidden="true">💾</span> שמור פלייליסט
            </button>
          ) : (
            <span className="ai-saved-tag">נשמר ✓</span>
          )}
          <button type="button" className="icon-btn" onClick={onDismiss} aria-label="סגור פלייליסט AI" title="סגור">
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
          </button>
        </div>
      </div>

      <ol className="ai-playlist-list">
        {items.map(({ song, reason }, idx) => (
          <li
            key={song.id}
            className={`ai-playlist-item ${currentId === song.id ? "is-active" : ""}`}
          >
            <button
              type="button"
              className="ai-playlist-item-btn"
              onClick={() => onPlayOne(song)}
              aria-label={`נגן ${song.title} של ${song.artist}`}
            >
              <span className="ai-playlist-index" aria-hidden="true">{idx + 1}</span>
              <img src={youtubeThumb(song.id)} alt="" loading="lazy" />
              <span className="ai-playlist-text">
                <span className="ai-playlist-song">{song.title}</span>
                <span className="ai-playlist-artist">{song.artist}</span>
                {reason && <span className="ai-playlist-reason">{reason}</span>}
              </span>
              <span className="ai-playlist-play" aria-hidden="true">▶</span>
            </button>
          </li>
        ))}
      </ol>
    </section>
  );
}
