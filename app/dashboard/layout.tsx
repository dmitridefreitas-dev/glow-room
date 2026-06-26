import { redirect } from "next/navigation";
import { LogOut, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { BootScreen } from "@/components/game/BootScreen";
import { BottomNav } from "@/components/game/BottomNav";
import { ScreenTransition } from "@/components/game/ScreenTransition";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Real authorization check (the proxy does an optimistic one).
  if (!user) {
    redirect("/login");
  }

  return (
    <div className="relative min-h-dvh">
      {/* atmospheric backdrop */}
      <div className="stage-bg" aria-hidden="true">
        <span className="orb orb-1" />
        <span className="orb orb-2" />
        <span className="orb orb-3" />
      </div>

      {/* boot / splash (once per session) */}
      <BootScreen />

      {/* the mobile "play column" */}
      <div className="play-col">
        <header className="flex items-center justify-between px-5 pt-5">
          <span className="flex items-center gap-2 font-display text-base font-extrabold text-spruce">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-coral text-white shadow">
              <Sparkles className="h-4 w-4" />
            </span>
            The Glow Room
          </span>
          <form action="/auth/signout" method="post">
            <button
              type="submit"
              aria-label="Sign out"
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-muted shadow-sm transition hover:text-coral"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </form>
        </header>

        <main className="px-5 pb-28 pt-4">
          <ScreenTransition>{children}</ScreenTransition>
        </main>
      </div>

      {/* fixed game tab bar */}
      <BottomNav />
    </div>
  );
}
