"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Avatar } from "@/components/game/Avatar";

// "Ground yourself" — box breathing. No typing, no logging: just follow the circle.
// The circle is a 16s CSS loop (grow 4s · hold 4s · shrink 4s · hold 4s); JS only
// advances the word label and counts cycles, so it stays in sync.
const LABELS = ["Breathe in", "Hold", "Breathe out", "Hold"];

export function Breathing() {
  const [i, setI] = useState(0);
  const [cycles, setCycles] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (done) return;
    const id = setInterval(() => {
      setI((prev) => {
        const nx = (prev + 1) % LABELS.length;
        if (nx === 0) setCycles((c) => c + 1);
        return nx;
      });
    }, 4000);
    return () => clearInterval(id);
  }, [done]);

  if (done) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center px-6 py-12 text-center">
        <Avatar stage={3} size={120} />
        <h1 className="mt-4 font-display text-3xl font-extrabold text-spruce">Notice your shoulders drop.</h1>
        <p className="mt-3 max-w-xs text-base text-muted">
          You gave your nervous system {cycles} {cycles === 1 ? "round" : "rounds"} of slow. That&apos;s real — come back to it any time the noise gets loud.
        </p>
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

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col px-6 py-8">
      <Link href="/tools" className="text-sm font-bold text-teal">
        ← Practices
      </Link>

      <div className="flex flex-1 flex-col items-center justify-center">
        <p className="text-xs font-extrabold uppercase tracking-[0.15em] text-teal">Ground yourself</p>
        <div className="breathe-wrap mt-8">
          <span className="breathe-circle" />
          <span className="breathe-word">{LABELS[i]}</span>
        </div>
        <p className="mt-10 text-sm text-muted">Follow the circle. Nothing else to do.</p>
      </div>

      <button
        type="button"
        onClick={() => setDone(true)}
        className="rounded-2xl border border-line bg-white py-3.5 text-center font-bold text-spruce transition active:translate-y-0.5"
      >
        I&apos;m calmer
      </button>
    </main>
  );
}
