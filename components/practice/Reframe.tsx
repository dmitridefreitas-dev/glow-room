"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, ArrowLeft } from "lucide-react";
import { Avatar } from "@/components/game/Avatar";

// "Reframe a thought" — a guided CBT thought-record. The classic, evidence-based
// cognitive-restructuring exercise, turned into a gentle step-by-step practice:
// catch the thought → rate it → spot the thinking trap → talk back → re-rate and
// notice the shift. CBT-informed self-help, NOT therapy. Standalone + localStorage.

type Distortion = { key: string; label: string; blurb: string };

const DISTORTIONS: Distortion[] = [
  { key: "all_or_nothing", label: "All-or-nothing", blurb: "Total win or total failure — no middle ground." },
  { key: "catastrophizing", label: "Catastrophizing", blurb: "Jumping to the worst possible outcome." },
  { key: "mind_reading", label: "Mind-reading", blurb: "Assuming you know what others are thinking." },
  { key: "fortune_telling", label: "Fortune-telling", blurb: "Predicting it'll go badly before it happens." },
  { key: "labeling", label: "Labeling", blurb: "\"I'm a failure\" instead of \"that didn't go well.\"" },
  { key: "discounting", label: "Discounting the good", blurb: "Brushing off what actually went okay." },
  { key: "shoulds", label: "Should statements", blurb: "Beating yourself up with \"I should…\"" },
  { key: "emotional", label: "Emotional reasoning", blurb: "\"I feel it, so it must be true.\"" },
];

const STEPS = ["situation", "thought", "trap", "reframe", "shift"] as const;

