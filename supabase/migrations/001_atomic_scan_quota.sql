-- Atomic scan quota: check + increment in one operation to prevent race conditions.
-- Apply this migration via Supabase Dashboard SQL Editor or supabase CLI.
--
-- Prerequisites:
--   scan_limit_by_email.email must have a UNIQUE constraint
--   scan_usage must have a UNIQUE constraint on (user_id, month)

-- Reserve a scan slot atomically. Returns TRUE if allowed, FALSE if limit reached.
CREATE OR REPLACE FUNCTION try_reserve_scan(
  p_email TEXT,
  p_user_id TEXT,
  p_limit INT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
  v_count INT;
BEGIN
  -- Attempt atomic increment: only succeeds if current count < limit.
  UPDATE scan_limit_by_email
  SET total_count = total_count + 1, updated_at = NOW()
  WHERE email = p_email AND total_count < p_limit
  RETURNING total_count INTO v_count;

  IF NOT FOUND THEN
    -- Row may not exist yet (first scan) or limit is already reached.
    BEGIN
      INSERT INTO scan_limit_by_email (email, total_count, updated_at)
      VALUES (p_email, 1, NOW());
    EXCEPTION WHEN unique_violation THEN
      -- Row exists but total_count >= p_limit. Deny.
      RETURN FALSE;
    END;
  END IF;

  -- Also update monthly scan_usage for analytics.
  INSERT INTO scan_usage (user_id, month, count)
  VALUES (p_user_id, to_char(NOW(), 'YYYY-MM'), 1)
  ON CONFLICT (user_id, month)
  DO UPDATE SET count = scan_usage.count + 1;

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
AS $$
BEGIN
  UPDATE scan_limit_by_email
  SET total_count = GREATEST(total_count - 1, 0), updated_at = NOW()
  WHERE email = p_email;

  UPDATE scan_usage
  SET count = GREATEST(count - 1, 0)
  WHERE user_id = p_user_id
    AND month = to_char(NOW(), 'YYYY-MM');
END;
$$;
