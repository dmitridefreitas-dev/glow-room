import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Avatar } from "@/components/game/Avatar";

export const metadata = {
  title: "Why this exists",
  description: "The Glow Room was built by someone who needed it.",
};

// DRAFT founder story — written from what the founder shared. Brackets are for the
// founder to make true/specific. Voice: honest, plain, Gen-Z, hopeful at the end.
export default function StoryPage() {
  return (
    <main className="mx-auto max-w-md px-6 py-10">
      <div className="text-center">
        <Avatar stage={5} size={96} />
        <p className="mt-3 text-xs font-extrabold uppercase tracking-[0.15em] text-coral">Why this exists</p>
        <h1 className="mt-2 font-display text-3xl font-extrabold leading-tight text-spruce">
          I built the thing that got me out.
        </h1>
      </div>

      <div className="prose mt-7 space-y-4 text-[15px] leading-relaxed text-ink">
        <p>There was a stretch of my life where I couldn&apos;t get out of bed.</p>
        <p>
          Not &ldquo;tired.&rdquo; Not &ldquo;lazy.&rdquo; The smallest things — making breakfast,
          taking out the trash, opening my laptop — felt impossible. And then I&apos;d hate myself for
          not doing them, which made the next day even heavier.
        </p>
        <p>
          I did the things you&apos;re supposed to do. Psychologists. Psychiatrists.{" "}
          <span className="text-muted">[anything else you tried — meds, etc.]</span>. Some of it helped a
          little. But none of it gave me the one thing I actually needed:{" "}
          <strong className="text-spruce">a structure for my day</strong> — a way to know what to do
          next when my brain couldn&apos;t decide anything.
        </p>
        <p>
          So I built one. Badly, at first. One tiny step at a time — literally &ldquo;sit up,&rdquo; then
          &ldquo;feet on the floor,&rdquo; then &ldquo;open the curtains.&rdquo; I stopped trying to fix my
          whole life and just did the next small thing.
        </p>
        <p>
          Slowly — over <span className="text-muted">[months / years]</span> of trial and error — the
          structure became a scaffold, and the scaffold held me up until I could stand on my own.
        </p>
        <p className="font-semibold text-spruce">
          It took me years to figure out. It shouldn&apos;t take you years.
        </p>
        <p>
          The Glow Room is that structure, handed to you. No lectures, no 12-step program — just the next
          small thing, and, when you&apos;re ready, the skills that helped me stay out. Built by someone
          who&apos;s been exactly where you are.
        </p>
        <p className="text-muted">
          You don&apos;t have to feel ready. Just do the next small thing. I&apos;ll be right here.
        </p>
        <p className="font-semibold text-spruce">— [Your name], founder</p>
      </div>

      <Link
        href="/start"
        className="mt-8 flex w-full items-center justify-center gap-2 rounded-2xl bg-spruce py-4 text-lg font-extrabold text-ivory shadow-lg transition active:translate-y-0.5"
      >
        Build my plan <ArrowRight className="h-5 w-5" />
      </Link>

      <p className="mt-6 rounded-2xl bg-ivory p-4 text-xs leading-relaxed text-muted">
        The Glow Room offers structure and CBT-informed self-help — it isn&apos;t therapy or medical care.
        If you&apos;re in crisis or thinking about harming yourself, please reach out now: call or text{" "}
        <strong className="text-spruce">988</strong> (US Suicide &amp; Crisis Lifeline) or your local
        emergency number.
      </p>
    </main>
  );
}
