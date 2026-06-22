# The Glow Room — Build Progress Log

A running changelog of everything built, in order. Newest entries at the top.
Each entry notes **what changed**, **why**, and **any action you need to take**
(e.g. SQL to run in Supabase). Commit hashes are in `git log`.

App lives in `theglowroom/` (Next.js 16, App Router, TypeScript, Tailwind v4,
Supabase). Repo: https://github.com/dmitridefreitas-dev/glow-room

## Integrations status (verified 2026-06-15)
Re-run anytime: `cd theglowroom && node --env-file=.env.local scripts/check-integrations.mjs`.
A full owner-facing explainer lives at `SYSTEM_MAP.html` (repo root).

| Service | Job | Wired? | Status |
|---|---|---|---|
| Supabase | DB, auth, photo storage | Core | ✅ Live |
| Stripe | Payments & billing | Core | ✅ Live (test mode) |
| Resend | Access-code email | Yes | ✅ Live — ⚠️ no verified domain (only reaches own account email; verify domain + change `from` in `lib/email.ts`) |
| Discord | Community role grant/remove | Yes | ✅ Live (bot GlowRoomBot · guild TheGlowRoom · role Glow Member) |
| PostHog | Usage analytics | Yes | ✅ Live |
| OneSignal | Push reminders (Day-8 nudge) | ❌ Phase 6 | ✅ Live but idle (0 devices) |
| Sentry | Error monitoring | ❌ Phase 6 | ✅ Live but idle (only a placeholder in `app/error.tsx`) |

---

# ▶ NEXT STEPS & VERIFICATION CHECKS
_Kept current. Do these in order. After each step, run the listed checks before
moving on._

### 🟢 REPO RESTRUCTURE (2026-06-16) — Next app moved to the repo ROOT
The Next.js app no longer lives in `theglowroom/` — it's now at the repository
root (`app/`, `lib/`, `package.json`, etc. are top-level). This makes **Vercel
auto-detect and deploy it with zero config** (no "Root Directory" setting needed).
Run all app commands (`npm run dev`, `npm run build`, the `scripts/*.mjs`) **from
the repo root** now. The Discord bot's env path is now `../.env.local`.
- _To deploy:_ on Vercel just **Redeploy** the project — it builds from the root
  automatically. (If a Root Directory was set to `theglowroom`, clear it back to `./`.)

### ✅ DONE — migration 0005 (squads / Phase 8) applied 2026-06-15
Verified: `squads` + `squad_members` tables and `squad_leaderboard()` present.
Crews are live — reload `/dashboard` → **"Your crew"** to create/join one.

### ✅ DONE — migration 0004 (referrals / Phase 7) applied 2026-06-15
Verified live: referral columns + Recruiter badge present; code generation works
(e.g. `/r/4stf7m`); the `/r/[code]` capture route 307-redirects and sets the
`gr_ref` (+ `gr_ref_cohort`) cookie. Reload `/dashboard` to see the **"Invite
friends"** panel; the share card footer now carries your `/r/<code>` link.
Remaining polish (optional): gate the Recruiter reward on the referee's *payment*
(not signup) before launch; carry referral attribution through the Stripe webhook.

### ✅ DONE — Phase 4 (payments + Discord) verified locally (2026-06-15)
All six setup steps below are complete and a full test purchase succeeded:
checkout → webhook fired → `/welcome` showed the single-use code → `/verify` in
Discord promoted the account to **Server Member**. Settled values now in
`theglowroom/.env.local`: `STRIPE_MEMBERSHIP_PRICE_ID`, `STRIPE_WEBHOOK_SECRET`.
Stripe CLI installed via winget (v1.42.13). A visual user-flow map for the owner
lives at `USER_FLOW.html` (repo root — open in a browser).

> **⚠️ Recommended before go-live: review Phase 4.** It works in the happy path,
> but the money + access code path deserves a careful read. Suggested focus:
> webhook idempotency under Stripe retries; the refund/chargeback + subscription-
> cancel revoke paths (hard to trigger by hand — verify with Stripe CLI
> `stripe trigger`); access-code single-use/expiry guarantees; that the Discord
> shared-secret guard on `/api/discord/redeem` can't be bypassed; and the
> webhook signature check. Consider `/security-review` on this diff.

<details><summary>Original setup checklist (kept for reference / redeploy)</summary>

1. **Apply migrations 0001 → 0003** in Supabase SQL Editor (if not already).
2. **Run the Stripe setup script** — from `theglowroom/`:
   `node --env-file=.env.local scripts/setup-stripe.mjs`
