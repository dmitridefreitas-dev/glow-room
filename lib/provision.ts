import { createAdminClient } from "@/lib/supabase/admin";
import { createAccessCode } from "@/lib/access-codes";
import { sendAccessEmail } from "@/lib/email";
import type { Stripe } from "@/lib/stripe";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

type Admin = ReturnType<typeof createAdminClient>;

/**
 * Provision access from a completed Stripe Checkout Session.
 *
 * Idempotent and intentionally callable from BOTH places that learn a purchase
 * happened:
 *   1. the Stripe webhook (`checkout.session.completed`), and
 *   2. the `/welcome` success page (fallback, in case the webhook isn't
 *      configured yet in production or is delayed).
 * Whichever runs first provisions; the other no-ops on the existing-row check.
 *
 * For a cohort purchase it creates the enrollment + a single-use access code
 * (and emails it). For a membership it upserts the subscription row.
 */
export async function provisionFromCheckoutSession(
  session: Stripe.Checkout.Session
): Promise<void> {
  const meta = session.metadata ?? {};
  const admin = createAdminClient();

  if (meta.kind === "cohort" && meta.user_id && meta.cohort_id) {
    // Idempotency: skip if this user already has an enrollment in the cohort.
    const { data: existing } = await admin
      .from("enrollments")
      .select("id")
      .eq("user_id", meta.user_id)
      .eq("cohort_id", meta.cohort_id)
      .maybeSingle();
    if (existing) return;

    const { data: enr } = await admin
      .from("enrollments")
      .insert({
        user_id: meta.user_id,
        cohort_id: meta.cohort_id,
        stripe_session_id: session.id,
        status: "active",
      })
      .select("id")
      .single();

    if (enr) {
      const code = await createAccessCode(meta.user_id, enr.id);
      const email = session.customer_details?.email ?? session.customer_email;
      if (email) await sendAccessEmail(email, code, APP_URL);
    }
  } else if (meta.kind === "membership" && meta.user_id) {
    await admin.from("subscriptions").upsert(
      {
        user_id: meta.user_id,
        stripe_customer_id: session.customer ? String(session.customer) : null,
        stripe_sub_id: session.subscription ? String(session.subscription) : null,
        status: "active",
      },
      { onConflict: "stripe_sub_id" }
    );

    // Membership grants the Glow Up challenge itself — not a specific cohort.
    // Give the member a personal, self-paced enrollment so they land straight in
    // the dashboard with their 30 days, plus a single-use Discord code. Joining a
    // (seasonal / competitive) cohort is a separate action they take later.
    const enr = await ensureSoloEnrollment(admin, meta.user_id);
    if (enr?.created) {
      const code = await createAccessCode(meta.user_id, enr.enrollmentId);
      const email = session.customer_details?.email ?? session.customer_email;
      if (email) await sendAccessEmail(email, code, APP_URL);
    }
  }
}

/**
 * Find-or-create a personal, self-paced Glow Up enrollment for a user.
 *
 * Used when access is granted without choosing a specific cohort (e.g. a
 * membership): the member sees the full 30-day challenge immediately, paced from
 * their join date. The backing cohort carries no `stripe_price_id`, so it never
 * shows up in the purchasable cohort list. Idempotent — reuses any existing
 * active enrollment, and reports whether it created a new one (so the caller
 * only issues a fresh access code on first provision).
 */
async function ensureSoloEnrollment(
  admin: Admin,
  userId: string
): Promise<{ enrollmentId: string; created: boolean } | null> {
  const { data: existing } = await admin
    .from("enrollments")
    .select("id")
    .eq("user_id", userId)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (existing) return { enrollmentId: existing.id, created: false };

  const today = new Date().toISOString().slice(0, 10);
  const { data: cohort } = await admin
    .from("cohorts")
    .insert({
      challenge_type: "glow_up",
      name: "Glow Up",
      start_date: today,
      status: "active",
    })
    .select("id")
    .single();
  if (!cohort) return null;

  const { data: enr } = await admin
    .from("enrollments")
    .insert({ user_id: userId, cohort_id: cohort.id, status: "active" })
    .select("id")
    .single();
  return enr ? { enrollmentId: enr.id, created: true } : null;
}
