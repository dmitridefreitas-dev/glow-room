import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Avatar } from "@/components/game/Avatar";
import { saveIntake } from "../actions";

const OPTIONS = [
  "Make my bed",
  "Drink 2 litres of water",
  "Read 10 pages",
  "Go outside for 10 minutes",
];

export default async function IntakePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("habit_anchor")
    .eq("id", user.id)
    .maybeSingle();

  // Already chosen? Skip straight to the dashboard.
  if (profile?.habit_anchor) redirect("/dashboard");

  return (
    <div>
      <div className="text-center">
        <Avatar stage={1} size={120} />
        <p className="mt-2 text-xs font-bold uppercase tracking-game text-teal">
          Create your player
        </p>
        <h1 className="mt-1 font-display text-3xl font-extrabold text-spruce">
          Choose your anchor
        </h1>
        <p className="mx-auto mt-2 max-w-sm text-sm text-muted">
          One small, non-negotiable thing you&apos;ll do <em>every single day</em> of the
          quest. It never changes — it&apos;s the metronome everything else plays against.
          Pick the one you&apos;re most likely to actually keep.
        </p>
      </div>

      <form action={saveIntake} className="mt-7 space-y-3">
        {OPTIONS.map((opt) => (
          <label
            key={opt}
            className="panel-game flex cursor-pointer items-center gap-3 px-4 py-3.5 text-sm font-semibold text-ink"
          >
            <input type="radio" name="anchor" value={opt} required className="h-5 w-5 accent-coral" />
            {opt}
          </label>
        ))}

        <label className="panel-game flex cursor-pointer items-center gap-3 px-4 py-3.5 text-sm font-semibold text-ink">
          <input type="radio" name="anchor" value="__custom" className="h-5 w-5 accent-coral" />
          Something else:
          <input
            type="text"
            name="custom"
            placeholder="my own anchor…"
            className="flex-1 rounded-lg border border-line bg-white px-3 py-1.5 text-sm outline-none focus:border-teal"
          />
        </label>

        <button type="submit" className="btn-game btn-primary mt-2 w-full text-base">
          ▶ Lock it in &amp; start
        </button>
      </form>
    </div>
  );
}
