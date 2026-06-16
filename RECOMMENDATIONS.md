# The Glow Room — Recommendations

Forward-looking recommendations and proposals (the proactive sibling to
`critiques.txt`, which tracks problems with the *current* build). Each entry is a
plan, not yet executed. Status tags:
`[ ] proposed` · `[~] in progress` · `[x] shipped` · `[-] declined/deferred`.

---

## R1 — Server-rendered share image (PNG OG / story card)  `[x] shipped 2026-06-15`

> **SHIPPED.** Built with `next/og`, signed snapshot params, no new deps.
> Endpoint `GET /api/share-image?...&format=story|og|square` renders a branded
> PNG (story 1080×1920, OG 1200×630, square 1080×1080); `/s/[token]` is the
> public link-preview page (`generateMetadata` → OG/Twitter tags). Dashboard
> `ShareCard` now has a primary **"Post to my story"** (native share sheet → PNG,
> desktop falls back to download) + a quiet **"copy a link"**. Files:
> `lib/share-token.ts`, `lib/og-fonts.ts`, `app/api/share-image/route.tsx`,
> `app/s/[token]/page.tsx`, `components/ShareCard.tsx`. Env: `SHARE_SIGNING_SECRET`.
> Verified: all three formats return 200 image/png with Bricolage + Inter fonts.
> Satori gotcha hit & fixed: **every div needs `display:flex`** (even single-child).

**One-liner:** Generate a real, branded **PNG** of a member's progress on the
server — both as a downloadable IG/TikTok **story card** and as the **Open Graph
image** shown when they paste a Glow Room link. Today's `ShareCard` is only
screenshot-able; this makes sharing one tap and makes shared *links* look rich.

### Why it's worth doing (the growth case)
- Members come from **TikTok/IG**; the product thesis is "together." A clean,
  on-brand image that posts itself is **delight + a free acquisition loop**.
- A screenshot is lossy, off-center, and has the browser chrome in it. A
  purpose-built **1080×1920** PNG is post-ready and carries branding + a CTA.
- Rich **link previews** (OG image) mean every shared URL in a DM or bio looks
  designed, not like a bare link — higher click-through into the funnel.
- Closes critique **#20** in `critiques.txt`.

### Approach (recommended)
Use **`next/og`** (`ImageResponse`, built into Next 16 — no new dependency). It
renders a JSX/CSS subset via Satori → PNG. Two surfaces:

1. **Downloadable story card** — an API route returning a PNG the member saves
   and posts. `GET /api/share-image?...signed-params...&format=story`.
2. **Link-preview OG image** — a public `app/s/[token]/` page whose
   `generateMetadata` points at the same image route, so pasted links unfurl with
   the card.

**Data & privacy — use signed, stateless params (no DB read, no PII):**
- Encode only public-safe fields in the URL: `name` (display name), `streak`,
  `completed`, `total`, optional `badge`. These are the same fields already public
  on the leaderboard. **Never** email/user-id.
- **HMAC-sign** the params with a server secret (`SHARE_SIGNING_SECRET`, new env)
  so stats can't be forged ("999-day streak"). The route verifies the signature
  before rendering; bad/missing signature → generic fallback card.
- Stateless = snapshot at share time. That's *correct* for a story image and
  keeps the endpoint public, cacheable, and DB-free.

### Architecture / files (proposed)
- `lib/share-token.ts` — `signShare(payload)` / `verifyShare(query)` using
  `crypto` HMAC; helper `buildShareUrl(appUrl, payload, format)`.
