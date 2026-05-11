import React from "react";

export default function Header({ totalCount, favoritesCount, view, onChangeView }) {
  const tabs = [
    { id: "library", label: "הספרייה", count: totalCount, icon: "♪" },
    { id: "favorites", label: "מועדפים", count: favoritesCount, icon: "♥" },
    { id: "playlists", label: "פלייליסטים", icon: "≡" },
  ];
  return (
    <header className="site-header" role="banner">
      <div className="brand">
        <span className="brand-mark" aria-hidden="true">
          <svg viewBox="0 0 32 32" width="28" height="28" focusable="false">
            <defs>
              <linearGradient id="bm" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#f472b6" />
                <stop offset="100%" stopColor="#a78bfa" />
              </linearGradient>
            </defs>
            <circle cx="16" cy="16" r="14" fill="url(#bm)" />
            <path d="M21 9v10.2a3.3 3.3 0 1 1-2-3V11.6l-6 1.6v7a3.3 3.3 0 1 1-2-3V11l10-2.7Z" fill="#111827" />
          </svg>
        </span>
        <div className="brand-text">
          <h1>MusicStream</h1>
          <p>שירים מכל הזמנים · עם AI</p>
        </div>
      </div>

      <nav className="header-nav" aria-label="ניווט ראשי">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`pill ${view === t.id ? "active" : ""}`}
            onClick={() => onChangeView(t.id)}
            aria-pressed={view === t.id}
          >
            <span aria-hidden="true">{t.icon}</span> {t.label}
            {typeof t.count === "number" && <span className="pill-count">{t.count}</span>}
          </button>
        ))}
      </nav>
    </header>
  );
}
