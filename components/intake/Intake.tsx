"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, ArrowLeft, Sparkles } from "lucide-react";
import { Avatar } from "@/components/game/Avatar";
import { buildPlan, PRACTICE_META, type IntakeAnswers } from "@/lib/plan";
import { structureById } from "@/lib/structures";

type Q = {
  key: keyof IntakeAnswers;
  type: "chips" | "choice";
  title: string;
  hint?: string;
  options: { key: string; label: string }[];
};

const QUESTIONS: Q[] = [
  {
    key: "hardest",
    type: "chips",
    title: "What's the hardest part right now?",
    hint: "Pick any that fit — there's no wrong answer.",
    options: [
      { key: "bed", label: "Getting out of bed" },
      { key: "getdone", label: "Getting anything done" },
      { key: "anxious", label: "Racing, anxious thoughts" },
      { key: "mean", label: "Being hard on myself" },
      { key: "sleep", label: "My sleep's a mess" },
      { key: "alone", label: "Feeling alone" },
    ],
  },
  {
    key: "worst",
    type: "choice",
    title: "When is it worst?",
    options: [
      { key: "mornings", label: "Mornings" },
      { key: "afternoons", label: "The afternoon slump" },
      { key: "nights", label: "Nights" },
      { key: "allday", label: "Honestly, all day" },
    ],
  },
  {
    key: "doable",
    type: "choice",
    title: "Right now, what feels doable?",
    options: [
      { key: "nothing", label: "Honestly, nothing" },
      { key: "one", label: "One tiny thing" },
      { key: "few", label: "A few small things" },
      { key: "full", label: "I want a full routine" },
    ],
  },
  {
    key: "want",
    type: "choice",
    title: "What do you want more of?",
    options: [
      { key: "calm", label: "Calm" },
      { key: "energy", label: "Energy" },
      { key: "focus", label: "Focus" },
      { key: "kindness", label: "To be kinder to myself" },
    ],
  },
];

export function Intake() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [hardest, setHardest] = useState<string[]>([]);
  const [single, setSingle] = useState<Record<string, string>>({});

  const atReveal = step >= QUESTIONS.length;

  if (atReveal) {
    const answers: IntakeAnswers = {
      hardest,
      worst: single.worst ?? "allday",
      doable: single.doable ?? "one",
      want: single.want ?? "calm",
    };
    const plan = buildPlan(answers);
    const structure = structureById(plan.structureId);

    function start() {
      try {
        localStorage.setItem("glow_plan_v1", JSON.stringify({ answers, plan, at: new Date().toISOString() }));
      } catch {
        /* ignore */
      }
      router.push("/today");
    }

    return (
      <main className="mx-auto flex min-h-dvh max-w-md flex-col px-6 py-10">
        <div className="flex flex-col items-center text-center">
          <Avatar stage={3} size={104} />
          <p className="mt-4 flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-[0.15em] text-coral">
            <Sparkles className="h-3.5 w-3.5" /> Your plan
          </p>
          <h1 className="mt-2 font-display text-3xl font-extrabold text-spruce">{plan.headline}</h1>
          <p className="mt-3 text-base text-muted">{plan.reflect}</p>
        </div>

        <div className="mt-7 rounded-2xl border border-line bg-white p-5">
          <p className="text-xs font-bold uppercase tracking-[0.15em] text-teal">Your daily list</p>
          <div className="mt-1 font-display text-xl font-extrabold text-spruce">{structure.title}</div>
          <div className="text-sm text-muted">{structure.when}</div>
        </div>

        <div className="mt-4 rounded-2xl border border-line bg-white p-5">
          <p className="text-xs font-bold uppercase tracking-[0.15em] text-teal">Your kit</p>
          <div className="mt-2.5 flex flex-col gap-2">
            {plan.practices.map((p) => {
              const m = PRACTICE_META[p];
              if (!m) return null;
              return (
                <Link
                  key={p}
                  href={m.href}
                  className="flex items-center justify-between rounded-xl bg-ivory px-4 py-2.5 text-sm font-bold text-spruce transition hover:bg-teal-light"
                >
                  {m.label}
                  <ArrowRight className="h-4 w-4 text-teal" />
                </Link>
              );
            })}
          </div>
        </div>

        <button
          type="button"
          onClick={start}
          className="mt-7 flex w-full items-center justify-center gap-2 rounded-2xl bg-spruce py-4 text-lg font-extrabold text-ivory shadow-lg transition active:translate-y-0.5"
        >
          Start my plan <ArrowRight className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={() => {
            setStep(0);
            setHardest([]);
            setSingle({});
          }}
          className="mt-3 text-center text-xs font-semibold text-muted underline-offset-2 hover:underline"
        >
          Start over
        </button>
        <Link href="/story" className="mt-2 text-center text-xs font-semibold text-teal underline-offset-2 hover:underline">
          Who built this?
        </Link>
      </main>
    );
  }

  const q = QUESTIONS[step];

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col px-6 py-8">
      <div className="flex items-center justify-between">
        {step > 0 ? (
          <button type="button" onClick={() => setStep((s) => s - 1)} className="flex items-center gap-1 text-sm font-bold text-teal">
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
        ) : (
          <span />
        )}
        <span className="text-xs font-semibold text-muted">
          {step + 1} / {QUESTIONS.length}
        </span>
      </div>

      <p className="mt-4 text-xs font-extrabold uppercase tracking-[0.15em] text-coral">Let&apos;s build your plan</p>

      <div className="mt-2 flex-1">
        <div className="anim-screen-in">
          <h1 className="mt-1 font-display text-2xl font-extrabold text-spruce">{q.title}</h1>
          {q.hint && <p className="mt-1.5 text-sm text-muted">{q.hint}</p>}

          <div className="mt-5 flex flex-col gap-2.5">
            {q.type === "chips" &&
              q.options.map((o) => {
                const on = hardest.includes(o.key);
                return (
                  <button
                    key={o.key}
                    type="button"
                    onClick={() => setHardest((h) => (on ? h.filter((x) => x !== o.key) : [...h, o.key]))}
                    className={`rounded-2xl border-2 px-5 py-3.5 text-left font-bold transition ${
                      on ? "border-coral bg-coral-light text-spruce" : "border-line bg-white text-spruce"
                    }`}
                  >
                    {o.label}
                  </button>
                );
              })}

            {q.type === "choice" &&
              q.options.map((o) => (
                <button
                  key={o.key}
                  type="button"
                  onClick={() => {
                    setSingle((s) => ({ ...s, [q.key]: o.key }));
                    setStep((s) => s + 1);
                  }}
                  className={`rounded-2xl border-2 px-5 py-3.5 text-left font-bold transition ${
                    single[q.key] === o.key ? "border-coral bg-coral-light text-spruce" : "border-line bg-white text-spruce"
                  }`}
                >
                  {o.label}
                </button>
              ))}
          </div>
        </div>
      </div>

      {q.type === "chips" && (
        <button
          type="button"
          onClick={() => setStep((s) => s + 1)}
          disabled={hardest.length === 0}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-spruce py-4 text-lg font-extrabold text-ivory shadow-lg transition active:translate-y-0.5 disabled:opacity-40"
        >
          Next <ArrowRight className="h-5 w-5" />
        </button>
      )}
    </main>
  );
}
