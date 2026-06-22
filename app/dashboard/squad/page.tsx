import Link from "next/link";
import { redirect } from "next/navigation";
import { Users, Crown, Trophy, ArrowRight, LogOut, Plus } from "lucide-react";
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
    <div className="mx-auto max-w-2xl">
      <Link href="/dashboard" className="text-sm font-semibold text-teal">
        ← Dashboard
      </Link>
      <h1 className="mt-3 text-3xl font-extrabold text-spruce">Your crew</h1>
      <p className="mt-1 text-sm text-muted">
        A persistent group that runs cohorts together. Your crew streak doesn&apos;t
        reset when a cohort ends.
      </p>

      {sp.error && (
        <div className="mt-4 rounded-xl bg-coral-light px-4 py-3 text-sm text-spruce">
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
      {/* Crew header */}
      <div className="mt-6 overflow-hidden rounded-3xl bg-gradient-to-br from-spruce to-spruce-dark p-6 text-ivory">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.15em] text-teal-light">
          <Users className="h-4 w-4" /> {squad.members.length}-person crew
        </div>
        <h2 className="mt-2 font-display text-3xl font-extrabold">{squad.name}</h2>
        <div className="mt-4 flex flex-wrap gap-6">
          <div>
            <div className="font-display text-3xl font-extrabold">
              {squad.totalDays * 10}
            </div>
            <div className="text-xs uppercase tracking-wide text-ivory/70">
              crew points
            </div>
          </div>
          <div>
            <div className="font-display text-3xl font-extrabold">
              {rank > 0 ? `#${rank}` : "—"}
            </div>
            <div className="text-xs uppercase tracking-wide text-ivory/70">
              global rank
            </div>
          </div>
        </div>
      </div>

      {/* Invite */}
      <div className="mt-4 rounded-2xl border border-line bg-white p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-bold text-spruce">
              Invite code: <span className="tracking-widest">{squad.inviteCode}</span>
            </div>
            <div className="text-xs text-muted">
              Share the link or code — friends join from their dashboard.
            </div>
          </div>
          <CopyButton value={inviteLink} label="Copy link" event="squad_invite_copied" />
        </div>
      </div>

      {/* Members */}
      <h3 className="mt-8 text-sm font-bold uppercase tracking-[0.15em] text-teal">
        Crew members
      </h3>
      <ol className="mt-3 space-y-2">
        {squad.members.map((m, i) => {
          const me = m.user_id === userId;
          return (
            <li
              key={m.user_id}
              className={`flex items-center justify-between rounded-2xl border px-5 py-3 ${
                me ? "border-coral bg-coral-light" : "border-line bg-white"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="w-5 text-center text-sm font-extrabold text-spruce">
                  {i + 1}
                </span>
                <span className="font-semibold text-ink">
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
                <div className="text-lg font-extrabold text-spruce">
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
          className="inline-flex items-center gap-2 rounded-xl bg-spruce px-5 py-2.5 text-sm font-semibold text-ivory transition hover:bg-spruce-dark"
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
      <div className="rounded-2xl border border-line bg-white p-6">
        <h2 className="flex items-center gap-2 font-bold text-spruce">
          <Plus className="h-4 w-4 text-teal" /> Start a crew
        </h2>
        <p className="mt-1 text-xs text-muted">
          Name it, then invite friends to glow up together.
        </p>
        <form action={createSquadAction} className="mt-3 flex gap-2">
          <input
            name="name"
            required
            maxLength={40}
            placeholder="The Glow Gang"
            className="flex-1 rounded-xl border border-line bg-white px-4 py-2.5 text-sm outline-none focus:border-teal"
          />
          <button
            type="submit"
            className="rounded-xl bg-coral px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-coral/90"
          >
            Create
          </button>
        </form>
      </div>

      {/* Join */}
      <div className="rounded-2xl border border-line bg-white p-6">
        <h2 className="flex items-center gap-2 font-bold text-spruce">
          <Users className="h-4 w-4 text-teal" /> Join a crew
        </h2>
        <p className="mt-1 text-xs text-muted">
          Got a code from a friend? Enter it here.
        </p>
        <form action={joinSquadAction} className="mt-3 flex gap-2">
          <input
            name="code"
            required
            defaultValue={prefillCode ?? ""}
            placeholder="CREW CODE"
            className="flex-1 rounded-xl border border-line bg-white px-4 py-2.5 text-sm uppercase tracking-widest outline-none focus:border-teal"
          />
          <button
            type="submit"
            className="rounded-xl border border-spruce bg-white px-5 py-2.5 text-sm font-semibold text-spruce transition hover:bg-ivory"
          >
            Join
          </button>
        </form>
      </div>
    </div>
  );
}
