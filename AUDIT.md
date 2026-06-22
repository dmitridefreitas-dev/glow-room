# The Glow Room — Retention & Core-Problem Audit
*Prepared 2026-06-21. This is a review document, not executed work. Each item is a
proposal to discuss. Effort tags: **S** = hours, **M** = 1–2 days, **L** = 3+ days.*

---

## 0. How to read this

The business plan is unusually clear about what this product **is**: not a PDF, not
a tracker — *"structured transformation"* sold as a **synchronized, time-boxed,
witnessed experience**. The core problem it claims to solve, in the plan's own
words:

> *"Motivation is not the bottleneck for this generation; motivation is abundant
> and free. The bottleneck is the absence of a system that converts a fleeting
> motivated state into a repeatable daily action before the motivation
> evaporates."*

So the only metric that matters for this audit is: **does the app pull a member
back every day for 30 days, and make finishing feel inevitable and worth
sharing?** Everything below is scored against that, in priority order.

The good news: the foundations are genuinely strong — the daily loop works, the
brand system (Bricolage + Inter, Spruce/Coral) is coherent, and the growth
surfaces (share PNGs, referrals, squads, tiers, badges) are already built. The
gaps are not "polish"; they are the **retention machine** the plan describes but
that isn't wired up yet.

---

## Update — 2026-06-21 (after review)

**Decision made (owner):** this is a **self-help product for individuals.** The
**solo, self-paced** model is the intended design. Friends, squads, and cohorts
are **optional** layers, never required and never a paywall. → **Section 1 below is
resolved: keep solo as the model.** The synchronized-cohort "moat" framing does not
apply; Section 5 (community) is now *optional enhancement*, not a strategic
imperative. The only carryover from Section 1 is the **leaderboard-fairness** note
(scope competitive boards sensibly for self-paced members).

**Shipped this round (the high-leverage misses that are pure code):**
- ✅ **2.3 Streak loss-aversion** — "your N-day streak is on the line" banner on the
  dashboard when today isn't done yet.
- ✅ **2.4 Emotional arc** — Day 15 (halfway/turning point), Day 22 ("past the hard
  part"), and final-day banners added alongside the existing Day 8.
- ✅ **2.5 Habit anchor elevated** — a 30-dot "daily anchor" tracker on the
  dashboard, separate from full-day completion.
- ✅ **2.2 Before/after reveal** — Day-1-vs-latest photo side-by-side card on the
  dashboard (auto-appears once two day-photos exist), feeding the share loop.
- ✅ **3.1 Completion emotion** — a dedicated **celebration screen** after a day is
  completed (confetti + streak), with a **~20%** (and always-on-finish) "Post to my
  story" prompt so the share ask never feels like spam.

**Still the #1 remaining gap — deferred, needs external setup:**
- ⏳ **2.1 Triggers (push + email).** This is the biggest retention lever but it
  can't be shipped as pure code — it needs a **PWA service worker + web-push (or
  OneSignal) config**, a **scheduled sender (cron)**, and a **Resend verified
  domain** for lifecycle email. Recommend doing it as the next dedicated build once
  those accounts/keys are decided. Everything above is the "make the moments feel
  great" layer; this is the "bring them back" layer.

Remaining visual items (real faces/photography, day-page polish) from Section 4 are
unchanged and still worthwhile.

---

## 1. The single most important decision: cohort vs. solo  🚩 ~~STRATEGIC~~ → **RESOLVED: solo**

> **Resolved 2026-06-21 — solo/individual is the model.** The analysis below is
> kept for the record, but the decision is made: self-paced individual experience,
> with cohorts/squads/friends as *optional* layers. Read this section as context,
> not a pending decision.

This is the headline of the whole audit, so it goes first.

**What the plan says the moat is:** everyone starts on the **same fixed date** and
moves through the 30 days **together**. That one design choice is credited with
producing *both* assets a digital product normally can't:

- **Accountability** — *"200 people posting in the Day 8 channel on the day you are
  doing Day 8."*
- **Urgency / FOMO** — *"miss the January cohort and you wait until April … the
  single most defensible feature of the entire model."*

