-- 011: admin が「無視済み」にした未識別成分名を管理するテーブル
-- products.unknown_ingredients に蓄積された成分名のうち、
-- 本物の成分ではないと判断したものを記録する。

CREATE TABLE IF NOT EXISTS public.dismissed_unknowns (
  name TEXT PRIMARY KEY,
  dismissed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.dismissed_unknowns ENABLE ROW LEVEL SECURITY;

-- service_role（API Route）のみ操作可能
CREATE POLICY "service_role_full_access"
  ON public.dismissed_unknowns
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
