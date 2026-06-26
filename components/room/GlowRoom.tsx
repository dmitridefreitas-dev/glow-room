"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Footprints,
  Sparkles,
  Brain,
  Anchor,
  Check,
  Flame,
  Zap,
  X,
  Share2,
  Map as MapIcon,
  type LucideIcon,
} from "lucide-react";
import { Avatar, stageFromLevel } from "@/components/game/Avatar";
import { Celebrate } from "@/components/Celebrate";
import { logPillar } from "@/app/play/actions";

// ── Types ───────────────────────────────────────────────────────────────────
export type Station = {
  key: "movement_done" | "skin_done" | "mindset_done" | "anchor_done";
  label: string;
  task: string;
  done: boolean;
};

type Props = {
  name: string;
  day: number;
  total: number;
  streak: number;
  completed: number;
  level: { level: number; pct: number; intoLevel: number; span: number };
  tierLabel: string;
  stations: Station[];
  challengeComplete: boolean;
};

// Per-pillar identity: icon + accent. Each station is one "spot" in your room.
const LOOK: Record<Station["key"], { Icon: LucideIcon; accent: string; soft: string }> = {
  movement_done: { Icon: Footprints, accent: "var(--color-sage)", soft: "var(--color-sage-light)" },
  skin_done: { Icon: Sparkles, accent: "var(--color-coral)", soft: "var(--color-coral-light)" },
  mindset_done: { Icon: Brain, accent: "var(--color-honey)", soft: "var(--color-honey-light)" },
  anchor_done: { Icon: Anchor, accent: "var(--color-teal)", soft: "var(--color-teal-light)" },
};

// Fixed spots around the avatar, by station count. Reads as objects in a room
// rather than a list — but with no fragile per-element math.
const SPOTS: Record<number, { x: number; y: number }[]> = {
  4: [
    { x: 16, y: 34 },
    { x: 84, y: 34 },
    { x: 22, y: 72 },
    { x: 78, y: 72 },
  ],
  3: [
    { x: 18, y: 40 },
    { x: 82, y: 40 },
    { x: 50, y: 78 },
  ],
  2: [
    { x: 24, y: 56 },
    { x: 76, y: 56 },
  ],
};

