import Link from "next/link";
import { redirect } from "next/navigation";
import { Medal } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getEnrollmentForUser } from "@/lib/cohort";
import { scoreFor, tierFor } from "@/lib/points";
import { TierEmblem } from "@/components/Tier";

type Row = {
  user_id: string;
  display_name: string;
  completed_days: number;
  tasks_done: number;
};

function Rank({ n }: { n: number }) {
  if (n <= 3) {
    const color = n === 1 ? "text-honey" : n === 2 ? "text-muted" : "text-coral";
    return <Medal className={`h-5 w-5 ${color}`} strokeWidth={2.2} />;
  }
  return <span className="text-sm font-extrabold text-spruce">{n}</span>;
}

export default async function LeaderboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const enrollment = await getEnrollmentForUser(user.id);
  if (!enrollment) redirect("/dashboard");

  const { data, error } = await supabase.rpc("cohort_leaderboard", {
    p_cohort_id: enrollment.cohortId,
  });

  // Rank by POINTS (trophies), computed with the same formula as the dashboard.
  const rows = ((data ?? []) as Row[])
    .map((r) => {
      const points = scoreFor(r.completed_days, enrollment.currentDay);
      return { ...r, points, tier: tierFor(points) };
    })
    .sort((a, b) => b.points - a.points || b.completed_days - a.completed_days);

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/dashboard" className="text-sm font-semibold text-teal">
        ← Dashboard
      </Link>
      <h1 className="mt-3 text-3xl font-extrabold text-spruce">Leaderboard</h1>
      <p className="mt-1 text-sm text-muted">
        Ranked by points — +10 a day you complete, −5 a day you miss. Same score
        and rank you see on your dashboard.
      </p>

      {error && (
        <div className="mt-4 rounded-xl bg-coral-light px-4 py-3 text-sm text-spruce">
          Couldn&apos;t load the leaderboard: {error.message}. (Did you run
          migration 0003?)
        </div>
      )}

      {rows.length === 0 ? (
        <p className="mt-6 text-sm text-muted">
          No check-ins yet — be the first on the board.
        </p>
      ) : (
        <ol className="mt-6 space-y-2">
          {rows.map((r, i) => {
            const me = r.user_id === user.id;
            return (
              <li
                key={r.user_id}
                className={`flex items-center justify-between rounded-2xl border px-4 py-3 ${
                  me ? "border-coral bg-coral-light" : "border-line bg-white"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="flex w-6 justify-center">
                    <Rank n={i + 1} />
                  </span>
                  <TierEmblem tier={r.tier} size={34} />
                  <div>
                    <div className="font-semibold text-ink">
                      {r.display_name}
                      {me && (
                        <span className="ml-2 text-xs font-bold text-coral">
                          you
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] uppercase tracking-wide text-muted">
                      {r.tier.label} · {r.completed_days} days
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-display text-xl font-extrabold text-spruce">
                    {r.points}
                  </div>
                  <div className="text-[10px] uppercase tracking-wide text-muted">
                    pts
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
