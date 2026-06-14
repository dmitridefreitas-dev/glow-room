import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Resolves the active enrollment for a user. In production this only ever
 * exists because Stripe (Phase 4) created it. In local development we
 * auto-provision a "Dev Cohort" so the daily loop is testable before payments
 * are built.
 */

const DEV_COHORT_NAME = "Dev Cohort — local testing";

export type EnrollmentInfo = {
  enrollmentId: string;
  cohortId: string;
  challengeType: "glow_up" | "phone_detox";
  startDate: string | null;
  totalDays: number;
  currentDay: number;
};

type Admin = ReturnType<typeof createAdminClient>;

function cohortOf(row: { cohorts: unknown }) {
  const c = row.cohorts;
  return (Array.isArray(c) ? c[0] : c) as {
    challenge_type: "glow_up" | "phone_detox";
    start_date: string | null;
  };
}

function computeCurrentDay(startDate: string | null, totalDays: number): number {
  if (!startDate) return 1;
  const start = new Date(`${startDate}T00:00:00`);
  const diff =
    Math.floor((Date.now() - start.getTime()) / 86_400_000) + 1;
  return Math.min(Math.max(diff, 1), totalDays);
}

async function provisionDevEnrollment(admin: Admin, userId: string) {
  let { data: cohort } = await admin
    .from("cohorts")
    .select("id")
    .eq("name", DEV_COHORT_NAME)
    .maybeSingle();

  if (!cohort) {
    const today = new Date().toISOString().slice(0, 10);
    const { data } = await admin
      .from("cohorts")
      .insert({
        challenge_type: "glow_up",
        name: DEV_COHORT_NAME,
        start_date: today,
        status: "active",
      })
      .select("id")
      .single();
    cohort = data;
  }

  const { data: enrollment } = await admin
    .from("enrollments")
    .insert({ user_id: userId, cohort_id: cohort!.id, status: "active" })
    .select("id, cohort_id, cohorts(challenge_type, start_date)")
    .single();

  return enrollment;
}

export async function getEnrollmentForUser(
  userId: string
): Promise<EnrollmentInfo | null> {
  const admin = createAdminClient();

  let { data: enrollment } = await admin
    .from("enrollments")
    .select("id, cohort_id, cohorts(challenge_type, start_date)")
    .eq("user_id", userId)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!enrollment && process.env.NODE_ENV !== "production") {
    enrollment = await provisionDevEnrollment(admin, userId);
  }
  if (!enrollment) return null;

  const cohort = cohortOf(enrollment);
  const totalDays = cohort.challenge_type === "glow_up" ? 30 : 7;

  return {
    enrollmentId: enrollment.id,
    cohortId: enrollment.cohort_id,
    challengeType: cohort.challenge_type,
    startDate: cohort.start_date,
    totalDays,
    currentDay: computeCurrentDay(cohort.start_date, totalDays),
  };
}
