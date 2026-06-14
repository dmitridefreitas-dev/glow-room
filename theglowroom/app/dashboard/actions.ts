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

  await supabase
    .from("check_ins")
    .upsert(payload, { onConflict: "enrollment_id,day_number" });

  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/day/${day}`);
  redirect(`/dashboard?saved=${day}`);
}
