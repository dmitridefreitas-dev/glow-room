import { createAdminClient } from "@/lib/supabase/admin";

// Unambiguous alphabet (no 0/O, 1/I/L) so codes are easy to read & type.
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

function randomCode(len = 5): string {
  const bytes = new Uint32Array(len);
  crypto.getRandomValues(bytes);
  let s = "";
  for (let i = 0; i < len; i++) s += ALPHABET[bytes[i] % ALPHABET.length];
  return `GLW-${s}`;
}

/**
 * Generates a unique, single-use access code for a purchase, valid 30 days.
 * Server-only (uses the service role).
 */
export async function createAccessCode(
  userId: string,
  enrollmentId: string
): Promise<string> {
  const admin = createAdminClient();
  const expiresAt = new Date(Date.now() + 30 * 86_400_000).toISOString();

  for (let attempt = 0; attempt < 6; attempt++) {
    const code = randomCode();
    const { error } = await admin.from("access_codes").insert({
      code,
      user_id: userId,
      enrollment_id: enrollmentId,
      expires_at: expiresAt,
    });
    if (!error) return code;
    // 23505 = unique violation -> try another code; otherwise bail.
    if (error.code !== "23505") throw new Error(error.message);
  }
  throw new Error("Could not generate a unique access code");
}
