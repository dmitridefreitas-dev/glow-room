/**
 * Shared completion logic. A "day" is complete when every pillar that applies
 * to that challenge type is ticked. Glow Up has four pillars; Phone Detox has
 * no skin step, so it only requires three.
 */

export type ChallengeType = "glow_up" | "phone_detox";

export type CheckInRow = {
  day_number?: number;
  movement_done?: boolean | null;
  skin_done?: boolean | null;
  mindset_done?: boolean | null;
  anchor_done?: boolean | null;
};

type PillarKey =
  | "movement_done"
  | "skin_done"
  | "mindset_done"
  | "anchor_done";

export function requiredKeys(type: ChallengeType): PillarKey[] {
  return type === "glow_up"
    ? ["movement_done", "skin_done", "mindset_done", "anchor_done"]
    : ["movement_done", "mindset_done", "anchor_done"];
}

export function totalTasks(type: ChallengeType): number {
  return requiredKeys(type).length;
}

export function doneCount(
  c: CheckInRow | undefined,
  type: ChallengeType
): number {
  if (!c) return 0;
  return requiredKeys(type).reduce((n, k) => n + (c[k] ? 1 : 0), 0);
}

export function dayComplete(
  c: CheckInRow | undefined,
  type: ChallengeType
): boolean {
  return doneCount(c, type) === totalTasks(type);
}

export function dayStarted(
  c: CheckInRow | undefined,
  type: ChallengeType
): boolean {
  return doneCount(c, type) > 0;
}
