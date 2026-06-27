"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/game/Avatar";

// The front door. The new app IS the app: first-timers go to the plan intake,
// returners drop straight into Today. (The old Glow Room game still lives at its
// own routes — /dashboard, /play — but nothing here sends you there.)
export default function Home() {
  const router = useRouter();
  useEffect(() => {
    let dest = "/start";
    try {
      if (localStorage.getItem("glow_plan_v1")) dest = "/today";
    } catch {
      /* ignore */
    }
    router.replace(dest);
  }, [router]);

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4">
      <Avatar stage={4} size={96} />
      <p className="text-sm font-semibold text-muted">Opening your day…</p>
    </main>
  );
}
