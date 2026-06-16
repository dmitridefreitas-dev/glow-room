import Link from "next/link";
import {
  Footprints,
  Sparkles,
  Brain,
  Anchor,
  ArrowRight,
  Quote,
} from "lucide-react";

const pillars = [
  {
    name: "Movement",
    body: "20 minutes a day, any form. A walk, a circuit, a dance break. No gym required.",
    Icon: Footprints,
    color: "bg-coral-light",
    bar: "bg-coral",
    icon: "text-coral",
  },
  {
    name: "Skin",
    body: "One small step a day, built up over 30 days into a real routine — never overwhelming.",
    Icon: Sparkles,
    color: "bg-teal-light",
    bar: "bg-teal",
    icon: "text-teal",
  },
  {
    name: "Mindset",
    body: "A five-minute journaling prompt designed to produce one specific internal shift.",
    Icon: Brain,
    color: "bg-honey-light",
    bar: "bg-honey",
    icon: "text-honey",
  },
  {
    name: "Habit Anchor",
    body: "One non-negotiable daily task, the same every day, that makes everything else stick.",
    Icon: Anchor,
    color: "bg-sage-light",
    bar: "bg-sage",
    icon: "text-sage",
  },
];

// NOTE: sample testimonials — replace with real member quotes + photos before launch.
const testimonials = [
  {
    quote:
      "First challenge I've ever actually finished. The day-by-day unlock meant I couldn't overthink it — I just showed up.",
    name: "Maya R.",
    tag: "Cohort 01",
    avatar: "bg-coral",
  },
  {
    quote:
      "Doing it with a group is the whole thing. On day 8 I wanted to quit and the cohort chat carried me.",
    name: "Sofia L.",
    tag: "Cohort 01",
    avatar: "bg-teal",
  },
  {
    quote:
      "My skin and my mornings are unrecognisable. Five minutes a pillar, that's it. Worth way more than $18.",
    name: "Imani T.",
    tag: "Cohort 02",
    avatar: "bg-honey",
  },
];

