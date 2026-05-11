import React from "react";
import SongCard from "./SongCard.jsx";

export default function SongGrid({ songs, currentId, favorites, onSelect, onToggleFavorite, view, emptyMessage }) {
  if (songs.length === 0) {
    return (
      <section className="empty" aria-live="polite">
        <div className="empty-illustration" aria-hidden="true">
          <svg viewBox="0 0 64 64" width="56" height="56"><circle cx="32" cy="32" r="30" fill="none" stroke="currentColor" strokeWidth="2" opacity=".25"/><path d="M22 42V22l24-5v22M22 42a5 5 0 1 1-5-5 5 5 0 0 1 5 5Zm24-4a5 5 0 1 1-5-5 5 5 0 0 1 5 5Z" fill="none" stroke="currentColor" strokeWidth="2"/></svg>
        </div>
        <p>{emptyMessage}</p>
      </section>
    );
  }

  return (
    <section
      className={`song-grid ${view === "list" ? "song-grid-list" : ""}`}
      aria-label="רשימת שירים"
    >
      {songs.map((song) => (
        <SongCard
          key={song.id}
          song={song}
          isActive={song.id === currentId}
          isFavorite={favorites.includes(song.id)}
          onSelect={() => onSelect(song)}
          onToggleFavorite={() => onToggleFavorite(song.id)}
          view={view}
        />
      ))}
    </section>
  );
}