3. **Add the printed membership price id** to `theglowroom/.env.local`
   (`STRIPE_MEMBERSHIP_PRICE_ID=price_…`) and restart `npm run dev`.
4. **Install the Stripe CLI**, then run:
   `stripe listen --forward-to localhost:3000/api/webhooks/stripe` → copy the
   `whsec_…` into `.env.local` as `STRIPE_WEBHOOK_SECRET=` and restart dev.
5. **Test a purchase:** `/join` → pay with card `4242 4242 4242 4242` → `/welcome`.
6. **Run the Discord bot** — in `bot/`: `npm install` once, then
   `node --env-file=../theglowroom/.env.local verify-bot.mjs`. Bot needs
   **Manage Roles** with its role above the Member role.
</details>

### ◐ IN PROGRESS — Phase 5: polish & pre-deploy
**Code done (2026-06-15):** real sales/landing copy, empty/error states
(`not-found`, `error`, dashboard `loading`), display-name editing
(`/dashboard/settings`), and a pre-launch countdown that is **built but currently
turned OFF** (see the box below). `npm run build` passes clean.
**Manual QA still owed (needs a human + a browser):**
- Click every route logged-out and logged-in; confirm no console errors.
- Mobile pass — especially the **TikTok / Instagram in-app browser** (where most
  Gen-Z traffic lands): check Stripe checkout redirect, photo upload, and Discord
  hand-off all work inside the in-app webview.
- Lighthouse mobile pass (perf + a11y).

> **🔌 Pre-launch countdown is built but DISABLED (toggle for launch).**
> When ON, a member who pays before their cohort's start date sees a "N days to
> go" countdown on the dashboard, and Day 1 stays locked until launch day.
> It's currently **off** so every account — including fresh test purchases (the
> Stripe setup script starts cohorts tomorrow) — lands straight in the daily loop
> instead of a countdown screen that blocks testing.
> **To re-activate for real launch:** set `PRE_LAUNCH_COUNTDOWN = true` in
> `theglowroom/lib/cohort.ts` (one line). Nothing else changes — the dashboard,
> day pages, and save action already branch on `enrollment.started`.
> **Dev tip:** `scripts/dev-start-now.mjs [N]` shifts cohort start dates so Days
> 1–N are unlocked, for testing the day-by-day unlock without waiting for real
> midnights (the DB day-lock stays fully on).

### THEN — Phase 6: deploy (folds in Sentry + push)
- Deploy `theglowroom/` to **Vercel**; set all env vars there.
  - _Check:_ production URL loads; sign-up/login works against Supabase.
- Create the **production Stripe webhook** → put real `whsec_` in Vercel.
  - _Check:_ a live test purchase provisions an enrollment + code.
- Buy domain → set `NEXT_PUBLIC_APP_URL`; switch Stripe to **live** keys.
- Host the **Discord bot** (Railway/Fly).
  - _Check:_ `/verify` works against the deployed API.
- **Sentry**: add `@sentry/nextjs`.
  - _Check:_ a thrown test error appears in the Sentry dashboard.
- **Push notifications** (Day-8 nudge): service worker + Web Push/OneSignal + a
  scheduled sender (cron).
  - _Check:_ a scheduled test push arrives on a subscribed device.

---

## 2026-06-21 — Fix: Stripe checkout infinite loop + purchase now self-provisions
**What:** Fixed the production bug where paying (test card `4242…`, then the
**6-digit `000000`** prompt) got stuck in an infinite loop and never completed.
- **Root cause:** that 6-digit code is **Stripe Link's** SMS verification, not
  3-D Secure (`4242…` never triggers 3DS). With `payment_method_types` unset,
  Checkout used the dashboard's automatic methods (which include Link); because
  we prefill `customer_email`, Link immediately demanded its OTP and looped in
  the browser / in-app webview.
- **Fix:** pin Checkout to **card only** — `payment_method_types: ["card"]` on
  both the cohort and membership sessions (`app/api/checkout/route.ts`). This
  removes Link and the whole 6-digit step; the card → expiry → CVC → pay flow now
  completes straight through. (Optional belt-and-braces: also turn Link off in
  the Stripe Dashboard → Settings → Payments.)
- **Also fixed (the next blocker after the loop):** the production Stripe webhook
  isn't set up yet (Phase 6), so a completed purchase had nothing to provision
  the enrollment/access code — `/welcome` would sit on "Finalising…" forever.
  `/welcome` now **self-heals**: it verifies the `session_id` with Stripe and, if
  the session is **paid** and belongs to the signed-in user, provisions directly.
  Provisioning logic was extracted to `lib/provision.ts`
  (`provisionFromCheckoutSession`) and is shared by **both** the webhook and
  `/welcome`, so they can't drift. It's **idempotent** (skips if already enrolled)
  and safe (only acts on a paid session owned by the current user).