**What the build now does:** this week we (correctly, for the bug at hand)
**decoupled payment from cohorts** and made every paid member a **personal,
self-paced** challenge that starts the day they pay (`ensureSoloEnrollment` in
`lib/provision.ts`, day-lock keyed off each member's own start date). That fixed
the dead-end and the loop — but it also quietly **removed the synchronization that
the entire retention/virality thesis depends on.** A self-paced solo challenge is
exactly the *"solo product [that] is, by definition, asocial"* the plan says has
**never cracked accountability**.

This isn't "wrong" — self-paced is far better for **conversion** (buy now, start
now, no waiting). But it's strictly weaker on **completion rate, repurchase, and
community**, which the plan calls the lifeblood of the business. You're trading the
moat for friction-reduction. That trade should be **conscious**, not a side effect
of a bug fix.

**Recommended resolution — have both (a hybrid), not one or the other:**

| | Solo "start today" | Synchronized cohort |
|---|---|---|
| Best for | conversion, impulse buy | retention, community, virality, FOMO |
| Keep as | the **default on-ramp** so nobody waits to begin | the **headline event** everyone is funneled toward |

Concrete shape to discuss:
- A member pays and **starts a solo run immediately** (today's behavior — keep it).
- They are **also auto-placed into the next dated cohort** (Jan 1 / Apr 1 / Jul 1 /
  Oct 1) and see *"You're in the July cohort — 9 days until everyone starts
  together. Warm up solo now."* That restores urgency + the shared Day-8 moment
  **without** making anyone wait to begin.
- The **leaderboard and squad competition run on the dated cohort**, not the solo
  run — otherwise the leaderboard compares people at different points in their
  journey (a real bug today: a solo member who joined earlier outranks a newer one
  purely by calendar, see `lib/cohort.ts` + `cohort_leaderboard`).
- Discord **day-channels** (Day 1…Day 30) only make sense for a *synchronized*
  group. Right now, with everyone on personal calendars, the plan's "beating heart"
  channel structure can't work. The cohort is what makes Discord come alive.

**This is the one item I'd resolve before building anything else**, because the
answer changes what "retention" even means for the other items. *(Effort to build
the hybrid: **M–L**. Effort to decide: a conversation.)*

---

## 2. Retention — the habit loop (where the real leverage is)

A habit product lives or dies on the loop **Trigger → Action → Reward →
Investment**. Here's the honest scorecard:

| Stage | Status | Verdict |
|---|---|---|
| **Trigger** (what brings them back daily) | ❌ **Missing** | The biggest hole. No push, no email, no nudge. |
| **Action** (the daily check-in) | ✅ Solid | Low-friction, clear, 4 pillars. |
| **Reward** (the payoff for finishing a day) | 🟡 Partial | Confetti on dashboard, but muted on the day page; no streak loss-aversion. |
| **Investment** (what they build up) | ✅ Good | Photos, streak, badges, tiers, squads. |

### 2.1 Triggers — push notifications + lifecycle email  🥇 **#1 functional gap · L**
The plan calls this *"the daily re-engagement mechanism that a PDF can never
provide,"* yet `PROGRESS.md` shows OneSignal **"live but idle (0 devices)"** and
push is an unstarted Phase-6 item. **A habit app with no trigger is a leaky
bucket** — you're relying on the member to *remember* to come back, which is the
exact failure mode ("the saved workout never gets done") the product exists to fix.

Minimum viable trigger system:
- **Daily check-in reminder** at a member-chosen time ("It's time for your Day 14
  check-in").
- **Streak-protection nudge** in the evening if today isn't done ("Don't break your
  11-day streak — 2 hours left").
- **Day-8 encouragement push** (the designed crisis — see 2.4).
- **Win-back** at 1, 3, 7 days lapsed ("Your glow up is waiting — pick up at Day 9").

Because there's no native app, the path is **PWA + Web Push** (plus email as the
reliable fallback, since iOS Safari web-push is restricted to installed PWAs).
Email lifecycle is *also* essentially unbuilt — only the access-code email exists
(`lib/email.ts`); the plan's announcement→reminder→urgency→last-chance and
daily/encouragement sequences are missing. **This single item probably moves
completion rate more than everything else in this document combined.**

### 2.2 The Day-30 before/after reveal  🥈 **M**
The plan calls the Day 1 vs. Day 30 photo *"the single most powerful piece of
marketing content the entire challenge generates"* and the member's *"most
motivating moment."* Today the app stores a photo per day (`check_ins.photo_path`)
and shows **only the current day's** photo — there is **no baseline capture and no
side-by-side reveal.** This is a double miss:
- **Retention:** an anticipated Day-30 reveal is a 30-day-long *reason to not quit*
  ("I want to see my before/after"). That anticipation is a retention rope.
- **Virality:** the before/after is the #1 acquisition asset and it's not being
  generated or surfaced for sharing.

Proposal: capture an explicit **"before" set on Day 0/1** (skin close-up + optional
screen-time/wake-time/steps), lock it, and at Day 30 render a **side-by-side
reveal** that flows straight into the existing share-image pipeline
(`/api/share-image`). *Strongly tied to #1 — only meaningful if the member commits
to the full 30.*

### 2.3 Streak loss-aversion  🥉 **S–M**
The streak exists and counts up, but there's **no loss to fear**. Loss aversion is
~2× stronger than gain-seeking; the streak only retains if breaking it *hurts* and
*almost-breaking* it is visible. Add:
- An evening **"streak at risk"** state on the dashboard + push (ties to 2.1).
- A **"streak freeze"** (1–2 per challenge) so one bad day doesn't nuke 20 days of
  momentum and trigger rage-quit. (This is the single most copied retention
  mechanic in the category — Duolingo, Snapchat — because it works.)
- Make the streak the **emotional centerpiece**, not a stat tile. The flame is
  already animated (`R8`); give it a number that members are afraid to lose.

### 2.4 Design the full emotional arc, not just Day 8  **M**
The plan specifies a **curve**: Day 4 easy · **Day 8 crisis** · **Day 15 turning
point** (timed to first visible skin change) · Day 22 inevitable · **Day 30
reveal.** Only **Day 8** is implemented (a banner on the day page — good, keep it).
The others are silent. Each is a cheap, high-impact moment:
- **Day 15** "halfway / turning point" celebration — *"the part where it starts
  getting easier."*
- **Day 22** "you're past the hard part — it's yours to lose now."
- **Day 30** the reveal (2.2).
Naming the curve *in advance* ("Day 8 will feel like quitting — that's the plan")
is itself the retention mechanic; do it for the whole arc.

### 2.5 Elevate the habit anchor  **S**
The plan calls the anchor *"the neurological backbone … the metronome the rest of
the challenge plays against."* In the UI it's just the 4th checkbox, visually equal
to the others (`app/dashboard/day/[n]/page.tsx`). Give it its own **persistent
mini-tracker** (e.g., a 30-dot anchor strip on the dashboard, separate from
pillar completion) so the one unchanging daily action gets the prominence the
behavioral model assigns it.

---

## 3. The core daily loop — friction & payoff  **functional**

### 3.1 Put the win *on the day page*, in place  **S–M**
Right now, completing the 4th pillar = submit form → **redirect** to the dashboard
→ confetti there. The dopamine should fire **at the moment of the tick**, on the
day page (critique #12 was marked done but only the dashboard got it). Make the
checkbox flip green with a spring, the day cell pop, the streak tick up — *before*
any navigation. The moment of completion is the most important emotional beat in
the entire product; it currently happens after a page load.

### 3.2 Onboarding sets up retention — or doesn't  **M**
Today: pay → `/welcome` (code) → dashboard → intake (pick habit anchor) → loop.
Two issues:
- **Baseline capture is missing** (see 2.2) — the "before" should be part of
  onboarding, while motivation is at its peak.
- **Order is slightly off:** a brand-new user can hit the intake quiz *before*
  paying (the dashboard gates on `habit_anchor` before it redirects to `/join`).
  Worth confirming the intended first-run sequence:
  **pay → welcome/code → set anchor + capture baseline → Day 1.**

### 3.3 Make it installable (PWA)  **M**
Most traffic is mobile, in-feed. An **"Add to Home Screen"** PWA (manifest +
service worker) is the prerequisite for iOS web-push **and** turns a browser tab
into a daily app icon — a passive trigger by itself. Currently not a PWA.

### 3.4 In-app browser hardening  **S–M · highest-risk, lowest-glory**
The plan's traffic lands in **TikTok/IG in-app webviews**, the most hostile
environment for auth cookies, Stripe redirects, file uploads (the photo!), and the
Discord hand-off. `PROGRESS.md` lists this QA as still owed. A flow that works in
Chrome but breaks in the TikTok browser will silently kill the funnel. Worth a
dedicated pass (and an "open in Safari/Chrome" escape hatch where webviews are
known-bad).

---

## 4. Visual / UX  *(builds on `critiques.txt`, which is mostly resolved)*

The brand system is good. Remaining visual leverage:

- **Real faces & photography (S–M, but needs assets).** Open critique #18/#19: the
  testimonials are placeholder initials and the hero is an SVG. For a *"do it
  together"* glow-up product, the absence of **human faces and real before/afters**
  is the biggest credibility gap on the landing page. This is a conversion lever,
  not a nicety — proof of *together* is the whole pitch. (Needs real member content
  → ties to 2.2 generating it.)
- **The day check-in page is the plainest screen in the app (S).** It's where
  members spend the most time, yet it's flat white cards with small checkboxes
  while the dashboard is rich. Bring the dashboard's energy (pillar color, the
  completion spring, progress) into the daily surface.
- **Dashboard density (S).** Strong hierarchy now, but it's a long scroll — today's
  check-in, stats, progress, rank, grid, share, leaderboard, crew, badges, invite.
  Consider collapsing secondary surfaces so the **one daily action** is unmissable
  above the fold every time.
- **Empty/first-run states (S).** With the new instant-access model, confirm the
  brand-new dashboard (Day 1, nothing done) feels like an exciting start line, not
  an empty grid.

---

## 5. Community — the moat the app barely touches  **strategic · L**

The plan is emphatic: *"the Discord community is the single most important asset in
the business … the one component that appreciates with every new member."* Yet the
app's only community touch is a one-time access code. Once a member is in Discord,
the app and the community never speak again. Opportunities (all depend on #1's
cohort decision):

- Surface **"X members on Day 8 right now"** / live cohort activity **in the app**
  — pull the social proof the plan describes *into* the product, don't leave it all
  in Discord.
- **Deep-link the day check-in to the matching Discord day-channel** ("share Day 8
  in #day-8") — close the loop between the private check-in and the public
  accountability the plan is built on.
- **Accountability-partner pairing** (plan §4.4) — the single strongest 1:1
  retention mechanic, currently absent (squads are the group version; a 1:1 buddy
  is different and stickier).

---

## 6. Quick wins (cheap, do-anytime)

- **S** — Streak-at-risk banner on the dashboard (no infra; pure UI on existing
  data). A down-payment on 2.3 before push exists.
- **S** — Day-15 / Day-22 / Day-30 milestone states (mirror the Day-8 banner).
- **S** — Completion animation on the day page itself (3.1).
- **S** — Habit-anchor dot strip (2.5).
- **S** — Resolve the leaderboard fairness bug for self-paced members (or scope the
  board to dated cohorts per #1).
- **S** — Wire the existing Day-8 OneSignal/Sentry placeholders, or remove them
  from the "live" column in `PROGRESS.md` so status is honest.

---

## 7. What I would *not* do yet

- Don't pour effort into **more growth surfaces** (new share-card variants, more
  badge art) until the **trigger system (2.1)** exists — you're optimizing the
  acquisition loop while the retention bucket leaks.
- Don't fully delete the cohort concept to "simplify." Per #1, that's deleting the
  moat. Keep solo as the on-ramp, not the destination.
- Don't build native push/SMS — **PWA web-push + email** covers it at near-zero
  cost and matches the plan's stack.

---

## 8. Suggested sequence

1. **Decide #1** (cohort hybrid vs. pure solo). Everything keys off this.
2. **Triggers (2.1):** PWA + web-push + the 4 core notifications + a minimal email
   lifecycle. *Highest retention ROI in the document.*
3. **Completion emotion (3.1) + streak loss-aversion (2.3).** Cheap, compounding.
4. **Baseline → Day-30 reveal (2.2).** Retention rope *and* the viral asset.
5. **Emotional-arc moments (2.4) + anchor elevation (2.5).** Cheap polish on the
   spine of the program.
6. **Community wiring (5) + real photography (4).** The moat and the credibility.

---

### One-line version
The app is a well-built **tracker**; the business plan describes a **synchronized,
notified, witnessed experience**. The gap between those two — *re-engagement
triggers* and *the cohort/community synchronization* — is where ~all the retention
upside lives. Fix triggers first; decide the cohort question before anything else.
