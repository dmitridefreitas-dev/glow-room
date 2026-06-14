# The Glow Room — Build Progress Log

A running changelog of everything built, in order. Newest entries at the top.
Each entry notes **what changed**, **why**, and **any action you need to take**
(e.g. SQL to run in Supabase). Commit hashes are in `git log`.

App lives in `theglowroom/` (Next.js 16, App Router, TypeScript, Tailwind v4,
Supabase). Repo: https://github.com/dmitridefreitas-dev/glow-room

---

## 2026-06-14 — Phase 3a: leaderboard, badges, analytics
**What:**
- **Leaderboard** (`/dashboard/leaderboard`): ranks the cohort by completed days
  via a privacy-safe SQL function (`cohort_leaderboard`, SECURITY DEFINER —
  exposes only name + counts). Because of the day-lock, completed days can't
  exceed days elapsed, so it can't be gamed. Highlights "you"; medals for top 3.
- **Badges** (collector mechanic): milestone badges (First Day, 7-Day Streak,
  Halfway, Challenge Complete) auto-awarded on dashboard load and shown as
  earned/locked chips. `lib/badges.ts` + new badge rows.
- **PostHog analytics**: initialised client-side with autocapture + pageviews,
  and identifies the logged-in user (`app/providers.tsx`, wired in root layout).
- Dashboard now links to the leaderboard and shows the badge shelf.

**Files:** `supabase/migrations/0003_leaderboard_badges.sql` (new),
`lib/badges.ts` (new), `app/dashboard/leaderboard/page.tsx` (new),
`app/providers.tsx` (new), `app/layout.tsx`, `app/dashboard/page.tsx`.

**ACTION REQUIRED:** Run `supabase/migrations/0003_leaderboard_badges.sql` in the
Supabase SQL Editor.

**Still to do in Phase 3:** Sentry error monitoring (quick) and push
notifications incl. the Day-8 nudge (needs a service worker + a scheduled sender
+ OneSignal config — best wired alongside deploy).

---

## 2026-06-14 — Locked day cells styling
**What:** Locked days show the **day number centered (50% opacity)** with the 🔒
in the **upper-right corner at full number size**, so the day is clearly readable
and obviously locked. **Files:** `app/dashboard/page.tsx`.

---

## 2026-06-14 — Anti-cheat day-lock + this progress log
**What:**
- Added a **day-lock**: you can only check in for days that have unlocked. Day 1
  is open today; each following day unlocks at **00:00 UTC**. This caps everyone's
  completed-day count at days elapsed, so nobody can pre-fill the whole challenge
  and jump the leaderboard.
- Enforced in the **database** via a trigger (`enforce_checkin_day`) so it can't
  be bypassed by calling the API directly — not just hidden in the UI.
- UI: future days show a 🔒 "locked — unlocks <date>" panel instead of the form;
  the day grid shows locked days with a lock icon; the save action gives a
  friendly "not unlocked yet" message.
- Aligned the app's day math to **UTC** so the UI and DB always agree.
- Created this `PROGRESS.md`.

**Files:** `supabase/migrations/0002_day_lock.sql` (new), `lib/cohort.ts`,
`app/dashboard/actions.ts`, `app/dashboard/day/[n]/page.tsx`,
`app/dashboard/page.tsx`.

**ACTION REQUIRED:** Run `theglowroom/supabase/migrations/0002_day_lock.sql` in
the Supabase SQL Editor.

**Testing tip:** the local "Dev Cohort" starts today, so only Day 1 is open. To
test more days locally, backdate it in the SQL Editor (e.g. open 5 days):
```sql
update public.cohorts
set start_date = current_date - 4
where name = 'Dev Cohort — local testing';
```

---

## 2026-06-14 — Phase 2 audit: progress feedback + completion fixes
**What:** Fixed the "nothing updates when I save" confusion.
- Streak/Days-complete require **all** of a day's pillars; the UI now explains
  partial progress instead of silently staying at 0.
