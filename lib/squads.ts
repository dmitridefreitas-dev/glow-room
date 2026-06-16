import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Squads / crews (RECOMMENDATIONS R6) — the persistent "clan" layer on top of
 * cohorts. All access via the service-role admin client. Every read is DEFENSIVE
 * so the dashboard never breaks if migration 0005 isn't applied yet.
 */

const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // uppercase, no ambiguous
function genCode(len = 5): string {
  let s = "";
  for (let i = 0; i < len; i++)
    s += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  return s;
}

export type SquadMember = {
  user_id: string;
  display_name: string;
  completed_days: number;
  is_owner: boolean;
};

export type MySquad = {
  id: string;
  name: string;
  inviteCode: string;
  isOwner: boolean;
  members: SquadMember[];
  totalDays: number;
};

export type SquadRankRow = {
  squad_id: string;
  name: string;
  member_count: number;
  completed_days: number;
};

/** The squad this user belongs to (with members), or null. */
export async function getMySquad(userId: string): Promise<MySquad | null> {
  const admin = createAdminClient();
  try {
    const { data: membership, error } = await admin
      .from("squad_members")
      .select("squad_id, role, squads(id, name, invite_code, owner_id)")
      .eq("user_id", userId)
      .maybeSingle();
    if (error || !membership?.squads) return null;

    const sq = (
      Array.isArray(membership.squads) ? membership.squads[0] : membership.squads
    ) as { id: string; name: string; invite_code: string; owner_id: string };

    const { data: members } = await admin.rpc("squad_members_stats", {
      p_squad_id: sq.id,
    });
    const list = (members ?? []) as SquadMember[];

    return {
      id: sq.id,
      name: sq.name,
      inviteCode: sq.invite_code,
      isOwner: sq.owner_id === userId,
      members: list,
      totalDays: list.reduce((n, m) => n + (m.completed_days ?? 0), 0),
    };
  } catch {
    return null;
  }
}

/** Create a squad and make the creator its owner. */
export async function createSquad(
  userId: string,
  name: string
): Promise<{ ok: boolean; error?: string }> {
  const clean = name.trim().slice(0, 40);
  if (!clean) return { ok: false, error: "Give your crew a name." };

  const admin = createAdminClient();
  try {
    // already in a squad?
    const existing = await getMySquad(userId);
    if (existing) return { ok: false, error: "You're already in a crew." };

    for (let attempt = 0; attempt < 6; attempt++) {
      const invite_code = genCode();
      const { data: squad, error } = await admin
        .from("squads")
        .insert({ name: clean, invite_code, owner_id: userId })
        .select("id")
        .single();
      if (error) {
        if (error.code === "23505") continue; // code collision — retry
        return { ok: false, error: error.message };
      }
      const { error: memErr } = await admin
        .from("squad_members")
        .insert({ squad_id: squad.id, user_id: userId, role: "owner" });
      if (memErr) return { ok: false, error: memErr.message };
      return { ok: true };
    }
    return { ok: false, error: "Couldn't generate a code — try again." };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "failed" };
  }
}

/** Join an existing squad by its invite code. */
export async function joinSquad(
  userId: string,
  code: string
): Promise<{ ok: boolean; error?: string }> {
  const invite = code.trim().toUpperCase();
  if (!invite) return { ok: false, error: "Enter a crew code." };

  const admin = createAdminClient();
  try {
    const { data: squad } = await admin
      .from("squads")
      .select("id")
      .eq("invite_code", invite)
      .maybeSingle();
    if (!squad) return { ok: false, error: "No crew with that code." };

    const { error } = await admin
      .from("squad_members")
      .insert({ squad_id: squad.id, user_id: userId, role: "member" });
    if (error) {
      if (error.code === "23505")
        return { ok: false, error: "You're already in a crew." };
      return { ok: false, error: error.message };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "failed" };
  }
}

/** Leave your current squad. */
export async function leaveSquad(userId: string): Promise<void> {
  const admin = createAdminClient();
  try {
    await admin.from("squad_members").delete().eq("user_id", userId);
  } catch {
    /* ignore */
  }
}

/** Squad-vs-squad leaderboard (ranked by total completed days). */
export async function getSquadLeaderboard(): Promise<SquadRankRow[]> {
  const admin = createAdminClient();
  try {
    const { data, error } = await admin.rpc("squad_leaderboard");
    if (error) return [];
    return (data ?? []) as SquadRankRow[];
  } catch {
    return [];
  }
}
