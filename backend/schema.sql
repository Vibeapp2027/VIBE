-- Minimal backend schema for VIBE (PostgreSQL/Supabase compatible)
-- Covers RBAC, moderation tribunal, sanctions, SOS, subscriptions, compatibility and notifications.

create extension if not exists pgcrypto;

create type app_role as enum ('founder', 'operations_director', 'moderator', 'jury', 'user');
create type moderation_category as enum ('fake_profile', 'harassment', 'intimidation', 'disrespect');
create type moderation_status as enum ('open', 'voting', 'resolved', 'escalated');
create type moderation_verdict as enum ('dismissed', 'warning', 'suspend_1_week', 'suspend_2_weeks', 'ban_lifetime');
create type sanction_state as enum ('active', 'expired', 'lifted');
create type payment_status as enum ('pending', 'succeeded', 'failed', 'refunded');
create type sos_session_state as enum ('active', 'closed', 'expired');
create type notification_channel as enum ('in_app', 'email', 'sms', 'push');

create table if not exists users_app (
  id uuid primary key default gen_random_uuid(),
  external_auth_id text unique,
  pseudonym_id text unique not null default ('u_' || substr(encode(gen_random_bytes(8), 'hex'), 1, 12)),
  email text unique,
  declared_identity text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists roles (
  id smallint generated always as identity primary key,
  key app_role unique not null
);

insert into roles(key) values ('founder'), ('operations_director'), ('moderator'), ('jury'), ('user')
on conflict (key) do nothing;

create table if not exists role_assignments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users_app(id) on delete cascade,
  role_key app_role not null,
  assigned_by uuid references users_app(id),
  assigned_at timestamptz not null default now(),
  unique(user_id, role_key)
);

create table if not exists permissions (
  key text primary key,
  description text not null
);

insert into permissions(key, description) values
('finance.manage', 'Manage payments, refunds and finance settings'),
('moderation.manage', 'Manage moderation and tribunal cases'),
('sos.manage', 'Manage SOS active incidents'),
('profiles.manage', 'Manage profile category rules'),
('subscriptions.manage', 'Manage subscription rules')
on conflict (key) do nothing;

create table if not exists role_permissions (
  role_key app_role not null,
  permission_key text not null references permissions(key) on delete cascade,
  primary key(role_key, permission_key)
);

insert into role_permissions(role_key, permission_key)
values
('founder', 'finance.manage'),
('founder', 'moderation.manage'),
('founder', 'sos.manage'),
('founder', 'profiles.manage'),
('founder', 'subscriptions.manage'),
('operations_director', 'moderation.manage'),
('operations_director', 'sos.manage'),
('operations_director', 'profiles.manage'),
('operations_director', 'subscriptions.manage'),
('moderator', 'moderation.manage'),
('user', 'profiles.manage')
on conflict do nothing;

