"use client";

import { useEffect, useRef, useState } from "react";

/** Animated number that eases from 0 → value on mount (cheap perceived quality). */
export function CountUp({
  value,
  className,
  durationMs = 850,
}: {
  value: number;
  className?: string;
  durationMs?: number;
}) {
  const [n, setN] = useState(0);
  const raf = useRef<number | undefined>(undefined);

  useEffect(() => {
    const start = performance.now();
    const tick = (t: number) => {
      const p = Math.min((t - start) / durationMs, 1);
      const eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
      setN(Math.round(eased * value));
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [value, durationMs]);

  return <span className={className}>{n}</span>;
}
