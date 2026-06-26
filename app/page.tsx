import Link from "next/link";
import {
  Footprints,
  Sparkles,
  Brain,
  Anchor,
  ArrowRight,
  Quote,
  Star,
  Play,
  Flame,
  Zap,
  Map as MapIcon,
  Trophy,
} from "lucide-react";
import { Avatar } from "@/components/game/Avatar";

const pillars = [
  {
    name: "Movement",
    stat: "Body",
    body: "20 minutes a day, any form. A walk, a circuit, a dance break. No gym required.",
    Icon: Footprints,
    panel: "bg-coral-light",
    bar: "bg-coral",
    icon: "text-coral",
    pct: 80,
  },
  {
    name: "Skin",
    stat: "Glow",
    body: "One small step a day, built up over 30 days into a real routine — never overwhelming.",
    Icon: Sparkles,
    panel: "bg-teal-light",
    bar: "bg-teal",
    icon: "text-teal",
    pct: 65,
  },
  {
    name: "Mindset",
    stat: "Focus",
    body: "A five-minute journaling prompt designed to produce one specific internal shift.",
    Icon: Brain,
    panel: "bg-honey-light",
    bar: "bg-honey",
    icon: "text-honey",
    pct: 72,
  },
  {
    name: "Habit Anchor",
    stat: "Willpower",
    body: "One non-negotiable daily task, the same every day, that makes everything else stick.",
    Icon: Anchor,
    panel: "bg-sage-light",
    bar: "bg-sage",
    icon: "text-sage",
    pct: 90,
  },
];

// NOTE: sample reviews — replace with real member quotes + photos before launch.
const reviews = [
  {
    quote:
      "First challenge I've ever actually finished. The day-by-day unlock meant I couldn't overthink it — I just showed up.",
    name: "Maya R.",
    tag: "Reached Day 30",
    avatar: "bg-coral",
  },
  {
    quote:
      "It genuinely feels like a game. Hitting a new level on a hard day is exactly the push I needed.",
    name: "Sofia L.",
    tag: "Level 9 · Gold",
    avatar: "bg-teal",
  },
  {
    quote:
      "My skin and my mornings are unrecognisable. Five minutes a pillar, that's it. Worth way more than $18.",
    name: "Imani T.",
    tag: "Champion tier",
    avatar: "bg-honey",
  },
];

const steps = [
  {
    step: "01",
    Icon: Play,
    title: "Start your quest",
    body: "Pay once and your 30-day Glow Up begins today. Lock in your habit anchor and you're at Day 1.",
  },
  {
    step: "02",
    Icon: MapIcon,
    title: "Clear a stage a day",
    body: "Each day is a stage on your quest map. Tick your four pillars, log a note, snap a private progress photo.",
  },
  {
    step: "03",
    Icon: Zap,
    title: "Level up the streak",
    body: "Every completed day is XP. Climb the levels, keep the flame alive — miss a day and it costs you.",
  },
  {
    step: "04",
    Icon: Trophy,
    title: "Beat the final boss",
    body: "Survive Day 8 'The Wall', cross Day 30 'The Reveal', and unlock your Champion tier and before/after.",
  },
];

