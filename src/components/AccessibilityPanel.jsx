import React, { useCallback, useEffect, useState } from "react";
import { useLocalStorage } from "../hooks/useLocalStorage.js";

const FONT_SCALES = [
  { value: 0.9,  label: "א" },
  { value: 1,    label: "א" },
  { value: 1.15, label: "א" },
  { value: 1.3,  label: "א" },
];

const DEFAULT_PREFS = {
  fontScale: 1,
  highContrast: false,
  grayscale: false,
  reduceMotion: false,
  underlineLinks: false,
};

function applyPrefs(prefs) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.style.fontSize = `${Math.round(prefs.fontScale * 100)}%`;
  root.classList.toggle("a11y-high-contrast", !!prefs.highContrast);
  root.classList.toggle("a11y-grayscale", !!prefs.grayscale);
  root.classList.toggle("a11y-reduce-motion", !!prefs.reduceMotion);
  root.classList.toggle("a11y-underline-links", !!prefs.underlineLinks);
}

export default function AccessibilityPanel({ onOpenDeclaration }) {
  const [prefs, setPrefs] = useLocalStorage("musicstream:a11y-prefs", DEFAULT_PREFS);
  const [open, setOpen] = useState(false);
  // sessionStorage so dismissing only hides the FAB for the current tab session
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.sessionStorage.getItem("musicstream:a11y-dismissed") === "1";
  });

  // Apply once on mount, and after every change
  useEffect(() => { applyPrefs(prefs); }, [prefs]);

  // ESC closes the panel
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const update = useCallback((patch) => setPrefs((p) => ({ ...p, ...patch })), [setPrefs]);

  const reset = useCallback(() => {
    setPrefs(DEFAULT_PREFS);
    applyPrefs(DEFAULT_PREFS);
  }, [setPrefs]);

  const dismissFab = useCallback(() => {
    setDismissed(true);
    try { window.sessionStorage.setItem("musicstream:a11y-dismissed", "1"); } catch { /* ignore */ }
    setOpen(false);
  }, []);

  if (dismissed && !open) return null;

  return (
    <>
      {!dismissed && (
        <div className="a11y-fab-wrap">
          <button
            type="button"
            className="a11y-fab"
            onClick={() => setOpen(true)}
            aria-label="פתח את תפריט הנגישות"
            title="נגישות"
          >
            <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false">
              <circle cx="12" cy="4.5" r="2" fill="currentColor"/>
              <path d="M5 8h14M9 8v3M15 8v3M9 11l-2 9M9 11h6M15 11l2 9" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <button
            type="button"
            className="a11y-fab-close"
            onClick={dismissFab}
            aria-label="הסתר את כפתור הנגישות עד לטעינה הבאה"
            title="הסתר עד הטעינה הבאה"
          >×</button>
        </div>
      )}

      {open && (
        <div
          className="modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="a11y-title"
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          <div className="modal-card a11y-card">
            <header className="modal-head">
              <h2 id="a11y-title">תפריט נגישות</h2>
              <button type="button" className="icon-btn" onClick={() => setOpen(false)} aria-label="סגור">
                <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
              </button>
            </header>

            <div className="modal-body">
              <div className="a11y-section">
                <h3>גודל גופן</h3>
                <div className="a11y-font-row" role="group" aria-label="גודל גופן">
                  {FONT_SCALES.map((scale, i) => (
                    <button
                      key={i}
                      type="button"
                      className={`a11y-font-btn ${Math.abs(prefs.fontScale - scale.value) < 0.01 ? "active" : ""}`}
                      style={{ fontSize: `${Math.round(scale.value * 100)}%` }}
                      onClick={() => update({ fontScale: scale.value })}
                      aria-pressed={Math.abs(prefs.fontScale - scale.value) < 0.01}
                    >
                      {scale.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="a11y-section">
                <h3>תצוגה</h3>
                <ul className="a11y-toggles">
                  <li>
                    <label>
                      <input
                        type="checkbox"
                        checked={prefs.highContrast}
                        onChange={(e) => update({ highContrast: e.target.checked })}
                      />
                      <span>ניגודיות גבוהה</span>
                    </label>
                  </li>
                  <li>
                    <label>
                      <input
                        type="checkbox"
                        checked={prefs.grayscale}
                        onChange={(e) => update({ grayscale: e.target.checked })}
                      />
                      <span>גווני אפור</span>
                    </label>
                  </li>
                  <li>
                    <label>
                      <input
                        type="checkbox"
                        checked={prefs.reduceMotion}
                        onChange={(e) => update({ reduceMotion: e.target.checked })}
                      />
                      <span>הפחת אנימציות</span>
                    </label>
                  </li>
                  <li>
                    <label>
                      <input
                        type="checkbox"
                        checked={prefs.underlineLinks}
                        onChange={(e) => update({ underlineLinks: e.target.checked })}
                      />
                      <span>קווים תחת קישורים</span>
                    </label>
                  </li>
                </ul>
              </div>

              <div className="a11y-section a11y-row">
                <button type="button" className="btn btn-ghost" onClick={reset}>
                  אפס הכול
                </button>
                <button type="button" className="btn btn-ghost" onClick={() => { setOpen(false); onOpenDeclaration?.(); }}>
                  הצהרת נגישות מלאה
                </button>
              </div>

              <p className="a11y-foot">
                האפליקציה תואמת לתקן ישראלי 5568 (WCAG 2.1 AA). בעלת ההצהרה: <strong>ליאור בלול</strong>.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
