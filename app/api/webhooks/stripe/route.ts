import { NextResponse } from "next/server";
import { stripe, type Stripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { provisionFromCheckoutSession } from "@/lib/provision";
import { removeMemberRole } from "@/lib/discord";

type Admin = ReturnType<typeof createAdminClient>;

async function revokeDiscordForUser(admin: Admin, userId: string) {
  const { data: u } = await admin
    .from("users")
    .select("discord_user_id")
    .eq("id", userId)
    .maybeSingle();
  if (u?.discord_user_id) await removeMemberRole(u.discord_user_id);
}

export async function POST(request: Request) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig!, secret!);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "bad signature";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const admin = createAdminClient();

  switch (event.type) {
    case "checkout.session.completed": {
      const s = event.data.object as Stripe.Checkout.Session;
      await provisionFromCheckoutSession(s);
      break;
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const { data: row } = await admin
        .from("subscriptions")
        .update({ status: "canceled" })
        .eq("stripe_sub_id", sub.id)
        .select("user_id")
        .maybeSingle();
      if (row?.user_id) await revokeDiscordForUser(admin, row.user_id);
      break;
    }

    case "charge.refunded":
    case "charge.dispute.created": {
      const charge = event.data.object as Stripe.Charge;
      const pi =
        typeof charge.payment_intent === "string"
          ? charge.payment_intent
          : charge.payment_intent?.id;
      if (pi) {
        // Map payment -> checkout session -> enrollment, then revoke.
        const sessions = await stripe.checkout.sessions.list({
          payment_intent: pi,
          limit: 1,
        });
        const meta = sessions.data[0]?.metadata ?? {};
        if (meta.user_id && meta.cohort_id) {
          await admin
            .from("enrollments")
            .update({ status: "revoked" })
            .eq("user_id", meta.user_id)
            .eq("cohort_id", meta.cohort_id);
          await revokeDiscordForUser(admin, meta.user_id);
        }
      }
      break;
    }

    default:
      break;
  }

  return NextResponse.json({ received: true });
}
