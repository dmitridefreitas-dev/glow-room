import Link from "next/link";
import { Check, Lock, Swords, Flag, Crown } from "lucide-react";

// The "quest map": the 30-day grid re-cast as a winding level-path you travel,
// the way a mobile game lays out its stages. Same data as the old grid (each
// day's state), but it *reads* like progress through a game instead of a
// calendar. Server component — all states are computed on the server; the only
// motion is a CSS pulse on "today", so no client JS is needed.

export type QuestNode = {
  day: number;
  state: "complete" | "today" | "started" | "available" | "locked";
};

type Milestone = { label: string; kind: "boss" | "turn" | "final" };

// Named beats along the road. These mirror the emotional arc the product already
// scripts (Day 8 "crisis", Day 15 turning point, Day 30 reveal) — here they're
// boss/checkpoint stages so the journey has landmarks, not just numbers.
function milestonesFor(total: number): Map<number, Milestone> {
  const m = new Map<number, Milestone>();
  if (total >= 30) {
    m.set(8, { label: "The Wall", kind: "boss" });
    m.set(15, { label: "The Turn", kind: "turn" });
    m.set(22, { label: "Home Stretch", kind: "turn" });
    m.set(total, { label: "The Reveal", kind: "final" });
  } else {
    // Shorter challenges (e.g. the 7-day phone detox).
    m.set(Math.max(2, Math.round(total / 2)), { label: "The Turn", kind: "turn" });
    m.set(total, { label: "The Reveal", kind: "final" });
  }
  return m;
}

const COLS = 5;
const ROW_H = 96; // px of vertical room per row of the trail
const NODE = 42;
const BOSS = 58;

// Brand hexes (kept literal so they resolve cleanly inside SVG strokes).
const C_LINE = "#e3ddd0";
const C_SAGE = "#6ca77f";
const C_TEAL = "#2c7a70";

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
  // consecutive days are always neighbours and the connecting road snakes.
  const pos = (day: number) => {
    const idx = day - 1;
    const row = Math.floor(idx / COLS);
    let col = idx % COLS;
    if (row % 2 === 1) col = COLS - 1 - col;
    return { x: ((col + 0.5) / COLS) * 100, y: ((row + 0.5) / rows) * 100 };
  };

  const roadPoints = nodes.map((n) => pos(n.day));
  // The lit portion of the road: from the start up to today's position.
  const litThrough = Math.min(today, total);
  const litPoints = roadPoints.slice(0, litThrough);

  const toAttr = (pts: { x: number; y: number }[]) =>
    pts.map((p) => `${p.x},${p.y}`).join(" ");

  return (
    <div
      className="relative w-full"
      style={{ height }}
      aria-label={`Quest map — day ${today} of ${total}`}
    >
      {/* The road, drawn behind the nodes. Non-scaling stroke keeps it an even
          width even though the viewBox is stretched to the container. */}
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <polyline
          points={toAttr(roadPoints)}
          fill="none"
          stroke={C_LINE}
          strokeWidth={6}
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
        {litPoints.length >= 2 && (
          <polyline
            points={toAttr(litPoints)}
            fill="none"
            stroke={C_SAGE}
            strokeWidth={6}
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
        )}
      </svg>

      {nodes.map((n) => {
        const { x, y } = pos(n.day);
        const ms = milestones.get(n.day);
        const size = ms ? BOSS : NODE;
        const r = size / 2;
        const isToday = n.day === today;

        // Fill + icon by state, with milestones keeping their identity colour
        // until they're cleared.
        let cls: string;
        let icon: React.ReactNode = null;
        if (n.state === "complete") {
          cls = "bg-sage text-white shadow-md";
          icon = <Check className="h-[45%] w-[45%]" strokeWidth={3} />;
        } else if (n.state === "today") {
          cls = "bg-coral text-white shadow-lg ring-4 ring-coral/30 animate-pulse";
          icon = ms ? milestoneIcon(ms.kind) : null;
        } else if (ms) {
          cls =
            ms.kind === "final"
              ? "bg-gradient-to-br from-spruce to-coral text-ivory shadow-md"
              : ms.kind === "boss"
                ? "bg-gradient-to-br from-coral to-honey text-white shadow-md"
                : "bg-teal text-white shadow-sm";
          icon = milestoneIcon(ms.kind);
        } else if (n.state === "started") {
          cls = "bg-honey-light text-spruce border border-honey/50";
        } else if (n.state === "locked") {
          cls = "bg-ivory text-muted border border-line";
          icon = <Lock className="h-[38%] w-[38%] opacity-60" />;
        } else {
          cls = "bg-white text-muted border border-line";
        }

        return (
          <div key={n.day}>
            {/* "You are here" pin floating over today's node. */}
            {isToday && (
              <span
                className="absolute z-20 -translate-x-1/2 rounded-full bg-spruce px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-ivory shadow"
                style={{ left: `${x}%`, top: `${y}%`, transform: `translate(-50%, ${-r - 18}px)` }}
              >
                You
              </span>
            )}

            <Link
              href={`/dashboard/day/${n.day}`}
              title={ms ? `Day ${n.day} — ${ms.label}` : `Day ${n.day}`}
              className={`absolute z-10 flex items-center justify-center rounded-full font-display font-extrabold transition hover:scale-110 ${cls} ${
                isToday && n.state !== "today" ? "ring-4 ring-coral/40" : ""
              }`}
              style={{
                left: `${x}%`,
                top: `${y}%`,
                width: size,
                height: size,
                transform: "translate(-50%, -50%)",
                fontSize: ms ? 13 : 15,
              }}
            >
              {icon ?? n.day}
            </Link>

            {/* Milestone label tucked just under the stage. */}
            {ms && (
              <span
                className="absolute z-10 whitespace-nowrap text-[10px] font-bold uppercase tracking-wide text-spruce"
                style={{
                  left: `${x}%`,
                  top: `${y}%`,
                  transform: `translate(-50%, ${r + 4}px)`,
                }}
              >
                {ms.label}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

function milestoneIcon(kind: Milestone["kind"]) {
  if (kind === "final") return <Crown className="h-[45%] w-[45%]" strokeWidth={2.4} />;
  if (kind === "boss") return <Swords className="h-[45%] w-[45%]" strokeWidth={2.4} />;
  return <Flag className="h-[42%] w-[42%]" strokeWidth={2.6} />;
}
