-- ============================================================
-- HADAMI 新プロジェクト移行スクリプト
-- 新規Supabaseプロジェクトに対して実行してください
-- ============================================================

-- ==================
-- 1. テーブル作成
-- ==================

-- profiles (auth.usersへのFK)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- products
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  name TEXT NOT NULL,
  brand TEXT,
  package_image_url TEXT,
  ingredient_ids TEXT[] DEFAULT '{}',
  unknown_ingredients TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  product_type TEXT NOT NULL DEFAULT 'other'
    CHECK (product_type = ANY (ARRAY[
      'cleansing', 'face_wash', 'toner', 'serum', 'emulsion',
      'cream', 'sunscreen', 'mask_pack', 'eye_care', 'oil', 'mist', 'other'
    ])),
  is_favorite BOOLEAN NOT NULL DEFAULT false,
  last_used_at TIMESTAMPTZ,
  purchased_at DATE,
  is_quasi_drug BOOLEAN DEFAULT false,
  active_ingredient_ids TEXT[] DEFAULT '{}'
);

-- zukan_discoveries
CREATE TABLE public.zukan_discoveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  ingredient_id TEXT NOT NULL,
  discovered_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, ingredient_id)
);

-- deck_items
CREATE TABLE public.deck_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  product_id UUID NOT NULL REFERENCES public.products(id),
  routine TEXT NOT NULL
    CHECK (routine = ANY (ARRAY['morning', 'night', 'spring_summer', 'autumn_winter'])),
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, product_id, routine)
);

-- scan_history
CREATE TABLE public.scan_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  product_name TEXT,
  brand TEXT,
  scanned_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- scan_ingredients
CREATE TABLE public.scan_ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id UUID NOT NULL REFERENCES public.scan_history(id),
  ingredient_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- scan_usage
CREATE TABLE public.scan_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  month TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  UNIQUE (user_id, month)
);

-- scan_limit_by_email
CREATE TABLE public.scan_limit_by_email (
  email TEXT PRIMARY KEY,
  total_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ingredient_cache
CREATE TABLE public.ingredient_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_name TEXT NOT NULL,
  brand TEXT NOT NULL,
  ingredients TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  is_quasi_drug BOOLEAN,
  active_ingredients TEXT,
  normalized_name TEXT,
  normalized_brand TEXT,
  UNIQUE (product_name, brand)
);

-- rakuten_product_cache
CREATE TABLE public.rakuten_product_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  search_keyword TEXT NOT NULL UNIQUE,
  results JSONB NOT NULL,
  fetched_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT (now() + interval '24 hours')
);

-- x_auth_tokens
CREATE TABLE public.x_auth_tokens (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id),
  access_token TEXT NOT NULL,
  access_token_secret TEXT NOT NULL,
  x_user_id TEXT NOT NULL,
  x_screen_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- x_tweet_log
CREATE TABLE public.x_tweet_log (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  tweeted_at TIMESTAMPTZ DEFAULT now()
);

-- ==================
-- 2. マテリアライズドビュー
-- ==================

CREATE MATERIALIZED VIEW public.user_ingredient_profile AS
  SELECT sh.user_id,
    si.ingredient_id,
    count(*) AS encounter_count,
    max(sh.scanned_at) AS last_seen_at
  FROM scan_ingredients si
  JOIN scan_history sh ON si.scan_id = sh.id
  GROUP BY sh.user_id, si.ingredient_id;

CREATE UNIQUE INDEX idx_uip_user_ingredient
  ON public.user_ingredient_profile (user_id, ingredient_id);

-- ==================
-- 3. インデックス
-- ==================

CREATE INDEX idx_ingredient_cache_lookup
  ON public.ingredient_cache (lower(brand), lower(product_name));
CREATE INDEX idx_ingredient_cache_normalized
  ON public.ingredient_cache (normalized_name, normalized_brand);
CREATE INDEX idx_rakuten_cache_expires
  ON public.rakuten_product_cache (expires_at);
CREATE INDEX idx_scan_history_scanned_at
  ON public.scan_history (scanned_at DESC);
CREATE INDEX idx_scan_history_user
  ON public.scan_history (user_id);
CREATE INDEX idx_scan_ingredients_ingredient
  ON public.scan_ingredients (ingredient_id);
CREATE INDEX idx_scan_ingredients_scan
  ON public.scan_ingredients (scan_id);
