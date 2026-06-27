import Link from "next/link";
import { Compass, Sparkles, BookOpen, ArrowRight } from "lucide-react";
import { Avatar } from "@/components/game/Avatar";
import { GlowNav } from "@/components/glow/GlowNav";

export const metadata = { title: "You" };

const LINKS = [
  { href: "/start", Icon: Compass, title: "Your plan", blurb: "Re-do or update it any time." },
  { href: "/tools", Icon: Sparkles, title: "Practices", blurb: "Your skills kit." },
  { href: "/story", Icon: BookOpen, title: "Why this exists", blurb: "The story behind it." },
];

export default function YouPage() {
  return (
    <main className="mx-auto max-w-md px-6 pt-8 pb-28">
      <div className="text-center">
        <Avatar stage={4} size={88} />
        <h1 className="mt-3 font-display text-3xl font-extrabold text-spruce">You</h1>
        <p className="mt-1 text-sm text-muted">Your space. No pressure here.</p>
      </div>

      <div className="mt-7 flex flex-col gap-3">
        {LINKS.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="group flex items-center gap-3 rounded-2xl border border-line bg-white px-5 py-4 transition hover:border-teal"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-light text-teal">
              <l.Icon className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="font-bold text-spruce">{l.title}</div>
              <div className="text-xs text-muted">{l.blurb}</div>
            </div>
            <ArrowRight className="h-5 w-5 text-teal transition group-hover:translate-x-0.5" />
          </Link>
        ))}
      </div>

      {/* Glow+ teaser — the soft paywall, gently */}
      <div className="mt-4 rounded-2xl border-2 border-dashed border-honey/50 bg-honey-light p-5">
        <div className="flex items-center gap-2">
          <span className="font-display text-lg font-extrabold text-spruce">Glow+</span>
          <span className="rounded-full bg-honey px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-spruce">
            Soon
          </span>
        </div>
        <p className="mt-1 text-xs leading-relaxed text-muted">
          All practices, a room that grows with you, your mood history, and gentle reminders. The depth —
          for when you&apos;re ready. Students get it for less.
        </p>
      </div>

      <p className="mt-6 rounded-2xl bg-ivory p-4 text-xs leading-relaxed text-muted">
        The Glow Room is structure and CBT-informed self-help — not therapy. If you&apos;re in crisis or
        thinking about harming yourself, call or text <strong className="text-spruce">988</strong> (US) or
        your local emergency number.
      </p>

      <GlowNav />
    </main>
  );
}
