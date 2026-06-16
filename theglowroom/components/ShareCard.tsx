"use client";

import { useState } from "react";
import { Flame, Share2, Check, Link2 } from "lucide-react";
import { postImageToStory, copyText } from "./share-actions";

/**
 * Branded progress card + the real sharing actions. PRIMARY "Post to my story"
 * hands the server-rendered PNG to the native share sheet; SECONDARY "copy a
 * link" copies the /s/[token] URL (unfurls into the OG preview).
 */
export function ShareCard({
  name,
  streak,
  completed,
  total,
  latestBadge,
  storyImageUrl,
  shareLink,
}: {
  name: string;
  streak: number;
  completed: number;
  total: number;
  latestBadge?: string;
  storyImageUrl: string;
  shareLink: string;
}) {
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const pct = Math.round((completed / total) * 100);
  const caption = `${streak}-day streak on my 30-day glow up 🌿 ${completed}/${total} days done. ${shareLink}`;

  async function onPost() {
    setBusy(true);
    await postImageToStory(storyImageUrl, caption, "share_story");
    setBusy(false);
  }

  async function onCopy() {
    if (await copyText(shareLink, "share_link_copied")) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }
  }

  return (
    <div>
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-spruce to-spruce-dark p-6 text-ivory">
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-coral/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-12 -left-8 h-36 w-36 rounded-full bg-honey/20 blur-3xl" />

        <div className="relative">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-teal-light">
              The Glow Room
            </span>
            <span className="flex gap-1">
              <span className="h-2 w-6 rounded bg-coral" />
              <span className="h-2 w-6 rounded bg-sage" />
              <span className="h-2 w-6 rounded bg-honey" />
            </span>
          </div>

          <div className="mt-5 flex items-end gap-3">
            <Flame className="h-10 w-10 text-honey" strokeWidth={2.2} />
            <div>
              <div className="font-display text-5xl font-extrabold leading-none">
                {streak}
              </div>
              <div className="text-xs uppercase tracking-wide text-ivory/70">
                day streak
              </div>
            </div>
          </div>

          <p className="mt-4 text-sm text-ivory/85">
            {name} is {pct}% through a 30-day glow up — {completed}/{total} days
            done{latestBadge ? `, latest badge: ${latestBadge}` : ""}.
          </p>

          <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-ivory/15">
            <div
              className="h-full rounded-full bg-honey transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </div>

      <button
        onClick={onPost}
        disabled={busy}
        className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-coral px-5 py-3 text-sm font-semibold text-white transition hover:bg-coral/90 disabled:opacity-60 sm:w-auto"
      >
        <Share2 className="h-4 w-4" />
        {busy ? "Preparing…" : "Post to my story"}
      </button>

      <div className="mt-2">
        <button
          onClick={onCopy}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted transition hover:text-teal"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-sage" /> Link copied
            </>
          ) : (
            <>
              <Link2 className="h-3.5 w-3.5" /> or copy a link
            </>
          )}
        </button>
      </div>
    </div>
  );
}
