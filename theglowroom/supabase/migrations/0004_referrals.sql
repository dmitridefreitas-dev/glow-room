-- =============================================================================
-- The Glow Room — referrals + growth (Phase 7, RECOMMENDATIONS R2)
-- Apply AFTER 0001–0003. Adds a per-user referral code, an attribution link
-- (who referred whom), and a "Recruiter" collectible badge.
-- =============================================================================

-- Per-user public referral code (short, unique). Generated lazily by the app.
alter table public.users
  add column if not exists referral_code text unique;

-- Attribution: which existing member referred this user (set once at signup).
alter table public.users
  add column if not exists referred_by uuid
    references public.users(id) on delete set null;

create index if not exists idx_users_referred_by
  on public.users(referred_by);

-- Reward for referring: a collectible badge (cheapest incentive to start).
insert into public.badges (key, label)
values ('recruiter', 'Recruiter')
on conflict (key) do nothing;
