-- =============================================================================
-- The Glow Room — core schema (Phase 1)
-- Apply in Supabase Dashboard > SQL Editor (or `supabase db push`).
-- Safe to re-run: uses IF NOT EXISTS / DROP POLICY IF EXISTS.
-- =============================================================================

create extension if not exists pgcrypto;

-- ---------- USERS (profile mirror of auth.users) ----------
create table if not exists public.users (
  id              uuid primary key references auth.users(id) on delete cascade,
  email           text unique not null,
  display_name    text,
  discord_user_id text unique,
  habit_anchor    text,
  notif_opt_in    boolean not null default true,
  created_at      timestamptz not null default now()
);

-- Auto-create a profile row whenever an auth user is created.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.users (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- COHORTS ----------
create table if not exists public.cohorts (
  id              uuid primary key default gen_random_uuid(),
  challenge_type  text not null check (challenge_type in ('glow_up','phone_detox')),
  name            text not null,
  start_date      date,
  enroll_open_at  timestamptz,
  enroll_close_at timestamptz,
  stripe_price_id text,
  status          text not null default 'upcoming'
                   check (status in ('upcoming','open','active','complete')),
  created_at      timestamptz not null default now()
);

-- ---------- ENROLLMENTS ----------
create table if not exists public.enrollments (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references public.users(id) on delete cascade,
  cohort_id         uuid not null references public.cohorts(id) on delete cascade,
  stripe_session_id text,
  status            text not null default 'active'
                     check (status in ('active','refunded','revoked')),
  completed_day     int not null default 0,
  created_at        timestamptz not null default now(),
  unique (user_id, cohort_id)
);

-- ---------- SUBSCRIPTIONS (membership) ----------
create table if not exists public.subscriptions (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references public.users(id) on delete cascade,
  stripe_customer_id text,
  stripe_sub_id      text unique,
  status             text not null default 'active'
                      check (status in ('active','past_due','canceled')),
  current_period_end timestamptz,
  created_at         timestamptz not null default now()
);

-- ---------- CHALLENGE CONTENT LIBRARY ----------
-- For phone_detox, movement_task holds the day's single action and
-- mindset_prompt holds the "why" / reframe (skin_task stays null).
create table if not exists public.challenge_days (
  id             uuid primary key default gen_random_uuid(),
  challenge_type text not null check (challenge_type in ('glow_up','phone_detox')),
  day_number     int not null,
  movement_task  text,
  skin_task      text,
  mindset_prompt text,
  notes          text,
  unique (challenge_type, day_number)
);

-- ---------- CHECK-INS (the behavioral dataset) ----------
create table if not exists public.check_ins (
  id             uuid primary key default gen_random_uuid(),
  enrollment_id  uuid not null references public.enrollments(id) on delete cascade,
  day_number     int not null,
  movement_done  boolean not null default false,
  skin_done      boolean not null default false,
  mindset_done   boolean not null default false,
  anchor_done    boolean not null default false,
  movement_log   text,
  mindset_answer text,
  reflection     text,
  photo_path     text,
  created_at     timestamptz not null default now(),
  unique (enrollment_id, day_number)
);

-- ---------- BADGES (cross-challenge collector) ----------
create table if not exists public.badges (
  id    uuid primary key default gen_random_uuid(),
  key   text unique not null,
  label text not null
);

create table if not exists public.user_badges (
  user_id    uuid not null references public.users(id) on delete cascade,
  badge_id   uuid not null references public.badges(id) on delete cascade,
  awarded_at timestamptz not null default now(),
  primary key (user_id, badge_id)
);

-- ---------- ACCESS CODES (single-use Discord unlock) ----------
create table if not exists public.access_codes (
  id              uuid primary key default gen_random_uuid(),
  code            text unique not null,
  user_id         uuid references public.users(id) on delete cascade,
  enrollment_id   uuid references public.enrollments(id) on delete set null,
  redeemed        boolean not null default false,
  redeemed_by_did text,
  redeemed_at     timestamptz,
  expires_at      timestamptz,
  created_at      timestamptz not null default now()
);

-- =============================================================================
-- ROW-LEVEL SECURITY
-- =============================================================================
alter table public.users          enable row level security;
alter table public.cohorts        enable row level security;
alter table public.enrollments    enable row level security;
alter table public.subscriptions  enable row level security;
alter table public.challenge_days enable row level security;
alter table public.check_ins      enable row level security;
alter table public.badges         enable row level security;
alter table public.user_badges    enable row level security;
alter table public.access_codes   enable row level security;

-- users: read/update own row only
drop policy if exists "users select own" on public.users;
create policy "users select own" on public.users
  for select using (auth.uid() = id);
drop policy if exists "users update own" on public.users;
create policy "users update own" on public.users
  for update using (auth.uid() = id);

-- cohorts + challenge_days + badges: world-readable static content
drop policy if exists "cohorts readable" on public.cohorts;
create policy "cohorts readable" on public.cohorts for select using (true);
drop policy if exists "challenge_days readable" on public.challenge_days;
create policy "challenge_days readable" on public.challenge_days for select using (true);
drop policy if exists "badges readable" on public.badges;
create policy "badges readable" on public.badges for select using (true);

-- enrollments / subscriptions: own rows
drop policy if exists "enrollments select own" on public.enrollments;
create policy "enrollments select own" on public.enrollments
  for select using (auth.uid() = user_id);
drop policy if exists "subscriptions select own" on public.subscriptions;
create policy "subscriptions select own" on public.subscriptions
  for select using (auth.uid() = user_id);

-- user_badges: own rows
drop policy if exists "user_badges select own" on public.user_badges;
create policy "user_badges select own" on public.user_badges
  for select using (auth.uid() = user_id);

-- check_ins: own (via owning enrollment)
drop policy if exists "check_ins select own" on public.check_ins;
create policy "check_ins select own" on public.check_ins for select
  using (exists (select 1 from public.enrollments e
                 where e.id = check_ins.enrollment_id and e.user_id = auth.uid()));
drop policy if exists "check_ins insert own" on public.check_ins;
create policy "check_ins insert own" on public.check_ins for insert
  with check (exists (select 1 from public.enrollments e
                      where e.id = check_ins.enrollment_id and e.user_id = auth.uid()));
drop policy if exists "check_ins update own" on public.check_ins;
create policy "check_ins update own" on public.check_ins for update
  using (exists (select 1 from public.enrollments e
                 where e.id = check_ins.enrollment_id and e.user_id = auth.uid()));

-- access_codes: NO anon/authenticated policy on purpose.
-- Only the service role (Stripe webhook + Discord bot) may read/write them.

-- =============================================================================
-- STORAGE (private bucket for daily / before-after photos)
-- =============================================================================
insert into storage.buckets (id, name, public)
values ('checkin-photos', 'checkin-photos', false)
on conflict (id) do nothing;

-- Users may only touch files under their own folder: checkin-photos/<uid>/...
drop policy if exists "checkin photos read own" on storage.objects;
create policy "checkin photos read own" on storage.objects for select
  using (bucket_id = 'checkin-photos'
         and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "checkin photos insert own" on storage.objects;
create policy "checkin photos insert own" on storage.objects for insert
  with check (bucket_id = 'checkin-photos'
              and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "checkin photos update own" on storage.objects;
create policy "checkin photos update own" on storage.objects for update
  using (bucket_id = 'checkin-photos'
         and (storage.foldername(name))[1] = auth.uid()::text);

-- =============================================================================
-- SEED: starter badges
-- =============================================================================
insert into public.badges (key, label) values
  ('glow_up_complete', 'Glow Up — Completed'),
  ('glow_legend',      'Glow Legend (Top 3)'),
  ('detox_complete',   'Phone Detox — Completed')
on conflict (key) do nothing;
