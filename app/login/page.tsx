import Link from "next/link";
import {
  signInWithPassword,
  signUpWithPassword,
  signInWithGoogle,
} from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ check?: string; error?: string }>;
}) {
  const sp = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center bg-spruce px-6 py-16">
      <div className="w-full max-w-md rounded-3xl bg-ivory p-8 shadow-xl">
        <Link
          href="/"
          className="text-xs font-semibold uppercase tracking-[0.18em] text-teal"
        >
          ← The Glow Room
        </Link>
        <h1 className="mt-4 text-2xl font-extrabold text-spruce">
          Sign in or create your account
        </h1>
        <p className="mt-1 text-sm text-muted">
          Email and a password — that&apos;s it. No codes to wait for.
        </p>

        {sp.check && (
          <div className="mt-5 rounded-xl bg-sage-light px-4 py-3 text-sm text-spruce">
            ✓ Account created — you&apos;re all set. Sign in below to continue.
          </div>
        )}
        {sp.error && (
          <div className="mt-5 rounded-xl bg-coral-light px-4 py-3 text-sm text-spruce">
            {sp.error}
          </div>
        )}

        <form className="mt-6 space-y-3">
          <div>
            <label
              className="block text-sm font-medium text-ink"
              htmlFor="email"
            >
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
            <label
              className="block text-sm font-medium text-ink"
              htmlFor="password"
            >
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
            <button
              type="submit"
              formAction={signUpWithPassword}
              className="w-full rounded-xl bg-coral px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-coral/90"
            >
              Create my account
            </button>
            <button
              type="submit"
              formAction={signInWithPassword}
              className="w-full rounded-xl border border-line bg-white px-4 py-3 text-sm font-semibold text-spruce transition hover:border-spruce hover:bg-ivory"
            >
              I already have an account — sign in
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
              <button
                type="submit"
                className="w-full rounded-xl border border-line bg-white px-4 py-3 text-sm font-semibold text-ink transition hover:bg-ivory"
              >
                Continue with Google
              </button>
            </form>
          </>
        )}

        <p className="mt-6 text-center text-xs text-muted">
          Members only — access is gated to paying cohort members.
        </p>
      </div>
    </main>
  );
}
