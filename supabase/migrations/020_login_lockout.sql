-- 020_login_lockout.sql
-- ログイン試行履歴と 5 回失敗で 30 分ロックする仕組み

CREATE TABLE IF NOT EXISTS public.login_attempts (
  id BIGSERIAL PRIMARY KEY,
  email_lower TEXT NOT NULL,
  ip TEXT,
  success BOOLEAN NOT NULL,
  attempted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_login_attempts_email_time
  ON public.login_attempts (email_lower, attempted_at DESC);
CREATE INDEX IF NOT EXISTS idx_login_attempts_cleanup
  ON public.login_attempts (attempted_at);

-- service_role 以外は触れない
ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.login_attempts FROM PUBLIC, anon, authenticated;

-- 直近 30 分内に「最後の成功以降」5 回失敗していたら locked=true を返す
CREATE OR REPLACE FUNCTION public.check_login_lock(p_email TEXT)
RETURNS TABLE(locked BOOLEAN, retry_after_seconds INT)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_last_success TIMESTAMPTZ;
  v_fail_count INT;
  v_oldest_fail TIMESTAMPTZ;
  v_window INTERVAL := INTERVAL '30 minutes';
  v_max_fails INT := 5;
BEGIN
  SELECT MAX(attempted_at) INTO v_last_success
    FROM public.login_attempts
    WHERE email_lower = lower(p_email) AND success = TRUE;

  SELECT COUNT(*), MIN(attempted_at)
    INTO v_fail_count, v_oldest_fail
    FROM public.login_attempts
    WHERE email_lower = lower(p_email)
      AND success = FALSE
      AND attempted_at > NOW() - v_window
      AND (v_last_success IS NULL OR attempted_at > v_last_success);

  IF v_fail_count >= v_max_fails THEN
    RETURN QUERY SELECT TRUE,
      GREATEST(0, EXTRACT(EPOCH FROM (v_oldest_fail + v_window - NOW()))::INT);
  ELSE
    RETURN QUERY SELECT FALSE, 0;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.record_login_attempt(
  p_email TEXT, p_ip TEXT, p_success BOOLEAN
) RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.login_attempts (email_lower, ip, success)
  VALUES (lower(p_email), p_ip, p_success);
  DELETE FROM public.login_attempts WHERE attempted_at < NOW() - INTERVAL '30 days';
END;
$$;

REVOKE ALL ON FUNCTION public.check_login_lock(TEXT) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.record_login_attempt(TEXT, TEXT, BOOLEAN) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_login_lock(TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.record_login_attempt(TEXT, TEXT, BOOLEAN) TO service_role;
