// Level / XP layer — a finer-grained, faster-climbing progression that sits on
// top of the same score the tiers use (`lib/points.ts`). Tiers are the six big
// ranks (Bronze → Champion); levels are the frequent dopamine hits in between.
//
// XP == score, on purpose: a completed day (+10) is real, visible progress and a
// missed day costs you — the number people see climbing is the number that
// already drives the leaderboard, so nothing can drift out of sync.

export type LevelInfo = {
  /** 1-based player level. */
  level: number;
  /** Total XP (identical to the points score). */
  xp: number;
  /** XP earned *into* the current level. */
  intoLevel: number;
  /** XP needed to clear the current level. */
  span: number;
  /** XP remaining until the next level. */
  toNext: number;
  /** 0–100 progress through the current level (for the XP bar). */
  pct: number;
};

// XP required to go from level L to L+1. Starts cheap and ramps, so the first
// few days each trigger a level-up (early momentum) and later levels feel earned.
//   L1→2: 15 · L2→3: 20 · L3→4: 25 · …
function span(level: number): number {
  return 15 + (level - 1) * 5;
}

export function levelFor(score: number): LevelInfo {
  const xp = Math.max(0, Math.round(score));
  let level = 1;
  let remaining = xp;
  while (remaining >= span(level)) {
    remaining -= span(level);
    level += 1;
  }
  const s = span(level);
  return {
    level,
    xp,
    intoLevel: remaining,
    span: s,
    toNext: s - remaining,
    pct: Math.round((remaining / s) * 100),
  };
}