- **Files:** `app/api/checkout/route.ts`, `app/welcome/page.tsx`,
  `app/api/webhooks/stripe/route.ts`, `lib/provision.ts` (new). `npm run build`
  passes clean.

> **Still recommended for go-live (config, not code):** create the **production
> Stripe webhook** (`https://<your-domain>/api/webhooks/stripe`, events
> `checkout.session.completed`, `customer.subscription.deleted`,
> `charge.refunded`, `charge.dispute.created`) and set `STRIPE_WEBHOOK_SECRET` +
> all other env vars in Vercel. The `/welcome` fallback covers the *grant-access*
> path, but **revoke on refund/chargeback/cancel still needs the live webhook**.
> Also set `NEXT_PUBLIC_APP_URL` to the real domain.

> **Known follow-up (not fixed here — needs a product decision):** a **monthly
> membership** purchase creates a `subscriptions` row but **no cohort enrollment
> or Discord access code**, so a subscriber lands on the empty dashboard. Decide
> which cohort a member auto-joins (e.g. the next upcoming one) before charging
> for memberships, then extend `provisionFromCheckoutSession`.

---

## 2026-06-15 — Phase 9 (progression): points + tier ladder (R7)
**What:** A points score + the **Bronze → Silver → Gold → Platinum → Diamond →
Champion** ladder with **graphic hexagon emblems**. Metal/gem names = instantly
legible (Gold beats Silver, no explanation). **No migration** — computed from
check-in data.
- **Score = completed×10 − missed×5** (min 0): climbs on completed days, **drops on
  missed** ones (owner wanted up-and-down). Six tiers, no divisions; thresholds get
  **progressively harder** (0/40/90/150/220/290) so Champion is near-perfect.
- **UI:** dashboard **rank card** (emblem + score + "X pts to <next>"); the tier
  also shows as a **colored chip on the share card** (verified render).
- **Files:** `lib/points.ts`, `components/Tier.tsx`, `app/dashboard/page.tsx`;
  share-card plumbing in `lib/share-token.ts` + `app/api/share-image/route.tsx`.
  `npm run build` passes. No DB change.
- **Follow-ups:** the score is **per-cohort (a "season", resets each cohort)** —
  a persistent cross-cohort "career rank" with decay is the next evolution (needs a
  stored points column). Tiered *badge* variants also deferred.

**Update (same day) — leaderboards now rank by POINTS, not days.** The cohort
leaderboard ranks by trophy **points** (the exact dashboard formula via
`scoreFor`, shared so the numbers always match) and shows each player's **tier
emblem + points**, days demoted to a subtitle. The crew leaderboard + crew header
show **crew points** (10 × completed days). The dashboard rank card was rebuilt as
a bold dark **trophy banner** (big points number + large emblem) so your standing
"pops" instead of reading as a quiet stat. No migration.

---

## 2026-06-15 — Phase 8 (community): squads / crews + crew leaderboard (R6)
**What:** The persistent "clan" layer on top of cohorts. A cohort is the
time-boxed *season*; a **crew** is the lasting group you run seasons with —
retention + sticky virality, without diluting the cohort's "start together" pressure.
- **Tables:** `squads` (name, invite_code, owner) + `squad_members` (one home crew
  per member). `0005_squads.sql`.
- **Crew leaderboard** (`squad_leaderboard()`): ranks crews by total completed days
  across members (bigger/consistent crews climb → rewards recruiting). Same
  completion rule as the cohort leaderboard. Plus `squad_members_stats()` for each
  member's contribution + owner crown.
- **UI:** `/dashboard/squad` (create / join-by-code / crew home with members, crew
  days, global rank, invite link, leave) and `/dashboard/squad/leaderboard`. A
  "Your crew" card on the dashboard. `lib/squads.ts` is **defensive** (hidden /
  friendly errors until 0005 is applied).
- **Files:** `supabase/migrations/0005_squads.sql`, `lib/squads.ts`,
  `app/dashboard/squad/{page,actions}.ts(x)`,
  `app/dashboard/squad/leaderboard/page.tsx`, `components/CopyButton.tsx`,
  `app/dashboard/page.tsx`. `npm run build` passes.

**ACTION REQUIRED:** run `0005_squads.sql` in the Supabase SQL Editor (see NOW above).

---

