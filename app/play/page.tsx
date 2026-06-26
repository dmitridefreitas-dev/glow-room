import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getEnrollmentForUser } from "@/lib/cohort";
import { scoreFor, tierProgress } from "@/lib/points";
import { levelFor } from "@/lib/level";
import {
  type CheckInRow,
  type ChallengeType,
  dayComplete,
  requiredKeys,
} from "@/lib/progress";
import { GlowRoom, type Station } from "@/components/room/GlowRoom";

export const metadata = { title: "Your Glow Room" };

// Per-pillar presentation: the label + a gentle fallback task if the content
// library has no row for the day yet. The real task text comes from
// `challenge_days`; the anchor is always the member's own chosen habit.
const PILLAR_META: Record<
  string,
  { label: string; fallback: string }
> = {
  movement_done: { label: "Move", fallback: "Move your body for a few minutes." },
  skin_done: { label: "Glow", fallback: "Take two minutes on your skin." },
  mindset_done: { label: "Mind", fallback: "A moment of calm — breathe and reset." },
  anchor_done: { label: "Anchor", fallback: "Your one daily anchor habit." },
};

export default async function PlayPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("display_name, habit_anchor")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.habit_anchor) redirect("/dashboard/intake");

  const name = profile.display_name ?? user.email?.split("@")[0] ?? "friend";

  const enrollment = await getEnrollmentForUser(user.id);
  if (!enrollment) redirect("/join");

  // Pre-start: the challenge hasn't begun — a calm "your room is getting ready"
  // holding screen instead of an empty world.
  if (!enrollment.started) {
    const d = enrollment.daysUntilStart;
    return (
      <div className="room-shell flex flex-col items-center justify-center px-6 text-center">
        <p className="text-xs font-extrabold uppercase tracking-game text-teal">
          {enrollment.cohortName ?? "Your cohort"}
        </p>
        <h1 className="mt-2 font-display text-3xl font-extrabold text-spruce">
          Your Glow Room opens soon
        </h1>
        <p className="mt-2 max-w-xs text-sm text-muted">
          The lights come on in <strong>{d}</strong> {d === 1 ? "day" : "days"}.
          Everyone starts Day&nbsp;1 together.
        </p>
        <Link href="/dashboard" className="btn-game btn-ivory mt-6">
          Back to dashboard
        </Link>
      </div>
    );
  }

  const type: ChallengeType = enrollment.challengeType;
  const total = enrollment.totalDays;
  const today = enrollment.currentDay;

  // Today's check-in state + the day's real task text.
  const [{ data: rows }, { data: content }] = await Promise.all([
    supabase
      .from("check_ins")
      .select(
        "day_number, movement_done, skin_done, mindset_done, anchor_done"
      )
      .eq("enrollment_id", enrollment.enrollmentId),
    supabase
      .from("challenge_days")
      .select("movement_task, skin_task, mindset_prompt")
      .eq("challenge_type", type)
      .eq("day_number", today)
      .maybeSingle(),
  ]);

  const byDay = new Map<number, CheckInRow>();
  (rows ?? []).forEach((r) => byDay.set(r.day_number as number, r as CheckInRow));

  let completed = 0;
  for (const c of byDay.values()) if (dayComplete(c, type)) completed += 1;

  let streak = 0;
  for (let d = 1; d <= total; d++) {
    if (dayComplete(byDay.get(d), type)) streak += 1;
    else break;
  }

  const todayRow = byDay.get(today);
  const challengeComplete = completed === total;

  const score = scoreFor(completed, today);
  const rank = tierProgress(score);
  const level = levelFor(score);

  // The real task text per applicable pillar (anchor = the member's own habit).
  const taskFor = (key: string): string => {
    if (key === "movement_done") return content?.movement_task ?? PILLAR_META[key].fallback;
    if (key === "skin_done") return content?.skin_task ?? PILLAR_META[key].fallback;
    if (key === "mindset_done") return content?.mindset_prompt ?? PILLAR_META[key].fallback;
    return profile.habit_anchor ?? PILLAR_META.anchor_done.fallback;
  };

  const stations: Station[] = requiredKeys(type).map((key) => ({
    key,
    label: PILLAR_META[key].label,
    task: taskFor(key),
    done: Boolean(todayRow?.[key]),
  }));

  return (
    <GlowRoom
      name={name}
      day={today}
      total={total}
      streak={streak}
      completed={completed}
      level={{ level: level.level, pct: level.pct, intoLevel: level.intoLevel, span: level.span }}
      tierLabel={rank.current.label}
      stations={stations}
      challengeComplete={challengeComplete}
    />
  );
}
