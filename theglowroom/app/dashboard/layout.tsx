import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

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
    <div className="min-h-screen">
      <header className="bg-spruce text-ivory">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <span className="text-sm font-extrabold tracking-tight">
            The Glow Room
          </span>
          <div className="flex items-center gap-4 text-xs">
            <span className="hidden text-ivory/70 sm:inline">{user.email}</span>
            <Link
              href="/dashboard/settings"
              className="font-semibold text-ivory/80 transition hover:text-ivory"
            >
              Settings
            </Link>
            <form action="/auth/signout" method="post">
              <button
                type="submit"
                className="rounded-full border border-ivory/40 px-3 py-1.5 font-semibold text-ivory transition hover:bg-ivory/10"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-6 py-10">{children}</main>
    </div>
  );
}
