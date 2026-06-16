-- =============================================================================
-- The Glow Room — day-lock anti-cheat (Phase 2.1)
-- Apply in Supabase Dashboard > SQL Editor AFTER 0001_init.sql.
--
-- A day only "unlocks" once that calendar day has arrived for the cohort.
-- Reset happens at 00:00 UTC (current_date). This is enforced in the database
-- via a trigger, so it cannot be bypassed by calling the REST API directly:
-- nobody can pre-fill future days, which caps everyone's completed-day count at
-- the number of days that have actually elapsed — keeping the leaderboard fair.
--
-- To change the reset timezone (e.g. US Eastern), replace `current_date` with
--   (now() at time zone 'America/New_York')::date
-- and mirror the same timezone in lib/cohort.ts.
-- =============================================================================

create or replace function public.enforce_checkin_day()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_start   date;
  v_type    text;
  v_total   int;
  v_allowed int;
begin
  select c.start_date, c.challenge_type
    into v_start, v_type
  from public.enrollments e
  join public.cohorts c on c.id = e.cohort_id
  where e.id = NEW.enrollment_id;

  v_total := case when v_type = 'phone_detox' then 7 else 30 end;

  if v_start is null then
    -- No start date configured: don't block (treat all days as open).
    v_allowed := v_total;
  else
    v_allowed := least(greatest((current_date - v_start) + 1, 1), v_total);
  end if;

  if NEW.day_number < 1 or NEW.day_number > v_allowed then
    raise exception
      'DAY_LOCKED: day % has not unlocked yet (today is day %).',
      NEW.day_number, v_allowed
      using errcode = 'check_violation';
  end if;

  return NEW;
end;
$$;

drop trigger if exists trg_enforce_checkin_day on public.check_ins;
create trigger trg_enforce_checkin_day
  before insert or update on public.check_ins
  for each row execute function public.enforce_checkin_day();
