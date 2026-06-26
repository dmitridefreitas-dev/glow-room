import Link from "next/link";
import { redirect } from "next/navigation";
import { Medal, Users, ArrowLeft } from "lucide-react";
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
    <div>
      <Link
        href="/dashboard/squad"
        className="inline-flex items-center gap-1 text-sm font-bold text-teal"
      >
        <ArrowLeft className="h-4 w-4" /> Crew
      </Link>

      <div className="mt-3 text-center">
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-honey-light text-honey anim-badgeglow">
          <Users className="h-6 w-6" />
        </span>
        <h1 className="mt-2 font-display text-3xl font-extrabold text-spruce">
          Crew leaderboard
        </h1>
        <p className="mx-auto mt-1 max-w-xs text-sm text-muted">
          +10 crew points for every day a member clears. Bigger, more consistent
          crews climb — recruit and show up.
        </p>
      </div>

      {board.length === 0 ? (
        <p className="mt-6 text-center text-sm text-muted">
          No crews on the board yet — start one and be first.
        </p>
      ) : (
        <ol className="mt-6 space-y-2.5">
          {board.map((s, i) => {
            const isMine = mine?.id === s.squad_id;
            return (
              <li
                key={s.squad_id}
                className={`flex items-center justify-between rounded-2xl px-4 py-3 ${
                  isMine ? "panel-game ring-2 ring-coral" : "panel-game"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="flex w-6 justify-center">
                    <Rank n={i + 1} />
                  </span>
                  <div>
                    <div className="font-bold text-ink">
                      {s.name}
                      {isMine && (
                        <span className="ml-2 text-xs font-bold text-coral">
                          your crew
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-[11px] uppercase tracking-wide text-muted">
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
