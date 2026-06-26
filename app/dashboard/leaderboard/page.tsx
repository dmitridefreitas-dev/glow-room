import { redirect } from "next/navigation";
import { Medal, Trophy } from "lucide-react";
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

  const rows = ((data ?? []) as Row[])
    .map((r) => {
      const points = scoreFor(r.completed_days, enrollment.currentDay);
      return { ...r, points, tier: tierFor(points) };
    })
    .sort((a, b) => b.points - a.points || b.completed_days - a.completed_days);

  return (
    <div>
      <div className="text-center">
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-honey-light text-honey anim-badgeglow">
          <Trophy className="h-6 w-6" />
        </span>
        <h1 className="mt-2 font-display text-3xl font-extrabold text-spruce">Leaderboard</h1>
        <p className="mx-auto mt-1 max-w-xs text-sm text-muted">
          Ranked by points — +10 a day you clear, −5 a day you miss.
        </p>
      </div>

      {error && (
        <div className="mt-4 rounded-2xl bg-coral-light px-4 py-3 text-sm text-spruce">
          Couldn&apos;t load the leaderboard: {error.message}. (Did you run migration 0003?)
        </div>
      )}

      {rows.length === 0 ? (
        <p className="mt-6 text-center text-sm text-muted">No check-ins yet — be the first on the board.</p>
      ) : (
        <ol className="mt-6 space-y-2.5">
          {rows.map((r, i) => {
            const me = r.user_id === user.id;
            return (
              <li
                key={r.user_id}
                className={`flex items-center justify-between rounded-2xl px-4 py-3 ${
                  me ? "panel-game ring-2 ring-coral" : "panel-game"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="flex w-6 justify-center">
                    <Rank n={i + 1} />
                  </span>
                  <TierEmblem tier={r.tier} size={34} />
                  <div>
                    <div className="font-bold text-ink">
                      {r.display_name}
                      {me && <span className="ml-2 text-xs font-bold text-coral">you</span>}
                    </div>
                    <div className="text-[11px] uppercase tracking-wide text-muted">
                      {r.tier.label} · {r.completed_days} days
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-display text-xl font-extrabold text-spruce">{r.points}</div>
                  <div className="text-[10px] uppercase tracking-wide text-muted">pts</div>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
