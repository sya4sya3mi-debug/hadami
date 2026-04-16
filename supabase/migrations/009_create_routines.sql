-- ルーティン本体
create table public.routines (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null default '私のスキンケアルーティン',
  skin_type   text not null default '乾燥肌',
  concerns    text[] not null default '{}',
  note        text,
  is_public   boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ルーティンのステップ
create table public.routine_steps (
  id           uuid primary key default gen_random_uuid(),
  routine_id   uuid not null references public.routines(id) on delete cascade,
  time_of_day  text not null check (time_of_day in ('am', 'pm')),
  step_order   int  not null,
  step_name    text not null,
  product_name text,
  product_id   uuid references public.products(id) on delete set null,
  icon         text not null default '🌿',
  created_at   timestamptz not null default now()
);

-- RLS有効化
alter table public.routines enable row level security;
alter table public.routine_steps enable row level security;

-- routines RLS: オーナーはフルアクセス
create policy "routines_owner_all" on public.routines
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- routines RLS: 公開ルーティンは全員SELECT可
create policy "routines_public_select" on public.routines
  for select using (is_public = true);

-- routine_steps RLS: 親のオーナーはフルアクセス
create policy "steps_owner_all" on public.routine_steps
  for all using (
    exists (select 1 from public.routines where id = routine_steps.routine_id and user_id = auth.uid())
  )
  with check (
    exists (select 1 from public.routines where id = routine_steps.routine_id and user_id = auth.uid())
  );

-- routine_steps RLS: 親が公開なら全員SELECT可
create policy "steps_public_select" on public.routine_steps
  for select using (
    exists (select 1 from public.routines where id = routine_steps.routine_id and is_public = true)
  );

-- updated_at 自動更新トリガー
create or replace function public.update_routines_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger routines_updated_at
  before update on public.routines
  for each row execute function public.update_routines_updated_at();
