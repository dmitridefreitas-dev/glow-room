import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getEnrollmentForUser } from "@/lib/cohort";
import { doneCount, totalTasks } from "@/lib/progress";
import { saveCheckIn } from "../../actions";

type Pillar = {
  key: "movement_done" | "skin_done" | "mindset_done" | "anchor_done";
  label: string;
  task: string;
  accent: string;
};

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

  const isFuture = day > enrollment.currentDay;
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
    pillars.push({
      key: "movement_done",
      label: "Movement",
      task: content.movement_task,
      accent: "bg-coral",
    });
  if (content?.skin_task)
    pillars.push({
      key: "skin_done",
      label: "Skin",
      task: content.skin_task,
      accent: "bg-teal",
    });
  if (content?.mindset_prompt)
    pillars.push({
      key: "mindset_done",
      label: "Mindset",
      task: content.mindset_prompt,
      accent: "bg-honey",
    });
  pillars.push({
    key: "anchor_done",
    label: "Habit anchor",
    task: profile?.habit_anchor ?? "Your daily anchor",
    accent: "bg-sage",
  });

  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex items-center justify-between">
        <Link href="/dashboard" className="text-sm font-semibold text-teal">
          ← Dashboard
        </Link>
        <span className="text-xs text-muted">
          Day {day} of {enrollment.totalDays}
        </span>
      </div>

      <h1 className="mt-3 text-3xl font-extrabold text-spruce">Day {day}</h1>
      {!isFuture && (
        <p className="mt-1 text-sm text-muted">
          {done === tasks ? (
            <span className="font-semibold text-sage">
              All {tasks} tasks done ✓ — this day counts toward your streak.
            </span>
          ) : (
            <>
              {done} of {tasks} tasks ticked. Tick all {tasks} to complete the
              day.
            </>
          )}
        </p>
      )}

      {saveError && (
        <div className="mt-3 rounded-xl bg-coral-light px-4 py-3 text-sm text-spruce">
          Couldn&apos;t save: {saveError}
        </div>
      )}

      {!isFuture && day === 8 && (
        <div className="mt-3 rounded-xl bg-honey-light px-4 py-3 text-sm text-spruce">
          <strong>This is the hard day.</strong> Day 8 is when most people quit —
          that&apos;s by design, not a sign you&apos;re failing. Do the smallest
          version and just don&apos;t skip. You&apos;ve got this.
        </div>
      )}

      {isFuture ? (
        <div className="mt-6 rounded-2xl border border-line bg-white p-8 text-center">
          <div className="text-4xl">🔒</div>
          <h2 className="mt-3 text-lg font-bold text-spruce">
            Day {day} is locked
          </h2>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted">
            It unlocks <strong>{unlockLabel}</strong>. One new day opens every
            midnight — you can&apos;t skip ahead. That&apos;s what keeps the
            challenge honest and the leaderboard fair.
          </p>
          <Link
            href={`/dashboard/day/${enrollment.currentDay}`}
            className="mt-5 inline-block rounded-xl bg-coral px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-coral/90"
          >
            Go to today — Day {enrollment.currentDay}
          </Link>
        </div>
      ) : (
      <form action={saveCheckIn} className="mt-6 space-y-4">
        <input type="hidden" name="day_number" value={day} />

        {pillars.map((p) => (
          <div key={p.key} className="rounded-2xl border border-line bg-white p-5">
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                name={p.key}
                defaultChecked={Boolean(existing?.[p.key])}
                className="mt-1 h-5 w-5 accent-coral"
              />
              <div className="flex-1">
                <span className={`block h-1 w-8 rounded ${p.accent}`} />
                <h2 className="mt-2 text-sm font-bold uppercase tracking-wide text-spruce">
                  {p.label}
                </h2>
                <p className="mt-1 text-sm text-ink">{p.task}</p>

                {p.key === "movement_done" && (
                  <input
                    name="movement_log"
                    defaultValue={existing?.movement_log ?? ""}
                    placeholder="What did you do? (optional)"
                    className="mt-3 w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-teal"
                  />
                )}
                {p.key === "mindset_done" && (
                  <textarea
                    name="mindset_answer"
                    defaultValue={existing?.mindset_answer ?? ""}
                    placeholder="Your answer (optional)…"
                    rows={3}
                    className="mt-3 w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-teal"
                  />
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Reflection + photo */}
        <div className="rounded-2xl border border-line bg-white p-5">
          <h2 className="text-sm font-bold uppercase tracking-wide text-spruce">
            Daily reflection
          </h2>
          <textarea
            name="reflection"
            defaultValue={existing?.reflection ?? ""}
            placeholder="A line or two about today (optional)…"
            rows={2}
            className="mt-2 w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-teal"
          />
          <h2 className="mt-4 text-sm font-bold uppercase tracking-wide text-spruce">
            Photo {existing?.photo_path ? "(replaces saved one)" : "(optional)"}
          </h2>
          {savedPhotoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={savedPhotoUrl}
              alt={`Your Day ${day} photo`}
              className="mt-2 max-h-72 rounded-xl border border-line"
            />
          )}
          <input
            type="file"
            name="photo"
            accept="image/*"
            className="mt-2 block w-full text-sm text-muted file:mr-3 file:rounded-lg file:border-0 file:bg-spruce file:px-3 file:py-2 file:text-xs file:font-semibold file:text-ivory"
          />
          <p className="mt-1 text-xs text-muted">
            Stored privately — only you can see it.
          </p>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex gap-3 text-sm">
            {day > 1 && (
              <Link
                href={`/dashboard/day/${day - 1}`}
                className="font-semibold text-teal"
              >
                ← Day {day - 1}
              </Link>
            )}
            {day < enrollment.totalDays && (
              <Link
                href={`/dashboard/day/${day + 1}`}
                className="font-semibold text-teal"
              >
                Day {day + 1} →
              </Link>
            )}
          </div>
          <button
            type="submit"
            className="rounded-xl bg-coral px-6 py-3 text-sm font-semibold text-white transition hover:bg-coral/90"
          >
            Save check-in
          </button>
        </div>
      </form>
      )}
    </div>
  );
}
