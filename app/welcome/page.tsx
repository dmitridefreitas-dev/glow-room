import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripe";
import { provisionFromCheckoutSession } from "@/lib/provision";

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
  // the (verified, paid) checkout session here so a purchase still grants access
  // even if the production webhook isn't configured yet or is delayed. Safe:
  // idempotent, and we only act on a paid session that belongs to this user.
  if (session_id) {
    try {
      const session = await stripe.checkout.sessions.retrieve(session_id);
      if (
        session.payment_status === "paid" &&
        session.metadata?.user_id === user.id
      ) {
        await provisionFromCheckoutSession(session);
      }
    } catch {
      // Bad/unknown session id, or Stripe unavailable — the webhook (if set up)
      // will still provision, and the code shows once it lands.
    }
  }

  // Fetch the most recent access code for this user (set by either path above).
  const admin = createAdminClient();
  const { data: code } = await admin
    .from("access_codes")
    .select("code, redeemed")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (
    <main className="flex min-h-screen items-center justify-center bg-spruce px-6 py-16">
      <div className="w-full max-w-md rounded-3xl bg-ivory p-8 text-center shadow-xl">
        <div className="text-4xl">🤍</div>
        <h1 className="mt-3 text-2xl font-extrabold text-spruce">You&apos;re in!</h1>
        <p className="mt-1 text-sm text-muted">
          Payment confirmed. Here&apos;s how to get started.
        </p>

        {code ? (
          <>
            <div className="mt-6 rounded-2xl bg-honey-light px-4 py-5">
              <div className="text-[11px] uppercase tracking-wide text-muted">
                Your single-use Discord code
              </div>
              <div className="mt-1 text-2xl font-extrabold tracking-wide text-spruce">
                {code.code}
              </div>
            </div>
            <p className="mt-4 text-sm text-muted">
              Join the Discord, go to <strong>#verify</strong>, and run{" "}
              <code className="rounded bg-white px-1.5 py-0.5">
                /verify code:{code.code}
              </code>
              . It works once, then expires.
            </p>
          </>
        ) : (
          <div className="mt-6 rounded-2xl bg-teal-light px-4 py-5 text-sm text-spruce">
            Finalising your purchase… refresh this page in a few seconds to see
            your access code. (Locally, make sure <code>stripe listen</code> is
            running so the webhook can fire.)
          </div>
        )}

        <Link
          href="/dashboard"
          className="mt-7 inline-block rounded-xl bg-coral px-6 py-3 text-sm font-semibold text-white transition hover:bg-coral/90"
        >
          Go to my dashboard →
        </Link>
      </div>
    </main>
  );
}
