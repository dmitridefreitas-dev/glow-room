# v2 — "The Next Small Thing"  (proposed simplest pathway)

A calm daily companion that hands you your day **one small step at a time**. Not a
game you play — a guide that says *"here's the next thing,"* you do it, it says
*"that's you,"* and gives you the next. Repeat until your day has shape.

This is the most direct answer to `../PROBLEM.md`.

## The whole app in one screen
A single card, centered, lots of calm space:
- The **one next step**, big and plain: *"Make your bed."*
- One short, kind line if it helps (*"Just pull the covers up. That's it."*).
- One big button: **Done.**
- One quiet, shameless out: **Not right now** → skips to the next step, never punishes.

That is the entire core interaction. Everything else is optional and out of the way.

## The loop
`open → see the one step → do it → tap Done → a 1-second warm beat ("nice. that's
one.") → the next step appears.`

When the day's structure is finished (or it's late): a soft close —
*"You did 6 today. Yesterday-you couldn't. That's the climb."* No score, no streak
guilt, no leaderboard.

## Where the steps come from: structure templates (the real value / the moat)
The founder's years of trial-and-error become a small library of **day structures**,
each an ordered sequence of micro-steps:
- **Get out of bed** — the hardest 20 minutes, broken into ~6 tiny moves.
- **Reset day** — for when the day already fell apart: "start where you are."
- **Class day** — a student's functional scaffold around lectures.
- **Sunday reset** — tidy + gently plan the week.
- **Wind down** — so tomorrow starts easier.

The app surfaces the right structure for the moment (time of day / how they're
doing) and walks them through it. v1 of the content can be **one** genuinely good
daily structure; depth comes later.

## Tone
Warm, plain, a friend who's been there. Never clinical, never a drill sergeant,
never fake-bubbly. Short sentences. *"You don't have to feel like it. Just do the
next small thing."*

## How the Glow Room folds in — gently
Keep the **glow-avatar** as a quiet companion that grows as you take steps
(genuinely supportive, Finch-style). Drop XP / tiers / leaderboards / quests from
the core — noise for this user. At most they live in a tucked-away "you" corner.

## MVP (smallest thing that could help a real person tomorrow)
1. One screen: one step + Done + "not right now."
2. One built-in daily structure (the founder's core routine) as ordered micro-steps.
3. Done → next step; remember the day's progress (reuse Supabase, or a tiny table).
4. A soft daily close.
No settings maze, no accounts friction, no game. Ship that, watch one real person.

## Riskiest assumptions to test first
- Will a struggling user **open it daily**? → notifications + home-screen install
  matter a lot (the PWA path we already flagged).
- Are the micro-steps **small enough**? → watch where they tap "not right now."
- Does one-step-at-a-time feel **relieving, not infantilizing**? → all in the tone
  and word choice.

## Build approach (non-destructive)
Ships as a **new route, `/today`**, in the same app — reusing login + Supabase. The
Glow Room stays exactly as built at `/dashboard` + `/play`. Click between them live
on the same deploy. We keep adding pathways (`/today`, then maybe `/v3…`) until one
clearly works for the person in `PROBLEM.md`.
