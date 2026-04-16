-- 006: Version-controlled RLS for core user-owned tables.
--
-- This migration brings the main user data tables under repo-managed RLS so
-- fresh environments do not rely on manual dashboard configuration.

DO $$
BEGIN
  IF to_regclass('public.products') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.products ENABLE ROW LEVEL SECURITY';

    EXECUTE 'DROP POLICY IF EXISTS "Users can manage own products" ON public.products';
    EXECUTE 'DROP POLICY IF EXISTS "user_select" ON public.products';
    EXECUTE 'DROP POLICY IF EXISTS "user_insert_limit" ON public.products';
    EXECUTE 'DROP POLICY IF EXISTS "user_update" ON public.products';
    EXECUTE 'DROP POLICY IF EXISTS "user_delete" ON public.products';

    EXECUTE 'CREATE POLICY "Users can manage own products"
      ON public.products
      FOR ALL
      TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id)';
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('public.zukan_discoveries') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.zukan_discoveries ENABLE ROW LEVEL SECURITY';

    EXECUTE 'DROP POLICY IF EXISTS "Users can manage own discoveries" ON public.zukan_discoveries';
    EXECUTE 'DROP POLICY IF EXISTS "user_isolation" ON public.zukan_discoveries';

    EXECUTE 'CREATE POLICY "Users can manage own discoveries"
      ON public.zukan_discoveries
      FOR ALL
      TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id)';
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('public.deck_items') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.deck_items ENABLE ROW LEVEL SECURITY';

    EXECUTE 'DROP POLICY IF EXISTS "Users can manage own deck items" ON public.deck_items';
    EXECUTE 'DROP POLICY IF EXISTS "user_isolation" ON public.deck_items';

    EXECUTE 'CREATE POLICY "Users can manage own deck items"
      ON public.deck_items
      FOR ALL
      TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (
        auth.uid() = user_id
        AND EXISTS (
          SELECT 1
          FROM public.products p
          WHERE p.id = product_id
            AND p.user_id = auth.uid()
        )
      )';
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('public.scan_history') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.scan_history ENABLE ROW LEVEL SECURITY';

    EXECUTE 'DROP POLICY IF EXISTS "Users can manage own scan history" ON public.scan_history';
    EXECUTE 'DROP POLICY IF EXISTS "users can manage own scan history" ON public.scan_history';

    EXECUTE 'CREATE POLICY "Users can manage own scan history"
      ON public.scan_history
      FOR ALL
      TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id)';
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('public.scan_ingredients') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.scan_ingredients ENABLE ROW LEVEL SECURITY';

    EXECUTE 'DROP POLICY IF EXISTS "Users can manage own scan ingredients" ON public.scan_ingredients';
    EXECUTE 'DROP POLICY IF EXISTS "users can manage own scan ingredients" ON public.scan_ingredients';

    EXECUTE 'CREATE POLICY "Users can manage own scan ingredients"
      ON public.scan_ingredients
      FOR ALL
      TO authenticated
      USING (
        EXISTS (
          SELECT 1
          FROM public.scan_history sh
          WHERE sh.id = scan_ingredients.scan_id
            AND sh.user_id = auth.uid()
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1
          FROM public.scan_history sh
          WHERE sh.id = scan_ingredients.scan_id
            AND sh.user_id = auth.uid()
        )
      )';
  END IF;
END $$;
