# MusicStream — שירים מכל הזמנים 🎵

אפליקציית React בעברית (RTL) לניגון להיטים דרך נגן YouTube רשמי מוטמע — חוקי, מהיר, נגיש ומלוטש.

> The app is in Hebrew with full RTL support, but the codebase is documented in English so anyone can contribute.

## ✨ תכונות

- 🎬 נגן YouTube רשמי מוטמע (ללא הורדה / אחסון)
- 🗂️ סינון לפי תקופות: 60–70, 80–90, 2000, 2010, חדשים — וגם לפי סגנון
- 🔍 חיפוש חי לפי שם שיר / אמן / סגנון
- ❤️ מועדפים שמורים ב-`localStorage`
- 🔀 מצב ערבוב + 🔁 מצב חזרה
- ⏮ ⏭ 🎲 ניווט בין שירים + נגינה אקראית
- 🖼️ תצוגת רשת או רשימה (נשמרת בין ביקורים)
- ⌨️ קיצורי מקלדת: `←`/`→` ניווט · `R` אקראי · `S` ערבוב · `F` הוסף/הסר מועדף · `/` מיקוד בחיפוש
- ♿ נגישות: skip-link, ARIA live regions, focus-visible, semantic landmarks, `prefers-reduced-motion`
- 📱 רספונסיבי במלוא מובן המילה — מובייל, טאבלט, דסקטופ
- 📲 PWA-ready: manifest + favicon SVG + theme color
- 🎨 עיצוב מודרני: glassmorphism, gradients, micro-interactions, dark theme

## 🚀 הפעלה מקומית

```bash
npm install
npm run dev
```

פתח את הכתובת שמופיעה בטרמינל (בד"כ `http://localhost:5173`).

## 📦 בנייה לפרודקשן

```bash
npm run build
npm run preview
```

קבצי הבנייה ייווצרו בתיקיית `dist/`.

## ☁️ דיפלוי ל-Netlify

הפרויקט כולל `netlify.toml` מוכן לשימוש.

**אופציה 1 — Netlify CLI:**
```bash
npm install -g netlify-cli
netlify deploy --prod
```

**אופציה 2 — דרך GitHub:**
1. דחוף את הריפו ל-GitHub
2. ב-Netlify: New site from Git → בחר את הריפו
3. ההגדרות יזוהו אוטומטית מ-`netlify.toml`

## 🛠️ סטאק טכנולוגי

- **React 18** + **Vite 5** — bundler מהיר וקל
- **CSS ידני** עם CSS variables, container-aware grids ו-RTL native (`inset-inline-*`)
- **localStorage** לשמירת העדפות ומועדפים
- **פונט Heebo** מ-Google Fonts (אופטימלי לעברית)

## 📁 מבנה הפרויקט

```
music_stream_app/
├── index.html                      # SEO meta, OG tags, manifest
├── public/
│   ├── favicon.svg                 # SVG icon (gradient)
│   └── manifest.webmanifest        # PWA manifest
├── src/
│   ├── main.jsx                    # React entry
│   ├── App.jsx                     # Top-level orchestrator
│   ├── style.css                   # Design tokens + all UI styles
│   ├── data/
│   │   └── songs.js                # Catalog, eras, moods, YT helpers
│   ├── hooks/
│   │   ├── useLocalStorage.js      # SSR-safe persistent state
│   │   └── useKeyboardShortcuts.js # Global keyboard handler
│   └── components/
│       ├── Header.jsx              # Brand + library/favorites toggle
│       ├── Player.jsx              # YouTube iframe + transport controls
│       ├── Filters.jsx             # Search, era chips, mood chips, view toggle
│       ├── SongGrid.jsx            # Grid container + empty state
│       ├── SongCard.jsx            # Song card (grid + list view)
│       ├── Toast.jsx               # Transient ARIA-live messages
│       └── Footer.jsx              # Legal note + keyboard hints
└── vite.config.js
```

## 🎵 הוספת שירים

ערוך את המערך `SONGS` ב-`src/data/songs.js`:

```js
{
  id: "VIDEO_ID",      // YouTube video ID (החלק אחרי v=)
  title: "שם השיר",
  artist: "שם האמן",
  year: 1987,          // שנת היציאה
  era: "80s-90s",      // אחד מ: 60s-70s, 80s-90s, 2000s, 2010s, new
  mood: "רוק"          // סגנון חופשי (יופיע אוטומטית בסינון)
}
```

ה-ID נמצא ב-URL: `https://www.youtube.com/watch?v=fJ9rUzIMcZQ` → ה-ID הוא `fJ9rUzIMcZQ`.

## ♿ נגישות

- Skip-link לתוכן הראשי
- ARIA live regions: ספירת תוצאות + הודעות toast
- `aria-pressed` / `aria-selected` על כל הכפתורים והצ'יפים
- `focus-visible` ברור על כל הפקדים
- ניווט מקלדת מלא + קיצורים גלובליים
- כיבוד `prefers-reduced-motion`
- כותרות סמנטיות ו-landmarks (`<header>`, `<main>`, `<footer>`, `role="..."`)

## ⚖️ הערת זכויות יוצרים

האפליקציה **אינה מאחסנת ואינה מפיצה** קבצי מוזיקה. הניגון נעשה דרך נגן YouTube רשמי מוטמע בלבד, בהתאם ל[תנאי השירות של YouTube](https://www.youtube.com/t/terms).

---

נבנה בעברית 💜 RTL · נגיש · רספונסיבי · production-ready.
