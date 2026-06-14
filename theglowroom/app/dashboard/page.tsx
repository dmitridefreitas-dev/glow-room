import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getEnrollmentForUser } from "@/lib/cohort";

type CheckIn = {
  day_number: number;
  movement_done: boolean;
  skin_done: boolean;
  mindset_done: boolean;
  anchor_done: boolean;
};

const isComplete = (c?: CheckIn) =>
  !!c && c.movement_done && c.skin_done && c.mindset_done && c.anchor_done;
const isStarted = (c?: CheckIn) =>
  !!c &&
  (c.movement_done || c.skin_done || c.mindset_done || c.anchor_done);

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

  const enrollment = await getEnrollmentForUser(user!.id);
  if (!enrollment) {
    return (
      <div>
        <h1 className="text-2xl font-extrabold text-spruce">No active cohort</h1>
        <p className="mt-2 text-muted">
          You&apos;re not enrolled in a cohort yet. Enrolment opens with each
          launch (Jan / Apr / Jul / Oct).
        </p>
      </div>
    );
  }

  const { data: rows } = await supabase
    .from("check_ins")
    .select("day_number, movement_done, skin_done, mindset_done, anchor_done")
    .eq("enrollment_id", enrollment.enrollmentId);

  const byDay = new Map<number, CheckIn>();
  (rows ?? []).forEach((r) => byDay.set(r.day_number, r as CheckIn));

  const total = enrollment.totalDays;
  let completed = 0;
  for (const c of byDay.values()) if (isComplete(c)) completed += 1;

  let streak = 0;
  for (let d = 1; d <= total; d++) {
    if (isComplete(byDay.get(d))) streak += 1;
    else break;
  }

  const name = profile.display_name ?? user!.email?.split("@")[0] ?? "friend";
  const pct = Math.round((completed / total) * 100);

  return (
    <div>
      {sp.saved && (
        <div className="mb-5 rounded-xl bg-sage-light px-4 py-3 text-sm font-medium text-spruce">
          ✓ Day {sp.saved} check-in saved.
        </div>
      )}

      <p className="text-xs font-bold uppercase tracking-[0.18em] text-teal">
        Glow Up Challenge
      </p>
      <h1 className="mt-2 text-3xl font-extrabold text-spruce">
        Hey {name} 👋
      </h1>
      <p className="mt-1 text-sm text-muted">
        Anchor: <strong>{profile.habit_anchor}</strong> · every day, no excuses.
      </p>

      {/* Stats */}
      <div className="mt-6 grid grid-cols-3 gap-3">
        <div className="rounded-2xl bg-coral-light p-4 text-center">
          <div className="text-3xl font-extrabold text-spruce">{streak}</div>
          <div className="text-[11px] uppercase tracking-wide text-muted">
            Day streak
          </div>
        </div>
        <div className="rounded-2xl bg-teal-light p-4 text-center">
          <div className="text-3xl font-extrabold text-spruce">
            {completed}
            <span className="text-base text-muted">/{total}</span>
          </div>
          <div className="text-[11px] uppercase tracking-wide text-muted">
            Days complete
          </div>
        </div>
        <div className="rounded-2xl bg-honey-light p-4 text-center">
          <div className="text-3xl font-extrabold text-spruce">
            {enrollment.currentDay}
          </div>
          <div className="text-[11px] uppercase tracking-wide text-muted">
            Today is day
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-5">
        <div className="h-3 w-full overflow-hidden rounded-full bg-line">
          <div
            className="h-full rounded-full bg-sage transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="mt-1 text-xs text-muted">{pct}% of the way there.</p>
      </div>

      {/* Today CTA */}
      <Link
        href={`/dashboard/day/${enrollment.currentDay}`}
        className="mt-6 flex items-center justify-between rounded-2xl bg-spruce px-6 py-5 text-ivory transition hover:bg-spruce-dark"
      >
        <div>
          <div className="text-xs uppercase tracking-wide text-ivory/70">
            {isComplete(byDay.get(enrollment.currentDay))
              ? "Done for today ✓"
              : "Today"}
          </div>
          <div className="text-lg font-bold">
            Day {enrollment.currentDay} check-in
          </div>
        </div>
        <span className="text-2xl">→</span>
      </Link>

      {/* Day grid */}
      <h2 className="mt-8 text-sm font-bold uppercase tracking-[0.15em] text-teal">
        All {total} days
      </h2>
      <div className="mt-3 grid grid-cols-6 gap-2 sm:grid-cols-10">
        {Array.from({ length: total }, (_, i) => i + 1).map((d) => {
          const c = byDay.get(d);
          const cls = isComplete(c)
            ? "bg-sage text-white"
            : isStarted(c)
              ? "bg-honey-light text-spruce"
              : "bg-white text-muted";
          const ring =
            d === enrollment.currentDay ? "ring-2 ring-coral" : "border border-line";
          return (
            <Link
              key={d}
              href={`/dashboard/day/${d}`}
              className={`flex aspect-square items-center justify-center rounded-xl text-sm font-bold ${cls} ${ring}`}
            >
              {d}
            </Link>
          );
        })}
      </div>
      <p className="mt-3 text-xs text-muted">
        <span className="inline-block h-2 w-2 rounded-full bg-sage" /> complete ·{" "}
        <span className="inline-block h-2 w-2 rounded-full bg-honey" /> started ·
        ring = today
      </p>
    </div>
  );
}
