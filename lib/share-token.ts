import crypto from "node:crypto";

/**
 * Stateless, signed share payloads for the public share-image endpoint.
 * Only public-safe fields are encoded (display name + streak + progress + an
 * optional badge — the same data already on the leaderboard). An HMAC signature
 * stops anyone forging stats ("999-day streak") since the route is public.
 */
export type SharePayload = {
  name: string;
  streak: number;
  completed: number;
  total: number;
  badge?: string;
  /** Optional referral URL printed on the card (R2/R3). */
  link?: string;
  /** Optional tier label, e.g. "Gold" (R7). */
  tier?: string;
};

export type ShareFormat = "story" | "og" | "square" | "invite";

const SECRET =
  process.env.SHARE_SIGNING_SECRET ?? "dev-insecure-share-secret-change-me";

function canonical(p: SharePayload): string {
  return [
    p.name,
    p.streak,
    p.completed,
    p.total,
    p.badge ?? "",
    p.link ?? "",
    p.tier ?? "",
  ].join("|");
}

export function signShare(p: SharePayload): string {
  return crypto
    .createHmac("sha256", SECRET)
    .update(canonical(p))
    .digest("hex")
    .slice(0, 32);
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

/** Query string for the image endpoint: /api/share-image?...&format=... */
export function buildShareImageUrl(
  appUrl: string,
  p: SharePayload,
  format: ShareFormat = "story"
): string {
  const q = new URLSearchParams({
    n: p.name,
    s: String(p.streak),
    c: String(p.completed),
    t: String(p.total),
    format,
    sig: signShare(p),
  });
  if (p.badge) q.set("b", p.badge);
  if (p.link) q.set("l", p.link);
  if (p.tier) q.set("tr", p.tier);
  return `${appUrl}/api/share-image?${q.toString()}`;
}

/** Verify + parse the image endpoint's query params. Returns null if tampered. */
export function parseShareParams(sp: URLSearchParams): SharePayload | null {
  const name = sp.get("n");
  const streak = Number(sp.get("s"));
  const completed = Number(sp.get("c"));
  const total = Number(sp.get("t"));
  const badge = sp.get("b") ?? undefined;
  const link = sp.get("l") ?? undefined;
  const tier = sp.get("tr") ?? undefined;
  const sig = sp.get("sig");
  if (
    name === null ||
    !Number.isFinite(streak) ||
    !Number.isFinite(completed) ||
    !Number.isFinite(total) ||
    !sig
  )
    return null;

  const payload: SharePayload = {
    name,
    streak,
    completed,
    total,
    badge,
    link,
    tier,
  };
  return safeEqual(sig, signShare(payload)) ? payload : null;
}

/** Compact, link-friendly token for /s/[token] (carries the signed payload). */
export function encodeToken(p: SharePayload): string {
  const raw = JSON.stringify({ ...p, sig: signShare(p) });
  return Buffer.from(raw, "utf8").toString("base64url");
}

export function decodeToken(token: string): SharePayload | null {
  try {
    const obj = JSON.parse(Buffer.from(token, "base64url").toString("utf8"));
    const payload: SharePayload = {
      name: String(obj.name),
      streak: Number(obj.streak),
      completed: Number(obj.completed),
      total: Number(obj.total),
      badge: obj.badge ? String(obj.badge) : undefined,
      link: obj.link ? String(obj.link) : undefined,
      tier: obj.tier ? String(obj.tier) : undefined,
    };
    if (typeof obj.sig !== "string" || !safeEqual(obj.sig, signShare(payload)))
      return null;
    return payload;
  } catch {
    return null;
  }
}
