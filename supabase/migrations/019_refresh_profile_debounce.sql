-- ============================================================
-- 019: Server-side debounce for refresh_user_ingredient_profile
-- ============================================================
--
-- refresh_user_ingredient_profile は MV 全体の CONCURRENTLY refresh を
-- 行う重い処理。複数ユーザーの同時呼び出しでスラッシングを防ぐため、
-- 直近 60 秒以内ならスキップするデバウンスを RPC 内に組み込む。
--
-- ルート側にも per-user / per-IP のレート制限が入っているが、
-- DB 側にもグローバル上限を持つことで二段防御にする。

create table if not exists public.user_ingredient_profile_meta (
  id boolean primary key default true,
  last_refreshed_at timestamptz not null default 'epoch',
  constraint single_row check (id = true)
);

insert into public.user_ingredient_profile_meta (id) values (true)
on conflict (id) do nothing;

alter table public.user_ingredient_profile_meta enable row level security;
-- ポリシー無し: SECURITY DEFINER 関数経由でのみアクセス可能

create or replace function public.refresh_user_ingredient_profile()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_last timestamptz;
  v_min_interval constant interval := interval '60 seconds';
begin
  select last_refreshed_at into v_last
  from public.user_ingredient_profile_meta
  where id = true
  for update;

  if v_last + v_min_interval > now() then
    return;
  end if;

  refresh materialized view concurrently public.user_ingredient_profile;

  update public.user_ingredient_profile_meta
  set last_refreshed_at = now()
  where id = true;
end;
$$;
