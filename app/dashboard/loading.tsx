import { Avatar } from "@/components/game/Avatar";

const TIPS = [
  "A missed day only costs a little XP — never your whole run.",
  "Day 8 is 'The Wall'. Everyone feels it. Push through and you level up.",
  "Your habit anchor is the backbone — never skip it.",
  "Keep the flame alive: streaks are worth more than perfect days.",
];

export default function DashboardLoading() {
  // Static pick (no randomness during render); rotates by nothing fancy.
  const tip = TIPS[0];
  return (
    <div className="loadscreen">
      <Avatar stage={4} size={120} />
      <div className="font-display text-xl font-extrabold text-spruce">Loading your quest…</div>
      <div className="loadbar">
        <i />
      </div>
      <p className="max-w-xs text-xs text-muted">Tip: {tip}</p>
    </div>
  );
}