CREATE INDEX idx_x_tweet_log_user_date
  ON public.x_tweet_log (user_id, tweeted_at DESC);

-- ==================
-- 4. RLS有効化
-- ==================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zukan_discoveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deck_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scan_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scan_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scan_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scan_limit_by_email ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ingredient_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rakuten_product_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.x_auth_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.x_tweet_log ENABLE ROW LEVEL SECURITY;

-- ==================
-- 5. RLSポリシー
-- ==================

-- profiles
CREATE POLICY user_isolation ON public.profiles FOR ALL
  USING (id = auth.uid());

-- products
CREATE POLICY user_select ON public.products FOR SELECT
  USING (user_id = auth.uid());
CREATE POLICY user_insert_limit ON public.products FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND (SELECT count(*) FROM products WHERE user_id = auth.uid()) < 30
  );
CREATE POLICY user_update ON public.products FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
CREATE POLICY user_delete ON public.products FOR DELETE
  USING (user_id = auth.uid());

-- zukan_discoveries
CREATE POLICY user_isolation ON public.zukan_discoveries FOR ALL
  USING (user_id = auth.uid());

-- deck_items
CREATE POLICY user_isolation ON public.deck_items FOR ALL
  USING (user_id = auth.uid());

-- scan_history
CREATE POLICY "users can manage own scan history" ON public.scan_history FOR ALL
  USING (auth.uid() = user_id);

-- scan_ingredients
CREATE POLICY "users can manage own scan ingredients" ON public.scan_ingredients FOR ALL
  USING (EXISTS (
    SELECT 1 FROM scan_history sh
    WHERE sh.id = scan_ingredients.scan_id AND sh.user_id = auth.uid()
  ));

-- scan_usage
CREATE POLICY "Users can read own scan usage" ON public.scan_usage FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own scan usage" ON public.scan_usage FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own scan usage" ON public.scan_usage FOR UPDATE
  USING (auth.uid() = user_id);

-- scan_limit_by_email
CREATE POLICY "Users can read own email scan limit" ON public.scan_limit_by_email FOR SELECT
  USING (email = auth.email());
CREATE POLICY "Users can insert own email scan limit" ON public.scan_limit_by_email FOR INSERT
  TO authenticated
  WITH CHECK (email = (SELECT users.email FROM auth.users WHERE users.id = auth.uid())::text);
CREATE POLICY "Users can update own email scan limit" ON public.scan_limit_by_email FOR UPDATE
  USING (email = auth.email());

-- ingredient_cache
CREATE POLICY "Anyone can read ingredient cache" ON public.ingredient_cache FOR SELECT
  USING (true);
CREATE POLICY "Authenticated users can insert ingredient cache" ON public.ingredient_cache FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- rakuten_product_cache
CREATE POLICY "Anyone can read product cache" ON public.rakuten_product_cache FOR SELECT
  USING (true);
CREATE POLICY "Authenticated users can write cache" ON public.rakuten_product_cache FOR INSERT
  TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update cache" ON public.rakuten_product_cache FOR UPDATE
  TO authenticated USING (true);

-- x_auth_tokens
CREATE POLICY "Users can read own X tokens" ON public.x_auth_tokens FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own X tokens" ON public.x_auth_tokens FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own X tokens" ON public.x_auth_tokens FOR UPDATE
  USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own X tokens" ON public.x_auth_tokens FOR DELETE
  USING (auth.uid() = user_id);

-- x_tweet_log
CREATE POLICY "Users can read own tweet log" ON public.x_tweet_log FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own tweet log" ON public.x_tweet_log FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ==================
-- 6. 関数（Functions）
-- ==================

-- 新規ユーザー作成時にプロフィール自動作成
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$;

-- ベータユーザー上限チェック
CREATE OR REPLACE FUNCTION public.check_beta_user_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  IF (SELECT COUNT(*) FROM public.profiles) >= 10 THEN
    RAISE EXCEPTION 'registration_limit_reached';
  END IF;
  RETURN NEW;
END;
$$;

-- プロフィール保存（ベータ上限付き）
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
    SELECT 1 FROM public.profiles WHERE id = v_user_id
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

