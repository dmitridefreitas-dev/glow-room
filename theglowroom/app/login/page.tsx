import Link from "next/link";
import { sendMagicLink, signInWithGoogle } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string; error?: string }>;
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
          Enter the Glow Room
        </h1>
        <p className="mt-1 text-sm text-muted">
          We&apos;ll email you a magic link — no password to remember.
        </p>

        {sp.sent && (
          <div className="mt-5 rounded-xl bg-sage-light px-4 py-3 text-sm text-spruce">
            ✓ Magic link sent to <strong>{sp.sent}</strong>. Check your inbox and
            click it to sign in.
          </div>
        )}
        {sp.error && (
          <div className="mt-5 rounded-xl bg-coral-light px-4 py-3 text-sm text-spruce">
            {sp.error}
          </div>
        )}

        <form action={sendMagicLink} className="mt-6 space-y-3">
          <label className="block text-sm font-medium text-ink" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@email.com"
            className="w-full rounded-xl border border-line bg-white px-4 py-3 text-sm text-ink outline-none focus:border-teal"
          />
          <button
            type="submit"
            className="w-full rounded-xl bg-coral px-4 py-3 text-sm font-semibold text-white transition hover:bg-coral/90"
          >
            Send me a magic link
          </button>
        </form>

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

        <p className="mt-6 text-center text-xs text-muted">
          By continuing you agree to the challenge terms. Members only — access is
          gated to paying cohort members.
        </p>
      </div>
    </main>
  );
}
