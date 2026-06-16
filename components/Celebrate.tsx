"use client";

import { useEffect } from "react";

const BRAND = ["#e2785a", "#e0a23c", "#6ca77f", "#2c7a70", "#fbf8f1"];

/**
 * Fires a one-shot confetti burst when `fire` is true. Used when a day is
 * completed or the challenge is finished. No-op if reduced motion is requested.
 */
export function Celebrate({ fire, big = false }: { fire: boolean; big?: boolean }) {
  useEffect(() => {
    if (!fire) return;
    if (
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
    )
      return;

    let cancelled = false;
    import("canvas-confetti").then(({ default: confetti }) => {
      if (cancelled) return;
      confetti({
        particleCount: big ? 140 : 80,
        spread: big ? 100 : 70,
        startVelocity: big ? 55 : 45,
        origin: { y: 0.3 },
        colors: BRAND,
      });
      setTimeout(
        () =>
          !cancelled &&
          confetti({
            particleCount: big ? 90 : 50,
            spread: 110,
            scalar: 0.9,
            origin: { y: 0.2 },
            colors: BRAND,
          }),
        220
      );
    });
    return () => {
      cancelled = true;
    };
  }, [fire, big]);

  return null;
}
