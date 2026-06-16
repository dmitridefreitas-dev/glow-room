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
  cohortName: string | null;
  challengeType: "glow_up" | "phone_detox";
  startDate: string | null;
  totalDays: number;
  currentDay: number;
  /** False while the cohort's start date is still in the future (UTC). */
  started: boolean;
  /** Whole days until the cohort starts; 0 once it has begun. */
  daysUntilStart: number;
};

type Admin = ReturnType<typeof createAdminClient>;

function cohortOf(row: { cohorts: unknown }) {
  const c = row.cohorts;
  return (Array.isArray(c) ? c[0] : c) as {
    name: string | null;
    challenge_type: "glow_up" | "phone_detox";
    start_date: string | null;
  };
}

/**
 * FEATURE FLAG — pre-launch countdown.
 * When ON, a paid member whose cohort hasn't started yet sees a "N days to go"
 * countdown on the dashboard (and Day 1 stays locked) until launch day.
 * Currently OFF so every account — including fresh test purchases that land in a
 * not-yet-started cohort — drops straight into the daily loop. Flip to `true`
 * for real launch; nothing else needs to change. See PROGRESS.md (Phase 5).
 */
const PRE_LAUNCH_COUNTDOWN = false;

/**
 * Whether the cohort has begun, and how many days remain until it does. Uses
 * UTC day boundaries to match computeCurrentDay and the database day-lock.
 * A cohort with no start date — or while the countdown flag is off — is treated
 * as already started.
 */
function computeStartInfo(startDate: string | null): {
  started: boolean;
  daysUntilStart: number;
} {
  if (!PRE_LAUNCH_COUNTDOWN || !startDate) return { started: true, daysUntilStart: 0 };
  const startMs = Date.parse(`${startDate}T00:00:00Z`);
  const todayMs = Date.parse(`${new Date().toISOString().slice(0, 10)}T00:00:00Z`);
  const daysUntil = Math.round((startMs - todayMs) / 86_400_000);
  return { started: daysUntil <= 0, daysUntilStart: Math.max(daysUntil, 0) };
}

/**
 * The highest day that has "unlocked" for this cohort. Uses UTC dates to match
 * the database trigger (enforce_checkin_day), so the UI and the DB agree on
 * exactly which days are open. Resets at 00:00 UTC.
 */
function computeCurrentDay(startDate: string | null, totalDays: number): number {
  if (!startDate) return totalDays;
  const startMs = Date.parse(`${startDate}T00:00:00Z`);
  const diff = Math.floor((Date.now() - startMs) / 86_400_000) + 1;
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
    .select("id, cohort_id, cohorts(name, challenge_type, start_date)")
    .single();

  return enrollment;
}

export async function getEnrollmentForUser(
  userId: string
): Promise<EnrollmentInfo | null> {
  const admin = createAdminClient();

  let { data: enrollment } = await admin
    .from("enrollments")
    .select("id, cohort_id, cohorts(name, challenge_type, start_date)")
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
  const { started, daysUntilStart } = computeStartInfo(cohort.start_date);

  return {
    enrollmentId: enrollment.id,
    cohortId: enrollment.cohort_id,
    cohortName: cohort.name,
    challengeType: cohort.challenge_type,
    startDate: cohort.start_date,
    totalDays,
    currentDay: computeCurrentDay(cohort.start_date, totalDays),
    started,
    daysUntilStart,
  };
}
