-- ============================================================
-- 018: Enforce per-user products limit at the database layer
-- ============================================================
--
-- 006 の RLS は auth.uid() = user_id のみで件数制限を持たない。
-- クライアント側 (lib/db.ts USER_LIMIT) のチェックは
-- supabase-js を直接叩けば回避可能なので、BEFORE INSERT トリガで
-- DB 側にも 30 件上限を強制する。
--
-- 上限値を変更する場合は lib/db.ts の USER_LIMIT も同時に更新すること。

create or replace function public.enforce_products_per_user_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count int;
  v_limit constant int := 30;
begin
  select count(*) into v_count
  from public.products
  where user_id = NEW.user_id;

  if v_count >= v_limit then
    raise exception 'product_limit_reached'
      using errcode = 'P0001';
  end if;

  return NEW;
end;
$$;

drop trigger if exists products_enforce_user_limit on public.products;

create trigger products_enforce_user_limit
  before insert on public.products
  for each row execute function public.enforce_products_per_user_limit();
