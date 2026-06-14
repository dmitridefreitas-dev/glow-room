import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getEnrollmentForUser } from "@/lib/cohort";

type Row = {
  user_id: string;
  display_name: string;
  completed_days: number;
  tasks_done: number;
};

const medal = (rank: number) =>
  rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : `${rank}`;

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
  const rows = (data ?? []) as Row[];

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/dashboard" className="text-sm font-semibold text-teal">
        ← Dashboard
      </Link>
      <h1 className="mt-3 text-3xl font-extrabold text-spruce">Leaderboard</h1>
      <p className="mt-1 text-sm text-muted">
        Ranked by days completed. You can&apos;t check in ahead of time, so this
        only rewards showing up — every day, on the day.
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
                className={`flex items-center justify-between rounded-2xl border px-5 py-3 ${
                  me
                    ? "border-coral bg-coral-light"
                    : "border-line bg-white"
                }`}
              >
                <div className="flex items-center gap-4">
                  <span className="w-7 text-center text-lg font-extrabold text-spruce">
                    {medal(i + 1)}
                  </span>
                  <span className="font-semibold text-ink">
                    {r.display_name}
                    {me && (
                      <span className="ml-2 text-xs font-bold text-coral">
                        you
                      </span>
                    )}
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-lg font-extrabold text-spruce">
                    {r.completed_days}
                  </div>
                  <div className="text-[10px] uppercase tracking-wide text-muted">
                    days complete
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
