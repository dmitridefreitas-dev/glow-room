import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Star } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getEnrollmentForUser } from "@/lib/cohort";
import { syncBadges } from "@/lib/badges";
import { Celebrate } from "@/components/Celebrate";
import { ShareWinButton } from "@/components/ShareWinButton";
import { buildShareImageUrl, encodeToken } from "@/lib/share-token";
import { getBaseUrl } from "@/lib/base-url";
import { getReferralStats } from "@/lib/referral";
import { scoreFor, tierProgress } from "@/lib/points";
import { levelFor } from "@/lib/level";
import { Avatar, stageFromLevel } from "@/components/game/Avatar";
import { type CheckInRow, dayComplete } from "@/lib/progress";

/**
 * The day-complete celebration — a game-style "stage cleared / level up" screen.
 * Reached only after a day's check-in is fully completed. Always congratulates;
 * ~20% of the time (and always on the final day) it also invites a story share.
 */
export default async function DayDonePage({
  params,
  searchParams,
}: {
  params: Promise<{ n: string }>;
  searchParams: Promise<{ share?: string }>;
}) {
  const { n } = await params;
  const { share } = await searchParams;
  const day = Number(n);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const enrollment = await getEnrollmentForUser(user.id);
  if (!enrollment) redirect("/dashboard");

  const type = enrollment.challengeType;
  const total = enrollment.totalDays;

  const { data: profile } = await supabase
    .from("users")
    .select("display_name")
    .eq("id", user.id)
    .maybeSingle();
  const name = profile?.display_name ?? user.email?.split("@")[0] ?? "friend";

  const { data: rows } = await supabase
    .from("check_ins")
    .select("day_number, movement_done, skin_done, mindset_done, anchor_done")
    .eq("enrollment_id", enrollment.enrollmentId);

  const byDay = new Map<number, CheckInRow>();
  (rows ?? []).forEach((r) => byDay.set(r.day_number as number, r as CheckInRow));

  // Guard: this screen is only for a *completed* day.
  if (!dayComplete(byDay.get(day), type)) redirect(`/dashboard/day/${day}`);

  let completed = 0;
  for (const c of byDay.values()) if (dayComplete(c, type)) completed += 1;

  let streak = 0;
  for (let d = 1; d <= total; d++) {
    if (dayComplete(byDay.get(d), type)) streak += 1;
    else break;
  }

  const challengeComplete = completed === total;

  const badges = await syncBadges(user.id, { completed, streak, total, type });
  const latestBadge = badges.filter((b) => b.earned).at(-1)?.label;

  const score = scoreFor(completed, enrollment.currentDay);
  const rank = tierProgress(score);
  const level = levelFor(score);

  const { code: refCode } = await getReferralStats(user.id);
  const appUrl = await getBaseUrl();
  const referralLink = refCode ? `${appUrl}/r/${refCode}` : undefined;

  const payload = {
    name,
    streak,
    completed,
    total,
    badge: latestBadge,
    link: referralLink,
    tier: rank.current.label,
  };
  const storyImageUrl = buildShareImageUrl(appUrl, payload, "story");
  const shareLink = `${appUrl}/s/${encodeToken(payload)}`;

  const showShare = share === "1" || challengeComplete;

  const caption = challengeComplete
    ? `I finished a 30-day glow up 🤍 ${shareLink}`
    : `Day ${day} done — ${streak}-day streak on my glow up 🌿 ${shareLink}`;

  return (
    <div className="py-2 text-center">
      <Celebrate fire big={challengeComplete} />

      <p className="text-xs font-extrabold uppercase tracking-[0.25em] text-coral">
        {challengeComplete ? "Quest complete" : "Stage cleared"}
      </p>

      <div className="mt-3 flex justify-center">
        <div className="anim-levelpop">
          <Avatar stage={stageFromLevel(level.level)} size={150} />
        </div>
      </div>

      <h1 className="mt-3 font-display text-3xl font-extrabold text-spruce">
        {challengeComplete ? `All ${total} days. 🤍` : `Day ${day} done! 🎉`}
      </h1>
      <p className="mx-auto mt-2 max-w-xs text-sm text-muted">
        {challengeComplete
          ? "You did the whole thing — on time, every time. This is the version of you that shows up."
          : streak > 1
            ? `A ${streak}-day streak. Momentum looks good on you — same time tomorrow.`
            : "One stage down. Showing up is the whole game. See you tomorrow."}
      </p>

      {/* Level + XP */}
      <div className="panel-dark mx-auto mt-6 max-w-sm p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl bg-coral text-white shadow">
            <span className="text-[8px] font-bold uppercase">Lvl</span>
            <span className="font-display text-lg font-extrabold leading-none">{level.level}</span>
          </div>
          <div className="min-w-0 flex-1 text-left">
            <div className="flex items-center justify-between text-[11px] font-semibold">
              <span className="uppercase tracking-wide text-ivory/70">{rank.current.label}</span>
              <span className="text-ivory/60">{level.intoLevel}/{level.span} XP</span>
            </div>
            <div className="xp-track xp-track-dark mt-1.5 h-2.5">
              <div className="xp-fill h-full" style={{ width: `${level.pct}%` }} />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-center gap-8">
        <div>
          <div className="font-display text-4xl font-extrabold text-coral">{streak}</div>
          <div className="text-[11px] uppercase tracking-wide text-muted">day streak</div>
        </div>
        <div>
          <div className="font-display text-4xl font-extrabold text-spruce">
            {completed}
            <span className="text-lg text-muted">/{total}</span>
          </div>
          <div className="text-[11px] uppercase tracking-wide text-muted">stages cleared</div>
        </div>
      </div>

      {latestBadge && (
        <div className="mx-auto mt-5 inline-flex items-center gap-1.5 rounded-full bg-honey-light px-3 py-1.5 text-xs font-bold text-spruce">
          <Star className="h-3.5 w-3.5 fill-honey text-honey" /> Trophy unlocked: {latestBadge}
        </div>
      )}

      {showShare ? (
        <div className="panel-game mt-7 p-6">
          <h2 className="font-display text-xl font-extrabold text-spruce">Share this win</h2>
          <p className="mt-1 text-sm text-muted">
            {challengeComplete
              ? "Post your finish — it's the best possible start to someone else's."
              : "Post it to your story. Your glow up could be someone else's Day 1."}
          </p>
          <div className="mt-4 flex justify-center">
            <ShareWinButton imageUrl={storyImageUrl} caption={caption} label="Post to my story" />
          </div>
          <Link
            href="/dashboard"
            className="mt-4 inline-block text-xs font-semibold text-muted underline-offset-2 hover:underline"
          >
            Maybe later — back to base
          </Link>
        </div>
      ) : (
        <Link href="/dashboard" className="btn-game btn-primary mt-7 text-base">
          Continue <ArrowRight className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
}
