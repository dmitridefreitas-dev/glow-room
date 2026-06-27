# Concepts — our iteration space

We keep the Glow Room we've built and explore better pathways here **without
destroying anything**. We keep trying versions until one clearly helps the person
in `PROBLEM.md`.

- **`PROBLEM.md`** — the north star. The real problem, user, and non-negotiables. Read first.
- **`v1-glow-room/`** — what's built today (the 30-day glow-up game). Preserved as pathway #1.
- **`v2-one-next-step/`** — the proposed simplest pathway: one small step at a time.
- add `v3-…/`, `v4-…/` as we try more.

## How versions actually run (important)
Each version is a **route in the same Next.js app**, so every version deploys and
is clickable, all sharing one login + one Supabase backend:

- v1 (Glow Room) lives at `/dashboard` + `/play` — untouched.
- v2 will get its own route, e.g. **`/today`**.
- v3, v4… get their own routes too.

We do **not** copy the whole app into a folder — that would break the build and the
deploy. Instead: **code lives as new routes; the thinking for each version lives
here** as a short README. That way nothing we've built is ever lost, and you can
A/B them live on the same site.
