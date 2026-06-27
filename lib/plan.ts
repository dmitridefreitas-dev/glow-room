// The tailored-plan engine — the "it understood me and built my plan" moment,
// done with RULES, not an LLM. No API key, no cost, no generic chatbot: a quick
// tap-through intake maps the person's answers to the right daily structure +
// a short list of practices + warm, reflected-back copy. Deterministic and free.

export type IntakeAnswers = {
  hardest: string[]; // multi-select
  worst: string; // single
  doable: string; // single
  want: string; // single
};

export type Plan = {
  structureId: string; // which /today structure
  practices: string[]; // exercise ids → PRACTICE_META
  headline: string;
  reflect: string; // a sentence that mirrors their answers back
};

export const PRACTICE_META: Record<string, { label: string; href: string }> = {
  reframe: { label: "Reframe a thought", href: "/reframe" },
  breathe: { label: "Ground yourself", href: "/breathe" },
  worry: { label: "Untangle a worry", href: "/worry" },
  wins: { label: "Three good things", href: "/wins" },
  kinder: { label: "Be kinder to yourself", href: "/kinder" },
};

const WORST_LABEL: Record<string, string> = {
  mornings: "mornings",
  afternoons: "the afternoon slump",
  nights: "nights",
  allday: "the whole day",
};

export function buildPlan(a: IntakeAnswers): Plan {
  const hardest = a.hardest ?? [];

  // 1) The daily structure that fits when it's hardest.
  let structureId = "reset";
  if (a.worst === "nights" || hardest.includes("sleep")) structureId = "winddown";
  else if (a.worst === "mornings" || hardest.includes("bed")) structureId = "start";

  // 2) Practices that match what they're carrying.
  const set = new Set<string>();
  if (hardest.includes("anxious")) {
    set.add("breathe");
    set.add("worry");
  }
  if (hardest.includes("mean")) {
    set.add("kinder");
    set.add("reframe");
  }
  if (hardest.includes("alone")) {
    set.add("kinder");
    set.add("wins");
  }
  if (hardest.includes("sleep")) set.add("breathe");
  if (hardest.includes("bed") || hardest.includes("getdone")) set.add("wins");

  const wantMap: Record<string, string> = {
    calm: "breathe",
    energy: "wins",
    focus: "worry",
    kindness: "kinder",
  };
  if (a.want && wantMap[a.want]) set.add(wantMap[a.want]);

  // Fill to ~3 so there's always a small kit.
  for (const f of ["reframe", "breathe", "wins"]) {
    if (set.size >= 3) break;
    set.add(f);
  }
  const practices = [...set].slice(0, 3);

  // 3) Reflect their answers back in plain, warm language.
  const worst = WORST_LABEL[a.worst] ?? "the day";
  const startDesc =
    structureId === "winddown"
      ? "wind the day down so tomorrow starts easier"
      : structureId === "start"
        ? "start tiny — just getting up and into the day"
        : "reset and start exactly where you are";
  const doableNote =
    a.doable === "nothing"
      ? " We'll keep the steps small enough for the worst days."
      : a.doable === "full"
        ? " And when you've got more in the tank, there's room to go further."
        : "";

  const reflect = `Because ${worst} hit hardest, we'll ${startDesc}.${doableNote} When it gets loud, your kit is one tap away.`;

  return {
    structureId,
    practices,
    headline: "Here's your plan — built around you.",
    reflect,
  };
}