- `lib/og-fonts.ts` — fetch + cache the **Inter** and **Bricolage Grotesque** font
  bytes (Satori needs raw font data; it can't use `next/font`). Host the `.ttf`
  in `public/fonts/` or fetch once and module-cache.
- `app/api/share-image/route.tsx` — `GET` returns `ImageResponse`. Reads signed
  params + `format` (`story` 1080×1920 | `og` 1200×630 | `square` 1080×1080).
  Rebuild the `ShareCard` visual in **Satori-safe inline styles** (flexbox only —
  no Tailwind, no CSS grid, limited gradients; layer solid blocks for the glow).
  Set `Cache-Control: public, immutable, max-age=...` keyed by the signature.
- `app/s/[token]/page.tsx` — tiny public page with `generateMetadata()` →
  `openGraph.images` + `twitter.card = "summary_large_image"` pointing at the
  image route; body is a CTA ("Start your own glow up").
- Update `components/ShareCard.tsx` — add **"Download story card"** (links to the
  image route w/ `format=story`) and have the **Share** button share the `/s/[token]`
  URL so the preview unfurls. Fire PostHog `share_image_downloaded` /
  `share_link_copied` events.

### Formats to ship
- **Story 1080×1920** (primary — IG/TikTok stories). 
- **OG 1200×630** (link previews). 
- *(optional)* Square 1080×1080 for feed.
Bake a small **"theglowroom — join the next cohort"** footer + brand bars into the
image, and add `?utm_source=share` to any link in the share text.

### Step-by-step
1. Add `SHARE_SIGNING_SECRET` to `.env.local` + `.env.example`; write
   `lib/share-token.ts` (sign/verify/build).
2. Add fonts for Satori (`public/fonts/*` + `lib/og-fonts.ts` loader).
3. Build the Satori-safe card renderer (story + og variants) and the
   `app/api/share-image/route.tsx` endpoint; verify signature; set caching.
4. Add `app/s/[token]/page.tsx` with `generateMetadata` for rich unfurls.
5. Wire `ShareCard` buttons (download + share link) + PostHog events.
6. Test: hit the endpoint in a browser at each size; check fonts render, no emoji
   tofu, correct dimensions; paste a `/s/[token]` link into a link-preview
   debugger.

### Risks / gotchas
- **Satori CSS is a subset** — flexbox only, no Tailwind, limited gradients. The
  card must be rebuilt with inline styles; budget time for visual tuning.
- **Fonts must be loaded as bytes**; `next/font` objects don't work in `next/og`.
- **Emoji** render as tofu in Satori without a Twemoji fallback — prefer the
  Lucide-style/SVG/text marks we already moved to, or load Twemoji.
- Keep the endpoint **public but signed** — it must be auth-free for crawlers to
  fetch the OG image, so signing is what prevents spoofed stats.

### Effort & dependencies
- **~0.5–1 day.** No new npm dependency (`next/og` is built in); just a new env
  secret and a couple of font files.

### Decisions (locked 2026-06-15)
- **Card content: NO leaderboard rank.** Card shows display name + streak + days
  complete + optional latest badge only.
- **Story image is the priority** (it's the more viral surface — a full-screen
  branded post, not a scroll-past link sticker). Build the downloadable/share PNG
  first; the OG link preview ships alongside as the secondary path.
- **Share UX = one hero action + a whisper link** (have both, no clutter via
  hierarchy):
    - PRIMARY button **"Post to my story →"** → opens the native share sheet with
      the **PNG image** (routes to IG / TikTok / Messages / etc. in one tap).
      Desktop / no file-share → falls back to downloading the PNG.
    - SECONDARY tiny text link **"or copy a link"** → copies the `/s/[token]` URL
      for DMs and bios, where the OG preview unfurls it. Low contrast, small.
    - Label wording is deliberate: "Post to my story" reads instantly; avoid
      "Share image."
- **Snapshot stats** (freeze at share time) — simpler, more private, and correct
  for a "where I am right now" story post. A one-tap regenerate gives a fresh card.

### Open decisions (for the owner)
- None blocking — ready to build when greenlit.

### Explainer: "OG link preview" and "snapshot vs live"
**OG link preview** — "OG" = Open Graph, the standard every app uses to turn a
pasted link into a little card with an image + title instead of a bare URL. When a
member drops a Glow Room link in an IG DM, iMessage, Discord, WhatsApp or X, it
would unfurl into their branded progress card. It's automatic (no download) and
makes every shared link look designed → more clicks into the funnel. This is
*separate* from the downloadable story PNG, which they save and post manually.

**Snapshot vs live** — what the image shows and when it's captured:
- *Snapshot:* freezes the stats at the moment of sharing. Share on Day 7 with a
  7-day streak and that image always says "7-day streak," even months later. Like
  a photo of the moment. Simple + private (stats ride inside the signed link, no
  DB lookup). Want an updated card? One tap generates a fresh one.
- *Live:* the image regenerates with current stats every view — a friend opening
  the old link on Day 20 would see "20-day streak." Like a live scoreboard. Needs
  a public per-person DB lookup → more complexity + privacy surface.
Recommendation: snapshot — a story post is meant to capture "where I am right now."

---

## Virality strategy — the framing

A beautiful share card is the **creative**, but virality needs a full **loop**:
`creative → a path back → an incentive`. R1 shipped the creative. Today the path
is weak ("theglowroom" as non-tappable text) and there's **no incentive**. R2–R5
close those gaps. Owner has **agreed in principle** to all of the below
(2026-06-15) — these are plans, not yet built.

---

## R2 — Referral program (the single biggest lever)  `[x] shipped 2026-06-15`

> **SHIPPED** (needs migration `0004_referrals.sql` applied to go live). Per-user
> `referral_code`, `/r/[code]` capture → cookie → signup attribution
> (`referred_by`), Recruiter badge reward, dashboard "Invite friends" panel.
> `lib/referral.ts` is defensive (hidden until 0004 is applied). See PROGRESS Phase 7.


**One-liner:** Give every member a unique invite link/code and reward **both
sides** when a referral joins. This closes the path *and* adds the incentive *and*
gives attribution — and the R1 share card becomes the ad creative for it.

**Why:** A pretty card with nowhere to go leaks. A referral link gives the viewer
a reason to act and the sharer a reason to push. It's the most durable growth loop
and the foundation R3–R5 plug into.

**Approach (proposed):**
- Per-user **referral code/slug** (e.g. `glowroom.app/r/maya`) stored on the user;
  resolve it at signup to attribute the new member to the referrer.
- **Double-sided reward** — options to pick from: a free membership month, a
  cohort discount, or a collectible **"Recruiter" badge** (cheapest to start).
- Bake the referral URL into the share card's CTA + the share caption (replaces the
  generic "theglowroom" line) and add `?ref=maya&utm_source=share`.