-- スキャン予約（トランザクション）
CREATE OR REPLACE FUNCTION public.try_reserve_scan(p_email text, p_user_id text, p_limit integer)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_count INT;
BEGIN
  UPDATE scan_limit_by_email
  SET total_count = total_count + 1, updated_at = NOW()
  WHERE email = p_email AND total_count < p_limit
  RETURNING total_count INTO v_count;

  IF NOT FOUND THEN
    BEGIN
      INSERT INTO scan_limit_by_email (email, total_count, updated_at)
      VALUES (p_email, 1, NOW());
    EXCEPTION WHEN unique_violation THEN
      RETURN FALSE;
    END;
  END IF;

  INSERT INTO scan_usage (user_id, month, count)
  VALUES (p_user_id::uuid, to_char(NOW(), 'YYYY-MM'), 1)
  ON CONFLICT (user_id, month)
  DO UPDATE SET count = scan_usage.count + 1;

  RETURN TRUE;
END;
$$;

-- スキャン予約ロールバック
CREATE OR REPLACE FUNCTION public.rollback_scan(p_email text, p_user_id text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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

-- マテリアライズドビューリフレッシュ用 meta テーブル (グローバルデバウンス)
CREATE TABLE IF NOT EXISTS public.user_ingredient_profile_meta (
  id boolean PRIMARY KEY DEFAULT true,
  last_refreshed_at timestamptz NOT NULL DEFAULT 'epoch',
  CONSTRAINT single_row CHECK (id = true)
);

INSERT INTO public.user_ingredient_profile_meta (id) VALUES (true)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.user_ingredient_profile_meta ENABLE ROW LEVEL SECURITY;
-- ポリシー無し: SECURITY DEFINER 関数経由でのみアクセス可能

-- マテリアライズドビューリフレッシュ (60秒デバウンス付き)
CREATE OR REPLACE FUNCTION public.refresh_user_ingredient_profile()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_last timestamptz;
  v_min_interval CONSTANT interval := interval '60 seconds';
BEGIN
  SELECT last_refreshed_at INTO v_last
  FROM public.user_ingredient_profile_meta
  WHERE id = true
  FOR UPDATE;

  IF v_last + v_min_interval > now() THEN
    RETURN;
  END IF;

  REFRESH MATERIALIZED VIEW CONCURRENTLY user_ingredient_profile;

  UPDATE public.user_ingredient_profile_meta
  SET last_refreshed_at = now()
  WHERE id = true;
END;
$$;

-- 商品 30 件上限の DB 側強制トリガ
-- 既存の user_insert_limit ポリシーと belt-and-suspenders で二段防御。
-- 上限値を変更する場合は lib/db.ts の USER_LIMIT も同時に更新すること。
CREATE OR REPLACE FUNCTION public.enforce_products_per_user_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count int;
  v_limit CONSTANT int := 30;
BEGIN
  SELECT count(*) INTO v_count
  FROM public.products
  WHERE user_id = NEW.user_id;

  IF v_count >= v_limit THEN
    RAISE EXCEPTION 'product_limit_reached'
      USING errcode = 'P0001';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS products_enforce_user_limit ON public.products;

CREATE TRIGGER products_enforce_user_limit
  BEFORE INSERT ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.enforce_products_per_user_limit();

-- ツイート制限チェック
CREATE OR REPLACE FUNCTION public.check_daily_tweet_limit(p_user_id uuid, p_limit integer DEFAULT 3)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'auth'
AS $$
DECLARE
  v_auth_uid UUID := auth.uid();
  today_count INT;
BEGIN
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

-- ==================
-- 7. トリガー
-- ==================

-- 新規ユーザー → プロフィール自動作成
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ベータユーザー上限
CREATE TRIGGER enforce_beta_user_limit
  BEFORE INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION check_beta_user_limit();

-- ==================
-- 8. ストレージ（バケット + ポリシー）
-- ==================

INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true);

CREATE POLICY user_upload ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'product-images'
    AND (storage.foldername(name))[1] = (auth.uid())::text
  );

CREATE POLICY user_read ON storage.objects FOR SELECT
  USING (
    bucket_id = 'product-images'
    AND (storage.foldername(name))[1] = (auth.uid())::text
  );

CREATE POLICY user_update ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'product-images'
    AND (storage.foldername(name))[1] = (auth.uid())::text
  )
  WITH CHECK (
    bucket_id = 'product-images'
    AND (storage.foldername(name))[1] = (auth.uid())::text
  );

CREATE POLICY user_delete ON storage.objects FOR DELETE
  USING (
    bucket_id = 'product-images'
    AND (storage.foldername(name))[1] = (auth.uid())::text
  );

-- ==================
-- 完了
-- ==================
