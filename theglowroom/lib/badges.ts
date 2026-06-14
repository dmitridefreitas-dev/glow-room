import { createAdminClient } from "@/lib/supabase/admin";
import type { ChallengeType } from "@/lib/progress";

export type BadgeRow = { key: string; label: string; earned: boolean };

export type BadgeStats = {
  completed: number;
  streak: number;
  total: number;
  type: ChallengeType;
};

/** Which milestone badge keys a member has earned given their stats. */
function earnedKeysFor(s: BadgeStats): string[] {
  const keys: string[] = [];
  if (s.completed >= 1) keys.push("first_day");
  if (s.streak >= 7) keys.push("week_one");
  if (s.completed >= Math.ceil(s.total / 2)) keys.push("halfway");
  if (s.completed >= s.total) {
    keys.push(s.type === "phone_detox" ? "detox_complete" : "glow_up_complete");
  }
  return keys;
}

// The collectible set shown on the dashboard, in order.
const DISPLAY_ORDER = [
  "first_day",
  "week_one",
  "halfway",
  "glow_up_complete",
  "glow_legend",
];

/**
 * Awards any newly-earned badges (idempotent) and returns the collectible set
 * with each marked earned/locked for display.
 */
export async function syncBadges(
  userId: string,
  stats: BadgeStats
): Promise<BadgeRow[]> {
  const admin = createAdminClient();
  const earnedKeys = earnedKeysFor(stats);

  const { data: defs } = await admin.from("badges").select("id, key, label");
  const byKey = new Map((defs ?? []).map((b) => [b.key as string, b]));

  const { data: existing } = await admin
    .from("user_badges")
    .select("badge_id")
    .eq("user_id", userId);
  const existingIds = new Set((existing ?? []).map((r) => r.badge_id as string));

  // Award newly-earned badges that aren't already recorded.
  const toAward = earnedKeys
    .map((k) => byKey.get(k))
    .filter((b): b is { id: string; key: string; label: string } =>
      Boolean(b && !existingIds.has(b.id))
    )
    .map((b) => ({ user_id: userId, badge_id: b.id }));

  if (toAward.length > 0) {
    await admin.from("user_badges").insert(toAward);
  }

  return DISPLAY_ORDER.map((k) => byKey.get(k))
    .filter((b): b is { id: string; key: string; label: string } => Boolean(b))
    .map((b) => ({
      key: b.key,
      label: b.label,
      earned: earnedKeys.includes(b.key) || existingIds.has(b.id),
    }));
}
