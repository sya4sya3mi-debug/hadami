create table if not exists public.pending_invite_claims (
  user_id uuid primary key references auth.users(id) on delete cascade,
  invitation_code_id uuid not null references public.invitation_codes(id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);

create index if not exists idx_pending_invite_claims_expires_at
  on public.pending_invite_claims (expires_at);

alter table public.pending_invite_claims enable row level security;
-- No policies on purpose: claims are managed only by trusted server code / SECURITY DEFINER RPCs.

create or replace function public.complete_profile_with_invite(
  p_display_name text,
  p_limit int default 15
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_user_id uuid := auth.uid();
  v_count int;
  v_claim public.pending_invite_claims%rowtype;
  v_code public.invitation_codes%rowtype;
begin
  if v_user_id is null then
    raise exception 'not authenticated';
  end if;

  if p_display_name is null or btrim(p_display_name) = '' then
    raise exception 'display_name required';
  end if;

  lock table public.profiles in exclusive mode;

  if exists (
    select 1
    from public.profiles
    where id = v_user_id
  ) then
    update public.profiles
    set display_name = btrim(p_display_name)
    where id = v_user_id;

    select count(*) into v_count from public.profiles;

    return jsonb_build_object(
      'allowed', true,
      'created', false,
      'count', v_count
    );
  end if;

  delete from public.pending_invite_claims
  where user_id = v_user_id
    and expires_at < now();

  select *
    into v_claim
  from public.pending_invite_claims
  where user_id = v_user_id
  for update;

  if not found then
    return jsonb_build_object(
      'allowed', false,
      'created', false,
      'reason', 'invite_required'
    );
  end if;

  select *
    into v_code
  from public.invitation_codes
  where id = v_claim.invitation_code_id
  for update;

  if not found or not v_code.is_active or (
    v_code.expires_at is not null and v_code.expires_at < now()
  ) then
    delete from public.pending_invite_claims
    where user_id = v_user_id;

    return jsonb_build_object(
      'allowed', false,
      'created', false,
      'reason', 'invite_invalid'
    );
  end if;

  if v_code.max_uses > 0 and v_code.used_count >= v_code.max_uses then
    delete from public.pending_invite_claims
    where user_id = v_user_id;

    return jsonb_build_object(
      'allowed', false,
      'created', false,
      'reason', 'invite_exhausted'
    );
  end if;

  select count(*) into v_count from public.profiles;

  if v_count >= greatest(coalesce(p_limit, 0), 0) then
    return jsonb_build_object(
      'allowed', false,
      'created', false,
      'count', v_count,
      'reason', 'limit_reached'
    );
  end if;

  insert into public.profiles (id, display_name)
  values (v_user_id, btrim(p_display_name));

  update public.invitation_codes
  set used_count = used_count + 1
  where id = v_code.id;

  delete from public.pending_invite_claims
  where user_id = v_user_id;

  return jsonb_build_object(
    'allowed', true,
    'created', true,
    'count', v_count + 1
  );
end;
$$;

revoke all on function public.complete_profile_with_invite(text, int) from public;
grant execute on function public.complete_profile_with_invite(text, int) to authenticated;
