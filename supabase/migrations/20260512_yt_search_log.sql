-- Rate-limit log for the youtube-search edge function (20/day per IP)
CREATE TABLE IF NOT EXISTS public.yt_search_log (
  id         BIGSERIAL PRIMARY KEY,
  ip         TEXT NOT NULL,
  query      TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS yt_search_log_ip_time_idx ON public.yt_search_log (ip, created_at DESC);
