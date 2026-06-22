import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, PartyPopper } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getEnrollmentForUser } from "@/lib/cohort";
import { syncBadges } from "@/lib/badges";
import { Celebrate } from "@/components/Celebrate";
import { ShareWinButton } from "@/components/ShareWinButton";
import { buildShareImageUrl, encodeToken } from "@/lib/share-token";
import { getBaseUrl } from "@/lib/base-url";
import { getReferralStats } from "@/lib/referral";
import { scoreFor, tierProgress } from "@/lib/points";
import { type CheckInRow, dayComplete } from "@/lib/progress";

/**
 * The day-complete celebration screen. Reached only after a day's check-in is
 * fully completed (saveCheckIn redirects here). It always congratulates; ~20% of
 * the time — and always on the final day — it also invites a story share. Kept
 * occasional on purpose so the share ask never feels like spam.
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

  // Guard: this screen is only for a *completed* day. If someone lands here
  // without actually finishing it, send them back to the check-in.
  if (!dayComplete(byDay.get(day), type)) redirect(`/dashboard/day/${day}`);

  let completed = 0;
  for (const c of byDay.values()) if (dayComplete(c, type)) completed += 1;

  let streak = 0;
  for (let d = 1; d <= total; d++) {
    if (dayComplete(byDay.get(d), type)) streak += 1;
    else break;
  }

  const challengeComplete = completed === total;

  // Award milestone badges at the moment they're earned (idempotent).
  const badges = await syncBadges(user.id, { completed, streak, total, type });
  const latestBadge = badges.filter((b) => b.earned).at(-1)?.label;

  const score = scoreFor(completed, enrollment.currentDay);
  const tier = tierProgress(score).current.label;

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
    tier,
  };
  const storyImageUrl = buildShareImageUrl(appUrl, payload, "story");
  const shareLink = `${appUrl}/s/${encodeToken(payload)}`;

  // Show the share prompt only ~20% of the time (saveCheckIn rolls the dice and
  // passes ?share=1) — but always on the finish-line day.
  const showShare = share === "1" || challengeComplete;

  const caption = challengeComplete
    ? `I finished a 30-day glow up 🤍 ${shareLink}`
    : `Day ${day} done — ${streak}-day streak on my glow up 🌿 ${shareLink}`;

  return (
    <div className="mx-auto max-w-md py-6 text-center">
      <Celebrate fire big={challengeComplete} />

      <span className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-honey-light text-honey">
        <PartyPopper className="h-8 w-8" />
      </span>

      <h1 className="mt-4 font-display text-3xl font-extrabold text-spruce">
        {challengeComplete
          ? `You finished all ${total} days. 🤍`
          : `Day ${day} complete! 🎉`}
      </h1>
      <p className="mt-2 text-muted">
        {challengeComplete
          ? "You did the whole thing — and on time, every time. This is the version of you that shows up."
          : streak > 1
            ? `That's a ${streak}-day streak. Momentum looks good on you — same time tomorrow.`
            : "One day down. Showing up is the whole game. See you tomorrow."}
      </p>

      <div className="mt-6 flex items-center justify-center gap-8">
        <div>
          <div className="font-display text-4xl font-extrabold text-coral">
            {streak}
          </div>
          <div className="text-[11px] uppercase tracking-wide text-muted">
            day streak
          </div>
        </div>
        <div>
          <div className="font-display text-4xl font-extrabold text-spruce">
            {completed}
            <span className="text-lg text-muted">/{total}</span>
          </div>
          <div className="text-[11px] uppercase tracking-wide text-muted">
            days complete
          </div>
        </div>
      </div>

      {showShare ? (
        <div className="mt-8 rounded-3xl bg-gradient-to-br from-spruce to-spruce-dark p-6 text-ivory">
          <h2 className="font-display text-xl font-extrabold">Share this win</h2>
          <p className="mt-1 text-sm text-ivory/80">
            {challengeComplete
              ? "Post your finish — it's the best possible start to someone else's."
              : "Post it to your story. Your glow up could be someone else's Day 1."}
          </p>
          <div className="mt-4 flex justify-center">
            <ShareWinButton
              imageUrl={storyImageUrl}
              caption={caption}
              label="Post to my story"
              tone="dark"
            />
          </div>
          <Link
            href="/dashboard"
            className="mt-4 inline-block text-xs font-semibold text-ivory/70 underline-offset-2 hover:underline"
          >
            Maybe later — back to my dashboard
          </Link>
        </div>
      ) : (
        <Link
          href="/dashboard"
          className="mt-8 inline-flex items-center gap-2 rounded-xl bg-coral px-6 py-3 text-sm font-semibold text-white transition hover:bg-coral/90"
        >
          Continue <ArrowRight className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
}
