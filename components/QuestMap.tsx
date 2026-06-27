import Link from "next/link";
import { Check, Lock, Swords, Flag, Crown } from "lucide-react";

// The "quest map": the 30-day journey re-cast as a winding RIVER you cross on
// stepping stones, the way a mobile game lays out its world map. Same data as the
// old grid (each day's state), but it reads like an adventure: a flowing river,
// a golden trail lighting up the days you've crossed, lily pads, and a bobbing
// "You" marker. Server component — every state is computed on the server; all the
// motion is CSS (flowing water, ripples, bob), so no client JS is needed.

export type QuestNode = {
  day: number;
  state: "complete" | "today" | "started" | "available" | "locked";
};

type Milestone = { label: string; kind: "boss" | "turn" | "final" };

// Named beats along the river — the emotional arc the product already scripts
// (Day 8 "The Wall", 15 turning point, Day 30 reveal) become landmark stones.
function milestonesFor(total: number): Map<number, Milestone> {
  const m = new Map<number, Milestone>();
  if (total >= 30) {
    m.set(8, { label: "The Wall", kind: "boss" });
    m.set(15, { label: "The Turn", kind: "turn" });
    m.set(22, { label: "Home Stretch", kind: "turn" });
    m.set(total, { label: "The Reveal", kind: "final" });
  } else {
    m.set(Math.max(2, Math.round(total / 2)), { label: "The Turn", kind: "turn" });
    m.set(total, { label: "The Reveal", kind: "final" });
  }
  return m;
}

const COLS = 4; // fewer columns → bigger stones + a wider, more dramatic meander
const ROW_H = 92; // px of vertical room per row of the river
const NODE = 46;
const BOSS = 62;

// A few lily pads / reeds floating on the banks (decor only). Kept to the edges,
// away from the serpentine stones which span the middle.
const LILIES: { x: number; y: number; s: number; d: number }[] = [
  { x: 6, y: 7, s: 22, d: 0 },
  { x: 93, y: 24, s: 16, d: 1.2 },
  { x: 5, y: 52, s: 18, d: 0.6 },
  { x: 95, y: 70, s: 24, d: 1.8 },
  { x: 7, y: 90, s: 15, d: 0.3 },
];

// Smooth Catmull-Rom path through the stone centres (a flowing river, not a
// straight road). Points are in the 0–100 viewBox space the stones also use.
function riverPath(p: { x: number; y: number }[]): string {
  if (p.length < 2) return p.length === 1 ? `M ${p[0].x} ${p[0].y}` : "";
  const r = (n: number) => Math.round(n * 100) / 100;
  const d = [`M ${r(p[0].x)} ${r(p[0].y)}`];
  for (let i = 0; i < p.length - 1; i++) {
    const p0 = p[i - 1] ?? p[i];
    const p1 = p[i];
    const p2 = p[i + 1];
    const p3 = p[i + 2] ?? p2;
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d.push(`C ${r(c1x)} ${r(c1y)}, ${r(c2x)} ${r(c2y)}, ${r(p2.x)} ${r(p2.y)}`);
  }
  return d.join(" ");
}