export function Reframe() {
  const [step, setStep] = useState(0);
  const [situation, setSituation] = useState("");
  const [thought, setThought] = useState("");
  const [before, setBefore] = useState(70);
  const [after, setAfter] = useState(40);
  const [traps, setTraps] = useState<string[]>([]);
  const [reframe, setReframe] = useState("");
  const [done, setDone] = useState(false);

  function toggleTrap(k: string) {
    setTraps((t) => (t.includes(k) ? t.filter((x) => x !== k) : [...t, k]));
  }

  function next() {
    if (step < STEPS.length - 1) setStep((s) => s + 1);
    else finish();
  }
  function back() {
    if (step > 0) setStep((s) => s - 1);
  }

  function finish() {
    try {
      const raw = localStorage.getItem("glow_reframes_v1");
      const arr = raw ? JSON.parse(raw) : [];
      arr.push({ at: new Date().toISOString(), situation, thought, before, after, reframe, traps });
      localStorage.setItem("glow_reframes_v1", JSON.stringify(arr));
    } catch {
      /* ignore */
    }
    setDone(true);
  }

  // ── Finished ──
  if (done) {
    const drop = Math.max(0, before - after);
    return (
      <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center px-6 py-12 text-center">
        <Avatar stage={4} size={128} />
        <h1 className="mt-4 font-display text-3xl font-extrabold text-spruce">
          You talked back to it.
        </h1>
        <p className="mt-3 max-w-xs text-base text-muted">
          Your belief in that thought went from{" "}
          <strong className="text-spruce">{before}</strong> to{" "}
          <strong className="text-spruce">{after}</strong>
          {drop > 0 ? (
            <> — that {drop}-point drop <em>is</em> the skill. It gets easier every time.</>
          ) : (
            <>. Even noticing the thought is the skill. It gets easier every time.</>
          )}
        </p>
        <div className="mt-9 flex w-full flex-col gap-2.5">
          <Link href="/reframe" className="rounded-2xl bg-spruce py-3.5 text-center font-bold text-ivory">
            Reframe another
          </Link>
          <Link href="/today" className="rounded-2xl border border-line bg-white py-3.5 text-center font-bold text-spruce">
            Back to today
          </Link>
        </div>
      </main>
    );
  }

  const which = STEPS[step];

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col px-6 py-8">
      {/* header */}
      <div className="flex items-center justify-between">
        {step > 0 ? (
          <button type="button" onClick={back} className="flex items-center gap-1 text-sm font-bold text-teal">
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
        ) : (
          <Link href="/today" className="flex items-center gap-1 text-sm font-bold text-teal">
            <ArrowLeft className="h-4 w-4" /> Today
          </Link>
        )}
        <span className="text-xs font-semibold text-muted">{step + 1} / {STEPS.length}</span>
      </div>

      <p className="mt-4 text-xs font-extrabold uppercase tracking-[0.15em] text-coral">
        Reframe a thought
      </p>

      <div className="mt-2 flex-1">
        {which === "situation" && (
          <Field
            title="What happened?"
            hint="One sentence. The moment that set the thought off."
          >
            <textarea
              value={situation}
              onChange={(e) => setSituation(e.target.value)}
              rows={3}
              placeholder="e.g. I missed another class this morning."
              className="reframe-input"
            />
          </Field>
        )}

        {which === "thought" && (
          <Field title="What did your mind say?" hint="The thought, in its own harsh words.">
            <textarea
              value={thought}
              onChange={(e) => setThought(e.target.value)}
              rows={3}
              placeholder="e.g. I'm hopeless. I'm going to fail everything."
              className="reframe-input"
            />
            <RatingRow label="How much do you believe it right now?" value={before} onChange={setBefore} />
          </Field>
        )}

        {which === "trap" && (
          <Field title="Spot the trap" hint="Which of these is your mind doing? Pick any that fit.">
            <div className="mt-1 flex flex-col gap-2">
              {DISTORTIONS.map((d) => {
                const on = traps.includes(d.key);
                return (
                  <button
                    key={d.key}
                    type="button"
                    onClick={() => toggleTrap(d.key)}
                    className={`rounded-2xl border-2 px-4 py-2.5 text-left transition ${
                      on ? "border-coral bg-coral-light" : "border-line bg-white"
                    }`}
                  >
                    <div className="text-sm font-bold text-spruce">{d.label}</div>
                    <div className="text-xs text-muted">{d.blurb}</div>
                  </button>
                );
              })}
            </div>
          </Field>
        )}

        {which === "reframe" && (
          <Field
            title="Now talk back to it"
            hint="What would you say to a friend who had this thought? What's a fairer, kinder way to see it?"
          >
            <textarea
              value={reframe}
              onChange={(e) => setReframe(e.target.value)}
              rows={4}
              placeholder="e.g. Missing one class doesn't make me hopeless. I'm struggling right now, and I just showed up here to work on it."
              className="reframe-input"
            />
          </Field>
        )}

        {which === "shift" && (
          <Field title="Read your reframe back" hint="Now re-rate the original thought.">
            <div className="rounded-2xl bg-sage-light p-4 text-sm text-spruce">
              {reframe || "—"}
            </div>
            <RatingRow label="How much do you believe the original thought now?" value={after} onChange={setAfter} />
            <p className="mt-2 text-center text-xs text-muted">
              Belief usually drops. Watching that gap is the whole point.
            </p>
          </Field>
        )}
      </div>

      <button
        type="button"
        onClick={next}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-spruce py-4 text-lg font-extrabold text-ivory shadow-lg transition active:translate-y-0.5"
      >
        {step === STEPS.length - 1 ? "Finish" : "Next"} <ArrowRight className="h-5 w-5" />
      </button>
    </main>
  );
}

function Field({ title, hint, children }: { title: string; hint: string; children: React.ReactNode }) {
  return (
    <div className="anim-screen-in">
      <h1 className="mt-1 font-display text-2xl font-extrabold text-spruce">{title}</h1>
      <p className="mt-1.5 text-sm text-muted">{hint}</p>
      <div className="mt-4 flex flex-col gap-4">{children}</div>
    </div>
  );
}

function RatingRow({ label, value, onChange }: { label: string; value: number; onChange: (n: number) => void }) {
  return (
    <div>
      <div className="flex items-center justify-between text-sm font-semibold text-spruce">
        <span className="text-muted">{label}</span>
        <span>{value}%</span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        step={5}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-2 w-full accent-coral"
      />
    </div>
  );
}
