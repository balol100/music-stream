-- Music streaming app — playlists + mood-AI rate limit log.

CREATE TABLE IF NOT EXISTS public.music_playlists (
  id              UUID         DEFAULT gen_random_uuid() PRIMARY KEY,
  name            TEXT         NOT NULL,
  description     TEXT,
  mood            TEXT,
  is_ai_generated BOOLEAN      DEFAULT false,
  is_public       BOOLEAN      DEFAULT false,
  created_by      TEXT,                       -- anonymous device id from localStorage
  songs           JSONB        DEFAULT '[]'::jsonb,
  play_count      INT          DEFAULT 0,
  created_at      TIMESTAMPTZ  DEFAULT now()
);

CREATE INDEX IF NOT EXISTS music_playlists_created_by_idx ON public.music_playlists (created_by);
CREATE INDEX IF NOT EXISTS music_playlists_is_public_idx  ON public.music_playlists (is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS music_playlists_play_count_idx ON public.music_playlists (play_count DESC) WHERE is_public = true;

ALTER TABLE public.music_playlists ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_music_playlists" ON public.music_playlists;
CREATE POLICY "anon_music_playlists" ON public.music_playlists FOR ALL TO anon USING (true) WITH CHECK (true);

-- Rate-limit log for the music-mood edge function (5/day per IP)
CREATE TABLE IF NOT EXISTS public.music_mood_log (
  id            BIGSERIAL PRIMARY KEY,
  ip            TEXT NOT NULL,
  mood          TEXT,
  custom_prompt TEXT,
  created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS music_mood_log_ip_time_idx ON public.music_mood_log (ip, created_at DESC);
