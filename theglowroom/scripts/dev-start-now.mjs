// Dev helper: shift test cohort start dates so a chosen number of days are
// already UNLOCKED — lets you test the day-by-day unlock without waiting for
// real midnights. The anti-cheat day-lock stays fully on; we're just moving the
// cohort's start date, exactly like time passing.
//
// Run from theglowroom/:
//   node --env-file=.env.local scripts/dev-start-now.mjs        # 1 day open (Day 1)
//   node --env-file=.env.local scripts/dev-start-now.mjs 7      # Days 1-7 open, 8+ locked
//   node --env-file=.env.local scripts/dev-start-now.mjs 30     # whole challenge open
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

// How many days should be unlocked (default 1 = only Day 1).
const daysOpen = Math.max(1, Number(process.argv[2] ?? 1));

// start_date = today - (daysOpen - 1)  → current day == daysOpen.
const start = new Date();
start.setUTCDate(start.getUTCDate() - (daysOpen - 1));
const startDate = start.toISOString().slice(0, 10);
const today = new Date().toISOString().slice(0, 10);

const { data: cohorts } = await supabase
  .from("cohorts")
  .select("id, name, start_date")
  .order("start_date", { ascending: true });

for (const c of cohorts ?? []) {
  await supabase.from("cohorts").update({ start_date: startDate }).eq("id", c.id);
  console.log(`✅ ${c.name}: start_date ${c.start_date} → ${startDate}`);
}

console.log(
  `\nToday is ${today}. Days 1–${daysOpen} are now UNLOCKED; ` +
    `day ${daysOpen + 1}+ stays locked. Reload /dashboard.`
);
