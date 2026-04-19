-- ============================================================
-- 010: Persistent rate limiting + drop rollback_scan
-- ============================================================

-- 1. Rate limit table (no RLS — accessed only via SECURITY DEFINER RPC)
CREATE TABLE IF NOT EXISTS public.rate_limit_entries (
  key         TEXT        NOT NULL,
  window_start TIMESTAMPTZ NOT NULL,
  hit_count   INT         NOT NULL DEFAULT 1,
  PRIMARY KEY (key, window_start)
);

ALTER TABLE public.rate_limit_entries ENABLE ROW LEVEL SECURITY;
-- No policies = nobody can access directly via PostgREST

-- 2. Atomic rate-limit check RPC
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_key          TEXT,
  p_window_seconds INT,
  p_max_requests   INT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_window_start TIMESTAMPTZ;
  v_count INT;
BEGIN
  -- Truncate current time to window boundary
  v_window_start := to_timestamp(
    floor(extract(epoch FROM now()) / p_window_seconds) * p_window_seconds
  );

  -- Upsert: increment hit count for this window
  INSERT INTO public.rate_limit_entries (key, window_start, hit_count)
  VALUES (p_key, v_window_start, 1)
  ON CONFLICT (key, window_start)
  DO UPDATE SET hit_count = public.rate_limit_entries.hit_count + 1
  RETURNING hit_count INTO v_count;

  -- Opportunistic cleanup: delete entries older than 2x window
  DELETE FROM public.rate_limit_entries
  WHERE key = p_key
    AND window_start < (now() - make_interval(secs => p_window_seconds * 2));

  RETURN v_count <= p_max_requests;
END;
$$;

-- Only callable by service_role (admin client), not by authenticated users
REVOKE ALL ON FUNCTION public.check_rate_limit(TEXT, INT, INT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.check_rate_limit(TEXT, INT, INT) FROM authenticated;

-- 3. Drop the rollback_scan RPC — no longer needed
DROP FUNCTION IF EXISTS public.rollback_scan(TEXT, TEXT);