export default function Home() {
  return (
    <main className="game-bg min-h-screen">
      {/* top bar */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <span className="flex items-center gap-2 font-display text-lg font-extrabold text-spruce">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-coral text-white shadow">
            <Sparkles className="h-4 w-4" />
          </span>
          The Glow Room
        </span>
        <Link href="/login" className="btn-game btn-ivory text-sm">
          Sign in
        </Link>
      </header>

      {/* ── TITLE SCREEN ── */}
      <section className="mx-auto max-w-6xl px-6 pb-10 pt-6">
        <div className="panel-dark game-dots overflow-hidden p-8 md:p-12">
          <div className="grid items-center gap-10 md:grid-cols-[1.1fr_0.9fr]">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-coral/20 px-3 py-1 text-xs font-extrabold uppercase tracking-game text-honey">
                <Play className="h-3 w-3 fill-current" /> Press start
              </span>
              <h1 className="mt-5 font-display text-5xl font-extrabold leading-[0.95] tracking-tight md:text-7xl">
                The Glow Room
              </h1>
              <p className="mt-5 max-w-xl text-lg leading-relaxed text-ivory/85">
                Turn your next 30 days into a game you actually finish. Movement,
                skin, mindset, and one daily habit — every day a stage, every day{" "}
                <span className="font-bold text-honey">XP</span>. Level up, keep
                the streak, beat the bosses.
              </p>

              {/* HUD teaser */}
              <div className="mt-6 flex flex-wrap gap-2">
                <span className="chip-stat bg-ivory/10 text-ivory">
                  <Zap className="h-4 w-4 text-honey" fill="currentColor" strokeWidth={0} /> Level 1
                </span>
                <span className="chip-stat bg-ivory/10 text-ivory">
                  <MapIcon className="h-4 w-4 text-sage" /> Day 0 / 30
                </span>
                <span className="chip-stat bg-ivory/10 text-ivory">
                  <Flame className="h-4 w-4 text-coral" /> 0 streak
                </span>
              </div>

              <div className="mt-8 flex flex-wrap gap-4">
                <Link href="/login" className="btn-game btn-primary text-base">
                  <Play className="h-4 w-4 fill-current" /> Start your quest
                </Link>
                <Link href="/login" className="btn-game btn-ivory text-base">
                  Continue <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              {/* social proof */}
              <div className="mt-8 flex items-center gap-3">
                <div className="flex -space-x-2">
                  {["bg-coral", "bg-honey", "bg-sage", "bg-teal"].map((c, i) => (
                    <span key={i} className={`h-8 w-8 rounded-full ${c} ring-2 ring-spruce`} />
                  ))}
                </div>
                <p className="text-sm text-ivory/70">
                  Hundreds leveling up their glow — join the next player.
                </p>
              </div>
            </div>

            {/* hero avatar */}
            <div className="flex justify-center md:justify-end">
              <div className="relative">
                <div className="absolute inset-0 -z-0 rounded-full bg-honey/20 blur-3xl" />
                <Avatar stage={5} size={300} className="relative z-10" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── STAT BAND ── */}
      <section className="mx-auto max-w-5xl px-6 py-8">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            ["30", "stages to clear"],
            ["4", "stats to train"],
            ["6", "rank tiers"],
            ["1", "final boss"],
          ].map(([n, l]) => (
            <div key={l} className="panel-game px-4 py-5 text-center">
              <div className="font-display text-4xl font-extrabold text-spruce">{n}</div>
              <div className="mt-1 text-xs font-semibold text-muted">{l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── YOUR 4 STATS (pillars) ── */}
      <section className="mx-auto max-w-5xl px-6 py-12">
        <h2 className="text-sm font-bold uppercase tracking-game text-teal">
          Train four stats, thirty days
        </h2>
        <p className="mt-2 max-w-2xl text-2xl font-semibold text-ink">
          Inspiration is everywhere. We sell the part nobody gives you — a system
          you actually execute, leveling a little every single day.
        </p>
        <div className="mt-10 grid gap-5 sm:grid-cols-2">
          {pillars.map((p) => (
            <div key={p.name} className={`panel-game ${p.panel} p-6`}>
              <div className="flex items-center justify-between">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/70 shadow-sm">
                  <p.Icon className={`h-6 w-6 ${p.icon}`} strokeWidth={2.2} />
                </span>
                <span className="text-[11px] font-extrabold uppercase tracking-game text-muted">
                  {p.stat}
                </span>
              </div>
              <h3 className="mt-4 text-lg font-bold text-spruce">{p.name}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">{p.body}</p>
              <div className="xp-track mt-4 h-2.5">
                <div className={`h-full rounded-full ${p.bar}`} style={{ width: `${p.pct}%` }} />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW TO PLAY ── */}
      <section className="mx-auto max-w-5xl px-6 py-12">
        <h2 className="text-sm font-bold uppercase tracking-game text-teal">How to play</h2>
        <p className="mt-2 max-w-2xl text-2xl font-semibold text-ink">
          Not another app you open twice. A quest with stages, levels, and a flame
          you don&apos;t want to lose.
        </p>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s) => (
            <div key={s.step} className="panel-game p-6">
              <div className="flex items-center justify-between">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-spruce text-ivory">
                  <s.Icon className="h-5 w-5" />
                </span>
                <span className="font-display text-sm font-extrabold text-coral">{s.step}</span>
              </div>
              <h3 className="mt-4 text-lg font-bold text-spruce">{s.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── PLAYER REVIEWS ── */}
      <section className="mx-auto max-w-5xl px-6 py-12">
        <div className="panel-dark p-8 md:p-10">
          <h2 className="text-sm font-bold uppercase tracking-game text-teal-light">Player reviews</h2>
          <p className="mt-2 max-w-2xl text-2xl font-semibold">
            The part that makes it stick isn&apos;t the plan. It&apos;s watching
            yourself level up.
          </p>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {reviews.map((t) => (
              <figure key={t.name} className="rounded-3xl bg-spruce-dark p-6 ring-1 ring-ivory/10">
                <div className="flex gap-0.5 text-honey">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-current" />
                  ))}
                </div>
                <Quote className="mt-3 h-6 w-6 text-honey/70" />
                <blockquote className="mt-2 text-sm leading-relaxed text-ivory/90">{t.quote}</blockquote>
                <figcaption className="mt-5 flex items-center gap-3">
                  <span className={`flex h-9 w-9 items-center justify-center rounded-full ${t.avatar} text-xs font-bold text-white`}>
                    {t.name[0]}
                  </span>
                  <span>
                    <span className="block text-sm font-semibold">{t.name}</span>
                    <span className="block text-xs text-ivory/55">{t.tag}</span>
                  </span>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* ── CHOOSE YOUR MODE (pricing) ── */}
      <section className="mx-auto max-w-5xl px-6 py-12">
        <h2 className="text-sm font-bold uppercase tracking-game text-teal">Choose your mode</h2>
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <div className="panel-game p-8">
            <p className="text-xs font-extrabold uppercase tracking-game text-teal">Story mode</p>
            <div className="mt-2 flex items-end gap-1">
              <span className="font-display text-5xl font-extrabold text-spruce">$18</span>
              <span className="mb-1.5 text-sm text-muted">one-time</span>
            </div>
            <ul className="mt-5 space-y-2 text-sm text-ink">
              <li>· The full 30-day Glow Up quest</li>
              <li>· Daily check-ins, levels, streak &amp; XP</li>
              <li>· Quest map, rank tiers &amp; milestone trophies</li>
              <li>· Members-only Discord</li>
            </ul>
            <Link href="/login" className="btn-game btn-primary mt-7 w-full">
              <Play className="h-4 w-4 fill-current" /> Start the quest
            </Link>
          </div>
          <div className="panel-dark p-8">
            <p className="text-xs font-extrabold uppercase tracking-game text-honey">Endless mode</p>
            <div className="mt-2 flex items-end gap-1">
              <span className="font-display text-5xl font-extrabold text-ivory">$9</span>
              <span className="mb-1.5 text-sm text-ivory/60">/month</span>
            </div>
            <ul className="mt-5 space-y-2 text-sm text-ivory/85">
              <li>· Every new challenge, all year</li>
              <li>· Fresh monthly quests drop</li>
              <li>· Keep your career rank climbing</li>
              <li>· Cancel anytime from your dashboard</li>
            </ul>
            <Link href="/login" className="btn-game btn-honey mt-7 w-full">
              Go endless <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="mx-auto max-w-3xl px-6 py-12">
        <h2 className="text-sm font-bold uppercase tracking-game text-teal">Questions</h2>
        <div className="mt-8 divide-y divide-line border-y border-line">
          {[
            {
              q: "Do I need a gym or any products?",
              a: "No. Movement is 20 minutes in any form — a walk counts. Skin is one small step a day with whatever you already have. Nothing to buy to start.",
            },
            {
              q: "What if I miss a day?",
              a: "You pick the streak back up the next day. Days unlock one at a time and you can't skip ahead, so it's about showing up — not being perfect. A missed day costs a little XP, never your whole run.",
            },
            {
              q: "When can I start?",
              a: "Right now. Pay once and Day 1 unlocks today — your quest begins immediately, self-paced through the 30 days.",
            },
            {
              q: "Can I cancel the membership?",
              a: "Anytime, from your dashboard — it's self-serve through Stripe. Story mode is just a single payment with nothing recurring.",
            },
          ].map((f) => (
            <div key={f.q} className="py-5">
              <h3 className="font-bold text-spruce">{f.q}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">{f.a}</p>
            </div>
          ))}
        </div>

        <div className="panel-game mt-12 p-8 text-center">
          <div className="mb-2 flex justify-center">
            <Avatar stage={4} size={104} />
          </div>
          <h3 className="text-2xl font-extrabold text-spruce">Your next 30 days, actually finished.</h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted">
            Start the quest, lock in your habit anchor, and watch yourself level up
            day by day.
          </p>
          <Link href="/login" className="btn-game btn-primary mx-auto mt-6 text-base">
            <Play className="h-4 w-4 fill-current" /> Start your quest
          </Link>
        </div>
      </section>

      {/* footer */}
      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-5xl flex-col gap-2 px-6 py-8 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} The Glow Room</span>
          <span>Built to be finished, together.</span>
        </div>
      </footer>
    </main>
  );
}
