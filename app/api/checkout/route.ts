import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url), { status: 303 });
  }

  const form = await request.formData();
  const kind = String(form.get("kind") ?? "cohort");
  const origin = new URL(request.url).origin;

  const common = {
    customer_email: user.email ?? undefined,
    success_url: `${origin}/welcome?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/join`,
  };

  try {
    if (kind === "membership") {
      const price = process.env.STRIPE_MEMBERSHIP_PRICE_ID;
      if (!price) {
        return NextResponse.redirect(
          new URL("/join?error=membership-not-configured", request.url),
          { status: 303 }
        );
      }
      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        line_items: [{ price, quantity: 1 }],
        metadata: { kind: "membership", user_id: user.id },
        ...common,
      });
      return NextResponse.redirect(session.url!, { status: 303 });
    }

    // One-time cohort purchase
    const cohortId = String(form.get("cohort_id") ?? "");
    const admin = createAdminClient();
    const { data: cohort } = await admin
      .from("cohorts")
      .select("id, stripe_price_id")
      .eq("id", cohortId)
      .maybeSingle();

    if (!cohort?.stripe_price_id) {
      return NextResponse.redirect(
        new URL("/join?error=cohort-not-configured", request.url),
        { status: 303 }
      );
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [{ price: cohort.stripe_price_id, quantity: 1 }],
      metadata: { kind: "cohort", user_id: user.id, cohort_id: cohort.id },
      ...common,
    });
    return NextResponse.redirect(session.url!, { status: 303 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "checkout failed";
    return NextResponse.redirect(
      new URL(`/join?error=${encodeURIComponent(msg)}`, request.url),
      { status: 303 }
    );
  }
}
