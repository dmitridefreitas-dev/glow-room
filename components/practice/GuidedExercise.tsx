"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, ArrowLeft } from "lucide-react";
import { Avatar } from "@/components/game/Avatar";
import { EXERCISES } from "@/lib/exercises";

// Generic engine for the data-driven practices in lib/exercises.ts. Takes just an
// id string (so a server page can render it without crossing the client boundary).
export function GuidedExercise({ id }: { id: string }) {
  const ex = EXERCISES[id];
  const [step, setStep] = useState(0);
  const [data, setData] = useState<Record<string, unknown>>({});
  const [done, setDone] = useState(false);

  if (!ex) return null;
  const steps = ex.steps;
  const cur = steps[step];

  function set(key: string, val: unknown) {
    setData((d) => ({ ...d, [key]: val }));
  }
  function next() {
    if (step < steps.length - 1) setStep((s) => s + 1);
    else finish();
  }
  function finish() {
    try {
      const k = `glow_ex_${id}`;
      const raw = localStorage.getItem(k);
      const arr = raw ? JSON.parse(raw) : [];
      arr.push({ at: new Date().toISOString(), data });
      localStorage.setItem(k, JSON.stringify(arr));
    } catch {
      /* ignore */
    }
    setDone(true);
  }

  if (done) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center px-6 py-12 text-center">
        <Avatar stage={4} size={128} />
        <h1 className="mt-4 font-display text-3xl font-extrabold text-spruce">{ex.close.title}</h1>
        <p className="mt-3 max-w-xs text-base text-muted">{ex.close.body}</p>
        <div className="mt-9 flex w-full flex-col gap-2.5">
          <Link href="/tools" className="rounded-2xl bg-spruce py-3.5 text-center font-bold text-ivory">
            More practices
          </Link>
          <Link href="/today" className="rounded-2xl border border-line bg-white py-3.5 text-center font-bold text-spruce">
            Back to today
          </Link>
        </div>
      </main>
    );
  }

  const chips = (data[cur.key] as string[] | undefined) ?? [];

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col px-6 py-8">
      <div className="flex items-center justify-between">
        {step > 0 ? (
          <button type="button" onClick={() => setStep((s) => s - 1)} className="flex items-center gap-1 text-sm font-bold text-teal">
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
        ) : (
          <Link href="/tools" className="flex items-center gap-1 text-sm font-bold text-teal">
            <ArrowLeft className="h-4 w-4" /> Practices
          </Link>
        )}
        <span className="text-xs font-semibold text-muted">
          {step + 1} / {steps.length}
        </span>
      </div>

      <p className="mt-4 text-xs font-extrabold uppercase tracking-[0.15em] text-coral">{ex.eyebrow}</p>

      <div className="mt-2 flex-1">
        <div className="anim-screen-in">
          <h1 className="mt-1 font-display text-2xl font-extrabold text-spruce">{cur.title}</h1>
          {cur.hint && <p className="mt-1.5 text-sm text-muted">{cur.hint}</p>}

          <div className="mt-4 flex flex-col gap-2.5">
            {cur.type === "text" && (
              <textarea
                value={String(data[cur.key] ?? "")}
                onChange={(e) => set(cur.key, e.target.value)}
                rows={4}
                placeholder={cur.placeholder}
                className="reframe-input"
              />
            )}

            {cur.type === "choice" &&
              cur.options.map((o) => (
                <button
                  key={o.key}
                  type="button"
                  onClick={() => {
                    set(cur.key, o.key);
                    next();
                  }}
                  className={`rounded-2xl border-2 px-5 py-3.5 text-left font-bold transition ${
                    data[cur.key] === o.key ? "border-coral bg-coral-light text-spruce" : "border-line bg-white text-spruce"
                  }`}
                >
                  {o.label}
                </button>
              ))}

            {cur.type === "chips" &&
              cur.options.map((o) => {
                const on = chips.includes(o.key);
                return (
                  <button
                    key={o.key}
                    type="button"
                    onClick={() => set(cur.key, on ? chips.filter((x) => x !== o.key) : [...chips, o.key])}
                    className={`rounded-2xl border-2 px-4 py-2.5 text-left transition ${
                      on ? "border-coral bg-coral-light" : "border-line bg-white"
                    }`}
                  >
                    <div className="text-sm font-bold text-spruce">{o.label}</div>
                    {o.blurb && <div className="text-xs text-muted">{o.blurb}</div>}
                  </button>
                );
              })}
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={next}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-spruce py-4 text-lg font-extrabold text-ivory shadow-lg transition active:translate-y-0.5"
      >
        {step === steps.length - 1 ? "Finish" : "Next"} <ArrowRight className="h-5 w-5" />
      </button>
    </main>
  );
}
