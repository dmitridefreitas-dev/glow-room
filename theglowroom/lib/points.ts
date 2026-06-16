/**
 * Points + tier ladder (RECOMMENDATIONS R7). A single legible score that goes
 * UP when you complete days and DOWN when elapsed days are missed, mapped to the
 * universally-understood Bronze → Champion ladder. Computed on the fly from
 * check-in data — no DB column, no migration.
 *
 * Score = completed days × 10  −  missed (elapsed, uncompleted) days × 5  (min 0)
 */
export const POINTS_PER_DAY = 10;
export const MISS_PENALTY = 5;

export type TierIcon = "shield" | "medal" | "award" | "gem" | "crown";

export type Tier = {
  key: string;
  label: string;
  min: number; // score needed to reach this tier
  from: string; // emblem gradient (top)
  to: string; // emblem gradient (bottom)
  icon: TierIcon;
};

// Ascending by score. Metal/gem order everyone already understands.
// Thresholds get PROGRESSIVELY harder (gaps 40 → 50 → 60 → 70 → 70), so the top
// tiers must be earned — near-perfect to reach Champion within a cohort/season.
export const TIERS: Tier[] = [
  { key: "bronze", label: "Bronze", min: 0, from: "#d08a4e", to: "#9c5a2b", icon: "shield" },
  { key: "silver", label: "Silver", min: 40, from: "#cdd4dc", to: "#8c97a4", icon: "shield" },
  { key: "gold", label: "Gold", min: 90, from: "#f1c64f", to: "#cd962a", icon: "medal" },
  { key: "platinum", label: "Platinum", min: 150, from: "#d6ebe7", to: "#7cb3ab", icon: "award" },
  { key: "diamond", label: "Diamond", min: 220, from: "#8fd8e8", to: "#3a9cb6", icon: "gem" },
  { key: "champion", label: "Champion", min: 290, from: "#e2785a", to: "#e0a23c", icon: "crown" },
];

export function computeScore(completedDays: number, missedDays: number): number {
  return Math.max(0, completedDays * POINTS_PER_DAY - missedDays * MISS_PENALTY);
}

/**
 * Missed = elapsed past days (currentDay − 1) not covered by completed days.
 * Used wherever we only have a completed-day count (e.g. the leaderboard), so the
 * dashboard and leaderboards compute the *same* score.
 */
export function missedFor(completedDays: number, currentDay: number): number {
  return Math.max(0, currentDay - 1 - completedDays);
}

export function scoreFor(completedDays: number, currentDay: number): number {
  return computeScore(completedDays, missedFor(completedDays, currentDay));
}

export function tierFor(score: number): Tier {
  let t = TIERS[0];
  for (const x of TIERS) if (score >= x.min) t = x;
  return t;
}

export type TierProgress = {
  current: Tier;
  next: Tier | null;
  pct: number; // progress through the current tier toward the next
  toGo: number; // points needed for the next tier
};

export function tierProgress(score: number): TierProgress {
  const current = tierFor(score);
  const idx = TIERS.findIndex((t) => t.key === current.key);
  const next = TIERS[idx + 1] ?? null;
  if (!next) return { current, next: null, pct: 100, toGo: 0 };
  const span = next.min - current.min;
  const into = score - current.min;
  return {
    current,
    next,
    pct: Math.max(0, Math.min(100, Math.round((into / span) * 100))),
    toGo: Math.max(0, next.min - score),
  };
}