## 2026-06-15 — Phase 7 (growth): referrals + viral share loop (R2–R5)
**What:** Built the full virality loop on top of R1 (`creative → path → incentive`).
- **R2 — Referral program:** per-user `referral_code` + `/r/[code]` capture route
  (sets a cookie, redirects to landing); signup attributes the new member to the
  referrer (`referred_by`) and awards the referrer a **Recruiter** badge. Dashboard
  **"Invite friends"** panel shows the link, friends-joined count, and badge.
  `lib/referral.ts` is **fully defensive** — if migration 0004 isn't applied it
  returns null and the panel just hides; the dashboard never breaks.
- **R3 — Share-card virality:** the referral URL now prints on the flex story/OG
  cards (replaces the generic wordmark), and a new **`invite` card format** renders
  a branded **QR code** (via `qrcode`) of the referral link. Verified rendering.
- **R4 — Share at peak moments:** a **"Share this win"** button appears on the
  day-complete toast and the Day-30 finish card (peak emotion = peak share intent).
- **R5 — Cohort invites:** "Invite to my cohort" copies `/r/<code>?c=<cohortId>`
  (preserved through the capture route for /join preselection).
- **Files:** `lib/referral.ts`, `app/r/[code]/route.ts`,
  `supabase/migrations/0004_referrals.sql` (new), `components/InvitePanel.tsx`,
  `components/ShareWinButton.tsx`, `components/share-actions.ts`; updates to
  `app/login/actions.ts`, `app/api/share-image/route.tsx`, `lib/share-token.ts`,
  `components/ShareCard.tsx`, `app/dashboard/page.tsx`. Dep added: `qrcode`.
- PostHog events: `referral_link_copied`, `cohort_invite_copied`,
  `invite_card_shared`, `share_win`, `share_story`, `share_link_copied`.

**ACTION REQUIRED:** run `supabase/migrations/0004_referrals.sql` in the Supabase
SQL Editor. Until then the referral features stay hidden (by design); the rest of
the app is unaffected. `npm run build` passes.

---

## 2026-06-15 — Growth: server-rendered share image (RECOMMENDATIONS R1)
**What:** Real, branded **PNG** of a member's progress — the more-viral story-card
play (delight + a free acquisition loop). No new dependency (`next/og`).
- **Endpoint** `GET /api/share-image?...&format=story|og|square` renders a signed,
  snapshot PNG — story **1080×1920** (IG/TikTok), OG **1200×630** (link previews),
  square 1080×1080. Verified all three return `200 image/png` with the brand fonts
  (Bricolage Grotesque + Inter, loaded as TTF via the Google v1 legacy-UA trick).
- **Privacy/security:** stats are HMAC-signed (`SHARE_SIGNING_SECRET`) into the
  URL — public + cacheable, no DB read, no PII, can't be forged. **No rank** on the
  card (per owner).
- **`/s/[token]`** public page with `generateMetadata` → OG/Twitter tags so pasted
  links unfurl into the card.
- **Dashboard `ShareCard`:** primary **"Post to my story"** (native share sheet
  hands over the PNG; desktop falls back to download) + a quiet **"copy a link"**.
  PostHog events on share/copy.
- **Files:** `lib/share-token.ts`, `lib/og-fonts.ts`,
  `app/api/share-image/route.tsx`, `app/s/[token]/page.tsx`,
  `components/ShareCard.tsx`. Env added: `SHARE_SIGNING_SECRET`.
- **Gotcha (logged):** Satori requires `display:flex` on *every* div with >1 child
  — set it on all of them. `npm run build` passes.

---

## 2026-06-15 — Phase 5 (UI): full design overhaul
**What:** Acted on a full senior-design critique (logged in `critiques.txt` at repo
root — newest changes tracked there going forward).
- **Typography:** added a display + body type pairing — **Bricolage Grotesque**
  (headlines) + **Inter** (body) via `next/font` (self-hosted, no layout shift).
  Headings auto-use the display face; `font-display` utility available.
- **Iconography:** added `lucide-react`; replaced emoji-as-icons across the app
  (locks, trophy, medals, sprout, search, rain, pillar icons). Kept intentional
  emoji (welcome 🤍, 👋, 🎉).
- **Imagery:** landing now has an on-brand SVG "glow bloom" hero graphic, Lucide
  pillar icons, a **testimonials** section (sample quotes — replace before launch)
  and a stat band; section backgrounds alternate light/dark to break the monotony.
- **Login:** "Create my account" is now the primary action; fixed the stale
  "check your email" copy; Google button hidden behind `NEXT_PUBLIC_GOOGLE_AUTH_ENABLED`.
