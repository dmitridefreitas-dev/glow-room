import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { updateProfile } from "../actions";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string; billing?: string }>;
}) {
  const sp = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("display_name, habit_anchor")
    .eq("id", user.id)
    .maybeSingle();

  const fallback = user.email?.split("@")[0] ?? "";

  return (
    <div className="mx-auto max-w-lg">
      <Link href="/dashboard" className="text-sm font-semibold text-teal">
        ← Dashboard
      </Link>
      <h1 className="mt-3 text-3xl font-extrabold text-spruce">Settings</h1>
      <p className="mt-1 text-sm text-muted">
        Your display name is what other members see on the leaderboard.
      </p>

      {sp.saved && (
        <div className="mt-5 rounded-xl bg-sage-light px-4 py-3 text-sm text-spruce">
          ✓ Saved.
        </div>
      )}
      {sp.error && (
        <div className="mt-5 rounded-xl bg-coral-light px-4 py-3 text-sm text-spruce">
          {sp.error}
        </div>
      )}
      {sp.billing === "none" && (
        <div className="mt-5 rounded-xl bg-honey-light px-4 py-3 text-sm text-spruce">
          You don&apos;t have a subscription to manage. One-time cohort purchases
          have nothing recurring to cancel — only the <strong>$9/mo
          membership</strong> opens the billing portal.
        </div>
      )}
      {sp.billing === "error" && (
        <div className="mt-5 rounded-xl bg-coral-light px-4 py-3 text-sm text-spruce">
          Couldn&apos;t open the billing portal. In Stripe <strong>test
          mode</strong>, activate it once under Settings → Billing → Customer
          portal, then try again.
        </div>
      )}

      <form action={updateProfile} className="mt-6 space-y-4">
        <div>
          <label
            htmlFor="display_name"
            className="block text-sm font-medium text-ink"
          >
            Display name
          </label>
          <input
            id="display_name"
            name="display_name"
            type="text"
            required
            maxLength={40}
            defaultValue={profile?.display_name ?? fallback}
            placeholder="How your name shows on the leaderboard"
            className="mt-1 w-full rounded-xl border border-line bg-white px-4 py-3 text-sm text-ink outline-none focus:border-teal"
          />
          <p className="mt-1 text-xs text-muted">Up to 40 characters.</p>
        </div>

        <button
          type="submit"
          className="rounded-xl bg-coral px-6 py-3 text-sm font-semibold text-white transition hover:bg-coral/90"
        >
          Save changes
        </button>
      </form>

      <div className="mt-8 border-t border-line pt-5">
        <h2 className="text-sm font-bold uppercase tracking-wide text-spruce">
          Account
        </h2>
        <dl className="mt-3 space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted">Email</dt>
            <dd className="font-medium text-ink">{user.email}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted">Habit anchor</dt>
            <dd className="font-medium text-ink">
              {profile?.habit_anchor ?? "—"}
            </dd>
          </div>
        </dl>
        <form action="/api/portal" method="post" className="mt-4">
          <button type="submit" className="text-sm font-semibold text-teal">
            Manage billing →
          </button>
        </form>
      </div>
    </div>
  );
}
