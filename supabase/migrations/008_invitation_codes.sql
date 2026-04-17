-- 招待コードテーブル
create table if not exists public.invitation_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  label text,                        -- 管理用メモ（例: "こっぺ配布用"）
  max_uses int not null default 1,   -- 最大使用回数（0 = 無制限）
  used_count int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  expires_at timestamptz             -- null = 無期限
);

-- RLS: service_role のみ読み書き可能（クライアント直アクセス不可）
alter table public.invitation_codes enable row level security;

-- サービスロール用ポリシー（API Route の service_role キーからのみ操作）
-- anon/authenticated ユーザーからは直接アクセスできない
create policy "service_role_full_access"
  on public.invitation_codes
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

-- 初期招待コードを投入（必要に応じて変更してください）
insert into public.invitation_codes (code, label, max_uses)
values
  ('HADAMI-BETA-2026', 'デフォルトベータ招待コード', 50);
