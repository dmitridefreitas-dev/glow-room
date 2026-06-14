import { NextResponse } from "next/server";
import { stripe, type Stripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { createAccessCode } from "@/lib/access-codes";
import { sendAccessEmail } from "@/lib/email";
import { removeMemberRole } from "@/lib/discord";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

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
      const meta = s.metadata ?? {};

      if (meta.kind === "cohort" && meta.user_id && meta.cohort_id) {
        // Idempotency: skip if this user already has an enrollment in the cohort.
        const { data: existing } = await admin
          .from("enrollments")
          .select("id")
          .eq("user_id", meta.user_id)
          .eq("cohort_id", meta.cohort_id)
          .maybeSingle();

        if (!existing) {
          const { data: enr } = await admin
            .from("enrollments")
            .insert({
              user_id: meta.user_id,
              cohort_id: meta.cohort_id,
              stripe_session_id: s.id,
              status: "active",
            })
            .select("id")
            .single();

          if (enr) {
            const code = await createAccessCode(meta.user_id, enr.id);
            const email = s.customer_details?.email ?? s.customer_email;
            if (email) await sendAccessEmail(email, code, APP_URL);
          }
        }
      } else if (meta.kind === "membership" && meta.user_id) {
        await admin.from("subscriptions").upsert(
          {
            user_id: meta.user_id,
            stripe_customer_id: s.customer ? String(s.customer) : null,
            stripe_sub_id: s.subscription ? String(s.subscription) : null,
            status: "active",
          },
          { onConflict: "stripe_sub_id" }
        );
      }
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
