import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// The Glow Room runs in its own immersive shell — the atmospheric stage behind a
// single phone-sized "scene". No scrolling chrome, no bottom tab bar: this is one
// focused screen you open once a day, not a set of pages you browse.
export default async function PlayLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="relative min-h-dvh">
      <div className="stage-bg" aria-hidden="true">
        <span className="orb orb-1" />
        <span className="orb orb-2" />
        <span className="orb orb-3" />
      </div>
      <div className="room-col">{children}</div>
    </div>
  );
}
