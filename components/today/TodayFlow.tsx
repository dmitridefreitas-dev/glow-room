"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import { Avatar } from "@/components/game/Avatar";
import {
  STRUCTURES,
  DEFAULT_STRUCTURE,
  structureById,
} from "@/lib/structures";

// "The Next Small Thing" — the whole app is one screen: the single next step, a
// big Done, and a shameless way out. Progress lives in the browser (localStorage),
// keyed to today's date, so there's no login wall and nothing touches the live
// backend. It resets gently each morning.

const KEY = "glow_today_v1";

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

type Saved = { date: string; structures: Record<string, number[]> };

function load(): Saved {
  if (typeof window === "undefined") return { date: todayKey(), structures: {} };
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const s = JSON.parse(raw) as Saved;
      if (s && s.date === todayKey() && s.structures) return s;
    }
  } catch {
    /* ignore */
  }
  return { date: todayKey(), structures: {} };
}

function firstPending(count: number, done: Set<number>): number {
  for (let i = 0; i < count; i++) if (!done.has(i)) return i;
  return -1;
}

function nextPending(count: number, done: Set<number>, after: number): number {
  for (let i = after + 1; i < count; i++) if (!done.has(i)) return i;
  for (let i = 0; i <= after; i++) if (!done.has(i)) return i;
  return -1;
}

const PRAISE = ["that's one.", "good.", "nice.", "keep going.", "that counts.", "proud of you."];

export function TodayFlow() {
  const [structureId, setStructureId] = useState(DEFAULT_STRUCTURE);
  const [doneByStruct, setDoneByStruct] = useState<Record<string, number[]>>({});
  const [viewIdx, setViewIdx] = useState(0);
  const [resting, setResting] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const structure = structureById(structureId);
  const steps = structure.steps;
  const done = doneByStruct[structureId] ?? [];
  const doneSet = new Set(done);
  const allDone = done.length >= steps.length;
  const stage = Math.max(0, Math.min(5, Math.round((done.length / steps.length) * 5)));

  // Hydrate today's saved progress once on mount. (Done in an effect, not a lazy
  // initializer, so the server and first client render match — localStorage is
  // client-only. This one-time sync from an external store is the intended use.)
  useEffect(() => {
    const s = load();
    const d = new Set(s.structures[DEFAULT_STRUCTURE] ?? []);
    const idx = Math.max(0, firstPending(structureById(DEFAULT_STRUCTURE).steps.length, d));
    /* eslint-disable react-hooks/set-state-in-effect -- one-time hydrate from localStorage */
    setDoneByStruct(s.structures);
    setViewIdx(idx);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  // Clear any pending praise timer on unmount.
  useEffect(() => () => {
    if (flashTimer.current) clearTimeout(flashTimer.current);
  }, []);

  function save(map: Record<string, number[]>) {
    setDoneByStruct(map);
    try {
      localStorage.setItem(KEY, JSON.stringify({ date: todayKey(), structures: map }));
    } catch {
      /* ignore */
    }
  }

  function showPraise() {
    const word = PRAISE[done.length % PRAISE.length];
    setFlash(word);
    if (flashTimer.current) clearTimeout(flashTimer.current);
    flashTimer.current = setTimeout(() => setFlash(null), 1400);
  }

  function markDone() {
    if (doneSet.has(viewIdx)) return;
    const nd = [...done, viewIdx];
    save({ ...doneByStruct, [structureId]: nd });
    showPraise();
    const ns = nextPending(steps.length, new Set(nd), viewIdx);
    if (ns !== -1) setViewIdx(ns);
  }

  function skip() {
    const ns = nextPending(steps.length, doneSet, viewIdx);
    if (ns !== -1) setViewIdx(ns);
  }

  function switchTo(id: string) {
    setStructureId(id);
    setResting(false);
    setFlash(null);
    const d = new Set(doneByStruct[id] ?? []);
    setViewIdx(Math.max(0, firstPending(structureById(id).steps.length, d)));
  }

  // ── Rest / finished screen ──
  if (resting || allDone) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center px-6 py-12 text-center">
        <Avatar stage={Math.max(2, stage)} size={132} />
        <h1 className="mt-4 font-display text-3xl font-extrabold text-spruce">
          {allDone ? "That's the whole list." : "Rest now."}
        </h1>
        <p className="mt-3 text-base text-muted">
          You did <strong className="text-spruce">{done.length}</strong>{" "}
          {done.length === 1 ? "thing" : "things"} today.
          {done.length > 0 ? " That's you climbing." : " That's okay. Tomorrow we go again."}
        </p>

        <div className="mt-9 w-full">
          <p className="text-xs font-bold uppercase tracking-[0.15em] text-teal">
            Another small list?
          </p>
          <div className="mt-3 flex flex-col gap-2.5">
            {STRUCTURES.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => switchTo(s.id)}
                className="rounded-2xl border border-line bg-white px-5 py-3.5 text-left transition hover:border-teal"
              >
                <div className="font-bold text-spruce">{s.title}</div>
                <div className="text-xs text-muted">{s.when}</div>
              </button>
            ))}
          </div>
        </div>

        <Link href="/" className="mt-8 text-xs font-semibold text-muted underline-offset-2 hover:underline">
          Close for now
        </Link>
      </main>
    );
  }

  const step = steps[viewIdx];
  const onlyOneLeft = steps.length - done.length <= 1;

  // ── The one step ──
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col px-6 py-8">
      {/* gentle progress — small, never a scoreboard */}
      <div className="flex items-center gap-3">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-line">
          <div
            className="h-full rounded-full bg-gradient-to-r from-sage to-teal transition-all duration-500"
            style={{ width: `${(done.length / steps.length) * 100}%` }}
          />
        </div>
        <span className="text-xs font-semibold text-muted">
          {done.length}/{steps.length}
        </span>
      </div>

      {/* companion + the single step */}
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <div className="relative">
          <Avatar stage={stage} size={104} />
          {flash && (
            <span className="absolute left-1/2 top-full mt-1 -translate-x-1/2 whitespace-nowrap rounded-full bg-sage-light px-3 py-1 text-xs font-bold text-spruce animate-pop">
              {flash}
            </span>
          )}
        </div>

        {done.length === 0 && (
          <p className="mt-6 max-w-xs text-sm text-muted">{structure.intro}</p>
        )}

        <h1 className="mt-5 font-display text-[2rem] font-extrabold leading-tight text-spruce">
          {step.title}
        </h1>
        {step.hint && <p className="mt-3 max-w-xs text-base text-muted">{step.hint}</p>}
      </div>

      {/* actions */}
      <div className="pb-2">
        <button
          type="button"
          onClick={markDone}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-spruce py-4 text-lg font-extrabold text-ivory shadow-lg transition active:translate-y-0.5"
        >
          <Check className="h-5 w-5" strokeWidth={3} /> Done
        </button>

        <div className="mt-3 flex items-center justify-center gap-5">
          {!onlyOneLeft && (
            <button
              type="button"
              onClick={skip}
              className="text-sm font-semibold text-muted underline-offset-2 hover:underline"
            >
              Not right now
            </button>
          )}
          <button
            type="button"
            onClick={() => setResting(true)}
            className="text-sm font-semibold text-muted underline-offset-2 hover:underline"
          >
            I&apos;m done for now
          </button>
        </div>
      </div>
    </main>
  );
}
