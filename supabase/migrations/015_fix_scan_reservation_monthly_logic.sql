-- 015: Fix scan reservation logic to enforce monthly quota consistently.
-- Restores monthly-gated reservation semantics while keeping auth checks.

CREATE OR REPLACE FUNCTION public.try_reserve_scan(
  p_email TEXT,
  p_user_id TEXT,
  p_limit INT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_auth_user_id UUID := auth.uid();
  v_auth_email TEXT := lower(COALESCE(auth.jwt() ->> 'email', ''));
  v_month TEXT := to_char(NOW(), 'YYYY-MM');
BEGIN
  IF v_auth_user_id IS NULL OR v_auth_user_id::text <> p_user_id THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  IF v_auth_email = '' OR v_auth_email <> lower(p_email) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  INSERT INTO public.scan_usage (user_id, month, count)
  VALUES (p_user_id::uuid, v_month, 1)
  ON CONFLICT (user_id, month)
  DO UPDATE SET count = public.scan_usage.count + 1
  WHERE public.scan_usage.count < p_limit;

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  INSERT INTO public.scan_limit_by_email (email, total_count, updated_at)
  VALUES (p_email, 1, NOW())
  ON CONFLICT (email)
  DO UPDATE SET total_count = public.scan_limit_by_email.total_count + 1,
                updated_at = NOW();

  RETURN TRUE;
END;
$$;

REVOKE ALL ON FUNCTION public.try_reserve_scan(TEXT, TEXT, INT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.try_reserve_scan(TEXT, TEXT, INT) TO authenticated;

CREATE OR REPLACE FUNCTION public.rollback_scan(
  p_email TEXT,
  p_user_id TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_auth_user_id UUID := auth.uid();
  v_auth_email TEXT := lower(COALESCE(auth.jwt() ->> 'email', ''));
BEGIN
  IF v_auth_user_id IS NULL OR v_auth_user_id::text <> p_user_id THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  IF v_auth_email = '' OR v_auth_email <> lower(p_email) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  UPDATE public.scan_limit_by_email
  SET total_count = GREATEST(total_count - 1, 0),
      updated_at = NOW()
  WHERE email = p_email;

  UPDATE public.scan_usage
  SET count = GREATEST(count - 1, 0)
  WHERE user_id = p_user_id::uuid
    AND month = to_char(NOW(), 'YYYY-MM');
END;
$$;

REVOKE ALL ON FUNCTION public.rollback_scan(TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rollback_scan(TEXT, TEXT) TO authenticated;
