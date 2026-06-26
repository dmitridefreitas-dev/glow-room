import { redirect } from "next/navigation";
import { CreditCard } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Avatar } from "@/components/game/Avatar";
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
    <div>
      <div className="text-center">
        <Avatar stage={4} size={112} />
        <h1 className="mt-2 font-display text-3xl font-extrabold text-spruce">Your player</h1>
        <p className="mt-1 text-sm text-muted">Your display name is what others see on the leaderboard.</p>
      </div>

      {sp.saved && (
        <div className="mt-5 rounded-2xl bg-sage-light px-4 py-3 text-sm text-spruce">✓ Saved.</div>
      )}
      {sp.error && (
        <div className="mt-5 rounded-2xl bg-coral-light px-4 py-3 text-sm text-spruce">{sp.error}</div>
      )}
      {sp.billing === "none" && (
        <div className="mt-5 rounded-2xl bg-honey-light px-4 py-3 text-sm text-spruce">
          You don&apos;t have a subscription to manage. One-time purchases have nothing recurring —
          only the <strong>$9/mo membership</strong> opens the billing portal.
        </div>
      )}
      {sp.billing === "error" && (
        <div className="mt-5 rounded-2xl bg-coral-light px-4 py-3 text-sm text-spruce">
          Couldn&apos;t open the billing portal. In Stripe <strong>test mode</strong>, activate it
          once under Settings → Billing → Customer portal, then try again.
        </div>
      )}

      <form action={updateProfile} className="panel-game mt-6 p-5">
        <label htmlFor="display_name" className="block text-sm font-semibold text-ink">
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
        <button type="submit" className="btn-game btn-primary mt-4 w-full">
          Save changes
        </button>
      </form>

      <div className="panel-game mt-4 p-5">
        <h2 className="text-xs font-extrabold uppercase tracking-game text-spruce">Account</h2>
        <dl className="mt-3 space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted">Email</dt>
            <dd className="font-semibold text-ink">{user.email}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted">Habit anchor</dt>
            <dd className="font-semibold text-ink">{profile?.habit_anchor ?? "—"}</dd>
          </div>
        </dl>
        <form action="/api/portal" method="post" className="mt-4">
          <button type="submit" className="btn-game btn-ivory w-full">
            <CreditCard className="h-4 w-4" /> Manage billing
          </button>
        </form>
      </div>
    </div>
  );
}
