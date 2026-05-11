import React, { useEffect, useRef } from "react";

const CONTENT = {
  terms: {
    title: "תנאי שימוש",
    body: (
      <>
        <p>
          השירות מבוסס על הטמעת נגני YouTube (YouTube Embedded Player) בהתאם
          ל<a href="https://www.youtube.com/t/terms" target="_blank" rel="noreferrer">תנאי השירות של YouTube</a>.
          כל השירים מוזרמים ישירות מ-YouTube ואינם מאוחסנים בשרתים שלנו.
        </p>
        <p>
          האפליקציה מספקת ממשק חיפוש וגילוי בלבד. אין כאן הורדה, אחסון, או הפצה של תוכן מוגן.
          הזכויות על כל שיר שייכות ליוצרים, אמנים וחברות תקליטים. אם אתה בעל זכויות וברצונך
          להסיר תוכן, פנה ישירות ל-YouTube.
        </p>
        <p>
          האפליקציה ניתנת "כפי שהיא", ללא אחריות. אין אנו אחראים לזמינות שירותי
          YouTube, מהירותם, או לכל נזק שייגרם מהשימוש.
        </p>
        <p>
          השימוש בפיצ'ר ה-AI (Mood AI) כפוף בנוסף לתנאי השימוש של Anthropic Claude.
          האפליקציה לא שומרת את שאילתות המשתמש מעבר ללוג הקצר הנדרש למניעת ניצול לרעה.
        </p>
      </>
    ),
  },
  privacy: {
    title: "מדיניות פרטיות",
    body: (
      <>
        <p>
          <strong>אנחנו לא אוספים נתוני האזנה.</strong> YouTube עצמה עשויה לאסוף נתונים לפי מדיניות
          הפרטיות שלה — קרא את <a href="https://policies.google.com/privacy" target="_blank" rel="noreferrer">מדיניות הפרטיות של Google</a>.
        </p>
        <p>
          מה אנחנו כן שומרים:
        </p>
        <ul>
          <li>מועדפים, פלייליסטים מקומיים, העדפות תצוגה — ב-<code>localStorage</code> בדפדפן שלך בלבד.</li>
          <li>מזהה מכשיר אנונימי (UUID אקראי) שנוצר בדפדפן ומשמש להפרדה בין משתמשים — לא מקושר לזהות אישית.</li>
          <li>פלייליסטים שיצרת ב-Supabase, אם בחרת לשמור אותם. ניתן למחוק בכל עת.</li>
          <li>לוג קצר של בקשות Mood-AI ו-YouTube-Search לפי כתובת IP — לצורך הגבלת קצב בלבד (5/20 ביום).</li>
        </ul>
        <p>
          אין שיתוף עם צד שלישי מעבר ל-YouTube, Supabase ו-Anthropic Claude (ספקי תשתית בלבד).
          אין שימוש בעוגיות מעקב, אין פרסום, אין אנליטיקס חיצוני.
        </p>
      </>
    ),
  },
  accessibility: {
    title: "הצהרת נגישות",
    body: (
      <>
        <p>
          האפליקציה פותחה בהתאם <strong>לתקן הישראלי 5568</strong>
          (WCAG 2.1 ברמה AA), בהתאם לתקנות שוויון זכויות לאנשים עם
          מוגבלות (התאמות נגישות לשירות), התשע"ג–2013.
        </p>
        <p>
          התאמות נגישות שזמינות באפליקציה:
        </p>
        <ul>
          <li>שינוי גודל גופן (קטן · רגיל · גדול · גדול מאוד)</li>
          <li>ניגודיות גבוהה</li>
          <li>גווני אפור (Grayscale)</li>
          <li>הפחתת אנימציות (Reduce Motion)</li>
          <li>קישור "דלג לתוכן" (Skip-link) בראש הדף</li>
          <li>ניווט מקלדת מלא + תיאורי ARIA</li>
          <li>תאימות לקוראי מסך (Screen readers)</li>
          <li>כיבוד הגדרת <code>prefers-reduced-motion</code> של המערכת</li>
        </ul>
        <p>
          ניתן לפתוח את פאנל הנגישות בלחיצה על כפתור ♿ הצף בפינת המסך.
        </p>
        <p>
          <strong>מי אנחנו:</strong>
          <br />
          האפליקציה והצהרת הנגישות הזו בבעלות <strong>ליאור בלול</strong>
          (lior_Ai). למשוב בנושאי נגישות יש לפנות בכתב לאתר
          <a href="https://lior-ai.com" target="_blank" rel="noreferrer"> lior-ai.com</a>.
        </p>
        <p>
          ההצהרה עודכנה לאחרונה: מאי 2026.
        </p>
      </>
    ),
  },
  attribution: {
    title: "ייחוס וקרדיטים",
    body: (
      <>
        <p>
          <strong>🎵 כל התוכן מוזרם ישירות מ-YouTube.</strong> הזכויות שייכות ליוצרים
          ולחברות התקליטים. אנחנו לא מאחסנים, מורידים, או מפיצים תוכן מוגן.
        </p>
        <p>
          האפליקציה משתמשת ב:
        </p>
        <ul>
          <li><a href="https://developers.google.com/youtube/iframe_api_reference" target="_blank" rel="noreferrer">YouTube Embedded Player</a> — ניגון השירים</li>
          <li><a href="https://www.anthropic.com/" target="_blank" rel="noreferrer">Anthropic Claude</a> — בחירת פלייליסטים לפי מצב רוח</li>
          <li><a href="https://supabase.com/" target="_blank" rel="noreferrer">Supabase</a> — שמירת פלייליסטים</li>
          <li>פונט <a href="https://fonts.google.com/specimen/Heebo" target="_blank" rel="noreferrer">Heebo</a> מ-Google Fonts</li>
        </ul>
        <p>פותח על-ידי <strong>ליאור בלול</strong> · <a href="https://lior-ai.com" target="_blank" rel="noreferrer">lior-ai.com</a> · 💜 RTL · נגיש · open-source</p>
      </>
    ),
  },
};

export default function LegalModal({ kind, onClose }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!kind) return undefined;
    function onKey(e) { if (e.key === "Escape") onClose(); }
    document.addEventListener("keydown", onKey);
    // basic focus trap: focus the modal container
    setTimeout(() => ref.current?.focus(), 30);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [kind, onClose]);

  if (!kind) return null;
  const content = CONTENT[kind];
  if (!content) return null;

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="legal-modal-title"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="modal-card" ref={ref} tabIndex={-1}>
        <header className="modal-head">
          <h2 id="legal-modal-title">{content.title}</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="סגור">
            <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
          </button>
        </header>
        <div className="modal-body">{content.body}</div>
      </div>
    </div>
  );
}
