import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { decodeToken, buildShareImageUrl } from "@/lib/share-token";
import { getBaseUrl } from "@/lib/base-url";

type Params = { params: Promise<{ token: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { token } = await params;
  const payload = decodeToken(token);
  if (!payload) return { title: "The Glow Room" };

  const image = buildShareImageUrl(await getBaseUrl(), payload, "og");
  const title = `${payload.name} is ${Math.round(
    (payload.completed / payload.total) * 100
  )}% through a 30-day glow up`;
  const description = `${payload.streak}-day streak · ${payload.completed}/${payload.total} days complete. Join the next cohort at The Glow Room.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [{ url: image, width: 1200, height: 630 }],
      type: "website",
      siteName: "The Glow Room",
    },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}

export default async function SharePage({ params }: Params) {
  const { token } = await params;
  const payload = decodeToken(token);

  return (
    <main className="flex min-h-screen items-center justify-center bg-spruce px-6 py-16">
      <div className="w-full max-w-md rounded-3xl bg-ivory p-8 text-center shadow-xl">
        <div className="mx-auto mb-5 flex w-fit gap-1.5">
          <span className="h-2.5 w-12 rounded bg-coral" />
          <span className="h-2.5 w-12 rounded bg-sage" />
          <span className="h-2.5 w-12 rounded bg-honey" />
        </div>
        {payload ? (
          <>
            <h1 className="text-2xl font-extrabold text-spruce">
              {payload.name} is on a {payload.streak}-day streak 🔥
            </h1>
            <p className="mt-2 text-sm text-muted">
              {payload.completed}/{payload.total} days into a 30-day glow up —
              movement, skin, mindset, and one daily habit, done together.
            </p>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-extrabold text-spruce">
              The Glow Room
            </h1>
            <p className="mt-2 text-sm text-muted">
              A 30-day glow up you actually finish — because you do it together.
            </p>
          </>
        )}
        <Link
          href="/login"
          className="mt-7 inline-flex items-center gap-2 rounded-full bg-coral px-7 py-3.5 text-sm font-semibold text-white transition hover:bg-coral/90"
        >
          Start your own glow up <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </main>
  );
}
