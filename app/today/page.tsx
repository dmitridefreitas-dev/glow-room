import { TodayFlow } from "@/components/today/TodayFlow";

// v2 — "The Next Small Thing" (see concepts/v2-one-next-step). A public, no-login,
// localStorage-only daily-structure companion. Lives alongside the Glow Room; the
// existing app is untouched.
export const metadata = {
  title: "Today",
  description: "One small step at a time.",
};

export default function TodayPage() {
  return <TodayFlow />;
}
