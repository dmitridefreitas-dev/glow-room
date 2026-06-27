# Daily return, notifications & student soft-pay

The business is recurring revenue, so the whole product is judged on one thing:
**do people come back tomorrow?** This is the design for that, plus how we charge.

## 1. The daily-return loop
The hook is already right: open → the one next small thing → Done → "that's you
climbing" → come back tomorrow. Reinforce it with:

- **Show-up streak, never a shame streak.** Count the days they *showed up at all*
  (opened + did ≥1 thing). Missing never breaks anything — "welcome back" only.
  (Streaks are the single most proven retention mechanic, but for THIS user they
  must reward, never punish — see `PROBLEM.md`.)
- **A reason that's waiting.** The plan from `/start` means there's always a
  next step queued for them personally — "your plan is waiting" > "open the app."
- **Install to home screen (PWA).** The cheapest retention win: an app icon on the
  phone is a daily cue. Add a web manifest + a gentle "Add to Home Screen" hint.
  (Implement next — small.)
- **Evening + morning bookends.** Morning = "Start the day" structure; night =
  "Wind down" so tomorrow starts easier. Two natural daily touchpoints.

## 2. Notifications (the retention engine — and the honest limit)
Notifications are what make a daily-habit business work. Copy is gentle, time-aware,
never guilt:
- Morning: *"One small thing is waiting. Just the first step."*
- Afternoon slump: *"Rough afternoon? Reset — start where you are."*
- Night: *"Let's make tomorrow easier. Two minutes."*
- After a miss: *"No streak to lose here. Want to do one small thing?"*

**Honest constraint:** reliable push needs **native**. Web push works on Android/
desktop and on **iOS only if installed to the Home Screen (iOS 16.4+)** — flaky for
most users. This is the #1 reason the real product is a **native app** (Capacitor
wraps our existing web build). Plan: PWA + web push now to test; native for launch.

## 3. Pricing — soft pay, student-friendly
**Model: soft paywall (Finch-style).** A genuinely great free core converts better
than a hard wall — and we never block someone mid-crisis behind a paywall.

- **Free forever:** the `/start` plan, the daily structure (`/today`), and two core
  practices (Ground yourself + Reframe). The thing that helps you *function* is free.
- **Glow+ (paid):** all practices, the avatar/room game layer, mood history &
  insights ("look how far you've come"), extra/advanced structures, reminders &
  deeper personalization.
- **Price:** student **~$4.99/mo or ~$39/yr**; non-student ~$8–9/mo. Annual converts
  best in wellness. Verify student status later via .edu email or SheerID.
- **Why it works:** broke, low-motivation students won't pay at a wall — but they'll
  pay for *depth* once the free core has already helped them. Universities are a
  parallel B2B path (they pay for their students; counseling centers are overwhelmed).

**Build note:** the live app already has Stripe (the $9/mo membership) to extend —
add a Glow+ product + gentle gating. Deferred until the free core proves it retains.

## 4. What's built now vs. next
- **Built:** `/start` tailored-plan intake (no chatbot, no API, free), 5 CBT
  practices, the daily structure, the founder story (`/story`).
- **Next (cheap):** PWA manifest + "add to home screen", show-up streak (forgiving),
  a gentle Glow+ teaser.
- **Next (needs decisions/$$):** native wrap for real push (Capacitor), Stripe Glow+
  + student verify, mood tracking/insights.
