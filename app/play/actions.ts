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

export type ExtrasResult =
  | { ok: true; photoSaved: boolean }
  | { ok: false; error: string };

/** Shared guard: resolve the signed-in user's active, started enrollment. */
async function activeEnrollment() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "Please sign in again." };

  const enrollment = await getEnrollmentForUser(user.id);
  if (!enrollment) return { ok: false as const, error: "No active challenge." };
  if (!enrollment.started) {
    return { ok: false as const, error: "Your challenge hasn't started yet." };
  }
  return { ok: true as const, supabase, user, enrollment };
}

/** Read today's pillar booleans so we always merge instead of clobbering. */
async function readTodayBooleans(
  supabase: Awaited<ReturnType<typeof createClient>>,
  enrollmentId: string,
  day: number
): Promise<Record<Pillar, boolean>> {
  const { data } = await supabase
    .from("check_ins")
    .select("movement_done, skin_done, mindset_done, anchor_done")
    .eq("enrollment_id", enrollmentId)
    .eq("day_number", day)
    .maybeSingle();
  return {
    movement_done: Boolean(data?.movement_done),
    skin_done: Boolean(data?.skin_done),
    mindset_done: Boolean(data?.mindset_done),
    anchor_done: Boolean(data?.anchor_done),
  };
}

/**
 * Mark ONE pillar done (or, with done=false, un-mark it) for *today*.
 *
 * The once-a-day ritual's atom — tapping a station in the room calls this.
 * Tapping a finished spot re-opens it so a mis-tap can be undone. Merges onto any
 * existing check-in for the current day, respects the same day-lock + ownership
 * rules as the classic form, and never redirects — the room celebrates inline.
 */
export async function logPillar(
  pillar: string,
  done = true
): Promise<LogResult> {
  if (!PILLARS.includes(pillar as Pillar)) {
    return { ok: false, error: "Unknown task." };
  }
  const key = pillar as Pillar;

  const ctx = await activeEnrollment();
  if (!ctx.ok) return { ok: false, error: ctx.error };
  const { supabase, enrollment } = ctx;

  const allowed = requiredKeys(enrollment.challengeType) as readonly string[];
  if (!allowed.includes(key)) {
    return { ok: false, error: "That isn't one of today's tasks." };
  }

  const day = enrollment.currentDay;
  const merged = await readTodayBooleans(supabase, enrollment.enrollmentId, day);
  merged[key] = done;

  const { error } = await supabase.from("check_ins").upsert(
    { enrollment_id: enrollment.enrollmentId, day_number: day, ...merged },
    { onConflict: "enrollment_id,day_number" }
  );
  if (error) return { ok: false, error: error.message };

  revalidatePath("/play");
  revalidatePath("/dashboard");

  const row: CheckInRow = merged;
  const keys = requiredKeys(enrollment.challengeType) as Pillar[];
  return {
    ok: true,
    allDone: dayComplete(row, enrollment.challengeType),
    doneCount: keys.reduce((n, k) => n + (merged[k] ? 1 : 0), 0),
    total: keys.length,
  };
}

/**
 * Save today's optional note and/or photo from inside the room — the same fields
 * the classic check-in collects (reflection + a private day photo that powers the
 * before/after reveal), so the room is a complete check-in on its own. Never
 * touches the pillar booleans (they're read back and preserved).
 */
export async function saveDayExtras(formData: FormData): Promise<ExtrasResult> {
  const ctx = await activeEnrollment();
  if (!ctx.ok) return { ok: false, error: ctx.error };
  const { supabase, user, enrollment } = ctx;

  const day = enrollment.currentDay;
  const note = String(formData.get("note") ?? "").trim();

  const merged = await readTodayBooleans(supabase, enrollment.enrollmentId, day);
  const payload: Record<string, unknown> = {
    enrollment_id: enrollment.enrollmentId,
    day_number: day,
    ...merged,
    reflection: note || null,
  };

  // Optional photo → private storage under <uid>/<enrollment>/day-N.<ext>.
  let photoSaved = false;
  const file = formData.get("photo");
  if (file instanceof File && file.size > 0) {
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
    const path = `${user.id}/${enrollment.enrollmentId}/day-${day}.${ext}`;
    const bytes = new Uint8Array(await file.arrayBuffer());
    const { error: uploadError } = await supabase.storage
      .from("checkin-photos")
      .upload(path, bytes, {
        contentType: file.type || "image/jpeg",
        upsert: true,
      });
    if (uploadError) return { ok: false, error: uploadError.message };
    payload.photo_path = path;
    photoSaved = true;
  }

  const { error } = await supabase
    .from("check_ins")
    .upsert(payload, { onConflict: "enrollment_id,day_number" });
  if (error) return { ok: false, error: error.message };

  revalidatePath("/play");
  revalidatePath("/dashboard");
  return { ok: true, photoSaved };
}
