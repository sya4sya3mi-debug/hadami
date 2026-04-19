-- 004: RLS hardening for registration/profile setup and scan quota functions.

DO $$
BEGIN
  IF to_regclass('public.profiles') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY';

    EXECUTE 'DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles';
    EXECUTE 'DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles';
    EXECUTE 'DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles';
    EXECUTE 'DROP POLICY IF EXISTS "Users can delete own profile" ON public.profiles';

    EXECUTE 'CREATE POLICY "Users can view own profile"
      ON public.profiles
      FOR SELECT
      TO authenticated
      USING (auth.uid() = id)';

    EXECUTE 'CREATE POLICY "Users can insert own profile"
      ON public.profiles
      FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = id)';

    EXECUTE 'CREATE POLICY "Users can update own profile"
      ON public.profiles
      FOR UPDATE
      TO authenticated
      USING (auth.uid() = id)
      WITH CHECK (auth.uid() = id)';

    EXECUTE 'CREATE POLICY "Users can delete own profile"
      ON public.profiles
      FOR DELETE
      TO authenticated
      USING (auth.uid() = id)';
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.upsert_profile_with_limit(
  p_display_name TEXT,
  p_limit INT DEFAULT 15
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_count INT;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  IF p_display_name IS NULL OR btrim(p_display_name) = '' THEN
    RAISE EXCEPTION 'display_name required';
  END IF;

  LOCK TABLE public.profiles IN EXCLUSIVE MODE;

  IF EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = v_user_id
  ) THEN
    UPDATE public.profiles
    SET display_name = btrim(p_display_name)
    WHERE id = v_user_id;

    SELECT COUNT(*) INTO v_count FROM public.profiles;

    RETURN jsonb_build_object(
      'allowed', TRUE,
      'created', FALSE,
      'count', v_count
    );
  END IF;

  SELECT COUNT(*) INTO v_count FROM public.profiles;

  IF v_count >= GREATEST(COALESCE(p_limit, 0), 0) THEN
    RETURN jsonb_build_object(
      'allowed', FALSE,
      'created', FALSE,
      'count', v_count
    );
  END IF;

  INSERT INTO public.profiles (id, display_name)
  VALUES (v_user_id, btrim(p_display_name));

  RETURN jsonb_build_object(
    'allowed', TRUE,
    'created', TRUE,
    'count', v_count + 1
  );
END;
$$;

REVOKE ALL ON FUNCTION public.upsert_profile_with_limit(TEXT, INT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.upsert_profile_with_limit(TEXT, INT) TO authenticated;

DO $$
BEGIN
  IF to_regclass('public.scan_usage') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.scan_usage ENABLE ROW LEVEL SECURITY';

    EXECUTE 'DROP POLICY IF EXISTS "Users can view own scan usage" ON public.scan_usage';

    EXECUTE 'CREATE POLICY "Users can view own scan usage"
      ON public.scan_usage
      FOR SELECT
      TO authenticated
      USING (user_id::text = auth.uid()::text)';
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('public.scan_limit_by_email') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.scan_limit_by_email ENABLE ROW LEVEL SECURITY';

    EXECUTE 'DROP POLICY IF EXISTS "Users can view own scan quota" ON public.scan_limit_by_email';

    EXECUTE 'CREATE POLICY "Users can view own scan quota"
      ON public.scan_limit_by_email
      FOR SELECT
      TO authenticated
      USING (
        lower(email) = lower(COALESCE(auth.jwt() ->> ''email'', ''''))
      )';
  END IF;
END $$;

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
  v_count INT;
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
  SET total_count = total_count + 1, updated_at = NOW()
  WHERE email = p_email AND total_count < p_limit
  RETURNING total_count INTO v_count;

  IF NOT FOUND THEN
    BEGIN
      INSERT INTO public.scan_limit_by_email (email, total_count, updated_at)
      VALUES (p_email, 1, NOW());
    EXCEPTION WHEN unique_violation THEN
      RETURN FALSE;
    END;
  END IF;

  INSERT INTO public.scan_usage (user_id, month, count)
  VALUES (p_user_id, to_char(NOW(), 'YYYY-MM'), 1)
  ON CONFLICT (user_id, month)
  DO UPDATE SET count = public.scan_usage.count + 1;

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
  SET total_count = GREATEST(total_count - 1, 0), updated_at = NOW()
  WHERE email = p_email;

  UPDATE public.scan_usage
  SET count = GREATEST(count - 1, 0)
  WHERE user_id = p_user_id
    AND month = to_char(NOW(), 'YYYY-MM');
END;
$$;

REVOKE ALL ON FUNCTION public.rollback_scan(TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rollback_scan(TEXT, TEXT) TO authenticated;