- **Dashboard:** reworked hierarchy — Today's check-in is the hero, the 30-day grid
  is promoted to a featured card, thicker gradient progress bar, count-up stat
  numbers with a streak flame, **confetti on day-complete / challenge-complete**
  (`Celebrate`), a **Day-30 finish state**, and a **share-ready progress card**
  (`ShareCard`, with native share/copy) as a growth loop.
- **Day check-in:** pillar icons, Lucide lock, larger prev/next tap targets.
- **A11y / hygiene:** visible `:focus-visible` rings, darker `--muted` (#565a52)
  for contrast, `prefers-reduced-motion` handling, smooth scroll, card-hover and
  number-count motion.
- New: `components/CountUp.tsx`, `components/Celebrate.tsx`, `components/ShareCard.tsx`.
  Deps added: `lucide-react`, `canvas-confetti`.

`npm run build` passes clean. **Open follow-ups** (in `critiques.txt`): replace
placeholder testimonials + hero with real photography; consider a server-rendered
share-image (OG PNG) endpoint in Phase 6.

---

## 2026-06-15 — Phase 5 (code): polish, countdown, settings, error states
**What:**
- **Landing page** is now a real sales page: hero + four pillars (kept) plus
  **How it works** (4 steps), **pricing** ($18 one-time vs $9/mo membership with
  feature lists), an **FAQ**, and a closing CTA band. `metadata`/OpenGraph +
  `viewport` (theme-color) added in `app/layout.tsx`.
- **Pre-cohort countdown (built, then gated OFF):** paid members whose cohort
  hasn't started yet would see a "You're in — N days to go" dashboard instead of a
  misleading Day-1 card. Backed by `started` / `daysUntilStart` on
  `EnrollmentInfo` (`lib/cohort.ts`, UTC-aligned to the DB day-lock); day pages
  lock all days pre-start and `saveCheckIn` refuses pre-start. **Disabled via the
  `PRE_LAUNCH_COUNTDOWN` flag in `lib/cohort.ts`** so it doesn't block testing —
  flip to `true` to re-enable for launch. Added `scripts/dev-start-now.mjs` to
  shift cohort start dates for testing the day-unlock locally.
- **Display-name editing:** new `/dashboard/settings` (display name + read-only
  account info + manage-billing) and an `updateProfile` server action;
  revalidates the dashboard + leaderboard. "Settings" link added to the dashboard
  header.
- **Empty/error states:** branded `app/not-found.tsx`, client `app/error.tsx`
  (logs to console; Sentry-ready), dashboard `loading.tsx` skeleton, and a
  friendlier "not in a cohort yet" empty state with a Join CTA.

**Files:** `app/page.tsx`, `app/layout.tsx`, `lib/cohort.ts`,
`app/dashboard/page.tsx`, `app/dashboard/day/[n]/page.tsx`,
`app/dashboard/actions.ts`, `app/dashboard/layout.tsx`,
`app/dashboard/settings/page.tsx` (new), `app/not-found.tsx` (new),
`app/error.tsx` (new), `app/dashboard/loading.tsx` (new).

**No DB migration needed.** `npm run build` passes. Remaining Phase 5 work is
manual QA (mobile / in-app browsers / Lighthouse) — see the checklist up top.

---

## 2026-06-14 — Phase 4: Stripe checkout, webhook provisioning, Discord bot
**What:**
- **Checkout** (`/join` → `/api/checkout`): one-time cohort ($18) and monthly
  membership ($9) via Stripe Checkout; metadata carries user + cohort.
- **Webhook** (`/api/webhooks/stripe`): on `checkout.session.completed` creates
  the enrollment + a **single-use access code** and emails it (Resend);
  membership creates a subscription row. Handles subscription cancel and
  refund/chargeback by revoking the enrollment + removing the Discord role.
  Idempotent (skips if already enrolled).
- **`/welcome`**: shows the access code after purchase.
- **Billing portal** (`/api/portal`): self-serve manage/cancel.
- **Discord redeem** (`/api/discord/redeem`): bot-secret-guarded; validates +
  burns the code, links the Discord account.
- **Verify bot** (`bot/`): standalone discord.js bot; `/verify code:…` calls the
  redeem API and grants the Member role.
- **Setup script** (`scripts/setup-stripe.mjs`): creates Stripe products/prices
  + a purchasable cohort.
- Libs: `lib/stripe.ts`, `lib/access-codes.ts`, `lib/email.ts`, `lib/discord.ts`.
  Dashboard links to `/join` + billing.

**ACTION REQUIRED:** See the **NEXT STEPS** checklist above (setup script, Stripe
CLI for the webhook secret, run the bot).

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
