import React, { useState } from "react";
import { MOOD_PRESETS } from "../data/songs.js";
import { generateMoodPlaylist } from "../lib/api.js";

export default function MoodAI({ catalog, onPlaylistGenerated, onError }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [customPrompt, setCustomPrompt] = useState("");
  const [activeId, setActiveId] = useState(null);

  async function pickPreset(preset) {
    if (loading) return;
    setActiveId(preset.id);
    setLoading(true);
    try {
      const lean = catalog.map(({ id, title, artist, mood, era, year }) => ({ id, title, artist, mood, era, year }));
      const result = await generateMoodPlaylist({
        mood: preset.prompt,
        songs: lean,
      });
      onPlaylistGenerated({ ...result, presetLabel: preset.label, presetEmoji: preset.emoji });
      setOpen(false);
    } catch (err) {
      onError?.(err);
    } finally {
      setLoading(false);
      setActiveId(null);
    }
  }

  async function submitCustom(e) {
    e.preventDefault();
    const txt = customPrompt.trim();
    if (!txt || loading) return;
    setLoading(true);
    setActiveId("custom");
    try {
      const lean = catalog.map(({ id, title, artist, mood, era, year }) => ({ id, title, artist, mood, era, year }));
      const result = await generateMoodPlaylist({ prompt: txt, songs: lean });
      onPlaylistGenerated({ ...result, presetLabel: txt, presetEmoji: "✨" });
      setCustomPrompt("");
      setOpen(false);
    } catch (err) {
      onError?.(err);
    } finally {
      setLoading(false);
      setActiveId(null);
    }
  }

  return (
    <section className="mood-ai" aria-label="פלייליסט לפי מצב רוח">
      <button
        type="button"
        className={`mood-trigger ${open ? "is-open" : ""}`}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="mood-panel"
      >
        <span className="mood-trigger-emoji" aria-hidden="true">🎭</span>
        <span className="mood-trigger-text">
          <strong>מצב רוח — תן ל-AI לבחור לך</strong>
          <span>פלייליסט מותאם אישית בלחיצה אחת</span>
        </span>
        <span className={`mood-trigger-caret ${open ? "open" : ""}`} aria-hidden="true">▾</span>
      </button>

      {open && (
        <div id="mood-panel" className="mood-panel" role="region" aria-label="בחירת מצב רוח">
          <div className="mood-grid">
            {MOOD_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                className={`mood-card ${activeId === preset.id ? "loading" : ""}`}
                onClick={() => pickPreset(preset)}
                disabled={loading}
                aria-busy={activeId === preset.id}
              >
                <span className="mood-card-emoji" aria-hidden="true">{preset.emoji}</span>
                <span className="mood-card-label">{preset.label}</span>
                {activeId === preset.id && <span className="mood-card-spinner" aria-hidden="true" />}
              </button>
            ))}
          </div>

          <form className="mood-custom" onSubmit={submitCustom}>
            <label htmlFor="mood-prompt" className="mood-custom-label">
              או תאר בעצמך:
            </label>
            <div className="mood-custom-row">
              <input
                id="mood-prompt"
                type="text"
                placeholder="תן לי מוזיקה ל…"
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                disabled={loading}
                maxLength={240}
                autoComplete="off"
              />
              <button type="submit" className="btn btn-primary" disabled={loading || !customPrompt.trim()}>
                {activeId === "custom" ? "מחפש…" : "צור פלייליסט ✨"}
              </button>
            </div>
            <p className="mood-hint">מוגבל ל-5 בקשות AI ביום. הפלייליסט נוצר על-ידי Claude Haiku מתוך הקטלוג שלך.</p>
          </form>
        </div>
      )}
    </section>
  );
}
