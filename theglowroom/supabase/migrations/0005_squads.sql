-- =============================================================================
-- The Glow Room — squads / crews (Phase 8, RECOMMENDATIONS R6)
-- Apply AFTER 0001–0004. Persistent small groups (the "clan" layer) that run
-- cohorts together, plus a squad-vs-squad leaderboard.
--
-- All app access goes through the service-role client / these SECURITY DEFINER
-- functions, so RLS is enabled with no public policies (locked down by default).
-- =============================================================================

create table if not exists public.squads (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  invite_code text unique not null,
  owner_id    uuid not null references public.users(id) on delete cascade,
  created_at  timestamptz not null default now()
);

create table if not exists public.squad_members (
  squad_id  uuid not null references public.squads(id) on delete cascade,
  user_id   uuid not null references public.users(id) on delete cascade,
  role      text not null default 'member' check (role in ('owner','member')),
  joined_at timestamptz not null default now(),
  primary key (squad_id, user_id),
  unique (user_id)               -- one "home crew" per member
);

alter table public.squads enable row level security;
alter table public.squad_members enable row level security;

-- ---------- Squad leaderboard (squad-vs-squad) ----------
-- Ranks squads by total completed days across all members (bigger active crews
-- win — which rewards recruiting). Same completion rule as cohort_leaderboard.
create or replace function public.squad_leaderboard()
returns table (
  squad_id       uuid,
  name           text,
  member_count   int,
  completed_days int
)
language sql
security definer
set search_path = public
as $$
  select
    s.id as squad_id,
    s.name,
    count(distinct sm.user_id)::int as member_count,
    coalesce(sum(
      case when ci.movement_done and ci.mindset_done and ci.anchor_done
        and (ci.skin_done or c.challenge_type = 'phone_detox')
      then 1 else 0 end
    ), 0)::int as completed_days
  from public.squads s
  join public.squad_members sm on sm.squad_id = s.id
  left join public.enrollments e on e.user_id = sm.user_id and e.status = 'active'
  left join public.cohorts c on c.id = e.cohort_id
  left join public.check_ins ci on ci.enrollment_id = e.id
  group by s.id, s.name
  order by completed_days desc, member_count desc, s.name;
$$;

grant execute on function public.squad_leaderboard() to anon, authenticated;

-- ---------- Members of one squad, with their contribution ----------
create or replace function public.squad_members_stats(p_squad_id uuid)
returns table (
  user_id        uuid,
  display_name   text,
  completed_days int,
  is_owner       boolean
)
language sql
security definer
set search_path = public
as $$
  select
    sm.user_id,
    coalesce(u.display_name, split_part(u.email, '@', 1)) as display_name,
    coalesce(count(ci.*) filter (
      where ci.movement_done and ci.mindset_done and ci.anchor_done
        and (ci.skin_done or c.challenge_type = 'phone_detox')
    ), 0)::int as completed_days,
    (sm.role = 'owner') as is_owner
  from public.squad_members sm
  join public.users u on u.id = sm.user_id
  left join public.enrollments e on e.user_id = sm.user_id and e.status = 'active'
  left join public.cohorts c on c.id = e.cohort_id
  left join public.check_ins ci on ci.enrollment_id = e.id
  where sm.squad_id = p_squad_id
  group by sm.user_id, u.display_name, u.email, sm.role
  order by completed_days desc, display_name;
$$;

grant execute on function public.squad_members_stats(uuid) to anon, authenticated;
