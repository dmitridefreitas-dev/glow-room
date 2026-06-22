import Link from "next/link";
import { redirect } from "next/navigation";
import { Check } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getEnrollmentForUser } from "@/lib/cohort";
import { ensureSoloAccess } from "@/lib/provision";

export default async function JoinPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const sp = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Already a paying member → never show the paywall again. If they're enrolled,
  // go straight to the dashboard. If they paid (active membership) but somehow have
  // no enrollment yet, recover access instead of asking them to pay again.
  const enrollment = await getEnrollmentForUser(user.id);
  if (enrollment) redirect("/dashboard");

  const admin = createAdminClient();

  const { data: activeSub } = await admin
    .from("subscriptions")
    .select("id")
    .eq("user_id", user.id)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();
  if (activeSub) {
    await ensureSoloAccess(user.id);
    redirect("/dashboard");
  }

  const { data: cohorts } = await admin
    .from("cohorts")
    .select("id, name, start_date, stripe_price_id")
    .eq("challenge_type", "glow_up")
    .not("stripe_price_id", "is", null)
    .order("start_date", { ascending: true });

  const membershipEnabled = Boolean(process.env.STRIPE_MEMBERSHIP_PRICE_ID);

  return (
    <main className="min-h-screen bg-ivory">
      <div className="mx-auto max-w-2xl px-6 py-12">
        <Link href="/dashboard" className="text-sm font-semibold text-teal">
          ← Dashboard
        </Link>
        <h1 className="mt-3 text-3xl font-extrabold text-spruce">
          Join The Glow Room
        </h1>
        <p className="mt-1 text-muted">
          Get instant access to the 30-day Glow Up Challenge, your private
          dashboard, and the members-only Discord. Pick a plan to start today.
        </p>

        {sp.error && (
          <div className="mt-4 rounded-xl bg-coral-light px-4 py-3 text-sm text-spruce">
            {sp.error === "cohort-not-configured"
              ? "This cohort isn't set up for checkout yet (run the Stripe setup script)."
              : sp.error === "membership-not-configured"
                ? "Membership isn't configured yet (set STRIPE_MEMBERSHIP_PRICE_ID)."
                : sp.error}
          </div>
        )}

        {/* Cohorts */}
        <div className="mt-8 space-y-4">
          {(cohorts ?? []).length === 0 && (
            <div className="rounded-2xl border border-line bg-white p-6 text-sm text-muted">
              No purchasable cohorts yet. Run{" "}
              <code>scripts/setup-stripe.mjs</code> to create one.
            </div>
          )}
          {(cohorts ?? []).map((c) => (
            <form
              key={c.id}
              action="/api/checkout"
              method="post"
              className="flex items-center justify-between rounded-2xl border border-line bg-white p-6"
            >
              <input type="hidden" name="kind" value="cohort" />
              <input type="hidden" name="cohort_id" value={c.id} />
              <div>
                <div className="font-bold text-spruce">{c.name}</div>
                <div className="text-xs text-muted">
                  {c.start_date
                    ? `Starts ${new Date(c.start_date + "T00:00:00Z").toLocaleDateString()}`
                    : "Start date TBA"}
                </div>
              </div>
              <button
                type="submit"
                className="rounded-xl bg-coral px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-coral/90"
              >
                Join — $18
              </button>
            </form>
          ))}
        </div>

        {/* Membership */}
        <h2 className="mt-10 text-sm font-bold uppercase tracking-[0.15em] text-teal">
          Or go monthly
        </h2>
        <div className="mt-3 rounded-2xl bg-spruce p-6 text-ivory">
          <div className="flex items-baseline justify-between gap-4">
            <div className="text-lg font-bold">The Glow Room Monthly</div>
            <div className="shrink-0">
              <span className="text-2xl font-extrabold">$9</span>
              <span className="text-sm text-ivory/70">/mo</span>
            </div>
          </div>
          <p className="mt-1 text-sm text-ivory/80">
            Ongoing access to everything The Glow Room — cancel anytime. You start
            today; your 30 days are unlocked right away.
          </p>
          <ul className="mt-4 space-y-2 text-sm text-ivory/90">
            {[
              "The full 30-day Glow Up Challenge + your private dashboard",
              "Members-only Discord community",
              "All four seasonal cohorts a year — do it “together” whenever you like",
              "New monthly drops, challenges & streak rewards",
            ].map((feature) => (
              <li key={feature} className="flex items-start gap-2">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-honey" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
          <form action="/api/checkout" method="post" className="mt-5">
            <input type="hidden" name="kind" value="membership" />
            <button
              type="submit"
              disabled={!membershipEnabled}
              className="w-full rounded-xl bg-honey px-5 py-3 text-sm font-semibold text-spruce transition hover:bg-honey/90 disabled:opacity-50"
            >
              Subscribe — $9/mo
            </button>
          </form>
          {!membershipEnabled && (
            <p className="mt-2 text-xs text-ivory/60">
              Membership isn&apos;t configured yet (set STRIPE_MEMBERSHIP_PRICE_ID).
            </p>
          )}
        </div>

        <p className="mt-6 text-xs text-muted">
          Test mode — use card <code>4242 4242 4242 4242</code>, any future expiry
          &amp; CVC.
        </p>
      </div>
    </main>
  );
}