- Smart save toast: "Day 1 complete! 🎉" vs "Day 1 saved — 3 of 4 tasks done…".
- Today card shows live task progress dots; day page shows "X of N tasks ticked".
- **Bug fix:** Phone Detox has no skin step, so a detox day could never reach
  "complete". Completion is now challenge-aware (Glow Up = 4 pillars, Detox = 3).
- Save errors now surface instead of failing silently.

**Files:** `lib/progress.ts` (new), `app/dashboard/page.tsx`,
`app/dashboard/day/[n]/page.tsx`, `app/dashboard/actions.ts`.

---

## 2026-06-14 — Show saved check-in photo
**What:** The day page now displays your uploaded photo (via a 1-hour signed URL,
because the bucket is private). **Files:** `app/dashboard/day/[n]/page.tsx`.

---

## 2026-06-14 — Auth fixes (email rate limit + Google error)
**What:**
- Switched primary auth to **email + password** (sign up once, then log in with a
  password — no email round-trip per login). Dropped the magic-link UI.
- Accounts are created **already-confirmed** via the service-role admin API, so
  no verification email is ever sent and it works regardless of the Supabase
  "Confirm email" setting. Auto-recovers previously-stuck unconfirmed accounts.
- Google login kept as an optional button (needs enabling in Supabase + Google
  Cloud). **Files:** `app/login/actions.ts`, `app/login/page.tsx`.

---

## 2026-06-14 — Phase 2: core daily check-in loop
**What:**
- Habit-anchor **intake quiz** (`/dashboard/intake`).
- **Day check-in** (`/dashboard/day/[n]`): four pillars from seeded content,
  checkboxes, optional logs/reflection, **private photo upload** to Supabase
  Storage; prefills if already saved; Day-8 encouragement module.
- **Dashboard**: streak, days-complete, progress bar, today CTA, 30-day grid.
- **Dev auto-enrollment** (`lib/cohort.ts`): in local dev, signing in creates a
  "Dev Cohort" so the loop is testable before payments exist. Skipped in
  production (real enrollment comes from Stripe in Phase 4).
- Service-role admin client (`lib/supabase/admin.ts`) for provisioning.

**Files:** `app/dashboard/*`, `lib/cohort.ts`, `lib/supabase/admin.ts`.

---

## 2026-06-14 — Phase 0 + 1: foundation, auth, schema
**What:**
- Converted the scaffold to **App Router + TypeScript** with Tailwind v4 brand
  tokens (Spruce/Coral palette). Branded landing page.
- Supabase client/server helpers; **`proxy.ts`** session guard (Next 16 renames
  Middleware → Proxy). Gated `/dashboard`.
- Auth: login + `/auth/callback` + sign-out.
- **Database**: `supabase/migrations/0001_init.sql` — all tables (users, cohorts,
  enrollments, subscriptions, challenge_days, check_ins, badges, access_codes) +
  Row-Level Security + new-user trigger + private storage bucket.
- **Seed**: `supabase/seed.sql` — Glow Up days 1-30, Phone Detox days 1-7.

**Files:** `app/`, `lib/supabase/`, `proxy.ts`, `supabase/`.

**ACTION (one-time):** Run `0001_init.sql` then `seed.sql` in Supabase SQL Editor;
set Site URL + redirect URL `http://localhost:3000/**` in Auth settings.

---

## 2026-06-14 — Repo + secrets setup
**What:** Moved live secrets out of the infra `.txt` into git-ignored
`.env.local`; added `.env.example` + `.gitignore`; initialised git and pushed to
GitHub. Initial commit included the business plan + infrastructure plan.

---

## Earlier — Planning artifacts (not app code)
- Investor business plan (`GlowUp_Business_Plan_V2.html` + PDF) with a live,
  slider-driven financial model.
- `WEBAPP_INFRASTRUCTURE_PLAN.txt` — the full technical build plan (Stripe vs
  Shopify decision, schema, Stripe + Discord flows, phases).
