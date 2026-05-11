export const ERAS = [
  { value: "all", label: "הכול" },
  { value: "60s-70s", label: "60–70" },
  { value: "80s-90s", label: "80–90" },
  { value: "2000s", label: "2000" },
  { value: "2010s", label: "2010" },
  { value: "new", label: "חדשים" },
];

export const SONGS = [
  // 1960s–1970s
  { id: "fJ9rUzIMcZQ", title: "Bohemian Rhapsody", artist: "Queen", year: 1975, era: "60s-70s", mood: "קלאסיקה" },
  { id: "A_MjCqQoLLA", title: "Hey Jude", artist: "The Beatles", year: 1968, era: "60s-70s", mood: "קלאסיקה" },

  // 1980s–1990s
  { id: "1w7OgIMMRc4", title: "Sweet Child O' Mine", artist: "Guns N' Roses", year: 1987, era: "80s-90s", mood: "רוק" },
  { id: "sOnqjkJTMaA", title: "Thriller", artist: "Michael Jackson", year: 1982, era: "80s-90s", mood: "פופ" },
  { id: "Zi_XLOBDo_Y", title: "Billie Jean", artist: "Michael Jackson", year: 1983, era: "80s-90s", mood: "פופ" },
  { id: "lDK9QqIzhwk", title: "Livin' On A Prayer", artist: "Bon Jovi", year: 1986, era: "80s-90s", mood: "רוק" },
  { id: "4fndeDfaWCg", title: "I Want It That Way", artist: "Backstreet Boys", year: 1999, era: "80s-90s", mood: "פופ" },
  { id: "3JWTaaS7LdU", title: "I Will Always Love You", artist: "Whitney Houston", year: 1992, era: "80s-90s", mood: "בלדה" },

  // 2000s
  { id: "dvgZkm1xWPE", title: "Viva La Vida", artist: "Coldplay", year: 2008, era: "2000s", mood: "פופ־רוק" },
  { id: "eVTXPUF4Oz4", title: "In The End", artist: "Linkin Park", year: 2001, era: "2000s", mood: "רוק חלופי" },
  { id: "_Yhyp-_hX2s", title: "Lose Yourself", artist: "Eminem", year: 2002, era: "2000s", mood: "היפ־הופ" },
  { id: "fLexgOxsZu0", title: "Umbrella", artist: "Rihanna", year: 2007, era: "2000s", mood: "פופ" },

  // 2010s
  { id: "JGwWNGJdvx8", title: "Shape of You", artist: "Ed Sheeran", year: 2017, era: "2010s", mood: "פופ" },
  { id: "kJQP7kiw5Fk", title: "Despacito", artist: "Luis Fonsi & Daddy Yankee", year: 2017, era: "2010s", mood: "לטיני" },
  { id: "CevxZvSJLk8", title: "Roar", artist: "Katy Perry", year: 2013, era: "2010s", mood: "פופ" },
  { id: "uelHwf8o7_U", title: "Love The Way You Lie", artist: "Eminem ft. Rihanna", year: 2010, era: "2010s", mood: "היפ־הופ" },
  { id: "hT_nvWreIhg", title: "Counting Stars", artist: "OneRepublic", year: 2013, era: "2010s", mood: "פופ־רוק" },
  { id: "RgKAFK5djSk", title: "See You Again", artist: "Wiz Khalifa ft. Charlie Puth", year: 2015, era: "2010s", mood: "רגוע" },
  { id: "60ItHLz5WEA", title: "Faded", artist: "Alan Walker", year: 2015, era: "2010s", mood: "אלקטרוני" },

  // New / contemporary
  { id: "4NRXx6U8ABQ", title: "Blinding Lights", artist: "The Weeknd", year: 2019, era: "new", mood: "פופ" },
  { id: "TUVcZfQe-Kw", title: "Levitating", artist: "Dua Lipa", year: 2020, era: "new", mood: "דאנס" },
  { id: "pok8H_KF1FA", title: "Say So", artist: "Doja Cat", year: 2019, era: "new", mood: "פופ" },
  { id: "H5v3kku4y6Q", title: "As It Was", artist: "Harry Styles", year: 2022, era: "new", mood: "פופ" },
  { id: "b1kbLwvqugk", title: "Anti-Hero", artist: "Taylor Swift", year: 2022, era: "new", mood: "פופ" },
  { id: "gNi_6U5Pm_o", title: "Flowers", artist: "Miley Cyrus", year: 2023, era: "new", mood: "פופ" },
];

export const MOODS = [...new Set(SONGS.map((s) => s.mood))].sort((a, b) => a.localeCompare(b, "he"));

export function youtubeEmbed(id, { autoplay = true } = {}) {
  const params = new URLSearchParams({
    rel: "0",
    modestbranding: "1",
    playsinline: "1",
  });
  if (autoplay) params.set("autoplay", "1");
  return `https://www.youtube.com/embed/${id}?${params.toString()}`;
}

export function youtubeThumb(id) {
  return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
}

export function youtubeWatchUrl(id) {
  return `https://www.youtube.com/watch?v=${id}`;
}
