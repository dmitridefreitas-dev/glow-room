import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripe";
import { provisionFromCheckoutSession } from "@/lib/provision";
import { Avatar } from "@/components/game/Avatar";

export default async function WelcomePage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Provisioning is normally webhook-driven, but fall back to provisioning from
  // the (verified, paid) checkout session here. Safe: idempotent, and we only act
  // on a paid session that belongs to this user.
  if (session_id) {
    try {
      const session = await stripe.checkout.sessions.retrieve(session_id);
      if (session.payment_status === "paid" && session.metadata?.user_id === user.id) {
        await provisionFromCheckoutSession(session);
      }
    } catch {
      // Bad/unknown session id, or Stripe unavailable — the webhook will provision.
    }
  }

  const admin = createAdminClient();
  const { data: code } = await admin
    .from("access_codes")
    .select("code, redeemed")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (
    <main className="relative flex min-h-dvh items-center justify-center overflow-hidden px-6 py-12">
      <div className="stage-bg" aria-hidden="true">
        <span className="orb orb-1" />
        <span className="orb orb-2" />
        <span className="orb orb-3" />
      </div>

      <div className="relative z-10 w-full max-w-md text-center">
        <Avatar stage={5} size={128} />
        <p className="mt-2 text-xs font-extrabold uppercase tracking-[0.25em] text-honey">
          Access granted
        </p>

        <div className="panel-game mt-4 p-7">
          <h1 className="font-display text-2xl font-extrabold text-spruce">You&apos;re in! 🤍</h1>
          <p className="mt-1 text-sm text-muted">Payment confirmed. Here&apos;s how to get started.</p>

          {code ? (
            <>
              <div className="mt-6 rounded-2xl bg-honey-light px-4 py-5">
                <div className="text-[11px] uppercase tracking-wide text-muted">
                  Your single-use Discord code
                </div>
                <div className="mt-1 font-display text-2xl font-extrabold tracking-wide text-spruce">
                  {code.code}
                </div>
              </div>
              <p className="mt-4 text-sm text-muted">
                Join the Discord, go to <strong>#verify</strong>, and run{" "}
                <code className="rounded bg-ivory px-1.5 py-0.5">/verify code:{code.code}</code>. It
                works once, then expires.
              </p>
            </>
          ) : (
            <div className="mt-6 rounded-2xl bg-teal-light px-4 py-5 text-sm text-spruce">
              Finalising your purchase… refresh in a few seconds to see your access code. (Locally,
              make sure <code>stripe listen</code> is running.)
            </div>
          )}

          <Link href="/dashboard" className="btn-game btn-primary mt-7 w-full">
            Enter the game <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </main>
  );
}