export function QuestMap({
  nodes,
  today,
  total,
}: {
  nodes: QuestNode[];
  today: number;
  total: number;
}) {
  const milestones = milestonesFor(total);
  const rows = Math.ceil(total / COLS);
  const height = rows * ROW_H;

  // Boustrophedon (serpentine) layout: each row runs the opposite direction, so
  // consecutive days are neighbours and the river snakes back and forth.
  const pos = (day: number) => {
    const idx = day - 1;
    const row = Math.floor(idx / COLS);
    let col = idx % COLS;
    if (row % 2 === 1) col = COLS - 1 - col;
    return { x: ((col + 0.5) / COLS) * 100, y: ((row + 0.5) / rows) * 100 };
  };

  const points = nodes.map((n) => pos(n.day));
  const litThrough = Math.min(today, total);
  const litPoints = points.slice(0, litThrough);

  const fullPath = riverPath(points);
  const litPath = riverPath(litPoints);

  return (
    <div
      className="quest-map relative w-full"
      style={{ height }}
      aria-label={`Quest map — day ${today} of ${total}`}
    >
      {/* The river + the golden trail you've crossed. preserveAspectRatio="none"
          stretches the viewBox to the container; non-scaling strokes keep an even
          width and the stones sit exactly on the path. */}
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        {/* river bed (soft, wide, deep blue) */}
        <path
          d={fullPath}
          fill="none"
          stroke="#8fc6d6"
          strokeWidth={15}
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
          opacity={0.55}
        />
        {/* river water */}
        <path
          d={fullPath}
          fill="none"
          stroke="#c2e6ef"
          strokeWidth={11}
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
        {/* flowing current highlight */}
        <path
          className="river-flow"
          d={fullPath}
          fill="none"
          stroke="#ffffff"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeDasharray="1 11"
          vectorEffect="non-scaling-stroke"
          opacity={0.7}
        />
        {/* the golden trail of days you've crossed */}
        {litPoints.length >= 2 && (
          <>
            <path
              d={litPath}
              fill="none"
              stroke="#e0a23c"
              strokeWidth={6}
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
            <path
              className="river-flow trail-flow"
              d={litPath}
              fill="none"
              stroke="#fff1cf"
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeDasharray="1 9"
              vectorEffect="non-scaling-stroke"
              opacity={0.85}
            />
          </>
        )}
      </svg>

      {/* lily pads on the banks */}
      {LILIES.map((l, i) => (
        <span
          key={i}
          aria-hidden="true"
          className="lily"
          style={{
            left: `${l.x}%`,
            top: `${l.y}%`,
            width: l.s,
            height: l.s * 0.84,
            animationDelay: `${l.d}s`,
          }}
        />
      ))}

      {/* stepping stones — one per day */}
      {nodes.map((n) => {
        const { x, y } = pos(n.day);
        const ms = milestones.get(n.day);
        const size = ms ? BOSS : NODE;
        const isToday = n.day === today;

        let stateClass: string;
        let icon: React.ReactNode = null;
        if (n.state === "complete") {
          stateClass = "stone-complete";
          icon = <Check className="h-[44%] w-[44%]" strokeWidth={3.2} />;
        } else if (n.state === "today") {
          stateClass = "stone-today";
          icon = ms ? milestoneIcon(ms.kind) : null;
        } else if (ms) {
          stateClass =
            ms.kind === "final"
              ? "stone-final"
              : ms.kind === "boss"
                ? "stone-boss"
                : "stone-turn";
          icon = milestoneIcon(ms.kind);
        } else if (n.state === "started") {
          stateClass = "stone-started";
        } else if (n.state === "locked") {
          stateClass = "stone-locked";
          icon = <Lock className="h-[38%] w-[38%] opacity-70" />;
        } else {
          stateClass = "stone-available";
        }

        return (
          <Link
            key={n.day}
            href={`/dashboard/day/${n.day}`}
            title={ms ? `Day ${n.day} — ${ms.label}` : `Day ${n.day}`}
            className="stone-pos"
            style={{ left: `${x}%`, top: `${y}%` }}
          >
            {isToday && <span className="stone-pin">You</span>}
            {n.state === "today" && <span className="stone-ripple" aria-hidden="true" />}
            <span
              className={`stone ${stateClass}`}
              style={{ width: size, height: size, fontSize: ms ? 13 : 15 }}
            >
              {icon ?? n.day}
            </span>
            {ms && <span className="stone-label">{ms.label}</span>}
          </Link>
        );
      })}
    </div>
  );
}

function milestoneIcon(kind: Milestone["kind"]) {
  if (kind === "final") return <Crown className="h-[46%] w-[46%]" strokeWidth={2.4} />;
  if (kind === "boss") return <Swords className="h-[46%] w-[46%]" strokeWidth={2.4} />;
  return <Flag className="h-[42%] w-[42%]" strokeWidth={2.6} />;
}