- A simple **"Invite & earn" panel** on the dashboard showing their link + how many
  they've referred.
- Track `referral_link_copied`, `referral_signup` in PostHog for the funnel.

**Key considerations:** reward funding/abuse (cap rewards, require the referee to
*pay* before a reward unlocks); Stripe coupon vs free-month mechanics; keep codes
human-readable. **Effort: ~1–2 days** (schema + attribution + reward issuance).

---

## R3 — Share-card virality mechanics (QR vs URL, two card modes)  `[x] shipped 2026-06-15`

> **SHIPPED.** Referral URL now prints on the flex story/OG cards; new `invite`
> card format renders a brand-colored **QR** of the referral link (`qrcode`).
> Verified rendering. (Flex card stays clean; invite card is the QR-forward one.)


**One-liner:** Make the R1 card *act* viral without making it look like an ad —
lead with a short URL, treat QR as a small secondary element, and split into two
card "modes."

**Decisions (owner agreed 2026-06-15):**
- **Lead with a short, memorable URL** on the card (ideally the R2 referral URL,
  e.g. `glowroom.app/maya`). On a story viewed on the *same phone*, a QR can't be
  scanned off your own screen — a URL works everywhere (type it or pair a link
  sticker).
- **QR = small corner element, not the hero.** It earns its place for the
  *cross-device / in-person* cases: a creator showing the card to their audience,
  printed flyers, a member showing a friend in person.
- **The most actionable element shouldn't live *on* the image.** IG/TikTok don't
  make image text tappable, but they have native **link stickers** — so the share
  flow should *nudge the user to add a link sticker* pointing to their referral URL.
  Image = the hook; sticker = the tap.
- **Two card modes** (don't over-brand — the more "JOIN NOW" plastered on, the less
  people want to post it; people share what makes *them* look good, not your ad):
    - **Flex card** (the current story card) — clean, aspirational, *barely*
      branded. Desirability *is* the virality. Keep CTA whisper-quiet.
    - **Invite card** — a separate "bring a friend" variant where the QR + referral
      code *are* the point. Surfaced via an explicit "invite a friend" action.

**Approach:** add a `mode=flex|invite` (or new `format`) to `/api/share-image`;
QR via a tiny dependency or a QR image service rendered into the Satori tree; pull
the URL from R2. **Effort: ~0.5 day** once R2 exists.

---

## R4 — Share at peak-emotion moments  `[x] shipped 2026-06-15`

> **SHIPPED.** "Share this win" button on the day-complete toast + the Day-30
> finish card (`ShareWinButton`). Fires the story-card share at the dopamine spike.
> (Milestone-specific card *art* — "7-day streak!" etc. — left as a future polish.)


