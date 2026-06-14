import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Best-effort profile read (works once the migration has been applied).
  const { data: profile } = await supabase
    .from("users")
    .select("display_name, habit_anchor")
    .eq("id", user!.id)
    .maybeSingle();

  const name =
    profile?.display_name ?? user!.email?.split("@")[0] ?? "friend";

  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-teal">
        You&apos;re in
      </p>
      <h1 className="mt-2 text-3xl font-extrabold text-spruce">
        Welcome, {name}.
      </h1>
      <p className="mt-3 max-w-xl text-muted">
        Your dashboard is live and your account is gated — only signed-in members
        reach this page. The next cohort hasn&apos;t started yet, so there are no
        daily tasks to check in… for now.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl bg-coral-light p-6">
          <span className="block h-1 w-10 rounded bg-coral" />
          <h2 className="mt-3 font-bold text-spruce">Coming in Phase 2</h2>
          <p className="mt-1 text-sm text-muted">
            Your four daily tasks (movement, skin, mindset, habit anchor), the
            check-in form, photo upload, and your streak counter.
          </p>
        </div>
        <div className="rounded-2xl bg-teal-light p-6">
          <span className="block h-1 w-10 rounded bg-teal" />
          <h2 className="mt-3 font-bold text-spruce">Your habit anchor</h2>
          <p className="mt-1 text-sm text-muted">
            {profile?.habit_anchor
              ? `Set to: ${profile.habit_anchor}`
              : "You'll choose this in the intake quiz before Day 1."}
          </p>
        </div>
      </div>

      <p className="mt-8 text-xs text-muted">
        Signed in as {user!.email}. This is the Phase&nbsp;1 checkpoint — auth and
        the gated dashboard are working.
      </p>
    </div>
  );
}
