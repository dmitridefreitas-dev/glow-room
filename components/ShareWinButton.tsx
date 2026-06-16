"use client";

import { useState } from "react";
import { Share2 } from "lucide-react";
import { postImageToStory } from "./share-actions";

/**
 * R4 — "Share this win" prompt shown at peak-emotion moments (day complete,
 * milestone, challenge finished). Posts the story card to the native share sheet.
 */
export function ShareWinButton({
  imageUrl,
  caption,
  label = "Share this win",
  tone = "light",
}: {
  imageUrl: string;
  caption: string;
  label?: string;
  tone?: "light" | "dark";
}) {
  const [busy, setBusy] = useState(false);
  const cls =
    tone === "dark"
      ? "bg-ivory text-spruce hover:bg-white"
      : "bg-spruce text-ivory hover:bg-spruce-dark";

  return (
    <button
      onClick={async () => {
        setBusy(true);
        await postImageToStory(imageUrl, caption, "share_win");
        setBusy(false);
      }}
      disabled={busy}
      className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition disabled:opacity-60 ${cls}`}
    >
      <Share2 className="h-4 w-4" />
      {busy ? "Preparing…" : label} →
    </button>
  );
}