create table if not exists audit_logs (
  id bigserial primary key,
  actor_user_id uuid references users_app(id),
  event_key text not null,
  target_table text,
  target_id text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create or replace function deny_audit_mutations()
returns trigger language plpgsql as $$
begin
  raise exception 'audit_logs is immutable';
end;
$$;

drop trigger if exists tr_deny_audit_update on audit_logs;
create trigger tr_deny_audit_update before update on audit_logs
for each row execute function deny_audit_mutations();

drop trigger if exists tr_deny_audit_delete on audit_logs;
create trigger tr_deny_audit_delete before delete on audit_logs
for each row execute function deny_audit_mutations();

create table if not exists profile_categories (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,
  label text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists profiles (
  user_id uuid primary key references users_app(id) on delete cascade,
  category_id uuid references profile_categories(id),
  display_name text not null,
  birth_year int,
  bio text,
  visibility_radius_km int not null default 20,
  is_subscriber boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists profile_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users_app(id) on delete cascade,
  preference_key text not null,
  preference_value jsonb not null,
  consented boolean not null default true,
  created_at timestamptz not null default now(),
  unique(user_id, preference_key)
);

create table if not exists profile_views (
  id bigserial primary key,
  viewer_user_id uuid not null references users_app(id) on delete cascade,
  viewed_user_id uuid not null references users_app(id) on delete cascade,
  viewed_at timestamptz not null default now()
);

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  title text not null,
  amount_cad numeric(10,2) not null,
  billing_mode text not null,
  capacity int,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

insert into products(code, title, amount_cad, billing_mode, capacity)
values ('annual_99_single', 'Billet annuel 99 CAD versement unique', 99.00, 'one_shot', 500)
on conflict (code) do nothing;

create table if not exists subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users_app(id) on delete cascade,
  product_id uuid references products(id),
  starts_at timestamptz not null,
  ends_at timestamptz,
  status text not null,
  created_at timestamptz not null default now()
);

create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users_app(id),
  product_id uuid references products(id),
  amount_cad numeric(10,2) not null,
  provider text not null,
  provider_ref text unique,
  status payment_status not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists refunds (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid not null references payments(id) on delete cascade,
  decided_by_user_id uuid not null references users_app(id),
  reason text,
  status payment_status not null,
  created_at timestamptz not null default now()
);

create table if not exists onboarding_counters (
  id boolean primary key default true,
  free_limit int not null default 2500,
  free_used int not null default 0,
  paid_limit int not null default 500,
  paid_used int not null default 0,
  updated_at timestamptz not null default now(),
  check (id)
);

insert into onboarding_counters(id) values (true)
on conflict (id) do nothing;

create table if not exists reports (
  id uuid primary key default gen_random_uuid(),
  reporter_user_id uuid not null references users_app(id),
  reported_user_id uuid not null references users_app(id),
  category moderation_category not null,
  details text,
  created_at timestamptz not null default now()
);

create table if not exists moderation_cases (
  id uuid primary key default gen_random_uuid(),
  reported_user_id uuid not null references users_app(id),
  created_from_report_id uuid references reports(id),
  status moderation_status not null default 'open',
  created_at timestamptz not null default now(),
  decision_due_at timestamptz not null default (now() + interval '24 hours'),
  resolved_at timestamptz,
  anonymized_subject_id text not null default ('case_subj_' || substr(encode(gen_random_bytes(8), 'hex'), 1, 12))
);

create table if not exists jury_assignments (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references moderation_cases(id) on delete cascade,
  jury_user_id uuid not null references users_app(id),
  anonymized_jury_id text not null default ('jury_' || substr(encode(gen_random_bytes(8), 'hex'), 1, 10)),
  assigned_at timestamptz not null default now(),
  unique(case_id, jury_user_id)
);

create table if not exists jury_votes (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references moderation_cases(id) on delete cascade,
  jury_user_id uuid not null references users_app(id),
  verdict moderation_verdict not null,
  rationale text,
  created_at timestamptz not null default now(),
  unique(case_id, jury_user_id)
);

create table if not exists sanctions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users_app(id),
  case_id uuid references moderation_cases(id),
  level smallint not null,
  verdict moderation_verdict not null,
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  state sanction_state not null default 'active',
  created_at timestamptz not null default now()
);

create table if not exists pardons (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users_app(id),
  case_id uuid not null references moderation_cases(id),
  payment_id uuid references payments(id),
  amount_cad numeric(10,2) not null default 60.00,
  approved boolean,
  created_at timestamptz not null default now(),
  decided_at timestamptz
);

create unique index if not exists ux_pardons_once_per_user on pardons(user_id);

create table if not exists sos_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users_app(id),
  state sos_session_state not null default 'active',
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  consent_voice_storage boolean not null default false
);

create table if not exists trusted_contacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users_app(id) on delete cascade,
  contact_value text not null,
  contact_channel notification_channel not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique(user_id, contact_value)
);

create table if not exists sos_events (
  id bigserial primary key,
  session_id uuid not null references sos_sessions(id) on delete cascade,
  event_type text not null,
  latitude numeric(9,6),
  longitude numeric(9,6),
  has_voice_capture boolean,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists compatibility_scores (
  id uuid primary key default gen_random_uuid(),
  user_a uuid not null references users_app(id) on delete cascade,
  user_b uuid not null references users_app(id) on delete cascade,
  score int not null check (score between 0 and 100),
  updated_at timestamptz not null default now(),
  unique(user_a, user_b),
  check (user_a <> user_b)
);

create table if not exists compatibility_explanations (
  id uuid primary key default gen_random_uuid(),
  compatibility_id uuid not null references compatibility_scores(id) on delete cascade,
  summary text not null,
  generated_at timestamptz not null default now()
);

create table if not exists profile_decisions (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid not null references users_app(id) on delete cascade,
  target_user_id uuid not null references users_app(id) on delete cascade,
  decision text not null check (decision in ('keep', 'reject')),
  created_at timestamptz not null default now(),
  unique(actor_user_id, target_user_id)
);

create table if not exists icebreaker_events (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid not null references users_app(id),
  target_user_id uuid not null references users_app(id),
  prompt text not null,
  was_helpful boolean,
  ai_stopped boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users_app(id),
  channel notification_channel not null,
  template_key text not null,
  payload jsonb not null,
  delivered_at timestamptz,
  created_at timestamptz not null default now()
);
