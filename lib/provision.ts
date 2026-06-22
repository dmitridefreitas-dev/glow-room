import { createAdminClient } from "@/lib/supabase/admin";
import { createAccessCode } from "@/lib/access-codes";
import { sendAccessEmail } from "@/lib/email";
import type { Stripe } from "@/lib/stripe";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

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
  }
}
