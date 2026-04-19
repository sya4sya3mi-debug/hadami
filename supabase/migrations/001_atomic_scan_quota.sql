-- Atomic scan quota: check + increment in one operation to prevent race conditions.
-- Apply this migration via Supabase Dashboard SQL Editor or supabase CLI.
--
-- Prerequisites:
--   scan_usage must have a UNIQUE constraint on (user_id, month)
--   scan_limit_by_email.email must have a UNIQUE constraint

-- Reserve a scan slot atomically. Returns TRUE if allowed, FALSE if limit reached.
-- Checks against the CURRENT MONTH's scan_usage row (monthly reset).
CREATE OR REPLACE FUNCTION try_reserve_scan(
  p_email TEXT,
  p_user_id TEXT,
  p_limit INT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_month TEXT := to_char(NOW(), 'YYYY-MM');
  v_count INT;
BEGIN
  -- 当月の scan_usage で判定（月次リセット）
  INSERT INTO scan_usage (user_id, month, count)
  VALUES (p_user_id::uuid, v_month, 1)
  ON CONFLICT (user_id, month)
  DO UPDATE SET count = scan_usage.count + 1
    WHERE scan_usage.count < p_limit
  RETURNING count INTO v_count;

  IF NOT FOUND THEN
    -- 当月の count が既に p_limit に達している
    RETURN FALSE;
  END IF;

  -- scan_limit_by_email は累計として更新（分析用）
  INSERT INTO scan_limit_by_email (email, total_count, updated_at)
  VALUES (p_email, 1, NOW())
  ON CONFLICT (email)
  DO UPDATE SET total_count = scan_limit_by_email.total_count + 1,
               updated_at = NOW();

  RETURN TRUE;
END;
$$;

-- Rollback a reserved scan slot (call when the API call fails after reservation).
CREATE OR REPLACE FUNCTION rollback_scan(
  p_email TEXT,
  p_user_id TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE scan_limit_by_email
  SET total_count = GREATEST(total_count - 1, 0), updated_at = NOW()
  WHERE email = p_email;

  UPDATE scan_usage
  SET count = GREATEST(count - 1, 0)
  WHERE user_id = p_user_id::uuid
    AND month = to_char(NOW(), 'YYYY-MM');
END;
$$;
