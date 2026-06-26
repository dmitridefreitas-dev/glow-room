import Link from "next/link";
import {
  signInWithPassword,
  signUpWithPassword,
  signInWithGoogle,
} from "./actions";
import { Avatar } from "@/components/game/Avatar";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ check?: string; error?: string }>;
}) {
  const sp = await searchParams;

  return (
    <main className="relative flex min-h-dvh items-center justify-center overflow-hidden px-6 py-12">
      <div className="stage-bg" aria-hidden="true">
        <span className="orb orb-1" />
        <span className="orb orb-2" />
        <span className="orb orb-3" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="text-center">
          <Avatar stage={5} size={116} />
          <div className="mt-1 font-display text-2xl font-extrabold text-ivory tracking-game">
            THE GLOW ROOM
          </div>
          <Link
            href="/"
            className="mt-1 inline-block text-[11px] font-semibold uppercase tracking-[0.2em] text-ivory/50"
          >
            ← back to title
          </Link>
        </div>

        <div className="panel-game mt-5 p-7">
          <h1 className="font-display text-xl font-extrabold text-spruce">
            Sign in or create your player
          </h1>
          <p className="mt-1 text-sm text-muted">
            Email and a password — that&apos;s it. No codes to wait for.
          </p>

          {sp.check && (
            <div className="mt-5 rounded-2xl bg-sage-light px-4 py-3 text-sm text-spruce">
              ✓ Player created — you&apos;re all set. Sign in below to continue.
            </div>
          )}
          {sp.error && (
            <div className="mt-5 rounded-2xl bg-coral-light px-4 py-3 text-sm text-spruce">
              {sp.error}
            </div>
          )}

          <form className="mt-6 space-y-3">
            <div>
              <label className="block text-sm font-semibold text-ink" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="you@email.com"
                className="mt-1 w-full rounded-xl border border-line bg-white px-4 py-3 text-sm text-ink outline-none focus:border-teal"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-ink" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                minLength={6}
                autoComplete="current-password"
                placeholder="at least 6 characters"
                className="mt-1 w-full rounded-xl border border-line bg-white px-4 py-3 text-sm text-ink outline-none focus:border-teal"
              />
            </div>

            <div className="space-y-2.5 pt-1">
              <button type="submit" formAction={signUpWithPassword} className="btn-game btn-primary w-full">
                ▶ Start a new player
              </button>
              <button type="submit" formAction={signInWithPassword} className="btn-game btn-ivory w-full">
                Continue — I have an account
              </button>
            </div>
          </form>

          {process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED === "true" && (
            <>
              <div className="my-5 flex items-center gap-3 text-xs text-muted">
                <span className="h-px flex-1 bg-line" />
                or
                <span className="h-px flex-1 bg-line" />
              </div>
              <form action={signInWithGoogle}>
                <button type="submit" className="btn-game btn-ivory w-full">
                  Continue with Google
                </button>
              </form>
            </>
          )}
        </div>

        <p className="mt-5 text-center text-xs text-ivory/45">
          Members only — access is gated to paying players.
        </p>
      </div>
    </main>
  );
}
