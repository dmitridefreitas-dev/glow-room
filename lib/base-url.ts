import { headers } from "next/headers";

/**
 * The app's public origin, for building ABSOLUTE links that get shared
 * (referral, cohort invite, share/OG links).
 *
 * It derives the origin from the **actual request host first**, so links always
 * point at the domain the visitor is really on — even when `NEXT_PUBLIC_APP_URL`
 * is unset or wrong on the host. That's the classic bug behind "the invite link
 * 404s in production": the env var still says `http://localhost:3000`, so every
 * shared link points at localhost. Falls back to the env var, then localhost for
 * local dev.
 */
export async function getBaseUrl(): Promise<string> {
  try {
    const h = await headers();
    const host = h.get("x-forwarded-host") ?? h.get("host");
    if (host) {
      const proto =
        h.get("x-forwarded-proto") ??
        (host.startsWith("localhost") || host.startsWith("127.0.0.1")
          ? "http"
          : "https");
      return `${proto}://${host}`;
    }
  } catch {
    // headers() isn't available in this context — fall through to the env var.
  }
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}
