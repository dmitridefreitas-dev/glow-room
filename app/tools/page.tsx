import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { GlowNav } from "@/components/glow/GlowNav";

export const metadata = {
  title: "Practices",
  description: "Short CBT-informed skills you can actually do.",
};

const LIVE = [
  { href: "/reframe", title: "Reframe a thought", blurb: "Catch a heavy thought and practice talking back to it.", mins: "~3 min" },
  { href: "/breathe", title: "Ground yourself", blurb: "Box breathing — no typing, just follow the circle.", mins: "~2 min" },
  { href: "/worry", title: "Untangle a worry", blurb: "Lay a worry out so it stops looping in your head.", mins: "~3 min" },
  { href: "/wins", title: "Three good things", blurb: "Train your brain to notice what went right.", mins: "~2 min" },
  { href: "/kinder", title: "Be kinder to yourself", blurb: "Trade the harsh inner voice for the one you'd use on a friend.", mins: "~2 min" },
];

const SOON: string[] = [];

export default function ToolsPage() {
  return (
    <main className="mx-auto min-h-dvh max-w-md px-6 pt-8 pb-28">
      <Link href="/today" className="flex items-center gap-1 text-sm font-bold text-teal">
        <ArrowLeft className="h-4 w-4" /> Today
      </Link>

      <h1 className="mt-4 font-display text-3xl font-extrabold text-spruce">Practices</h1>
      <p className="mt-1.5 text-sm text-muted">
        Short skills you can actually <em>do</em> — not reading. A couple of minutes each.
      </p>

      <div className="mt-6 flex flex-col gap-3">
        {LIVE.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            className="group flex items-center justify-between rounded-2xl border border-line bg-white px-5 py-4 transition hover:border-teal"
          >
            <div>
              <div className="font-bold text-spruce">{t.title}</div>
              <div className="text-xs text-muted">{t.blurb}</div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold text-muted">{t.mins}</span>
              <ArrowRight className="h-5 w-5 text-teal transition group-hover:translate-x-0.5" />
            </div>
          </Link>
        ))}

        {SOON.map((t) => (
          <div
            key={t}
            className="flex items-center justify-between rounded-2xl border border-dashed border-line bg-ivory px-5 py-4 opacity-70"
          >
            <div className="font-semibold text-muted">{t}</div>
            <span className="text-[11px] font-bold uppercase tracking-wide text-muted">Soon</span>
          </div>
        ))}
      </div>

      {/* Responsible footer: this is self-help, not therapy. */}
      <p className="mt-9 rounded-2xl bg-ivory p-4 text-xs leading-relaxed text-muted">
        These are <strong className="text-spruce">CBT-informed self-help</strong> practices and daily
        structure — not therapy or medical care. If you&apos;re in crisis or thinking about harming
        yourself, you deserve real help right now: call or text{" "}
        <strong className="text-spruce">988</strong> (US Suicide &amp; Crisis Lifeline), or your local
        emergency number.
      </p>
      <GlowNav />
    </main>
  );
}
