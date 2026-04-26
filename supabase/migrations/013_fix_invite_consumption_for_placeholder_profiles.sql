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
  v_profile public.profiles%rowtype;
  v_profile_exists boolean := false;
  v_has_completed_profile boolean := false;
  v_trimmed_display_name text := btrim(p_display_name);
begin
  if v_user_id is null then
    raise exception 'not authenticated';
  end if;

  if p_display_name is null or v_trimmed_display_name = '' then
    raise exception 'display_name required';
  end if;

  lock table public.profiles in exclusive mode;

  select *
    into v_profile
  from public.profiles
  where id = v_user_id
  for update;

  v_profile_exists := found;

  if v_profile_exists then
    v_has_completed_profile :=
      v_profile.display_name is not null
      and btrim(v_profile.display_name) <> '';

    if v_has_completed_profile then
      update public.profiles
      set display_name = v_trimmed_display_name
      where id = v_user_id;

      select count(*) into v_count
      from public.profiles
      where nullif(btrim(display_name), '') is not null;

      return jsonb_build_object(
        'allowed', true,
        'created', false,
        'count', v_count
      );
    end if;
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

  select count(*) into v_count
  from public.profiles
  where nullif(btrim(display_name), '') is not null;

  if v_count >= greatest(coalesce(p_limit, 0), 0) then
    return jsonb_build_object(
      'allowed', false,
      'created', false,
      'count', v_count,
      'reason', 'limit_reached'
    );
  end if;

  if v_profile_exists then
    update public.profiles
    set display_name = v_trimmed_display_name
    where id = v_user_id;
  else
    insert into public.profiles (id, display_name)
    values (v_user_id, v_trimmed_display_name);
  end if;

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
