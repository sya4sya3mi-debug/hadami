-- 005: Harden check_daily_tweet_limit — require auth.uid() match + restrict execution.

CREATE OR REPLACE FUNCTION check_daily_tweet_limit(p_user_id UUID, p_limit INT DEFAULT 3)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_auth_uid UUID := auth.uid();
  today_count INT;
BEGIN
  -- Caller must be authenticated and can only check their own limit
  IF v_auth_uid IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  IF v_auth_uid <> p_user_id THEN
    RAISE EXCEPTION 'forbidden: cannot check another user''s tweet limit';
  END IF;

  SELECT COUNT(*) INTO today_count
  FROM x_tweet_log
  WHERE user_id = p_user_id
    AND tweeted_at >= (now() AT TIME ZONE 'Asia/Tokyo')::date::timestamptz;

  RETURN today_count < p_limit;
END;
$$;

-- Restrict execution to authenticated users only
REVOKE ALL ON FUNCTION check_daily_tweet_limit(UUID, INT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION check_daily_tweet_limit(UUID, INT) TO authenticated;
