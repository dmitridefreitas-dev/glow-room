import Link from "next/link";
import { Compass } from "lucide-react";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-spruce px-6 py-16">
      <div className="w-full max-w-md rounded-3xl bg-ivory p-8 text-center shadow-xl">
        <span className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-light text-teal">
          <Compass className="h-8 w-8" />
        </span>
        <h1 className="mt-4 text-2xl font-extrabold text-spruce">
          Page not found
        </h1>
        <p className="mt-2 text-sm text-muted">
          This page doesn&apos;t exist, or it moved. Let&apos;s get you back on
          track.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link
            href="/dashboard"
            className="rounded-xl bg-coral px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-coral/90"
          >
            My dashboard
          </Link>
          <Link
            href="/"
            className="rounded-xl border border-line bg-white px-5 py-2.5 text-sm font-semibold text-spruce transition hover:bg-ivory"
          >
            Home
          </Link>
        </div>
      </div>
    </main>
  );
}
