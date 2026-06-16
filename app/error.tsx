"use client";

import { useEffect } from "react";
import { CloudOff } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surfaces in the browser console; Sentry will capture this in Phase 6.
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-spruce px-6 py-16">
      <div className="w-full max-w-md rounded-3xl bg-ivory p-8 text-center shadow-xl">
        <span className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-coral-light text-coral">
          <CloudOff className="h-8 w-8" />
        </span>
        <h1 className="mt-4 text-2xl font-extrabold text-spruce">
          Something went wrong
        </h1>
        <p className="mt-2 text-sm text-muted">
          That&apos;s on us, not you. Try again — if it keeps happening, give it
          a minute and come back.
        </p>
        <button
          onClick={reset}
          className="mt-6 rounded-xl bg-coral px-6 py-3 text-sm font-semibold text-white transition hover:bg-coral/90"
        >
          Try again
        </button>
      </div>
    </main>
  );
}
