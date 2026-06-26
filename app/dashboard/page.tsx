import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Flame,
  Trophy,
  Lock,
  Star,
  Settings,
  CreditCard,
  ArrowRight,
  Check,
  Sparkles,
  PartyPopper,
  Users,
  Anchor,
  Zap,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getBaseUrl } from "@/lib/base-url";
import { getEnrollmentForUser } from "@/lib/cohort";
import { syncBadges } from "@/lib/badges";
import { CountUp } from "@/components/CountUp";
import { Celebrate } from "@/components/Celebrate";
import { ShareCard } from "@/components/ShareCard";
import { ShareWinButton } from "@/components/ShareWinButton";
import { InvitePanel } from "@/components/InvitePanel";
import { buildShareImageUrl, encodeToken } from "@/lib/share-token";
import { getReferralStats } from "@/lib/referral";
import { getMySquad } from "@/lib/squads";
import { scoreFor, tierProgress } from "@/lib/points";
import { levelFor } from "@/lib/level";
import { TierEmblem } from "@/components/Tier";
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

        <div className="mt-6 rounded-2xl border border-line bg-white p-5 text-left">
          <h2 className="text-sm font-bold uppercase tracking-wide text-spruce">
            While you wait
          </h2>
          <ul className="mt-2 space-y-1.5 text-sm text-muted">
            <li>· Make sure you&apos;ve verified in Discord so you&apos;re in the cohort channel.</li>
            <li>· Tell a friend to join — doing it together is how you finish.</li>
            <li>· On launch day, Day 1 unlocks here automatically.</li>
          </ul>
        </div>
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

  // Habit anchor — the daily metronome. Tracked separately from full-day
  // completion so the one unchanging action gets its own prominence.
  let anchorDone = 0;
  for (const c of byDay.values()) if (c.anchor_done) anchorDone += 1;

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

  const pct = Math.round((completed / total) * 100);

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
        text: `Day ${d} saved — ${done} of ${tasksPerDay} tasks done. Tick the rest to complete the day.`,
      };
    }
  }

  return (
    <div>
      {/* Confetti when a day was just completed, or the whole challenge is done. */}
      <Celebrate fire={Boolean(toast?.ok) || challengeComplete} big={challengeComplete} />

      {toast && (
        <div
          className={`mb-5 rounded-xl px-4 py-3 ${
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

      {/* hero: your evolving avatar — it glows up as you level up */}
      <div className="text-center">
        <p className="text-xs font-bold uppercase tracking-game text-teal">
          Glow Up Quest
        </p>
        <div className="mt-2 flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 -z-0 rounded-full bg-honey/20 blur-2xl" />
            <Avatar stage={stageFromLevel(level.level)} size={132} className="relative z-10" />
          </div>
        </div>
        <h1 className="mt-1 font-display text-2xl font-extrabold text-spruce">
          Hey {name} 👋
        </h1>
        <p className="mt-0.5 text-sm text-muted">
          Anchor: <strong className="text-spruce">{profile.habit_anchor}</strong>
        </p>
      </div>

      {/* ── GAME HUD: level · XP · streak — the persistent player header ── */}
      <div className="mt-5 flex items-center gap-3 rounded-2xl bg-gradient-to-br from-spruce to-spruce-dark px-4 py-3 text-ivory shadow-md">
        <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl bg-coral text-white shadow">
          <Zap className="h-3 w-3" fill="currentColor" strokeWidth={0} />
          <span className="font-display text-lg font-extrabold leading-none">
            {level.level}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between text-[11px] font-semibold">
            <span className="uppercase tracking-wide text-ivory/70">
              Level {level.level} · {rank.current.label}
            </span>
            <span className="text-ivory/60">
              {level.intoLevel}/{level.span} XP
            </span>
          </div>
          <div className="mt-1.5 h-2.5 w-full overflow-hidden rounded-full bg-ivory/15">
            <div
              className="h-full rounded-full bg-gradient-to-r from-honey to-coral transition-all"
              style={{ width: `${level.pct}%` }}
            />
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-center">
          <Flame className="flame-glow h-5 w-5 text-honey" strokeWidth={2.4} />
          <span className="font-display text-sm font-extrabold leading-none">
            {streak}
          </span>
        </div>
      </div>

      {/* Streak loss-aversion: when today isn't done yet and a streak is on the
          line, make the cost of skipping visible. */}
      {!challengeComplete && !todayComplete && streak >= 1 && (
        <div className="mt-5 flex items-center gap-3 rounded-2xl border border-coral/40 bg-coral-light px-4 py-3">
          <Flame className="h-5 w-5 shrink-0 text-coral" strokeWidth={2.4} />
          <p className="text-sm font-medium text-spruce">
            Your <strong>{streak}-day streak</strong> is on the line — finish Day{" "}
            {today} to keep it alive.
          </p>
        </div>
      )}

      {/* ── PRIMARY: today's check-in (or the finish-line celebration) ── */}
      {challengeComplete ? (
        <div className="mt-6 overflow-hidden rounded-3xl bg-gradient-to-br from-spruce to-spruce-dark p-7 text-ivory">
          <PartyPopper className="h-9 w-9 text-honey" />
          <h2 className="mt-3 text-2xl font-extrabold">
            You finished all {total} days. 🤍
          </h2>
          <p className="mt-1 text-sm text-ivory/80">
            You did the whole thing — and you did it on time, every time. Share it
            and start your next glow up.
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
        <Link
          href={`/dashboard/day/${today}`}
          className="group mt-6 block rounded-3xl bg-gradient-to-br from-spruce to-spruce-dark p-7 text-ivory shadow-lg transition hover:brightness-110"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-[0.15em] text-ivory/70">
              {todayComplete
                ? "Done for today"
                : `Today · ${todayDone} of ${tasksPerDay} tasks done`}
            </span>
            {todayComplete && <Check className="h-5 w-5 text-sage" />}
          </div>
          <div className="mt-2 font-display text-3xl font-extrabold">
            Day {today} check-in
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
            {todayComplete ? "Review today" : "Start today's check-in"}
            <ArrowRight className="h-4 w-4" />
          </span>
        </Link>
      )}

      {/* Stats + thick progress (supporting context) */}
      <div className="mt-5 grid grid-cols-3 gap-3">
        <div className="rounded-2xl bg-coral-light p-4 text-center">
          <div className="flex items-center justify-center gap-1.5 text-spruce">
            <Flame className="flame-glow h-5 w-5 text-coral" strokeWidth={2.4} />
            <CountUp value={streak} className="font-display text-3xl font-extrabold" />
          </div>
          <div className="mt-0.5 text-[11px] uppercase tracking-wide text-muted">
            Day streak
          </div>
        </div>
        <div className="rounded-2xl bg-teal-light p-4 text-center">
          <div className="text-spruce">
            <CountUp value={completed} className="font-display text-3xl font-extrabold" />
            <span className="text-base text-muted">/{total}</span>
          </div>
          <div className="mt-0.5 text-[11px] uppercase tracking-wide text-muted">
            Days complete
          </div>
        </div>
        <div className="rounded-2xl bg-honey-light p-4 text-center">
          <CountUp
            value={today}
            className="font-display text-3xl font-extrabold text-spruce"
          />
          <div className="mt-0.5 text-[11px] uppercase tracking-wide text-muted">
            Today is day
          </div>
        </div>
      </div>

      <div className="mt-5">
        <div className="flex items-end justify-between">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted">
            Challenge progress
          </span>
          <span className="font-display text-sm font-bold text-spruce">{pct}%</span>
        </div>
        <div className="mt-1.5 h-5 w-full overflow-hidden rounded-full bg-line">
          <div
            className="h-full rounded-full bg-gradient-to-r from-sage to-teal transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* ── HABIT ANCHOR: the one unchanging daily action (the metronome) ── */}
      <div className="mt-5 rounded-3xl border border-line bg-white p-5">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.15em] text-teal">
            <Anchor className="h-4 w-4" /> Daily anchor
          </h2>
          <span className="text-xs font-semibold text-muted">
            {anchorDone}/{total} days
          </span>
        </div>
        <p className="mt-1 text-sm text-muted">
          <strong className="text-spruce">{profile.habit_anchor}</strong> — the one
          thing that never changes. It&apos;s the backbone the rest is built on.
        </p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {Array.from({ length: total }, (_, i) => i + 1).map((d) => {
            const on = Boolean(byDay.get(d)?.anchor_done);
            return (
              <span
                key={d}
                title={`Day ${d}${on ? " — done" : ""}`}
                className={`h-3 w-3 rounded-full ${
                  on ? "bg-sage" : d === today ? "ring-2 ring-coral" : "bg-line"
                }`}
              />
            );
          })}
        </div>
      </div>

      {/* ── RANK: points + tier ladder (R7) — the trophy count ── */}
      <div className="mt-5 flex items-center gap-5 rounded-3xl bg-gradient-to-br from-spruce to-spruce-dark p-6 text-ivory">
        <TierEmblem tier={rank.current} size={84} animated />
        <div className="min-w-0 flex-1">
          <div className="text-xs font-bold uppercase tracking-[0.15em] text-ivory/65">
            Your rank · {rank.current.label}
          </div>
          <div className="mt-0.5 flex items-baseline gap-2">
            <CountUp
              value={score}
              className="font-display text-5xl font-extrabold leading-none"
            />
            <span className="text-base font-semibold text-ivory/70">pts</span>
          </div>
          {rank.next ? (
            <div className="mt-2.5">
              <div className="h-2 w-full overflow-hidden rounded-full bg-ivory/15">
                <div
                  className="h-full rounded-full bg-honey transition-all"
                  style={{ width: `${rank.pct}%` }}
                />
              </div>
              <p className="mt-1 text-xs text-ivory/70">
                {rank.toGo} pts to <strong className="text-ivory">{rank.next.label}</strong>
              </p>
            </div>
          ) : (
            <p className="mt-1.5 text-xs font-semibold text-honey">
              Top tier — you&apos;re a Champion. 👑
            </p>
          )}
        </div>
      </div>

      {/* ── HERO VISUAL: the quest map (the journey as a level-path) ── */}
      <div className="mt-9 flex items-center justify-between">
        <h2 className="text-sm font-bold uppercase tracking-[0.15em] text-teal">
          Your quest
        </h2>
        <span className="text-[11px] text-muted">
          Day {today} of {total} 🗺️
        </span>
      </div>
      <div className="mt-3 rounded-3xl border border-line bg-white p-4 shadow-sm sm:p-6">
        <QuestMap nodes={questNodes} today={today} total={total} />
        <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
          <span className="inline-flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-full bg-sage" /> cleared
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-full bg-honey" /> in progress
          </span>
          <span className="inline-flex items-center gap-1">
            <Lock className="h-3 w-3" /> unlocks at midnight
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-full bg-coral" /> you are here
          </span>
        </p>
      </div>

      {/* Before / after reveal — your own most motivating (and most shareable)
          proof. Only shows once you have photos on two different days. */}
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
            <p className="mt-3 text-center text-xs text-muted">
              Private — only you can see these. Your Day-1-vs-now is the most
              powerful thing you&apos;ll ever post.
            </p>
          </div>
        </>
      )}

      {/* Share card — built to be posted */}
      <h2 className="mt-9 flex items-center gap-2 text-sm font-bold uppercase tracking-[0.15em] text-teal">
        <Sparkles className="h-4 w-4" /> Show off your streak
      </h2>
      <div className="mt-3">
        <ShareCard
          name={name}
          streak={streak}
          completed={completed}
          total={total}
          latestBadge={latestBadge}
          storyImageUrl={storyImageUrl}
          shareLink={shareLink}
        />
      </div>

      {/* Leaderboard */}
      <Link
        href="/dashboard/leaderboard"
        className="mt-6 flex items-center justify-between rounded-2xl border border-line bg-white px-6 py-4 transition hover:border-teal"
      >
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-honey-light text-honey">
            <Trophy className="h-5 w-5" />
          </span>
          <div>
            <div className="font-bold text-spruce">Leaderboard</div>
            <div className="text-xs text-muted">
              See how you rank against the cohort.
            </div>
          </div>
        </div>
        <ArrowRight className="h-5 w-5 text-teal" />
      </Link>

      {/* Your crew (R6) */}
      <Link
        href="/dashboard/squad"
        className="mt-4 flex items-center justify-between rounded-2xl border border-line bg-white px-6 py-4 transition hover:border-teal"
      >
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sage-light text-sage">
            <Users className="h-5 w-5" />
          </span>
          <div>
            <div className="font-bold text-spruce">Your crew</div>
            <div className="text-xs text-muted">
              Glow up with a persistent squad — and climb the crew leaderboard.
            </div>
          </div>
        </div>
        <ArrowRight className="h-5 w-5 text-teal" />
      </Link>

      {/* Badges */}
      <h2 className="mt-8 text-sm font-bold uppercase tracking-[0.15em] text-teal">
        Badges
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

      {/* Invite & earn (R2/R3/R5) — secondary growth action, kept near the bottom */}
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

      {/* Account links — note: no "join/pay" link here. Anyone viewing the
          dashboard already has access, so we never surface the paywall to them. */}
      <div className="mt-9 flex flex-wrap gap-3 border-t border-line pt-5">
        <form action="/api/portal" method="post">
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-xl bg-ivory px-4 py-2.5 text-sm font-semibold text-teal transition hover:bg-teal-light"
          >
            <CreditCard className="h-4 w-4" /> Manage billing
          </button>
        </form>
        <Link
          href="/dashboard/settings"
          className="inline-flex items-center gap-2 rounded-xl bg-ivory px-4 py-2.5 text-sm font-semibold text-teal transition hover:bg-teal-light"
        >
          <Settings className="h-4 w-4" /> Settings
        </Link>
      </div>
    </div>
  );
}
