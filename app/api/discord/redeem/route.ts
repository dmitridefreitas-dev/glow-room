import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Called by the Discord verify bot (server-to-server, authenticated with the
 * shared secret). Validates a single-use access code, burns it, and links the
 * Discord account to the app user. The bot grants the role on { ok: true }.
 */
export async function POST(request: Request) {
  if (request.headers.get("x-bot-secret") !== process.env.DISCORD_SHARED_SECRET) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  let code = "";
  let discordUserId = "";
  try {
    const json = await request.json();
    code = String(json.code ?? "").trim().toUpperCase();
    discordUserId = String(json.discord_user_id ?? "").trim();
  } catch {
    return NextResponse.json({ ok: false, error: "bad request" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: row } = await admin
    .from("access_codes")
    .select("*")
    .eq("code", code)
    .maybeSingle();

  if (!row) {
    return NextResponse.json({ ok: false, error: "Invalid code." });
  }
  if (row.redeemed) {
    return NextResponse.json({ ok: false, error: "That code has already been used." });
  }
  if (row.expires_at && new Date(row.expires_at) < new Date()) {
    return NextResponse.json({ ok: false, error: "That code has expired." });
  }

  await admin
    .from("access_codes")
    .update({
      redeemed: true,
      redeemed_by_did: discordUserId,
      redeemed_at: new Date().toISOString(),
    })
    .eq("id", row.id);

  if (row.user_id) {
    await admin
      .from("users")
      .update({ discord_user_id: discordUserId })
      .eq("id", row.user_id);
  }

  return NextResponse.json({ ok: true });
}
