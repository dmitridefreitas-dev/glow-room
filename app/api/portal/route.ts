import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/** Opens the Stripe Billing Portal so members manage/cancel their subscription. */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url), { status: 303 });
  }

  const admin = createAdminClient();
  const { data: sub } = await admin
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("user_id", user.id)
    .not("stripe_customer_id", "is", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  // No recurring subscription → nothing to manage (e.g. one-time cohort buyers).
  if (!sub?.stripe_customer_id) {
    return NextResponse.redirect(
      new URL("/dashboard/settings?billing=none", request.url),
      { status: 303 }
    );
  }

  const origin = new URL(request.url).origin;
  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: sub.stripe_customer_id,
      return_url: `${origin}/dashboard`,
    });
    return NextResponse.redirect(session.url, { status: 303 });
  } catch {
    // Most common in test mode: the Customer Portal hasn't been activated yet.
    return NextResponse.redirect(
      new URL("/dashboard/settings?billing=error", request.url),
      { status: 303 }
    );
  }
}
