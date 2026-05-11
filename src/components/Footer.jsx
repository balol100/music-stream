import React from "react";

export default function Footer() {
  return (
    <footer className="site-footer" role="contentinfo">
      <div className="footer-row">
        <p>
          <strong>הערה חשובה:</strong> האפליקציה לא מאחסנת ולא מורידה שירים. הניגון מתבצע
          דרך נגן YouTube רשמי מוטמע, בהתאם לתנאי השירות של YouTube.
        </p>
        <p className="footer-shortcuts">
          קיצורי מקלדת:
          <kbd>←</kbd>/<kbd>→</kbd> ניווט · <kbd>R</kbd> אקראי · <kbd>S</kbd> ערבוב · <kbd>F</kbd> מועדף · <kbd>/</kbd> חיפוש
        </p>
      </div>
    </footer>
  );
}
