import Link from "next/link";
import { Check, X, Lock, Swords, Flag, Crown } from "lucide-react";
import { Avatar } from "@/components/game/Avatar";

// The "quest ladder": the 30-day journey as a ladder you climb. Each day is a
// rung; your avatar stands on TODAY's rung and climbs as the days pass. Crucially,
// missed days don't disappear — a past day you didn't finish stays as a BROKEN
// rung beneath you, so the gaps in the climb are always visible. Server component;
// the only motion is the CSS "climb" bob, so no client JS is needed.

export type QuestNode = {
  day: number;
  // complete = cleared rung · today = the rung you're on · missed = a past day
  // you didn't finish (broken rung) · locked = a future rung not yet reached.
  state: "complete" | "today" | "missed" | "locked";
};

type Milestone = { label: string; kind: "boss" | "turn" | "final" };

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

const RUNG_H = 34; // px of height per day (rung spacing)
const PAD = 22; // top/bottom breathing room

export function QuestMap({
  nodes,
  today,
  total,
  avatarStage = 3,
}: {
  nodes: QuestNode[];
  today: number;
  total: number;
  avatarStage?: number;
}) {
  const milestones = milestonesFor(total);
  const height = total * RUNG_H + PAD * 2;

  // Day 1 sits at the bottom, day `total` at the top — you climb upward.
  const centerY = (day: number) => PAD + (total - day + 0.5) * RUNG_H;

  const railTop = centerY(total) - RUNG_H / 2;
  const railH = (total - 1) * RUNG_H + RUNG_H;
  const todayY = centerY(Math.min(Math.max(today, 1), total));

  return (
    <div
      className="ladder relative w-full"
      style={{ height }}
      aria-label={`Climb — day ${today} of ${total}`}
    >
      {/* the two rails */}
      <span className="ladder-rail" style={{ top: railTop, height: railH, left: "33%" }} aria-hidden="true" />
      <span className="ladder-rail" style={{ top: railTop, height: railH, left: "67%" }} aria-hidden="true" />

      {/* rungs */}
      {nodes.map((n) => {
        const ms = milestones.get(n.day);
        const y = centerY(n.day);
        const isToday = n.day === today;

        let rungClass = "rung-locked";
        let icon: React.ReactNode = <Lock className="h-3 w-3 opacity-70" />;
        if (n.state === "complete") {
          rungClass = "rung-complete";
          icon = <Check className="h-3.5 w-3.5" strokeWidth={3.2} />;
        } else if (n.state === "today") {
          rungClass = "rung-today";
          icon = null; // the avatar marks today
        } else if (n.state === "missed") {
          rungClass = "rung-missed";
          icon = <X className="h-3.5 w-3.5" strokeWidth={3} />;
        }

        return (
          <Link
            key={n.day}
            href={`/dashboard/day/${n.day}`}
            title={ms ? `Day ${n.day} — ${ms.label}` : `Day ${n.day}`}
            className="ladder-row"
            style={{ top: y }}
          >
            {/* day-number chip on the left rail */}
            <span className={`rung-num rung-num-${n.state}`} style={{ left: "20%" }}>
              {n.day}
            </span>

            {/* the rung itself */}
            <span className={`rung ${rungClass} ${ms ? "rung-ms" : ""}`} style={{ left: "33%", right: "33%" }} />

            {/* right-hand marker: milestone flag, or the state icon */}
            {ms ? (
              <span className={`rung-flag rung-flag-${ms.kind}`} style={{ left: "72%" }}>
                {milestoneIcon(ms.kind)}
                <span className="rung-flag-label">{ms.label}</span>
              </span>
            ) : (
              !isToday && (
                <span className={`rung-ic rung-ic-${n.state}`} style={{ left: "80%" }}>
                  {icon}
                </span>
              )
            )}
          </Link>
        );
      })}

      {/* the climber — your avatar, standing on today's rung */}
      <span className="climber-ring" style={{ top: todayY, left: "50%" }} aria-hidden="true" />
      <span className="climber" style={{ top: todayY, left: "50%" }}>
        <Avatar stage={avatarStage} size={54} float={false} />
        <span className="climber-tag">You · Day {today}</span>
      </span>
    </div>
  );
}

function milestoneIcon(kind: Milestone["kind"]) {
  if (kind === "final") return <Crown className="h-3.5 w-3.5" strokeWidth={2.4} />;
  if (kind === "boss") return <Swords className="h-3.5 w-3.5" strokeWidth={2.4} />;
  return <Flag className="h-3.5 w-3.5" strokeWidth={2.6} />;
}
