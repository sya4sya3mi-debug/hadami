-- 016: Per-user monthly scan limit overrides.

CREATE TABLE IF NOT EXISTS public.user_scan_limits (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  monthly_limit INT NOT NULL CHECK (monthly_limit > 0 AND monthly_limit <= 9999),
  updated_by UUID,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.user_scan_limits ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.set_timestamp_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_user_scan_limits_updated_at ON public.user_scan_limits;
CREATE TRIGGER trg_user_scan_limits_updated_at
BEFORE UPDATE ON public.user_scan_limits
FOR EACH ROW
EXECUTE FUNCTION public.set_timestamp_updated_at();
