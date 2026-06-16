import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Referral helpers (RECOMMENDATIONS R2). Every function is DEFENSIVE: if the
 * 0004 migration hasn't been applied yet (no referral_code / referred_by
 * columns), these return null/zero instead of throwing — so the dashboard never
 * breaks. Once 0004 is applied, everything lights up automatically.
 */

const ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789"; // no ambiguous chars
const UNDEFINED_COLUMN = "42703";

function gen(len = 6): string {
  let s = "";
  for (let i = 0; i < len; i++)
    s += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  return s;
}

/** The user's referral code, generating + persisting one lazily if needed. */
export async function getOrCreateReferralCode(
  userId: string
): Promise<string | null> {
  const admin = createAdminClient();
  try {
    const { data, error } = await admin
      .from("users")
      .select("referral_code")
      .eq("id", userId)
      .maybeSingle();
    if (error) return null; // migration not applied, etc.
    if (data?.referral_code) return data.referral_code as string;

    for (let attempt = 0; attempt < 6; attempt++) {
      const code = gen();
      const { error: upErr } = await admin
        .from("users")
        .update({ referral_code: code })
        .eq("id", userId);
      if (!upErr) return code;
      if (upErr.code === UNDEFINED_COLUMN) return null;
      // else: unique collision — try another code
    }
    return null;
  } catch {
    return null;
  }
}

/** Resolve a referral code to the referrer's user id (or null). */
export async function resolveReferralCode(
  code: string
): Promise<string | null> {
  if (!code) return null;
  const admin = createAdminClient();
  try {
    const { data, error } = await admin
      .from("users")
      .select("id")
      .eq("referral_code", code.toLowerCase().trim())
      .maybeSingle();
    if (error) return null;
    return (data?.id as string) ?? null;
  } catch {
    return null;
  }
}

/**
 * Attribute a new user to a referrer (set once) and award the referrer the
 * "Recruiter" badge. Best-effort; never throws.
 */
export async function recordReferral(
  newUserId: string,
  code: string
): Promise<void> {
  const referrerId = await resolveReferralCode(code);
  if (!referrerId || referrerId === newUserId) return;

  const admin = createAdminClient();
  try {
    // Only set attribution if not already set.
    const { data: row } = await admin
      .from("users")
      .select("referred_by")
      .eq("id", newUserId)
      .maybeSingle();
    if (row && row.referred_by) return;

    await admin
      .from("users")
      .update({ referred_by: referrerId })
      .eq("id", newUserId);

    // Award the Recruiter badge to the referrer (idempotent).
    const { data: badge } = await admin
      .from("badges")
      .select("id")
      .eq("key", "recruiter")
      .maybeSingle();
    if (badge?.id) {
      await admin
        .from("user_badges")
        .upsert(
          { user_id: referrerId, badge_id: badge.id },
          { onConflict: "user_id,badge_id", ignoreDuplicates: true }
        );
    }
  } catch {
    /* ignore */
  }
}

/** Referral code + how many people this user has referred. */
export async function getReferralStats(
  userId: string
): Promise<{ code: string | null; count: number; recruiter: boolean }> {
  const code = await getOrCreateReferralCode(userId);
  if (!code) return { code: null, count: 0, recruiter: false };

  const admin = createAdminClient();
  let count = 0;
  try {
    const { count: c } = await admin
      .from("users")
      .select("id", { count: "exact", head: true })
      .eq("referred_by", userId);
    count = c ?? 0;
  } catch {
    count = 0;
  }
  return { code, count, recruiter: count > 0 };
}
