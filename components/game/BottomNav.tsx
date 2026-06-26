"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Trophy, Users, User } from "lucide-react";

// Fixed mobile-game tab bar. The persistent navigation that makes the app feel
// like a native game instead of a set of web pages.
type Tab = {
  href: string;
  label: string;
  Icon: typeof Home;
  match: (p: string) => boolean;
};

const TABS: Tab[] = [
  { href: "/dashboard", label: "Home", Icon: Home, match: (p) => p === "/dashboard" },
  {
    href: "/dashboard/leaderboard",
    label: "Rank",
    Icon: Trophy,
    match: (p) => p.startsWith("/dashboard/leaderboard"),
  },
  {
    href: "/dashboard/squad",
    label: "Crew",
    Icon: Users,
    match: (p) => p.startsWith("/dashboard/squad"),
  },
  {
    href: "/dashboard/settings",
    label: "You",
    Icon: User,
    match: (p) => p.startsWith("/dashboard/settings"),
  },
];

export function BottomNav() {
  const pathname = usePathname() ?? "";
  return (
    <nav className="bottom-nav" aria-label="Game navigation">
      {TABS.map((t) => {
        const active = t.match(pathname);
        return (
          <Link
            key={t.href}
            href={t.href}
            className={`nav-item ${active ? "active" : ""}`}
            aria-current={active ? "page" : undefined}
          >
            <span className="nav-ic">
              <t.Icon className="h-4 w-4" strokeWidth={2.4} />
            </span>
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
