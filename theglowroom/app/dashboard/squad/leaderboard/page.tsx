import Link from "next/link";
import { redirect } from "next/navigation";
import { Medal, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getMySquad, getSquadLeaderboard } from "@/lib/squads";

function Rank({ n }: { n: number }) {
  if (n <= 3) {
    const color = n === 1 ? "text-honey" : n === 2 ? "text-muted" : "text-coral";
    return <Medal className={`h-5 w-5 ${color}`} strokeWidth={2.2} />;
  }
  return <span className="text-sm font-extrabold text-spruce">{n}</span>;
}

export default async function SquadLeaderboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [board, mine] = await Promise.all([
    getSquadLeaderboard(),
    getMySquad(user.id),
  ]);

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/dashboard/squad" className="text-sm font-semibold text-teal">
        ← Your crew
      </Link>
      <h1 className="mt-3 text-3xl font-extrabold text-spruce">
        Crew leaderboard
      </h1>
      <p className="mt-1 text-sm text-muted">
        Ranked by crew points — every day a member completes adds 10. Bigger, more
        consistent crews climb, so recruit and show up.
      </p>

      {board.length === 0 ? (
        <p className="mt-6 text-sm text-muted">
          No crews on the board yet — start one and be first.
        </p>
      ) : (
        <ol className="mt-6 space-y-2">
          {board.map((s, i) => {
            const isMine = mine?.id === s.squad_id;
            return (
              <li
                key={s.squad_id}
                className={`flex items-center justify-between rounded-2xl border px-5 py-3 ${
                  isMine ? "border-coral bg-coral-light" : "border-line bg-white"
                }`}
              >
                <div className="flex items-center gap-4">
                  <span className="flex w-7 justify-center">
                    <Rank n={i + 1} />
                  </span>
                  <div>
                    <div className="font-semibold text-ink">
                      {s.name}
                      {isMine && (
                        <span className="ml-2 text-xs font-bold text-coral">
                          your crew
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted">
                      <Users className="h-3 w-3" /> {s.member_count}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-display text-xl font-extrabold text-spruce">
                    {s.completed_days * 10}
                  </div>
                  <div className="text-[10px] uppercase tracking-wide text-muted">
                    crew pts
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
