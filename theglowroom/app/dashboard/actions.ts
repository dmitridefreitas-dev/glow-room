"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getEnrollmentForUser } from "@/lib/cohort";

/** Save the habit-anchor chosen in the intake quiz. */
export async function saveIntake(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  let anchor = String(formData.get("anchor") ?? "").trim();
  const custom = String(formData.get("custom") ?? "").trim();
  if (anchor === "__custom") anchor = custom;
  if (!anchor) redirect("/dashboard/intake?error=1");

  await supabase.from("users").update({ habit_anchor: anchor }).eq("id", user.id);
  redirect("/dashboard");
}

/** Update editable profile fields (currently the public display name). */
export async function updateProfile(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const displayName = String(formData.get("display_name") ?? "").trim();
  if (!displayName) {
    redirect("/dashboard/settings?error=" + encodeURIComponent("Enter a name."));
  }
  if (displayName.length > 40) {
    redirect(
      "/dashboard/settings?error=" +
        encodeURIComponent("Keep it under 40 characters.")
    );
  }

  const { error } = await supabase
    .from("users")
    .update({ display_name: displayName })
    .eq("id", user.id);

  if (error) {
    redirect("/dashboard/settings?error=" + encodeURIComponent(error.message));
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/leaderboard");
  redirect("/dashboard/settings?saved=1");
}

/** Save (insert or update) a day's check-in, including an optional photo. */
export async function saveCheckIn(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const enrollment = await getEnrollmentForUser(user.id);
  if (!enrollment) redirect("/dashboard");

  const day = Number(formData.get("day_number"));
  if (!Number.isInteger(day)) redirect("/dashboard");

  // The cohort hasn't started yet — nothing is checkable until launch day.
  if (!enrollment.started) {
    redirect(
      `/dashboard/day/${day}?error=` +
        encodeURIComponent(
          "Your cohort hasn't started yet — Day 1 unlocks on launch day."
        )
    );
  }

  // Anti-cheat: you can only check in for days that have unlocked. The DB
  // trigger enforces this too; this gives a friendly message before we try.
  if (day < 1 || day > enrollment.currentDay) {
    redirect(
      `/dashboard/day/${day}?error=` +
        encodeURIComponent(
          "This day hasn't unlocked yet — a new day opens each midnight."
        )
    );
  }

  const payload: Record<string, unknown> = {
    enrollment_id: enrollment.enrollmentId,
    day_number: day,
    movement_done: formData.get("movement_done") === "on",
    skin_done: formData.get("skin_done") === "on",
    mindset_done: formData.get("mindset_done") === "on",
    anchor_done: formData.get("anchor_done") === "on",
    movement_log: String(formData.get("movement_log") ?? "").trim() || null,
    mindset_answer: String(formData.get("mindset_answer") ?? "").trim() || null,
    reflection: String(formData.get("reflection") ?? "").trim() || null,
  };

  // Optional photo -> private storage under <uid>/<enrollment>/day-N.<ext>
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
    if (!uploadError) payload.photo_path = path;
  }

  const { error } = await supabase
    .from("check_ins")
    .upsert(payload, { onConflict: "enrollment_id,day_number" });

  if (error) {
    redirect(`/dashboard/day/${day}?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/day/${day}`);
  redirect(`/dashboard?saved=${day}`);
}
