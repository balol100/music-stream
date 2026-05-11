import React, { forwardRef } from "react";
import { ERAS } from "../data/songs.js";

const Filters = forwardRef(function Filters(
  { query, onQueryChange, era, onEraChange, moods, activeMood, onMoodChange, view, onViewChange, resultCount },
  searchRef
) {
  return (
    <section className="controls" aria-label="חיפוש וסינון">
      <div className="search-row">
        <div className="search">
          <span className="search-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="18" height="18" focusable="false"><circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="2"/><path d="m20 20-3.5-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
          </span>
          <input
            ref={searchRef}
            type="search"
            placeholder="חפש שיר, אמן או סגנון…"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            aria-label="חיפוש שיר"
            inputMode="search"
            enterKeyHint="search"
          />
          {query && (
            <button
              type="button"
              className="search-clear"
              onClick={() => onQueryChange("")}
              aria-label="נקה חיפוש"
            >
              ×
            </button>
          )}
        </div>

        <div className="view-toggle" role="group" aria-label="תצוגה">
          <button
            type="button"
            className={view === "grid" ? "active" : ""}
            onClick={() => onViewChange("grid")}
            aria-pressed={view === "grid"}
            aria-label="תצוגת רשת"
            title="תצוגת רשת"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M4 4h7v7H4V4Zm9 0h7v7h-7V4ZM4 13h7v7H4v-7Zm9 0h7v7h-7v-7Z" fill="currentColor"/></svg>
          </button>
          <button
            type="button"
            className={view === "list" ? "active" : ""}
            onClick={() => onViewChange("list")}
            aria-pressed={view === "list"}
            aria-label="תצוגת רשימה"
            title="תצוגת רשימה"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M4 6h16v3H4V6Zm0 5h16v3H4v-3Zm0 5h16v3H4v-3Z" fill="currentColor"/></svg>
          </button>
        </div>
      </div>

      <div className="chips" role="tablist" aria-label="סינון לפי תקופה">
        {ERAS.map((e) => (
          <button
            key={e.value}
            role="tab"
            aria-selected={era === e.value}
            className={`chip ${era === e.value ? "active" : ""}`}
            onClick={() => onEraChange(e.value)}
          >
            {e.label}
          </button>
        ))}
      </div>

      <div className="chips chips-soft" role="group" aria-label="סינון לפי סגנון">
        <button
          type="button"
          className={`chip chip-soft ${!activeMood ? "active" : ""}`}
          onClick={() => onMoodChange(null)}
          aria-pressed={!activeMood}
        >
          כל הסגנונות
        </button>
        {moods.map((m) => (
          <button
            key={m}
            type="button"
            className={`chip chip-soft ${activeMood === m ? "active" : ""}`}
            onClick={() => onMoodChange(activeMood === m ? null : m)}
            aria-pressed={activeMood === m}
          >
            {m}
          </button>
        ))}
      </div>

      <p className="results-count" aria-live="polite">
        נמצאו <strong>{resultCount}</strong> שירים
      </p>
    </section>
  );
});

export default Filters;