/** On-brand abstract "glow bloom" — a hero graphic in place of stock photography. */
function GlowBloom() {
  const petals = ["#e2785a", "#e0a23c", "#6ca77f", "#2c7a70"];
  return (
    <svg
      viewBox="0 0 420 420"
      className="h-full w-full max-w-md"
      role="img"
      aria-label="Abstract blooming glow graphic"
    >
      <defs>
        <filter id="soft" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="14" />
        </filter>
        <radialGradient id="core" cx="50%" cy="45%" r="55%">
          <stop offset="0%" stopColor="#fbf8f1" />
          <stop offset="60%" stopColor="#f8edd6" />
          <stop offset="100%" stopColor="#e0a23c" />
        </radialGradient>
      </defs>

      {/* outer glow */}
      <circle cx="210" cy="210" r="150" fill="#e0a23c" opacity="0.18" filter="url(#soft)" />

      {/* petals */}
      <g>
        {Array.from({ length: 8 }).map((_, i) => (
          <ellipse
            key={i}
            cx="210"
            cy="120"
            rx="46"
            ry="104"
            fill={petals[i % petals.length]}
            opacity="0.88"
            transform={`rotate(${i * 45} 210 210)`}
          />
        ))}
      </g>

      {/* core */}
      <circle cx="210" cy="210" r="62" fill="url(#core)" />
      <circle cx="210" cy="210" r="62" fill="none" stroke="#fbf8f1" strokeOpacity="0.5" strokeWidth="2" />
    </svg>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen">
      {/* Hero */}
      <section className="bg-spruce text-ivory">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-6 py-20 md:grid-cols-[1.1fr_0.9fr] md:py-28">
          <div>
            <div className="mb-8 flex gap-1.5">
              <span className="h-2.5 w-16 rounded bg-coral" />
              <span className="h-2.5 w-16 rounded bg-sage" />
              <span className="h-2.5 w-16 rounded bg-honey" />
            </div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-teal-light">
              A Gen Z digital wellness platform
            </p>
            <h1 className="mt-4 text-5xl font-extrabold leading-[0.95] tracking-tight md:text-7xl">
              The Glow Room
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-ivory/85">
              A 30-day glow up you actually finish — because you do it{" "}
              <span className="text-honey">together</span>. Movement, skin,
              mindset, and one daily habit. Every day already planned. No
              deciding, just doing.
            </p>
            <div className="mt-9 flex flex-wrap gap-4">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-full bg-coral px-7 py-3.5 text-sm font-semibold text-white transition hover:bg-coral/90"
              >
                Enter the Glow Room <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/login"
                className="rounded-full border border-ivory/40 px-7 py-3.5 text-sm font-semibold text-ivory transition hover:bg-ivory/10"
              >
                Sign in
              </Link>
            </div>

            {/* social proof microbar */}
            <div className="mt-8 flex items-center gap-3">
              <div className="flex -space-x-2">
                {["bg-coral", "bg-honey", "bg-sage", "bg-teal"].map((c, i) => (
                  <span
                    key={i}
                    className={`h-8 w-8 rounded-full ${c} ring-2 ring-spruce`}
                  />
                ))}
              </div>
              <p className="text-sm text-ivory/70">
                Hundreds glowing up together — new cohorts every quarter.
              </p>
            </div>
          </div>

          <div className="flex justify-center md:justify-end">
            <GlowBloom />
          </div>
        </div>
      </section>

      {/* Stat band */}
      <section className="bg-honey-light">
        <div className="mx-auto grid max-w-5xl grid-cols-2 gap-6 px-6 py-10 sm:grid-cols-4">
          {[
            ["30", "days, fully planned"],
            ["4", "daily pillars"],
            ["1", "habit anchor"],
            ["4", "cohorts a year"],
          ].map(([n, l]) => (
            <div key={l} className="text-center">
              <div className="font-display text-4xl font-extrabold text-spruce">
                {n}
              </div>
              <div className="mt-1 text-xs font-medium text-muted">{l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Pillars */}
      <section className="mx-auto max-w-5xl px-6 py-16">
        <h2 className="text-sm font-bold uppercase tracking-[0.15em] text-teal">
          Four pillars, thirty days
        </h2>
        <p className="mt-2 max-w-2xl text-2xl font-semibold text-ink">
          Inspiration is everywhere. We sell the part nobody gives you — a system
          you actually execute, with people doing it beside you.
        </p>
        <div className="mt-10 grid gap-5 sm:grid-cols-2">
          {pillars.map((p) => (
            <div key={p.name} className={`rounded-2xl ${p.color} p-6 shadow-sm`}>
              <span
                className={`inline-flex h-11 w-11 items-center justify-center rounded-xl bg-white/70 ${p.icon}`}
              >
                <p.Icon className="h-5 w-5" strokeWidth={2.2} />
              </span>
              <h3 className="mt-4 text-lg font-bold text-spruce">{p.name}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">
                {p.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-spruce text-ivory">
        <div className="mx-auto max-w-5xl px-6 py-16">
          <h2 className="text-sm font-bold uppercase tracking-[0.15em] text-teal-light">
            From the cohorts
          </h2>
          <p className="mt-2 max-w-2xl text-2xl font-semibold">
            The part that makes it stick isn&apos;t the plan. It&apos;s the people
            doing it with you.
          </p>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {testimonials.map((t) => (
              <figure
                key={t.name}
                className="rounded-2xl bg-spruce-dark p-6 ring-1 ring-ivory/10"
              >
                <Quote className="h-6 w-6 text-honey" />
                <blockquote className="mt-3 text-sm leading-relaxed text-ivory/90">
                  {t.quote}
                </blockquote>
                <figcaption className="mt-5 flex items-center gap-3">
                  <span
                    className={`flex h-9 w-9 items-center justify-center rounded-full ${t.avatar} text-xs font-bold text-white`}
                  >
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

      {/* How it works */}
      <section className="bg-sage-light">
        <div className="mx-auto max-w-5xl px-6 py-16">
          <h2 className="text-sm font-bold uppercase tracking-[0.15em] text-teal">
            How it works
          </h2>
          <p className="mt-2 max-w-2xl text-2xl font-semibold text-ink">
            Not another app you open twice. A cohort, a streak, and people who
            notice if you go quiet.
          </p>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                step: "01",
                title: "Join a cohort",
                body: "Everyone starts Day 1 on the same date — Jan, Apr, Jul or Oct. You move through the 30 days as a group.",
              },
              {
                step: "02",
                title: "Show up daily",
                body: "Each day unlocks one at a time. Tick your four pillars, log a note, snap a private progress photo.",
              },
              {
                step: "03",
                title: "Build the streak",
                body: "Complete a full day and your streak grows. Days can't be pre-filled, so the leaderboard only rewards real consistency.",
              },
              {
                step: "04",
                title: "Finish together",
                body: "Earn milestone badges, climb the cohort leaderboard, and cross Day 30 with the people who started beside you.",
              },
            ].map((s) => (
              <div
                key={s.step}
                className="rounded-2xl border border-line bg-white p-6 shadow-sm"
              >
                <div className="font-display text-sm font-extrabold text-coral">
                  {s.step}
                </div>
                <h3 className="mt-2 text-lg font-bold text-spruce">{s.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted">
                  {s.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="bg-spruce-dark text-ivory">
        <div className="mx-auto max-w-5xl px-6 py-16">
          <h2 className="text-sm font-bold uppercase tracking-[0.15em] text-teal-light">
            Pick your way in
          </h2>
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <div className="rounded-3xl bg-ivory p-8 text-ink">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-teal">
                One cohort
              </p>
              <div className="mt-2 flex items-end gap-1">
                <span className="font-display text-4xl font-extrabold text-spruce">
                  $18
                </span>
                <span className="mb-1 text-sm text-muted">one-time</span>
              </div>
              <ul className="mt-5 space-y-2 text-sm text-ink">
                <li>· Full 30-day Glow Up challenge</li>
                <li>· Daily check-ins, streak &amp; progress tracking</li>
                <li>· Cohort leaderboard &amp; milestone badges</li>
                <li>· Members-only Discord for your cohort</li>
              </ul>
              <Link
                href="/login"
                className="mt-7 block rounded-full bg-coral px-6 py-3 text-center text-sm font-semibold text-white transition hover:bg-coral/90"
              >
                Start with a cohort
              </Link>
            </div>
            <div className="rounded-3xl border border-ivory/20 bg-spruce p-8">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-honey">
                Membership
              </p>
              <div className="mt-2 flex items-end gap-1">
                <span className="font-display text-4xl font-extrabold text-ivory">
                  $9
                </span>
                <span className="mb-1 text-sm text-ivory/60">/month</span>
              </div>
              <ul className="mt-5 space-y-2 text-sm text-ivory/85">
                <li>· Every cohort, all year</li>
                <li>· New monthly challenge drops</li>
                <li>· Ongoing members-only channel</li>
                <li>· Cancel anytime from your dashboard</li>
              </ul>
              <Link
                href="/login"
                className="mt-7 block rounded-full bg-honey px-6 py-3 text-center text-sm font-semibold text-spruce transition hover:bg-honey/90"
              >
                Go monthly
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-3xl px-6 py-16">
        <h2 className="text-sm font-bold uppercase tracking-[0.15em] text-teal">
          Questions
        </h2>
        <div className="mt-8 divide-y divide-line border-y border-line">
          {[
            {
              q: "Do I need a gym or any products?",
              a: "No. Movement is 20 minutes in any form — a walk counts. Skin is one small step a day with whatever you already have. Nothing to buy to start.",
            },
            {
              q: "What if I miss a day?",
              a: "You pick the streak back up the next day. Days unlock one at a time and you can't skip ahead, so it's about showing up — not being perfect.",
            },
            {
              q: "When can I start?",
              a: "Cohorts launch Jan 1, Apr 1, Jul 1 and Oct 1 so everyone begins together. Join now and your dashboard shows a countdown until Day 1.",
            },
            {
              q: "Can I cancel the membership?",
              a: "Anytime, from your dashboard — it's self-serve through Stripe. A one-time cohort is just a single payment with nothing recurring.",
            },
          ].map((f) => (
            <div key={f.q} className="py-5">
              <h3 className="font-bold text-spruce">{f.q}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">{f.a}</p>
            </div>
          ))}
        </div>
        <div className="mt-10 rounded-3xl bg-coral-light p-8 text-center">
          <h3 className="text-2xl font-extrabold text-spruce">
            Your next 30 days, actually finished.
          </h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted">
            Join the cohort, lock in your habit anchor, and start showing up with
            people doing it beside you.
          </p>
          <Link
            href="/login"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-coral px-8 py-3.5 text-sm font-semibold text-white transition hover:bg-coral/90"
          >
            Enter the Glow Room <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-5xl flex-col gap-2 px-6 py-8 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} The Glow Room</span>
          <span>Built to be finished, together.</span>
        </div>
      </footer>
    </main>
  );
}
