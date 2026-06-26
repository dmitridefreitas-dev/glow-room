import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  Lock,
  Footprints,
  Sparkles,
  Brain,
  Anchor,
  ArrowLeft,
  ArrowRight,
  Swords,
  Flag,
  Crown,
  Map as MapIcon,
  type LucideIcon,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getEnrollmentForUser } from "@/lib/cohort";
import { doneCount, totalTasks } from "@/lib/progress";
import { PhotoField } from "@/components/PhotoField";
import { saveCheckIn } from "../../actions";

type Pillar = {
  key: "movement_done" | "skin_done" | "mindset_done" | "anchor_done";
  label: string;
  task: string;
  accent: string;
  Icon: LucideIcon;
};

type Milestone = { tag: string; Icon: LucideIcon; ring: string; copy: React.ReactNode };

export default async function DayPage({
  params,
  searchParams,
}: {
  params: Promise<{ n: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { n } = await params;
  const { error: saveError } = await searchParams;
  const day = Number(n);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const enrollment = await getEnrollmentForUser(user.id);
  if (!enrollment) redirect("/dashboard");
  if (!Number.isInteger(day) || day < 1 || day > enrollment.totalDays) {
    notFound();
  }

  const [{ data: content }, { data: existing }, { data: profile }] =
    await Promise.all([
      supabase
        .from("challenge_days")
        .select("*")
        .eq("challenge_type", enrollment.challengeType)
        .eq("day_number", day)
        .maybeSingle(),
      supabase
        .from("check_ins")
        .select("*")
        .eq("enrollment_id", enrollment.enrollmentId)
        .eq("day_number", day)
        .maybeSingle(),
      supabase
        .from("users")
        .select("habit_anchor")
        .eq("id", user.id)
        .maybeSingle(),
    ]);

  // The bucket is private, so render the saved photo via a short-lived signed URL.
  let savedPhotoUrl: string | null = null;
  if (existing?.photo_path) {
    const admin = createAdminClient();
    const { data: signed } = await admin.storage
      .from("checkin-photos")
      .createSignedUrl(existing.photo_path, 60 * 60);
    savedPhotoUrl = signed?.signedUrl ?? null;
  }

  const isFuture = !enrollment.started || day > enrollment.currentDay;
  const tasks = totalTasks(enrollment.challengeType);
  const done = doneCount(existing ?? undefined, enrollment.challengeType);

  const unlockMs = enrollment.startDate
    ? Date.parse(`${enrollment.startDate}T00:00:00Z`) + (day - 1) * 86_400_000
    : null;
  const unlockLabel = unlockMs
    ? new Date(unlockMs).toLocaleDateString(undefined, {
        weekday: "long",
        month: "short",
        day: "numeric",
      })
    : "soon";

  const pillars: Pillar[] = [];
  if (content?.movement_task)
    pillars.push({ key: "movement_done", label: "Movement", task: content.movement_task, accent: "bg-coral", Icon: Footprints });
  if (content?.skin_task)
    pillars.push({ key: "skin_done", label: "Skin", task: content.skin_task, accent: "bg-teal", Icon: Sparkles });
  if (content?.mindset_prompt)
    pillars.push({ key: "mindset_done", label: "Mindset", task: content.mindset_prompt, accent: "bg-honey", Icon: Brain });
  pillars.push({ key: "anchor_done", label: "Habit anchor", task: profile?.habit_anchor ?? "Your daily anchor", accent: "bg-sage", Icon: Anchor });

  // Boss / checkpoint framing for the scripted arc days.
  const milestone: Milestone | null = isFuture
    ? null
    : day === 8
      ? {
          tag: "Boss · The Wall",
          Icon: Swords,
          ring: "from-coral to-honey",
          copy: (
            <>
              <strong>This is the hard day.</strong> Day 8 is when most people quit —
              that&apos;s by design, not a sign you&apos;re failing. Do the smallest
              version and just don&apos;t skip. Beat the boss.
            </>
          ),
        }
      : day === 15
        ? {
            tag: "Checkpoint · The Turn",
            Icon: Flag,
            ring: "from-teal to-sage",
            copy: (
              <>
                <strong>Halfway. 🎉</strong> This is the turning point — the part where
                it starts to feel like who you are, not what you&apos;re forcing.
              </>
            ),
          }
        : day === 22
          ? {
              tag: "Checkpoint · Home Stretch",
              Icon: Flag,
              ring: "from-sage to-teal",
              copy: (
                <>
                  <strong>Day 22 — you&apos;re past the hard part.</strong> Eight to go.
                  It&apos;s yours to lose now. Protect the streak.
                </>
              ),
            }
          : day === enrollment.totalDays
            ? {
                tag: "Final Boss · The Reveal",
                Icon: Crown,
                ring: "from-spruce to-coral",
                copy: (
                  <>
                    <strong>The final day.</strong> Finish it and your before &amp; after
                    is waiting. Go claim it.
                  </>
                ),
              }
            : null;

  return (
    <div>
      <div className="flex items-center justify-between">
        <Link href="/dashboard" className="inline-flex items-center gap-1 text-sm font-bold text-teal">
          <MapIcon className="h-4 w-4" /> Map
        </Link>
        <span className="chip-stat bg-spruce/5 text-spruce">
          Stage {day} / {enrollment.totalDays}
        </span>
      </div>

      <h1 className="mt-3 font-display text-4xl font-extrabold text-spruce">Day {day}</h1>
      {!isFuture && (
        <>
          <p className="mt-1 text-sm text-muted">
            {done === tasks ? (
              <span className="font-bold text-sage">All {tasks} objectives cleared ✓</span>
            ) : (
              <>
                {done} / {tasks} objectives — clear them all to complete the stage.
              </>
            )}
          </p>
          <div className="xp-track mt-3 h-2.5">
            <div className="xp-fill h-full" style={{ width: `${(done / tasks) * 100}%` }} />
          </div>
        </>
      )}

      {saveError && (
        <div className="mt-3 rounded-2xl bg-coral-light px-4 py-3 text-sm text-spruce">
          Couldn&apos;t save: {saveError}
        </div>
      )}

      {milestone && (
        <div className="panel-game mt-4 overflow-hidden p-0">
          <div className={`flex items-center gap-2 bg-gradient-to-r ${milestone.ring} px-4 py-2 text-white`}>
            <milestone.Icon className="h-4 w-4" />
            <span className="text-xs font-extrabold uppercase tracking-game">{milestone.tag}</span>
          </div>
          <p className="px-4 py-3 text-sm text-spruce">{milestone.copy}</p>
        </div>
      )}

      {isFuture ? (
        <div className="panel-dark mt-6 p-8 text-center">
          <span className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-ivory/10 text-ivory">
            <Lock className="h-7 w-7" />
          </span>
          <h2 className="mt-4 font-display text-xl font-extrabold">Stage {day} is locked</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm text-ivory/75">
            It unlocks <strong className="text-honey">{unlockLabel}</strong>. One new stage
            opens every midnight — no skipping ahead. That&apos;s what keeps the run honest.
          </p>
          {enrollment.started ? (
            <Link href={`/dashboard/day/${enrollment.currentDay}`} className="btn-game btn-primary mt-6">
              Go to today — Day {enrollment.currentDay}
            </Link>
          ) : (
            <Link href="/dashboard" className="btn-game btn-primary mt-6">
              Back to countdown
            </Link>
          )}
        </div>
      ) : (
        <form action={saveCheckIn} className="mt-5 space-y-3.5">
          <input type="hidden" name="day_number" value={day} />

          {pillars.map((p) => (
            <label key={p.key} className="panel-game flex cursor-pointer items-start gap-3 p-4">
              <input
                type="checkbox"
                name={p.key}
                defaultChecked={Boolean(existing?.[p.key])}
                className="mt-1 h-6 w-6 shrink-0 accent-coral"
              />
              <div className="min-w-0 flex-1">
                <h2 className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-game text-spruce">
                  <span className={`inline-flex h-7 w-7 items-center justify-center rounded-lg text-white ${p.accent}`}>
                    <p.Icon className="h-4 w-4" strokeWidth={2.4} />
                  </span>
                  {p.label}
                </h2>
                <p className="mt-1.5 text-sm text-ink">{p.task}</p>

                {p.key === "movement_done" && (
                  <input
                    name="movement_log"
                    defaultValue={existing?.movement_log ?? ""}
                    placeholder="What did you do? (optional)"
                    className="mt-3 w-full rounded-xl border border-line bg-white px-3 py-2 text-sm outline-none focus:border-teal"
                  />
                )}
                {p.key === "mindset_done" && (
                  <textarea
                    name="mindset_answer"
                    defaultValue={existing?.mindset_answer ?? ""}
                    placeholder="Your answer (optional)…"
                    rows={3}
                    className="mt-3 w-full rounded-xl border border-line bg-white px-3 py-2 text-sm outline-none focus:border-teal"
                  />
                )}
              </div>
            </label>
          ))}

          <div className="panel-game p-4">
            <h2 className="text-xs font-extrabold uppercase tracking-game text-spruce">Daily reflection</h2>
            <textarea
              name="reflection"
              defaultValue={existing?.reflection ?? ""}
              placeholder="A line or two about today (optional)…"
              rows={2}
              className="mt-2 w-full rounded-xl border border-line bg-white px-3 py-2 text-sm outline-none focus:border-teal"
            />
            <h2 className="mt-4 text-xs font-extrabold uppercase tracking-game text-spruce">
              Photo {existing?.photo_path ? "(replaces saved one)" : "(optional)"}
            </h2>
            <PhotoField savedPhotoUrl={savedPhotoUrl} day={day} />
            <p className="mt-1 text-xs text-muted">Stored privately — only you can see it.</p>
          </div>

          <button type="submit" className="btn-game btn-primary w-full text-base">
            Complete stage <ArrowRight className="h-4 w-4" />
          </button>

          <div className="flex items-center justify-between pt-1 text-sm">
            {day > 1 ? (
              <Link
                href={`/dashboard/day/${day - 1}`}
                className="inline-flex items-center gap-1 font-bold text-teal"
              >
                <ArrowLeft className="h-4 w-4" /> Day {day - 1}
              </Link>
            ) : (
              <span />
            )}
            {day < enrollment.totalDays && (
              <Link
                href={`/dashboard/day/${day + 1}`}
                className="inline-flex items-center gap-1 font-bold text-teal"
              >
                Day {day + 1} <ArrowRight className="h-4 w-4" />
              </Link>
            )}
          </div>
        </form>
      )}
    </div>
  );
}
