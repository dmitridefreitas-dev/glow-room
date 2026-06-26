import Link from "next/link";
import { redirect } from "next/navigation";
import { Users, Crown, Trophy, LogOut, Plus, Swords } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getBaseUrl } from "@/lib/base-url";
import { getMySquad, getSquadLeaderboard } from "@/lib/squads";
import { CopyButton } from "@/components/CopyButton";
import {
  createSquadAction,
  joinSquadAction,
  leaveSquadAction,
} from "./actions";

export default async function SquadPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; code?: string }>;
}) {
  const sp = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const squad = await getMySquad(user.id);
  const appUrl = await getBaseUrl();

  return (
    <div>
      <div className="text-center">
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-sage-light text-sage anim-badgeglow">
          <Users className="h-6 w-6" />
        </span>
        <h1 className="mt-2 font-display text-3xl font-extrabold text-spruce">Your crew</h1>
        <p className="mx-auto mt-1 max-w-xs text-sm text-muted">
          A party that runs the quest together. Your crew streak doesn&apos;t reset
          when a cohort ends.
        </p>
      </div>

      {sp.error && (
        <div className="mt-5 rounded-2xl bg-coral-light px-4 py-3 text-sm text-spruce">
          {sp.error}
        </div>
      )}

      {squad ? (
        <SquadHome squad={squad} userId={user.id} appUrl={appUrl} />
      ) : (
        <NoSquad prefillCode={sp.code} />
      )}
    </div>
  );
}

async function SquadHome({
  squad,
  userId,
  appUrl,
}: {
  squad: NonNullable<Awaited<ReturnType<typeof getMySquad>>>;
  userId: string;
  appUrl: string;
}) {
  const board = await getSquadLeaderboard();
  const rank = board.findIndex((s) => s.squad_id === squad.id) + 1;
  const inviteLink = `${appUrl}/dashboard/squad?code=${squad.inviteCode}`;

  return (
    <div>
      {/* Crew banner — the party header */}
      <div className="panel-dark mt-6 overflow-hidden p-6">
        <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-game text-teal-light">
          <Swords className="h-4 w-4" /> {squad.members.length}-person crew
        </div>
        <h2 className="mt-2 font-display text-3xl font-extrabold">{squad.name}</h2>
        <div className="mt-4 flex flex-wrap gap-8">
          <div>
            <div className="font-display text-3xl font-extrabold">
              {squad.totalDays * 10}
            </div>
            <div className="text-[11px] uppercase tracking-wide text-ivory/70">
              crew points
            </div>
          </div>
          <div>
            <div className="font-display text-3xl font-extrabold">
              {rank > 0 ? `#${rank}` : "—"}
            </div>
            <div className="text-[11px] uppercase tracking-wide text-ivory/70">
              global rank
            </div>
          </div>
        </div>
      </div>

      {/* Invite */}
      <div className="panel-game mt-4 p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-sm font-bold text-spruce">
              Invite code:{" "}
              <span className="tracking-widest text-coral">{squad.inviteCode}</span>
            </div>
            <div className="text-xs text-muted">
              Share the link or code — friends join from their dashboard.
            </div>
          </div>
          <CopyButton value={inviteLink} label="Copy link" event="squad_invite_copied" />
        </div>
      </div>

      {/* Members — the party roster */}
      <h3 className="mt-8 text-sm font-bold uppercase tracking-[0.15em] text-teal">
        Crew members
      </h3>
      <ol className="mt-3 space-y-2.5">
        {squad.members.map((m, i) => {
          const me = m.user_id === userId;
          return (
            <li
              key={m.user_id}
              className={`flex items-center justify-between rounded-2xl px-4 py-3 ${
                me ? "panel-game ring-2 ring-coral" : "panel-game"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="w-5 text-center font-display text-sm font-extrabold text-spruce">
                  {i + 1}
                </span>
                <span className="font-bold text-ink">
                  {m.display_name}
                  {m.is_owner && (
                    <Crown className="ml-1.5 inline h-3.5 w-3.5 text-honey" />
                  )}
                  {me && (
                    <span className="ml-2 text-xs font-bold text-coral">you</span>
                  )}
                </span>
              </div>
              <div className="text-right">
                <div className="font-display text-lg font-extrabold text-spruce">
                  {m.completed_days}
                </div>
                <div className="text-[10px] uppercase tracking-wide text-muted">
                  days
                </div>
              </div>
            </li>
          );
        })}
      </ol>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Link
          href="/dashboard/squad/leaderboard"
          className="btn-game btn-spruce"
        >
          <Trophy className="h-4 w-4" /> Crew leaderboard
        </Link>
        <form action={leaveSquadAction}>
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-muted transition hover:text-coral"
          >
            <LogOut className="h-4 w-4" /> Leave crew
          </button>
        </form>
      </div>
    </div>
  );
}

function NoSquad({ prefillCode }: { prefillCode?: string }) {
  return (
    <div className="mt-6 space-y-4">
      {/* Create */}
      <div className="panel-game p-6">
        <h2 className="flex items-center gap-2 font-display text-lg font-extrabold text-spruce">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-coral text-white">
            <Plus className="h-4 w-4" />
          </span>
          Start a crew
        </h2>
        <p className="mt-1.5 text-sm text-muted">
          Name it, then invite friends to glow up together.
        </p>
        <form action={createSquadAction} className="mt-4 flex gap-2">
          <input
            name="name"
            required
            maxLength={40}
            placeholder="The Glow Gang"
            className="flex-1 rounded-xl border border-line bg-white px-4 py-2.5 text-sm outline-none focus:border-teal"
          />
          <button type="submit" className="btn-game btn-primary">
            Create
          </button>
        </form>
      </div>

      {/* Join */}
      <div className="panel-game p-6">
        <h2 className="flex items-center gap-2 font-display text-lg font-extrabold text-spruce">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-sage-light text-sage">
            <Users className="h-4 w-4" />
          </span>
          Join a crew
        </h2>
        <p className="mt-1.5 text-sm text-muted">
          Got a code from a friend? Enter it here.
        </p>
        <form action={joinSquadAction} className="mt-4 flex gap-2">
          <input
            name="code"
            required
            defaultValue={prefillCode ?? ""}
            placeholder="CREW CODE"
            className="flex-1 rounded-xl border border-line bg-white px-4 py-2.5 text-sm uppercase tracking-widest outline-none focus:border-teal"
          />
          <button type="submit" className="btn-game btn-ivory">
            Join
          </button>
        </form>
      </div>
    </div>
  );
}
