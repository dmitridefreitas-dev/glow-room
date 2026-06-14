-- =============================================================================
-- The Glow Room — leaderboard + badges (Phase 3)
-- Apply in Supabase Dashboard > SQL Editor AFTER 0002_day_lock.sql.
-- =============================================================================

-- ---------- Milestone badges ----------
insert into public.badges (key, label) values
  ('first_day', 'First Day Done'),
  ('week_one',  '7-Day Streak'),
  ('halfway',   'Halfway There')
on conflict (key) do nothing;

-- ---------- Leaderboard function ----------
-- Returns a ranked, privacy-safe view of a cohort: display name + completed-day
-- count + total tasks done. SECURITY DEFINER so it can aggregate across all
-- members (bypassing RLS) while exposing only non-sensitive fields. A day counts
-- as "complete" only if every applicable pillar is done — and because of the
-- day-lock, completed days can never exceed days elapsed, so this can't be gamed.
create or replace function public.cohort_leaderboard(p_cohort_id uuid)
returns table (
  user_id        uuid,
  display_name   text,
  completed_days int,
  tasks_done     int
)
language sql
security definer
set search_path = public
as $$
  select
    e.user_id,
    coalesce(u.display_name, split_part(u.email, '@', 1)) as display_name,
    count(ci.*) filter (
      where ci.movement_done and ci.mindset_done and ci.anchor_done
        and (ci.skin_done or c.challenge_type = 'phone_detox')
    )::int as completed_days,
    coalesce(sum(
      (ci.movement_done)::int + (ci.skin_done)::int
      + (ci.mindset_done)::int + (ci.anchor_done)::int
    ), 0)::int as tasks_done
  from public.enrollments e
  join public.cohorts c on c.id = e.cohort_id
  join public.users   u on u.id = e.user_id
  left join public.check_ins ci on ci.enrollment_id = e.id
  where e.cohort_id = p_cohort_id and e.status = 'active'
  group by e.user_id, u.display_name, u.email
  order by completed_days desc, tasks_done desc, e.user_id;
$$;

grant execute on function public.cohort_leaderboard(uuid) to anon, authenticated;
