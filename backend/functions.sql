-- Minimal backend business functions for VIBE

create or replace function has_permission(p_user uuid, p_permission text)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from role_assignments ra
    join role_permissions rp on rp.role_key = ra.role_key
    where ra.user_id = p_user and rp.permission_key = p_permission
  );
$$;

create or replace function allocate_onboarding_offer(p_user uuid)
returns table(offer_type text, requires_payment boolean, annual_price_cad numeric, annual_remaining int)
language plpgsql
as $$
declare
  counters onboarding_counters%rowtype;
begin
  select * into counters
  from onboarding_counters
  where id = true
  for update;

  if counters.free_used < counters.free_limit then
    update onboarding_counters
    set free_used = free_used + 1,
        updated_at = now()
    where id = true;

    offer_type := 'free';
    requires_payment := false;
    annual_price_cad := 0;
    annual_remaining := greatest(counters.paid_limit - counters.paid_used, 0);
    return next;
    return;
  end if;

  if counters.paid_used < counters.paid_limit then
    update onboarding_counters
    set paid_used = paid_used + 1,
        updated_at = now()
    where id = true;

    offer_type := 'annual_99_single';
    requires_payment := true;
    annual_price_cad := 99;
    annual_remaining := greatest(counters.paid_limit - (counters.paid_used + 1), 0);
    return next;
    return;
  end if;

  offer_type := 'waitlist';
  requires_payment := false;
  annual_price_cad := 0;
  annual_remaining := 0;
  return next;
end;
$$;

create or replace function create_moderation_case_from_report(p_report_id uuid)
returns uuid
language plpgsql
as $$
declare
  v_case_id uuid;
begin
  insert into moderation_cases(reported_user_id, created_from_report_id, status)
  select reported_user_id, id, 'voting'
  from reports
  where id = p_report_id
  returning id into v_case_id;

  return v_case_id;
end;
$$;

create or replace function assign_random_jury(p_case_id uuid, p_assigner uuid)
returns int
language plpgsql
as $$
declare
  assigned_count int;
begin
  insert into jury_assignments(case_id, jury_user_id)
  select p_case_id, ra.user_id
  from role_assignments ra
  where ra.role_key = 'jury'
  order by random()
  limit 6
  on conflict do nothing;

  get diagnostics assigned_count = row_count;

  insert into audit_logs(actor_user_id, event_key, target_table, target_id, payload)
  values (p_assigner, 'moderation.jury.assigned', 'moderation_cases', p_case_id::text, jsonb_build_object('assigned_count', assigned_count));

  return assigned_count;
end;
$$;

create or replace function apply_sanction_from_verdict(p_case_id uuid, p_actor uuid)
returns uuid
language plpgsql
as $$
declare
  v_reported uuid;
  v_existing_count int;
  v_level int;
  v_verdict moderation_verdict;
  v_ends timestamptz;
  v_sanction_id uuid;
begin
  select reported_user_id into v_reported
  from moderation_cases where id = p_case_id;

  if v_reported is null then
    raise exception 'case not found';
  end if;

  select count(*) into v_existing_count
  from sanctions where user_id = v_reported;

  v_level := v_existing_count + 1;

  if v_level = 1 then
    v_verdict := 'suspend_1_week';
    v_ends := now() + interval '7 days';
  elsif v_level = 2 then
    v_verdict := 'suspend_2_weeks';
    v_ends := now() + interval '14 days';
  else
    v_verdict := 'ban_lifetime';
    v_ends := null;
  end if;

  insert into sanctions(user_id, case_id, level, verdict, starts_at, ends_at)
  values (v_reported, p_case_id, v_level, v_verdict, now(), v_ends)
  returning id into v_sanction_id;

  update moderation_cases
  set status = 'resolved', resolved_at = now()
  where id = p_case_id;

  insert into notifications(user_id, channel, template_key, payload)
  values (
    v_reported,
    'in_app',
    'moderation.verdict.final',
    jsonb_build_object('case_id', p_case_id, 'verdict', v_verdict, 'level', v_level, 'ends_at', v_ends)
  );

  insert into audit_logs(actor_user_id, event_key, target_table, target_id, payload)
  values (p_actor, 'moderation.sanction.applied', 'sanctions', v_sanction_id::text, jsonb_build_object('level', v_level, 'verdict', v_verdict));

  return v_sanction_id;
end;
$$;

create or replace function request_pardon(p_user uuid, p_case uuid, p_payment_id uuid)
returns uuid
language plpgsql
as $$
declare
  v_id uuid;
begin
  if exists(select 1 from pardons where user_id = p_user) then
    raise exception 'pardon already used';
  end if;

  insert into pardons(user_id, case_id, payment_id, amount_cad)
  values (p_user, p_case, p_payment_id, 60)
  returning id into v_id;

  insert into audit_logs(actor_user_id, event_key, target_table, target_id, payload)
  values (p_user, 'moderation.pardon.requested', 'pardons', v_id::text, jsonb_build_object('amount_cad', 60));

  return v_id;
end;
$$;

create or replace function escalate_overdue_cases()
returns int
language plpgsql
as $$
declare
  v_count int;
begin
  update moderation_cases
  set status = 'escalated'
  where status in ('open', 'voting')
    and decision_due_at < now();

  get diagnostics v_count = row_count;

  return v_count;
end;
$$;

create or replace function sos_start_session(p_user uuid, p_consent_voice_storage boolean)
returns uuid
language plpgsql
as $$
declare
  v_id uuid;
begin
  insert into sos_sessions(user_id, state, consent_voice_storage)
  values (p_user, 'active', p_consent_voice_storage)
  returning id into v_id;

  insert into sos_events(session_id, event_type, payload)
  values (v_id, 'session_started', '{}'::jsonb);

  return v_id;
end;
$$;

create or replace function sos_heartbeat(
  p_session uuid,
  p_lat numeric,
  p_lng numeric,
  p_has_voice boolean,
  p_payload jsonb default '{}'::jsonb
)
returns void
language plpgsql
as $$
begin
  insert into sos_events(session_id, event_type, latitude, longitude, has_voice_capture, payload)
  values (p_session, 'heartbeat', p_lat, p_lng, p_has_voice, coalesce(p_payload, '{}'::jsonb));
end;
$$;

create or replace function sos_end_session(p_session uuid)
returns void
language plpgsql
as $$
begin
  update sos_sessions
  set state = 'closed', ended_at = now()
  where id = p_session and state = 'active';

  insert into sos_events(session_id, event_type, payload)
  values (p_session, 'session_closed', '{}'::jsonb);
end;
$$;

create or replace function get_compatibility(p_actor uuid, p_target uuid)
returns table(score int, summary text)
language sql
stable
as $$
  select cs.score,
         coalesce(ce.summary, 'Compatibilité disponible, détails à enrichir.') as summary
  from compatibility_scores cs
  left join compatibility_explanations ce on ce.compatibility_id = cs.id
  where cs.user_a = p_actor and cs.user_b = p_target;
$$;

create or replace function upsert_profile_decision(p_actor uuid, p_target uuid, p_decision text)
returns void
language plpgsql
as $$
begin
  insert into profile_decisions(actor_user_id, target_user_id, decision)
  values (p_actor, p_target, p_decision)
  on conflict(actor_user_id, target_user_id)
  do update set decision = excluded.decision, created_at = now();
end;
$$;
