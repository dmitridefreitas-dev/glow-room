import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

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

  const admin = createAdminClient();
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
          Join a cohort
        </h1>
        <p className="mt-1 text-muted">
          Everyone starts on the same day and moves through the 30 days together.
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
        <form
          action="/api/checkout"
          method="post"
          className="mt-3 flex items-center justify-between rounded-2xl bg-spruce p-6 text-ivory"
        >
          <input type="hidden" name="kind" value="membership" />
          <div>
            <div className="font-bold">The Glow Room Monthly</div>
            <div className="text-xs text-ivory/70">
              All four cohorts a year, monthly drops, members-only channel.
            </div>
          </div>
          <button
            type="submit"
            disabled={!membershipEnabled}
            className="rounded-xl bg-honey px-5 py-2.5 text-sm font-semibold text-spruce transition hover:bg-honey/90 disabled:opacity-50"
          >
            Subscribe — $9/mo
          </button>
        </form>

        <p className="mt-6 text-xs text-muted">
          Test mode — use card <code>4242 4242 4242 4242</code>, any future expiry
          &amp; CVC.
        </p>
      </div>
    </main>
  );
}
