import React from "react";

export default function Footer({ onOpenLegal }) {
  return (
    <footer className="site-footer" role="contentinfo">
      <div className="attribution">
        <p className="attribution-line">
          🎵 <strong>כל התוכן מוזרם ישירות מ-YouTube.</strong> הזכויות שייכות
          ליוצרים ולחברות התקליטים. אנחנו לא מאחסנים, מורידים, או מפיצים
          תוכן מוגן.
        </p>
        <p className="attribution-powered">
          Powered by
          <span className="yt-badge" aria-label="YouTube">
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
              <path d="M23 7.2a3 3 0 0 0-2.1-2.1C19 4.6 12 4.6 12 4.6s-7 0-8.9.5A3 3 0 0 0 1 7.2 31 31 0 0 0 .5 12 31 31 0 0 0 1 16.8a3 3 0 0 0 2.1 2.1c1.9.5 8.9.5 8.9.5s7 0 8.9-.5a3 3 0 0 0 2.1-2.1 31 31 0 0 0 .5-4.8 31 31 0 0 0-.5-4.8Z" fill="#ff0000"/>
              <path d="M9.8 15.4 15.6 12 9.8 8.6Z" fill="#fff"/>
            </svg>
            YouTube
          </span>
        </p>
      </div>

      <div className="footer-row">
        <p className="footer-shortcuts">
          קיצורי מקלדת:
          <kbd>←</kbd>/<kbd>→</kbd> ניווט · <kbd>R</kbd> אקראי · <kbd>S</kbd> ערבוב · <kbd>F</kbd> מועדף · <kbd>/</kbd> חיפוש
        </p>
        <nav className="footer-legal" aria-label="קישורים משפטיים">
          <button type="button" onClick={() => onOpenLegal("terms")}>תנאי שימוש</button>
          <span aria-hidden="true">·</span>
          <button type="button" onClick={() => onOpenLegal("privacy")}>פרטיות</button>
          <span aria-hidden="true">·</span>
          <button type="button" onClick={() => onOpenLegal("accessibility")}>נגישות</button>
          <span aria-hidden="true">·</span>
          <button type="button" onClick={() => onOpenLegal("attribution")}>ייחוס</button>
        </nav>
      </div>
    </footer>
  );
}
