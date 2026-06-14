import Link from "next/link";

const pillars = [
  {
    name: "Movement",
    body: "20 minutes a day, any form. A walk, a circuit, a dance break. No gym required.",
    color: "bg-coral-light",
    bar: "bg-coral",
  },
  {
    name: "Skin",
    body: "One small step a day, built up over 30 days into a real routine — never overwhelming.",
    color: "bg-teal-light",
    bar: "bg-teal",
  },
  {
    name: "Mindset",
    body: "A five-minute journaling prompt designed to produce one specific internal shift.",
    color: "bg-honey-light",
    bar: "bg-honey",
  },
  {
    name: "Habit Anchor",
    body: "One non-negotiable daily task, the same every day, that makes everything else stick.",
    color: "bg-sage-light",
    bar: "bg-sage",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen">
      {/* Hero */}
      <section className="bg-spruce text-ivory">
        <div className="mx-auto max-w-5xl px-6 py-20 md:py-28">
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
            <span className="text-honey">together</span>. Movement, skin, mindset,
            and one daily habit. Every day already planned. No deciding, just
            doing.
          </p>
          <div className="mt-9 flex flex-wrap gap-4">
            <Link
              href="/login"
              className="rounded-full bg-coral px-7 py-3 text-sm font-semibold text-white transition hover:bg-coral/90"
            >
              Enter the Glow Room
            </Link>
            <Link
              href="/login"
              className="rounded-full border border-ivory/40 px-7 py-3 text-sm font-semibold text-ivory transition hover:bg-ivory/10"
            >
              Sign in
            </Link>
          </div>
          <p className="mt-5 text-xs text-ivory/55">
            Cohorts start Jan 1 · Apr 1 · Jul 1 · Oct 1 — everyone begins the same
            day.
          </p>
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
            <div
              key={p.name}
              className={`rounded-2xl ${p.color} p-6 shadow-sm`}
            >
              <span className={`block h-1 w-10 rounded ${p.bar}`} />
              <h3 className="mt-4 text-lg font-bold text-spruce">{p.name}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">
                {p.body}
              </p>
            </div>
          ))}
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
