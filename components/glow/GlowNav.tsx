"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Sparkles, Compass, User } from "lucide-react";

// The v2 app's bottom tab bar — ties Today / Practices / Plan / You into one
// finished product. Reuses the .bottom-nav styling from game.css (a floating
// dark pill). Shown only on the hub screens, not the focused task flows.
const TABS = [
  { href: "/today", label: "Today", Icon: Home, match: (p: string) => p === "/today" },
  { href: "/tools", label: "Practices", Icon: Sparkles, match: (p: string) => p.startsWith("/tools") },
  { href: "/start", label: "Plan", Icon: Compass, match: (p: string) => p.startsWith("/start") },
  { href: "/you", label: "You", Icon: User, match: (p: string) => p.startsWith("/you") },
];

export function GlowNav() {
  const pathname = usePathname() ?? "";
  return (
    <nav className="bottom-nav" aria-label="App navigation">
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
