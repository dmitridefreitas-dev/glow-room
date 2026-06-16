import posthog from "posthog-js";

/**
 * Fetches a server-rendered PNG and hands it to the native share sheet
 * (→ IG / TikTok / Messages). Falls back to downloading on desktop / where
 * file-share isn't supported. Used by the dashboard share + invite + win flows.
 */
export async function postImageToStory(
  imageUrl: string,
  caption: string,
  event = "share_image"
): Promise<"shared" | "downloaded" | "error"> {
  try {
    const res = await fetch(imageUrl);
    const blob = await res.blob();
    const file = new File([blob], "glow-room.png", { type: "image/png" });

    if (
      typeof navigator !== "undefined" &&
      navigator.canShare?.({ files: [file] })
    ) {
      await navigator.share({ files: [file], text: caption });
      posthog.capture?.(event, { result: "shared" });
      return "shared";
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "glow-room.png";
    a.click();
    URL.revokeObjectURL(url);
    posthog.capture?.(event, { result: "downloaded" });
    return "downloaded";
  } catch {
    return "error";
  }
}

export async function copyText(text: string, event?: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    if (event) posthog.capture?.(event);
    return true;
  } catch {
    return false;
  }
}