export function GlowRoom({
  name,
  day,
  total,
  streak,
  completed,
  level,
  tierLabel,
  stations,
  challengeComplete,
}: Props) {
  const router = useRouter();
  const [busy, start] = useTransition();

  const [done, setDone] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(stations.map((s) => [s.key, s.done]))
  );
  const [active, setActive] = useState<Station | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [justCompleted, setJustCompleted] = useState(false);

  const totalToday = stations.length;
  const doneToday = stations.reduce((n, s) => n + (done[s.key] ? 1 : 0), 0);
  const allDoneInit = useMemo(
    () => stations.every((s) => s.done),
    [stations]
  );
  const allDone = doneToday === totalToday;
  const bloom = totalToday > 0 ? doneToday / totalToday : 0;
  const spots = SPOTS[totalToday] ?? SPOTS[4];

  function complete(s: Station) {
    setErr(null);
    start(async () => {
      const res = await logPillar(s.key);
      if (!res.ok) {
        setErr(res.error);
        return;
      }
      setDone((p) => ({ ...p, [s.key]: true }));
      setActive(null);
      if (res.allDone && !allDoneInit) setJustCompleted(true);
      router.refresh();
    });
  }

  async function share() {
    const text = challengeComplete
      ? `I finished my 30-day glow up 🤍`
      : `Day ${day} done — ${streak}-day streak in my Glow Room 🌿`;
    const url = typeof window !== "undefined" ? window.location.origin : "";
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ title: "The Glow Room", text, url });
      } else if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(`${text} ${url}`.trim());
      }
    } catch {
      /* user dismissed the share sheet — nothing to do */
    }
  }

  const restful = allDone; // the room is "at rest / bloomed" when today is done

  return (
    <div className="room-shell" style={{ ["--bloom" as string]: bloom }}>
      <Celebrate fire={justCompleted} big={challengeComplete} />

      {/* ── HUD ── */}
      <header className="room-hud">
        <Link href="/dashboard" className="room-hud-back" aria-label="Back to dashboard">
          <MapIcon className="h-4 w-4" />
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between text-[11px] font-semibold">
            <span className="flex items-center gap-1.5 uppercase tracking-wide text-ivory/75">
              <span className="room-lvl">
                <Zap className="h-2.5 w-2.5" fill="currentColor" strokeWidth={0} /> {level.level}
              </span>
              {tierLabel}
            </span>
            <span className="text-ivory/60">
              {level.intoLevel}/{level.span} XP
            </span>
          </div>
          <div className="xp-track xp-track-dark mt-1.5 h-2">
            <div className="xp-fill h-full" style={{ width: `${level.pct}%` }} />
          </div>
        </div>
        <span className="room-streak">
          <Flame className="h-4 w-4 text-honey" strokeWidth={2.4} />
          {streak}
        </span>
      </header>

      {/* ── The room scene ── */}
      <div className={`scene ${restful ? "scene-bloom" : ""}`}>
        {/* back wall + window; the sky brightens as today blooms */}
        <div className="scene-wall" aria-hidden="true">
          <div className="scene-window">
            <span className="scene-sky" />
            <span className="scene-sun" />
          </div>
          {/* a little shelf of plants that grows with days cleared */}
          <div className="scene-shelf">
            {Array.from({ length: Math.min(6, Math.ceil(completed / 5)) }, (_, i) => (
              <span key={i} className="scene-plant" />
            ))}
          </div>
        </div>
        <div className="scene-floor" aria-hidden="true" />

        {/* the avatar, glowing brighter the more of today is done */}
        <div className="scene-avatar">
          <div className="scene-avatar-glow" />
          <Avatar stage={stageFromLevel(level.level)} size={120} />
        </div>

        {/* stations — the spots in your room to tend today */}
        {stations.map((s, i) => {
          const { Icon, accent, soft } = LOOK[s.key];
          const isDone = done[s.key];
          const at = spots[i] ?? spots[spots.length - 1];
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => (isDone ? undefined : setActive(s))}
              className={`station ${isDone ? "station-done" : "station-todo"}`}
              style={{
                left: `${at.x}%`,
                top: `${at.y}%`,
                ["--accent" as string]: accent,
                ["--soft" as string]: soft,
              }}
              aria-label={
                isDone ? `${s.label} — done today` : `${s.label} — tap to do today's task`
              }
              disabled={isDone}
            >
              <span className="station-ic">
                {isDone ? <Check className="h-5 w-5" strokeWidth={3} /> : <Icon className="h-5 w-5" strokeWidth={2.4} />}
              </span>
              <span className="station-label">{s.label}</span>
              {!isDone && <span className="station-bang">!</span>}
            </button>
          );
        })}
      </div>

      {/* ── Caption / state ── */}
      {challengeComplete ? (
        <div className="room-note room-note-final">
          <h1 className="font-display text-2xl font-extrabold text-spruce">
            You glowed all {total} days. 🤍
          </h1>
          <p className="mt-1 text-sm text-muted">
            Look how far this room has come since Day 1. That&apos;s you.
          </p>
        </div>
      ) : allDone ? (
        <div className="room-note">
          <h1 className="font-display text-2xl font-extrabold text-spruce">
            Day {day} done, {name}. ✨
          </h1>
          <p className="mt-1 text-sm text-muted">
            Your room is glowing. Come back tomorrow — that&apos;s the whole game.
          </p>
        </div>
      ) : (
        <div className="room-note">
          <h1 className="font-display text-2xl font-extrabold text-spruce">
            {doneToday === 0 ? `Welcome back, ${name}` : "Keep going — nearly there"}
          </h1>
          <p className="mt-1 text-sm text-muted">
            Tap a glowing spot to do today&apos;s thing.{" "}
            <strong className="text-spruce">{doneToday}/{totalToday}</strong> done today.
          </p>
        </div>
      )}

      {/* ── Actions ── */}
      {allDone && (
        <div className="room-actions">
          <button type="button" onClick={share} className="btn-game btn-primary">
            <Share2 className="h-4 w-4" /> Share my glow
          </button>
          <Link href="/dashboard" className="btn-game btn-ivory">
            <MapIcon className="h-4 w-4" /> See my journey
          </Link>
        </div>
      )}

      {/* ── Task sheet ── */}
      {active && (
        <div className="sheet-scrim" onClick={() => !busy && setActive(null)}>
          <div
            className="sheet"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label={`Today's ${active.label} task`}
          >
            <button
              type="button"
              className="sheet-x"
              onClick={() => !busy && setActive(null)}
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
            <div
              className="sheet-badge"
              style={{ ["--accent" as string]: LOOK[active.key].accent, ["--soft" as string]: LOOK[active.key].soft }}
            >
              {(() => {
                const { Icon } = LOOK[active.key];
                return <Icon className="h-6 w-6" strokeWidth={2.4} />;
              })()}
            </div>
            <div className="text-center">
              <p className="text-xs font-extrabold uppercase tracking-game text-teal">
                {active.label} · Day {day}
              </p>
              <p className="mt-2 text-lg font-semibold text-ink">{active.task}</p>
            </div>
            {err && <p className="mt-3 text-center text-sm font-medium text-coral">{err}</p>}
            <button
              type="button"
              onClick={() => complete(active)}
              disabled={busy}
              className="btn-game btn-primary mt-5 w-full"
            >
              {busy ? "Saving…" : "I did it ✓"}
            </button>
            <p className="mt-2 text-center text-[11px] text-muted">
              One tap. That&apos;s all today asks.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
