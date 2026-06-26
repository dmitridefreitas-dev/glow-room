"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getEnrollmentForUser } from "@/lib/cohort";
import { dayComplete, requiredKeys, type CheckInRow } from "@/lib/progress";

// The four glow-up pillars, in the order they live on the check_ins row.
const PILLARS = [
  "movement_done",
  "skin_done",
  "mindset_done",
  "anchor_done",
] as const;
type Pillar = (typeof PILLARS)[number];

export type LogResult =
  | { ok: true; allDone: boolean; doneCount: number; total: number }
  | { ok: false; error: string };

/**
 * The Glow Room's single write: mark ONE pillar done for *today*.
 *
 * This is the once-a-day ritual's atom — tapping a station in the room calls
 * this. It merges onto any existing check-in for the current day (so finishing
 * the four pillars one tap at a time never clobbers the earlier ones), respects
 * the same day-lock + ownership rules as the classic check-in form, and returns
 * a small result the client uses to drive the room's "bloom" animation. It is
 * intentionally one-way (you don't un-do having done your workout) and never
 * redirects — the celebration happens inline so the daily moment stays whole.
 */
export async function logPillar(pillar: string): Promise<LogResult> {
  if (!PILLARS.includes(pillar as Pillar)) {
    return { ok: false, error: "Unknown task." };
  }
  const key = pillar as Pillar;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Please sign in again." };

  const enrollment = await getEnrollmentForUser(user.id);
  if (!enrollment) return { ok: false, error: "No active challenge." };
  if (!enrollment.started) {
    return { ok: false, error: "Your challenge hasn't started yet." };
  }

  // Only pillars that apply to this challenge type are loggable (phone detox
  // has no skin step).
  const allowed = requiredKeys(enrollment.challengeType) as readonly string[];
  if (!allowed.includes(key)) {
    return { ok: false, error: "That isn't one of today's tasks." };
  }

  const day = enrollment.currentDay;

  // Read the current day's row (if any) so we merge rather than overwrite.
  const { data: existing } = await supabase
    .from("check_ins")
    .select("movement_done, skin_done, mindset_done, anchor_done")
    .eq("enrollment_id", enrollment.enrollmentId)
    .eq("day_number", day)
    .maybeSingle();

  const merged: Record<Pillar, boolean> = {
    movement_done: Boolean(existing?.movement_done),
    skin_done: Boolean(existing?.skin_done),
    mindset_done: Boolean(existing?.mindset_done),
    anchor_done: Boolean(existing?.anchor_done),
  };
  merged[key] = true;

  const { error } = await supabase.from("check_ins").upsert(
    {
      enrollment_id: enrollment.enrollmentId,
      day_number: day,
      ...merged,
    },
    { onConflict: "enrollment_id,day_number" }
  );
  if (error) return { ok: false, error: error.message };

  revalidatePath("/play");
  revalidatePath("/dashboard");

  const row: CheckInRow = merged;
  const total = requiredKeys(enrollment.challengeType).length;
  const doneCount = requiredKeys(enrollment.challengeType).reduce(
    (n, k) => n + (merged[k as Pillar] ? 1 : 0),
    0
  );

  return {
    ok: true,
    allDone: dayComplete(row, enrollment.challengeType),
    doneCount,
    total,
  };
}
