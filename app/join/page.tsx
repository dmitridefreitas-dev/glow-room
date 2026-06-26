import Link from "next/link";
import { redirect } from "next/navigation";
import { Check, Map as MapIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getEnrollmentForUser } from "@/lib/cohort";
import { ensureSoloAccess } from "@/lib/provision";
import { Avatar } from "@/components/game/Avatar";

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

  // Already a paying member → never show the paywall again.
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
    <main className="relative min-h-dvh overflow-hidden px-6 py-12">
      <div className="stage-bg" aria-hidden="true">
        <span className="orb orb-1" />
        <span className="orb orb-2" />
        <span className="orb orb-3" />
      </div>

      <div className="relative z-10 mx-auto max-w-md">
        <Link href="/dashboard" className="inline-flex items-center gap-1 text-sm font-bold text-ivory/70">
          <MapIcon className="h-4 w-4" /> Map
        </Link>

        <div className="mt-3 text-center">
          <Avatar stage={3} size={110} />
          <h1 className="mt-2 font-display text-3xl font-extrabold text-ivory">
            Choose your mode
          </h1>
          <p className="mx-auto mt-1 max-w-xs text-sm text-ivory/70">
            Instant access to the 30-day Glow Up quest, your dashboard, and the
            members-only Discord. Start today.
          </p>
        </div>

        {sp.error && (
          <div className="mt-5 rounded-2xl bg-coral-light px-4 py-3 text-sm text-spruce">
            {sp.error === "cohort-not-configured"
              ? "This cohort isn't set up for checkout yet (run the Stripe setup script)."
              : sp.error === "membership-not-configured"
                ? "Membership isn't configured yet (set STRIPE_MEMBERSHIP_PRICE_ID)."
                : sp.error}
          </div>
        )}

        {/* Story mode — cohorts */}
        <h2 className="mt-8 text-xs font-extrabold uppercase tracking-game text-honey">
          Story mode · one-time
        </h2>
        <div className="mt-3 space-y-3">
          {(cohorts ?? []).length === 0 && (
            <div className="panel-game p-6 text-sm text-muted">
              No purchasable cohorts yet. Run <code>scripts/setup-stripe.mjs</code> to create one.
            </div>
          )}
          {(cohorts ?? []).map((c) => (
            <form
              key={c.id}
              action="/api/checkout"
              method="post"
              className="panel-game flex items-center justify-between p-5"
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
              <button type="submit" className="btn-game btn-primary">
                Play — $18
              </button>
            </form>
          ))}
        </div>

        {/* Endless mode — membership */}
        <h2 className="mt-8 text-xs font-extrabold uppercase tracking-game text-honey">
          Endless mode · monthly
        </h2>
        <div className="panel-dark mt-3 p-6">
          <div className="flex items-baseline justify-between gap-4">
            <div className="text-lg font-bold">The Glow Room Monthly</div>
            <div className="shrink-0">
              <span className="font-display text-2xl font-extrabold">$9</span>
              <span className="text-sm text-ivory/70">/mo</span>
            </div>
          </div>
          <p className="mt-1 text-sm text-ivory/80">
            Ongoing access to everything — cancel anytime. You start today; your 30
            days unlock right away.
          </p>
          <ul className="mt-4 space-y-2 text-sm text-ivory/90">
            {[
              "The full 30-day Glow Up quest + your dashboard",
              "Members-only Discord community",
              "Every seasonal challenge, all year",
              "New monthly drops, quests & streak rewards",
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
              className="btn-game btn-honey w-full disabled:opacity-50"
            >
              Go endless — $9/mo
            </button>
          </form>
          {!membershipEnabled && (
            <p className="mt-2 text-xs text-ivory/60">
              Membership isn&apos;t configured yet (set STRIPE_MEMBERSHIP_PRICE_ID).
            </p>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-ivory/45">
          Test mode — card <code>4242 4242 4242 4242</code>, any future expiry &amp; CVC.
        </p>
      </div>
    </main>
  );
}