**One-liner:** Auto-prompt "Share this win" exactly when the confetti fires —
peak emotion = peak share intent. We already *have* the moments; we're just not
*asking* at them.

**Why:** Share volume is a function of *when* you ask. Asking at a neutral moment
gets ignored; asking at the dopamine spike converts. These are the spikes:
**Day 1 done · 7-day streak · halfway (Day 15) · Day 30 complete · every badge
unlock.**

**Approach (proposed):**
- At each milestone (we already detect them for badges + the `Celebrate` confetti),
  show a small **"Share this win →"** affordance that opens the R1 share flow with a
  milestone-specific card variant ("7-day streak!", "Halfway 🎉", "Day 30 — done").
- Optionally a one-time, dismissible nudge so it never feels naggy.
- Track which moment drives the most `share → click → signup` in PostHog so we can
  double down on the winner (likely Day-30 and 7-day-streak).

**Key considerations:** frequency-cap so it's celebratory, not spammy; milestone
copy + card variants. **Effort: ~0.5–1 day** (mostly UI + card copy; builds on R1).

---

## R5 — Cohort invite links ("bring your group")  `[x] shipped 2026-06-15`

> **SHIPPED.** "Invite to my cohort" copies `/r/<code>?c=<cohortId>`; the capture
> route preserves the cohort for /join. (Full checkout pre-selection of that cohort
> is a small follow-up.)


**One-liner:** Let a member invite friends **into their specific cohort** with one
link. The product's whole thesis is *together* — so inviting friends to do it *with
you* is the most natural viral act there is (and it boosts retention too).

**Why:** "Do it together" is the differentiator. Friends who start the same cohort
hold each other accountable (retention) and each invite is an organic acquisition.
This is virality that's *intrinsic* to the product, not bolted on.

**Approach (proposed):**
- A shareable **cohort invite link** (e.g. `glowroom.app/join/cohort-xyz?ref=maya`)
  that pre-selects that cohort at checkout and attributes the referrer (ties to R2).
