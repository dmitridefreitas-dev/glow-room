import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Flame,
  Lock,
  Star,
  ArrowRight,
  Check,
  Sparkles,
  PartyPopper,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getBaseUrl } from "@/lib/base-url";
import { getEnrollmentForUser } from "@/lib/cohort";
import { syncBadges } from "@/lib/badges";
import { Celebrate } from "@/components/Celebrate";
import { ShareWinButton } from "@/components/ShareWinButton";
import { InvitePanel } from "@/components/InvitePanel";
import { buildShareImageUrl, encodeToken } from "@/lib/share-token";
import { getReferralStats } from "@/lib/referral";
import { getMySquad } from "@/lib/squads";
import { scoreFor, tierProgress } from "@/lib/points";
import { levelFor } from "@/lib/level";
import { QuestMap, type QuestNode } from "@/components/QuestMap";
import { Avatar, stageFromLevel } from "@/components/game/Avatar";
import {
  type CheckInRow,
  dayComplete,
  dayStarted,
  doneCount,
  totalTasks,
} from "@/lib/progress";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const sp = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("users")
    .select("display_name, habit_anchor")
    .eq("id", user!.id)
    .maybeSingle();

  if (!profile?.habit_anchor) redirect("/dashboard/intake");

  const name = profile.display_name ?? user!.email?.split("@")[0] ?? "friend";

  const enrollment = await getEnrollmentForUser(user!.id);
  if (!enrollment) {
    // No access yet → go straight to the join / membership page. (No dead-end
    // "you're not in a cohort yet" screen.) Paying provisions an enrollment, so
    // paid members never bounce back here.
    redirect("/join");
  }

  // Pre-cohort: the user has paid but the challenge hasn't started yet.
  if (!enrollment.started) {
    const startLabel = enrollment.startDate
      ? new Date(`${enrollment.startDate}T00:00:00Z`).toLocaleDateString(
          undefined,
          { weekday: "long", month: "long", day: "numeric" }
        )
      : "soon";
    const d = enrollment.daysUntilStart;
    return (
      <div className="mx-auto max-w-lg text-center">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-teal">
          {enrollment.cohortName ?? "Your cohort"}
        </p>
        <h1 className="mt-2 text-3xl font-extrabold text-spruce">
          You&apos;re in, {name} 🎉
        </h1>
        <p className="mt-2 text-muted">
          The Glow Up Challenge begins <strong>{startLabel}</strong>. Everyone
          starts Day&nbsp;1 together — that&apos;s the whole point.
        </p>

        <div className="mt-7 rounded-3xl bg-spruce px-6 py-10 text-ivory">
          <div className="text-6xl font-extrabold tracking-tight">{d}</div>
          <div className="mt-1 text-sm uppercase tracking-[0.15em] text-ivory/70">
            {d === 1 ? "day to go" : "days to go"}
          </div>
        </div>

        {profile.habit_anchor && (
          <p className="mt-5 text-sm text-muted">
            Your habit anchor is locked in:{" "}
            <strong className="text-spruce">{profile.habit_anchor}</strong>.
            Start it today — a head start never hurts.
          </p>
        )}
      </div>
    );
  }

  const type = enrollment.challengeType;
  const total = enrollment.totalDays;
  const tasksPerDay = totalTasks(type);

  const { data: rows } = await supabase
    .from("check_ins")
    .select(
      "day_number, movement_done, skin_done, mindset_done, anchor_done, photo_path"
    )
    .eq("enrollment_id", enrollment.enrollmentId);

  const byDay = new Map<number, CheckInRow>();
  const photoByDay = new Map<number, string>();
  (rows ?? []).forEach((r) => {
    byDay.set(r.day_number as number, r as CheckInRow);
    if (r.photo_path) photoByDay.set(r.day_number as number, r.photo_path as string);
  });

  let completed = 0;
  for (const c of byDay.values()) if (dayComplete(c, type)) completed += 1;

  // Before/after reveal: sign the earliest and latest day-photos (private bucket)
  // so we can show a side-by-side. Only meaningful once there are two on
  // different days.
  let beforeUrl: string | null = null;
  let afterUrl: string | null = null;
  let beforeDay = 0;
  let afterDay = 0;
  const photoDayNums = [...photoByDay.keys()].sort((a, b) => a - b);
  if (photoDayNums.length >= 2) {
    beforeDay = photoDayNums[0];
    afterDay = photoDayNums[photoDayNums.length - 1];
    const admin = createAdminClient();
    const [{ data: b }, { data: a }] = await Promise.all([
      admin.storage
        .from("checkin-photos")
        .createSignedUrl(photoByDay.get(beforeDay)!, 60 * 60),
      admin.storage
        .from("checkin-photos")
        .createSignedUrl(photoByDay.get(afterDay)!, 60 * 60),
    ]);
    beforeUrl = b?.signedUrl ?? null;
    afterUrl = a?.signedUrl ?? null;
  }

  let streak = 0;
  for (let d = 1; d <= total; d++) {
    if (dayComplete(byDay.get(d), type)) streak += 1;
    else break;
  }

  // Award + fetch collectible badges.
  const badges = await syncBadges(user!.id, { completed, streak, total, type });

  // Today's progress
  const today = enrollment.currentDay;
  const todayCheckIn = byDay.get(today);
  const todayDone = doneCount(todayCheckIn, type);
  const todayComplete = dayComplete(todayCheckIn, type);

  const challengeComplete = completed === total;
  const earnedBadges = badges.filter((b) => b.earned);
  const latestBadge = earnedBadges.at(-1)?.label;

  // Points + tier (R7): score climbs on completed days, drops on missed ones.
  // Same formula the cohort/crew leaderboards use, so the numbers always match.
  const score = scoreFor(completed, today);
  const rank = tierProgress(score);
  const level = levelFor(score);

  // Quest-map nodes: the same per-day state the old grid used, shaped for the
  // winding level-path. Completion wins over "today" so a finished current day
  // still shows its check; the "you are here" marker is keyed off `today`.
  const questNodes: QuestNode[] = Array.from({ length: total }, (_, i) => {
    const d = i + 1;
    const c = byDay.get(d);
    let state: QuestNode["state"];
    if (dayComplete(c, type)) state = "complete";
    else if (d === today) state = "today";
    else if (dayStarted(c, type)) state = "started";
    else if (d > today) state = "locked";
    else state = "available";
    return { day: d, state };
  });

  // Referral (R2) — defensive: null until the 0004 migration is applied.
  const { code: refCode, count: refCount, recruiter } = await getReferralStats(
    user!.id
  );

  // Signed, snapshot share assets (public PNG + link-preview page). Build links
  // from the real request origin so they never point at localhost in production.
  const appUrl = await getBaseUrl();
  const referralLink = refCode ? `${appUrl}/r/${refCode}` : null;
  const sharePayload = {
    name,
    streak,
    completed,
    total,
    badge: latestBadge,
    link: referralLink ?? undefined,
    tier: rank.current.label,
  };
  const storyImageUrl = buildShareImageUrl(appUrl, sharePayload, "story");
  const shareLink = `${appUrl}/s/${encodeToken(sharePayload)}`;
  const inviteImageUrl = referralLink
    ? buildShareImageUrl(appUrl, sharePayload, "invite")
    : null;
  // "Invite to my crew" → if they're in a crew, share its join link; otherwise the
  // button sends them to create one (handled in InvitePanel via crewInviteLink=null).
  const squad = await getMySquad(user!.id);
  const crewInviteLink = squad
    ? `${appUrl}/dashboard/squad?code=${squad.inviteCode}`
    : null;
  const winCaption = `${streak}-day streak on my 30-day glow up 🌿 ${shareLink}`;

  // Smart save toast
  let toast: { ok: boolean; text: string } | null = null;
  if (sp.saved) {
    const d = Number(sp.saved);
    const c = byDay.get(d);
    const done = doneCount(c, type);
    if (dayComplete(c, type)) {
      toast = { ok: true, text: `Day ${d} complete! 🎉 Streak and progress updated.` };
    } else {
      toast = {
        ok: false,
        text: `Day ${d} saved — ${done} of ${tasksPerDay} tasks done.`,
      };
    }
  }

  return (
    <div>
      {/* Confetti when a day was just completed, or the whole challenge is done. */}
      <Celebrate fire={Boolean(toast?.ok) || challengeComplete} big={challengeComplete} />

      {toast && (
        <div
          className={`mb-5 rounded-2xl px-4 py-3 ${
            toast.ok ? "bg-sage-light" : "bg-honey-light"
          }`}
        >
          <p className="text-sm font-medium text-spruce">
            {toast.ok ? "✓ " : ""}
            {toast.text}
          </p>
          {toast.ok && (
            <div className="mt-2.5">
              <ShareWinButton imageUrl={storyImageUrl} caption={winCaption} />
            </div>
          )}
        </div>
      )}

      {/* ── HERO: your avatar + a single, calm status line ── */}
      <div className="text-center">
        <div className="flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-honey/20 blur-2xl" />
            <Avatar stage={stageFromLevel(level.level)} size={116} className="relative z-10" />
          </div>
        </div>
        <h1 className="mt-1 font-display text-2xl font-extrabold text-spruce">
          Hey {name} 👋
        </h1>
        <p className="mt-1 text-sm text-muted">
          Level {level.level} · {rank.current.label} ·{" "}
          <span className="font-semibold text-coral">🔥 {streak}</span>
        </p>
      </div>

      {/* ── THE ONE ACTION: today's glow up (or the finish line) ── */}
      {challengeComplete ? (
        <div className="mt-6 overflow-hidden rounded-3xl bg-gradient-to-br from-spruce to-spruce-dark p-7 text-ivory">
          <PartyPopper className="h-9 w-9 text-honey" />
          <h2 className="mt-3 text-2xl font-extrabold">
            You finished all {total} days. 🤍
          </h2>
          <p className="mt-1 text-sm text-ivory/80">
            You did the whole thing — on time, every time. Share it and start your
            next glow up.
          </p>
          <div className="mt-4">
            <ShareWinButton
              imageUrl={storyImageUrl}
              caption={`I finished a 30-day glow up 🤍 ${shareLink}`}
              label="Share my finish"
              tone="dark"
            />
          </div>
        </div>
      ) : (
        <>
          <Link
            href="/play"
            className="group mt-6 block overflow-hidden rounded-3xl bg-gradient-to-br from-spruce to-spruce-dark p-6 text-ivory shadow-lg transition hover:brightness-110"
          >
            <div className="flex items-center gap-4">
              <div className="relative shrink-0">
                <div className="absolute inset-0 rounded-full bg-honey/30 blur-md" />
                <Avatar stage={stageFromLevel(level.level)} size={60} float={false} className="relative" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.15em] text-ivory/70">
                  <Sparkles className="h-3.5 w-3.5" />
                  {todayComplete
                    ? "Done for today"
                    : `Today · ${todayDone} of ${tasksPerDay} done`}
                  {todayComplete && <Check className="h-4 w-4 text-sage" />}
                </span>
                <div className="mt-1 font-display text-2xl font-extrabold leading-tight">
                  Enter your Glow Room
                </div>
              </div>
            </div>
            <div className="mt-4 flex gap-1.5">
              {Array.from({ length: tasksPerDay }, (_, i) => (
                <span
                  key={i}
                  className={`h-2 flex-1 rounded transition-all ${
                    i < todayDone ? "bg-honey" : "bg-ivory/20"
                  }`}
                />
              ))}
            </div>
            <span className="mt-5 inline-flex items-center gap-2 rounded-full bg-coral px-5 py-2.5 text-sm font-semibold text-white transition group-hover:gap-3">
              {todayComplete ? "Back to your room" : "Do today's glow up"}
              <ArrowRight className="h-4 w-4" />
            </span>
          </Link>

          {/* The full check-in (photo + journal) stays reachable, quietly. */}
          <div className="mt-3 text-center">
            <Link
              href={`/dashboard/day/${today}`}
              className="text-xs font-semibold text-teal underline-offset-2 hover:underline"
            >
              Prefer the full check-in? Add a photo or journal →
            </Link>
          </div>

          {/* Streak on the line — only when it actually is. */}
          {!todayComplete && streak >= 1 && (
            <div className="mt-4 flex items-center gap-3 rounded-2xl border border-coral/40 bg-coral-light px-4 py-3">
              <Flame className="h-5 w-5 shrink-0 text-coral" strokeWidth={2.4} />
              <p className="text-sm font-medium text-spruce">
                Your <strong>{streak}-day streak</strong> is on the line — finish
                Day {today} to keep it.
              </p>
            </div>
          )}
        </>
      )}

      {/* ── YOUR JOURNEY: the one rich visual ── */}
      <div className="mt-9 flex items-center justify-between">
        <h2 className="text-sm font-bold uppercase tracking-[0.15em] text-teal">
          Your journey
        </h2>
        <span className="text-[11px] text-muted">
          Day {today} of {total} 🗺️
        </span>
      </div>
      <div className="mt-3 rounded-3xl border border-line bg-white p-3 pt-7 shadow-sm">
        <QuestMap nodes={questNodes} today={today} total={total} />
      </div>

      {/* Before / after reveal — your own most motivating proof. Only shows once
          you have photos on two different days. */}
      {beforeUrl && afterUrl && (
        <>
          <h2 className="mt-9 text-sm font-bold uppercase tracking-[0.15em] text-teal">
            Your glow up so far
          </h2>
          <div className="mt-3 rounded-3xl border border-line bg-white p-4 shadow-sm">
            <div className="grid grid-cols-2 gap-3">
              <figure>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={beforeUrl}
                  alt={`Your Day ${beforeDay} photo`}
                  className="aspect-square w-full rounded-xl border border-line object-cover"
                />
                <figcaption className="mt-1.5 text-center text-xs font-semibold uppercase tracking-wide text-muted">
                  Day {beforeDay}
                </figcaption>
              </figure>
              <figure>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={afterUrl}
                  alt={`Your Day ${afterDay} photo`}
                  className="aspect-square w-full rounded-xl border border-line object-cover"
                />
                <figcaption className="mt-1.5 text-center text-xs font-semibold uppercase tracking-wide text-spruce">
                  Day {afterDay}
                </figcaption>
              </figure>
            </div>
          </div>
        </>
      )}

      {/* ── Quiet footer: trophies + the one invite loop ── */}
      {earnedBadges.length > 0 && (
        <>
          <h2 className="mt-9 text-sm font-bold uppercase tracking-[0.15em] text-teal">
            Trophies
          </h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {badges.map((b) => (
              <span
                key={b.key}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${
                  b.earned
                    ? "bg-honey-light text-spruce"
                    : "border border-line bg-white text-muted"
                }`}
              >
                {b.earned ? (
                  <Star className="h-3.5 w-3.5 fill-honey text-honey" />
                ) : (
                  <Lock className="h-3.5 w-3.5" />
                )}
                {b.label}
              </span>
            ))}
          </div>
        </>
      )}

      {referralLink && inviteImageUrl && (
        <div className="mt-9">
          <InvitePanel
            referralLink={referralLink}
            inviteImageUrl={inviteImageUrl}
            crewInviteLink={crewInviteLink}
            count={refCount}
            recruiter={recruiter}
          />
        </div>
      )}
    </div>
  );
}
