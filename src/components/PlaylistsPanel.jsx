import React, { useCallback, useEffect, useMemo, useState } from "react";
import { listMyPlaylists, listPopularPlaylists, deletePlaylist, setPlaylistPublic, savePlaylist } from "../lib/api.js";
import { DEVICE_ID } from "../lib/supabase.js";

export default function PlaylistsPanel({ songs, selectedSongIds, onPlayPlaylist, onClearSelection, onError, refreshSignal, onSaved }) {
  const [tab, setTab] = useState("mine"); // mine | popular | create
  const [mine, setMine] = useState([]);
  const [popular, setPopular] = useState([]);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [makePublic, setMakePublic] = useState(false);
  const [creating, setCreating] = useState(false);

  const songMap = useMemo(() => new Map(songs.map((s) => [s.id, s])), [songs]);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [m, p] = await Promise.all([listMyPlaylists(), listPopularPlaylists()]);
      setMine(m);
      setPopular(p);
    } catch (err) {
      onError?.(err);
    } finally {
      setLoading(false);
    }
  }, [onError]);

  useEffect(() => { refresh(); }, [refresh, refreshSignal]);

  async function handleCreate(e) {
    e.preventDefault();
    if (!name.trim() || selectedSongIds.length === 0 || creating) return;
    setCreating(true);
    try {
      const created = await savePlaylist({
        name: name.trim(),
        isPublic: makePublic,
        songIds: selectedSongIds.map((id) => ({ id })),
      });
      setName("");
      setMakePublic(false);
      onClearSelection();
      onSaved?.(created);
      setTab("mine");
      await refresh();
    } catch (err) {
      onError?.(err);
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm("למחוק את הפלייליסט?")) return;
    try {
      await deletePlaylist(id);
      await refresh();
    } catch (err) {
      onError?.(err);
    }
  }

  async function togglePublic(p) {
    try {
      await setPlaylistPublic(p.id, !p.is_public);
      await refresh();
    } catch (err) {
      onError?.(err);
    }
  }

  function play(p) {
    const ids = (p.songs ?? []).map((x) => x.id).filter(Boolean);
    const queue = ids.map((id) => songMap.get(id)).filter(Boolean);
    if (queue.length === 0) {
      onError?.(new Error("הפלייליסט ריק או מכיל שירים שלא נמצאים בקטלוג."));
      return;
    }
    onPlayPlaylist(p, queue);
  }

  return (
    <section className="playlists-panel" aria-label="פלייליסטים">
      <div className="playlists-tabs" role="tablist">
        <button role="tab" aria-selected={tab === "mine"} className={tab === "mine" ? "active" : ""} onClick={() => setTab("mine")}>
          הפלייליסטים שלי <span className="count">{mine.length}</span>
        </button>
        <button role="tab" aria-selected={tab === "popular"} className={tab === "popular" ? "active" : ""} onClick={() => setTab("popular")}>
          פופולריים <span className="count">{popular.length}</span>
        </button>
        <button role="tab" aria-selected={tab === "create"} className={tab === "create" ? "active" : ""} onClick={() => setTab("create")}>
          צור פלייליסט
        </button>
      </div>

      {loading && <p className="playlists-loading">טוען…</p>}

      {tab === "mine" && !loading && (
        <PlaylistList
          items={mine}
          songMap={songMap}
          emptyMessage="עוד לא יצרת פלייליסטים. עבור לטאב 'צור פלייליסט' כדי להתחיל."
          onPlay={play}
          onDelete={handleDelete}
          onTogglePublic={togglePublic}
          owned
        />
      )}

      {tab === "popular" && !loading && (
        <PlaylistList
          items={popular}
          songMap={songMap}
          emptyMessage="עוד אין פלייליסטים ציבוריים. צור אחד והפוך אותו לציבורי!"
          onPlay={play}
        />
      )}

      {tab === "create" && (
        <form className="playlist-create" onSubmit={handleCreate}>
          <label htmlFor="pl-name">שם הפלייליסט</label>
          <input
            id="pl-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="למשל: ערב שישי"
            maxLength={60}
          />
          <p className="playlist-create-info">
            נבחרו <strong>{selectedSongIds.length}</strong> שירים. כדי להוסיף או להסיר, לחץ על אייקון <span aria-hidden="true">＋</span> בכרטיסי השירים בספרייה.
          </p>
          <label className="playlist-public-toggle">
            <input type="checkbox" checked={makePublic} onChange={(e) => setMakePublic(e.target.checked)} />
            <span>שתף ציבורית — יופיע ב"פופולריים"</span>
          </label>
          <button type="submit" className="btn btn-primary" disabled={!name.trim() || selectedSongIds.length === 0 || creating}>
            {creating ? "שומר…" : "שמור פלייליסט"}
          </button>
        </form>
      )}
    </section>
  );
}

function PlaylistList({ items, songMap, emptyMessage, onPlay, onDelete, onTogglePublic, owned = false }) {
  if (items.length === 0) {
    return <p className="playlists-empty">{emptyMessage}</p>;
  }
  return (
    <ul className="playlist-list">
      {items.map((p) => {
        const songCount = (p.songs ?? []).length;
        const previewTitles = (p.songs ?? [])
          .slice(0, 3)
          .map((x) => songMap.get(x.id)?.title)
          .filter(Boolean)
          .join(" · ");
        return (
          <li key={p.id} className="playlist-row">
            <div className="playlist-row-main">
              <h4>
                {p.is_ai_generated && <span className="playlist-ai-tag" aria-hidden="true">✨ AI</span>}
                {p.name}
              </h4>
              {p.description && <p className="playlist-desc">{p.description}</p>}
              <p className="playlist-summary">
                {songCount} שירים{previewTitles ? ` · ${previewTitles}${songCount > 3 ? "…" : ""}` : ""}
              </p>
              {p.play_count > 0 && <p className="playlist-plays">▶ {p.play_count} השמעות</p>}
            </div>
            <div className="playlist-row-actions">
              <button type="button" className="btn btn-primary btn-sm" onClick={() => onPlay(p)}>נגן</button>
              {owned && (
                <>
                  <button
                    type="button"
                    className={`btn btn-sm ${p.is_public ? "btn-ghost active" : "btn-ghost"}`}
                    onClick={() => onTogglePublic(p)}
                    aria-pressed={p.is_public}
                    title={p.is_public ? "פלייליסט ציבורי" : "פלייליסט פרטי"}
                  >
                    {p.is_public ? "🌐 ציבורי" : "🔒 פרטי"}
                  </button>
                  <button type="button" className="btn btn-sm btn-danger" onClick={() => onDelete(p.id)} aria-label={`מחק את ${p.name}`}>
                    מחק
                  </button>
                </>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
