"use client";

import { usePathname } from "next/navigation";

// Re-keys on every route change so the enter animation replays — each screen
// "loads in" like a game scene rather than a hard page swap.
export function ScreenTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div key={pathname} className="anim-screen-in">
      {children}
    </div>
  );
}
