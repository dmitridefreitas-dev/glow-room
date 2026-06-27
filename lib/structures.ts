// The structure templates — the heart of the "one next small thing" pathway
// (concepts/v2-one-next-step). Each structure is an ordered list of MICRO-steps,
// small enough to do on the worst day. This is starter content written to the
// PROBLEM.md principles; it's meant to be replaced/expanded with the founder's
// real, lived templates over time.

export type Step = {
  title: string;
  /** A short, kind line — only when it genuinely helps. Keep most steps bare. */
  hint?: string;
};

export type Structure = {
  id: string;
  /** Short label for the picker. */
  title: string;
  /** When to reach for it. */
  when: string;
  /** One calm line shown when you begin. */
  intro: string;
  steps: Step[];
};

export const STRUCTURES: Structure[] = [
  {
    id: "start",
    title: "Start the day",
    when: "For the morning — especially when getting up feels impossible.",
    intro:
      "One small step at a time. You don't have to feel ready — just do the next thing.",
    steps: [
      { title: "Sit up", hint: "Just sit up in bed. That's the hardest part — and you already did it." },
      { title: "Put both feet on the floor" },
      { title: "Let some light in", hint: "Open the curtains or a window. Even grey light counts." },
      { title: "Drink a full glass of water" },
      { title: "Splash your face or brush your teeth", hint: "Two minutes. Cold water helps." },
      { title: "Make your bed", hint: "Just pull the covers up. One made thing changes the whole room." },
      { title: "Put on fresh clothes", hint: "Even just different clothes than the ones you slept in." },
      { title: "Eat something small", hint: "Toast, a banana, anything. Fuel, not a feast." },
      { title: "Step outside for one minute", hint: "Front door, porch, anywhere. Air on your face." },
      { title: "Pick one thing for today", hint: "Just one. Say it out loud. Everything else is bonus." },
    ],
  },
  {
    id: "reset",
    title: "Reset the day",
    when: "For when the day already fell apart and you want back in.",
    intro: "You're not behind. You're starting now — that's allowed.",
    steps: [
      { title: "Stop and take three slow breaths", hint: "The day isn't ruined. You're here." },
      { title: "Drink a glass of water" },
      { title: "Clear one small surface", hint: "Your desk, your nightstand. Just one." },
      { title: "Open a window" },
      { title: "Change into fresh clothes" },
      { title: "Do one 5-minute thing you've been avoiding", hint: "Set a timer. Stop when it rings." },
      { title: "Pick the next single thing", hint: "Not the whole day. Just the next one." },
    ],
  },
  {
    id: "winddown",
    title: "Wind down",
    when: "For the evening — to make tomorrow easier on you.",
    intro: "Let's set tomorrow up to be a little easier.",
    steps: [
      { title: "Put your phone on the charger across the room" },
      { title: "Set out clothes for tomorrow" },
      { title: "Tidy one thing" },
      { title: "Brush your teeth" },
      { title: "Lights low — get into bed" },
      { title: "Tomorrow, we just do the next small thing", hint: "That's the whole plan. Goodnight." },
    ],
  },
];

export const DEFAULT_STRUCTURE = "start";

export function structureById(id: string): Structure {
  return STRUCTURES.find((s) => s.id === id) ?? STRUCTURES[0];
}
