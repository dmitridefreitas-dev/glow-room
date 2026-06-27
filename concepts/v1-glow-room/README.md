# v1 — The Glow Room (built, live)

The 30-day glow-up game as it stands today. Preserved as our first pathway.

**What it is:** a "modern juicy game" version of a 30-day glow-up challenge —
daily check-ins across 4 pillars (movement / skin / mindset / anchor), an evolving
glow-avatar, a climbable journey **ladder** (missed days = broken rungs),
XP / levels / tiers / badges, streaks, crews, before/after photos, and a cozy
once-a-day **Glow Room** (`/play`) where you tend your room and it blooms.

**Routes:** `/dashboard` (home), `/play` (the room), `/dashboard/day/[n]`,
`/dashboard/leaderboard`, `/dashboard/squad`, `/dashboard/settings`.
**Stack:** Next.js 16 + React 19 + Tailwind v4 + Supabase. Live on Vercel
(`glow-room.vercel.app`).

**What it's great at:** delightful, on-brand, genuinely game-like — strong for an
already-motivated self-improver who wants a fun 30-day push.

**Where it's likely too much for the core mission:** for someone who can't get out
of bed, the game / score / map / ladder is a lot of UI standing between them and
the one thing they actually need to do. That gap is what `../v2-one-next-step/`
is trying to close. See `../PROBLEM.md`.

**Decision:** keep it. It stays live and untouched. The warm glow-avatar from here
is worth carrying forward into v2 as a gentle companion; the scoring/competition
layer is not.
