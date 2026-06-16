import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
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
    <div className="mx-auto max-w-lg">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-teal">
        Before Day 1
      </p>
      <h1 className="mt-2 text-3xl font-extrabold text-spruce">
        Pick your habit anchor
      </h1>
      <p className="mt-3 text-muted">
        One small, non-negotiable thing you&apos;ll do <em>every single day</em>{" "}
        for the whole challenge. It stays the same all 30 days — it&apos;s the
        metronome everything else plays against. Choose the one you&apos;re most
        likely to actually keep.
      </p>

      <form action={saveIntake} className="mt-7 space-y-3">
        {OPTIONS.map((opt) => (
          <label
            key={opt}
            className="flex cursor-pointer items-center gap-3 rounded-xl border border-line bg-white px-4 py-3 text-sm font-medium text-ink transition hover:border-teal"
          >
            <input
              type="radio"
              name="anchor"
              value={opt}
              required
              className="h-4 w-4 accent-coral"
            />
            {opt}
          </label>
        ))}

        <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-line bg-white px-4 py-3 text-sm font-medium text-ink transition hover:border-teal">
          <input
            type="radio"
            name="anchor"
            value="__custom"
            className="h-4 w-4 accent-coral"
          />
          Something else:
          <input
            type="text"
            name="custom"
            placeholder="my own anchor…"
            className="flex-1 rounded-lg border border-line px-3 py-1.5 text-sm outline-none focus:border-teal"
          />
        </label>

        <button
          type="submit"
          className="mt-2 w-full rounded-xl bg-coral px-4 py-3 text-sm font-semibold text-white transition hover:bg-coral/90"
        >
          Lock it in &amp; start
        </button>
      </form>
    </div>
  );
}