- A dashboard **"Start with friends"** action (especially strong in the pre-cohort
  countdown window, when there's still time to recruit your group).
- Optional: a "squad" view showing which friends are in your cohort.

**Key considerations:** cohort capacity/limits; what happens if the cohort fills;
overlap with R2 attribution. **Effort: ~1 day** (mostly checkout pre-selection +
attribution; depends on R2).

---

## Production notes (small hardening items, not blocking)

- **PN1 — `NEXT_PUBLIC_APP_URL` must be the live domain in production.** The R1
  share links (`/s/[token]`) and the OG image URL are built from it; in prod it has
  to be the real domain or shared links/previews won't resolve. Already on the
  Phase 6 deploy checklist — just don't forget it when setting Vercel env vars.
- **PN2 — Bundle the share-image fonts to remove the external fetch.** R1's
  `lib/og-fonts.ts` fetches Inter + Bricolage Grotesque from Google at render time
  (legacy-UA → TTF) and caches in memory. Works fine, but it's an external
  dependency on the cold render. If we ever want zero external calls / more
  reliability, drop the two `.ttf` files into `public/fonts/` and read them locally
  instead. ~15 min when desired.

---

## R6 — Squads / Crews (the "clan" layer) + crew leaderboard  `[x] shipped 2026-06-15`

> **SHIPPED** (needs migration `0005_squads.sql` applied to go live).

**One-liner:** A persistent group (3–8 friends) that runs cohorts *together*,
with a lasting identity and a **squad-vs-squad leaderboard** — the Clash-style
engagement loop, sized for this product.

**Framing (why this and not "cohort = clan"):** A cohort is a *time-boxed season*
— its power is the synchronous "everyone starts Day 1, no skipping" pressure that
drives completion. Don't dilute that. A **crew is the persistent layer on top**:
the group you run seasons *with*. Cohort = the season now; crew = your home team.
Why it fits: (1) retention — a reason to stay between cohorts (key for the $9/mo
tier); (2) it's the natural evolution of R5 "bring your group"; (3) crew-vs-crew
competition is sticky virality ("join my crew"). Caveat: clans need critical mass
to feel alive — Discord is the MVP community layer until volume justifies formal
crews. (We built it now at the owner's request; it shines once cohorts fill.)

**What shipped:**
- `squads` + `squad_members` tables (one home crew per member), `invite_code`.
- **Crew leaderboard** (`squad_leaderboard()`): ranks crews by *total* completed
  days across members — bigger, more consistent crews climb, which rewards
  recruiting. Same completion rule as `cohort_leaderboard`.
- `squad_members_stats()`: each member's contribution (days) + owner crown.
- `/dashboard/squad` — create / join (by code) / crew home (members, crew days,
  global rank, invite link, leave); `/dashboard/squad/leaderboard` — crew board.
- Dashboard "Your crew" card. `lib/squads.ts` is defensive (hidden until 0005).
- Files: `supabase/migrations/0005_squads.sql`, `lib/squads.ts`,
  `app/dashboard/squad/*`, `components/CopyButton.tsx`, dashboard link.

**Open follow-ups:** roles beyond owner/member (elder/mod); crew chat (Discord
auto-channel per crew); seasonal crew resets; cap crew size; reward gating.

---

## R7 — Points + Bronze→Champion tier ladder (graphic emblems)  `[x] shipped 2026-06-15`

> **SHIPPED — no migration needed** (computed from check-in data).

**One-liner:** A single legible **points** score that climbs on completed days and
**drops on missed ones**, mapped to the universally-understood
**Bronze → Silver → Gold → Platinum → Diamond → Champion** ladder with **graphic
hexagon emblems** (not abstract words — you see Gold, you know it beats Silver).

**Why graphic + metal names:** the owner rightly flagged that abstract tiers
("Ember/Sprout/Glow") aren't legible — metal/gem order is common sense. Emblems are
identity, screenshot-worthy (they ride on the R1/R3 share cards), and read instantly.

**Mechanic (decisions locked 2026-06-15):**
- **Score = completed days × 10 − missed (elapsed, uncompleted) days × 5** (min 0).
  Goes **up and down** (owner wanted the Clash-style dynamic, not only-up).
- **Six tiers, no divisions.** Thresholds get **progressively harder**
  (0 / 40 / 90 / 150 / 220 / 290 — gaps 40→50→60→70→70) so Champion must be earned
  (near-perfect within a cohort). Owner confirmed "harder as you go up."
- Streak still carries its own loss-aversion; tiers add the climb.

**What shipped:** `lib/points.ts` (TIERS, `computeScore`, `tierProgress`),
`components/Tier.tsx` (hexagon `TierEmblem`/`TierBadge`), a dashboard **rank card**
(emblem + score + progress to next tier), and a **tier chip on the share card**
(signed via `tier` in `lib/share-token.ts`, rendered in `app/api/share-image`).

**Important scope note — SEASONAL vs CAREER:** the score is currently **computed
from the *current cohort's* check-ins**, so it effectively **resets each cohort**
(a "season" — standard for ranked ladders). For a **persistent career rank** that
accumulates across cohorts (with decay for inactivity = true Clash longevity),
we'd store points in a DB column + a decay job. Flagged as the natural R7 evolution
once there are multiple cohorts per member. (Item 3 of the owner's list — tiered
*badge* variants — is also a follow-up; the badge shelf is already iconified.)

---

## R8 — Subtle, purposeful motion (emblem + flame)  `[x] shipped 2026-06-15`

> **SHIPPED.** Brings the dashboard "to life" without overdoing it — CSS-only,
> two elements, reduced-motion safe.

**Principles:** only the **tier emblem** and **streak flame** move; CSS-only
(transform/opacity/filter — no JS, no perf cost); slow + faint (2.8–5s loops);
auto-disabled under `prefers-reduced-motion` (global rule). Dashboard only — the
share PNG stays static.

**What shipped (all three effects + tier-aware intensity):**
- **Emblem sheen sweep** — a soft light band drifts across the hexagon face,
  clipped to the badge shape.
- **Emblem breathing glow** — a faint aura in the **tier's own colour** pulses
  behind the emblem (bronze glows bronze, gold glows gold…).
- **Streak flame glow** — the 🔥 icon breathes a honey/coral drop-shadow + ~1px
  scale shimmer so it reads as "lit".
- **Tier-aware:** Bronze/Silver = glow only; Gold/Platinum = glow + sheen;
  Diamond/Champion = glow + a slightly faster/brighter sheen. Climbing feels like
  leveling up.

**Files:** keyframes in `app/globals.css`; `animated` prop on `TierEmblem`
(`components/Tier.tsx`); wired on the dashboard rank banner + streak flame.
Easily dialed up/down by editing the keyframe opacities/durations.
