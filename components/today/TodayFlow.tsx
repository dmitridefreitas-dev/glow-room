"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Check, ArrowRight, ArrowLeft } from "lucide-react";
import { Avatar } from "@/components/game/Avatar";
import { GlowNav } from "@/components/glow/GlowNav";
import { STRUCTURES, DEFAULT_STRUCTURE, structureById } from "@/lib/structures";

// "The Next Small Thing" — your day, one step at a time. Duolingo-style: a top bar
// with a back button + progress, you can leave any time and come back to finish,
// and once the list is done it's marked complete for the day. Progress lives in the
// browser (localStorage), keyed to today's date; it resets gently each morning.
// Self-contained: nothing here links back to the old Glow Room game.

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
  const [flash, setFlash] = useState<string | null>(null);
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const structure = structureById(structureId);
  const steps = structure.steps;
  const done = doneByStruct[structureId] ?? [];
  const doneSet = new Set(done);
  const allDone = done.length >= steps.length;
  const stage = Math.max(0, Math.min(5, Math.round((done.length / steps.length) * 5)));
  const onlyOneLeft = steps.length - done.length <= 1;

  // Hydrate today's progress + the plan's chosen structure, once on mount.
  useEffect(() => {
    const s = load();
    let sid = DEFAULT_STRUCTURE;
    try {
      const p = JSON.parse(localStorage.getItem("glow_plan_v1") ?? "null");
      const planned = p?.plan?.structureId;
      if (planned && STRUCTURES.some((x) => x.id === planned)) sid = planned;
    } catch {
      /* ignore */
    }
    const d = new Set(s.structures[sid] ?? []);
    const idx = Math.max(0, firstPending(structureById(sid).steps.length, d));
    /* eslint-disable react-hooks/set-state-in-effect -- one-time hydrate from localStorage */
    setDoneByStruct(s.structures);
    setStructureId(sid);
    setViewIdx(idx);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  useEffect(
    () => () => {
      if (flashTimer.current) clearTimeout(flashTimer.current);
    },
    []
  );

  function save(map: Record<string, number[]>) {
    setDoneByStruct(map);
    try {
      localStorage.setItem(KEY, JSON.stringify({ date: todayKey(), structures: map }));
    } catch {
      /* ignore */
    }
  }

  function showPraise() {
    setFlash(PRAISE[done.length % PRAISE.length]);
    if (flashTimer.current) clearTimeout(flashTimer.current);
    flashTimer.current = setTimeout(() => setFlash(null), 1400);
  }

  function markDone() {
    let nd = done;
    if (!doneSet.has(viewIdx)) {
      nd = [...done, viewIdx];
      save({ ...doneByStruct, [structureId]: nd });
      showPraise();
    }
    const ns = nextPending(steps.length, new Set(nd), viewIdx);
    if (ns !== -1) setViewIdx(ns);
  }

  function skip() {
    const ns = nextPending(steps.length, doneSet, viewIdx);
    if (ns !== -1) setViewIdx(ns);
  }

  function back() {
    setViewIdx((v) => Math.max(0, v - 1));
  }

  function switchTo(id: string) {
    setStructureId(id);
    setFlash(null);
    const d = new Set(doneByStruct[id] ?? []);
    setViewIdx(Math.max(0, firstPending(structureById(id).steps.length, d)));
  }

  // ── Done for today ──
  if (allDone) {
    return (
      <>
        <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center px-6 pt-12 pb-28 text-center">
          <Avatar stage={Math.max(2, stage)} size={132} />
          <div className="mt-4 flex items-center gap-2 text-sage">
            <Check className="h-5 w-5" strokeWidth={3} />
            <span className="text-xs font-extrabold uppercase tracking-[0.15em]">Done for today</span>
          </div>
          <h1 className="mt-2 font-display text-3xl font-extrabold text-spruce">
            That&apos;s the whole list. ✨
          </h1>
          <p className="mt-3 max-w-xs text-base text-muted">
            You did <strong className="text-spruce">{done.length}</strong>{" "}
            {done.length === 1 ? "thing" : "things"} today. Come back tomorrow — that&apos;s the whole game.
          </p>

          <Link
            href="/tools"
            className="mt-8 flex w-full items-center justify-center gap-2 rounded-2xl bg-coral py-3.5 font-bold text-white shadow-md transition active:translate-y-0.5"
          >
            Practice a skill <ArrowRight className="h-4 w-4" />
          </Link>

          <div className="mt-6 w-full">
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-teal">Another small list?</p>
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

          <Link href="/start" className="mt-7 text-xs font-semibold text-teal underline-offset-2 hover:underline">
            Re-do my plan
          </Link>
        </main>
        <GlowNav />
      </>
    );
  }

  const step = steps[viewIdx];

  // ── The one step ──
  return (
    <>
      <main className="mx-auto flex min-h-dvh max-w-md flex-col px-6 pt-6 pb-28">
        {/* top bar — back + progress (Duolingo style) */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={back}
            disabled={viewIdx === 0}
            aria-label="Previous step"
            className="shrink-0 text-spruce transition disabled:opacity-25"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <div className="h-3 flex-1 overflow-hidden rounded-full bg-line">
            <div
              className="h-full rounded-full bg-gradient-to-r from-sage to-teal transition-all duration-500"
              style={{ width: `${(done.length / steps.length) * 100}%` }}
            />
          </div>
          <span className="shrink-0 text-xs font-bold text-muted">
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

          {done.length === 0 && <p className="mt-6 max-w-xs text-sm text-muted">{structure.intro}</p>}

          <h1 className="mt-5 font-display text-[2rem] font-extrabold leading-tight text-spruce">{step.title}</h1>
          {step.hint && <p className="mt-3 max-w-xs text-base text-muted">{step.hint}</p>}
        </div>

        {/* actions */}
        <div>
          <button
            type="button"
            onClick={markDone}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-spruce py-4 text-lg font-extrabold text-ivory shadow-lg transition active:translate-y-0.5"
          >
            <Check className="h-5 w-5" strokeWidth={3} /> Done
          </button>
          {!onlyOneLeft && (
            <div className="mt-3 text-center">
              <button
                type="button"
                onClick={skip}
                className="text-sm font-semibold text-muted underline-offset-2 hover:underline"
              >
                Not right now
              </button>
            </div>
          )}
        </div>
      </main>
      <GlowNav />
    </>
  );
}
