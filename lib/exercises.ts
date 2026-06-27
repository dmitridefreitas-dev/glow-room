// Guided practice definitions — short, interactive CBT-informed exercises that run
// through the generic engine (components/practice/GuidedExercise.tsx). Data-driven
// on purpose: new practices (including AI-generated ones later) are just new entries.
// CBT-informed self-help, NOT therapy.

export type ExStep =
  | { type: "text"; key: string; title: string; hint?: string; placeholder?: string }
  | { type: "choice"; key: string; title: string; hint?: string; options: { key: string; label: string }[] }
  | { type: "chips"; key: string; title: string; hint?: string; options: { key: string; label: string; blurb?: string }[] };

export type Exercise = {
  id: string;
  eyebrow: string;
  steps: ExStep[];
  close: { title: string; body: string };
};

export const EXERCISES: Record<string, Exercise> = {
  worry: {
    id: "worry",
    eyebrow: "Untangle a worry",
    steps: [
      { type: "text", key: "worry", title: "What's the worry?", hint: "Name it plainly. Worries shrink the moment you write them down.", placeholder: "e.g. I'm going to fail this semester." },
      { type: "text", key: "worst", title: "What's the worst that could happen?", hint: "Say the scary version out loud. It's usually less solid on paper." },
      { type: "text", key: "likely", title: "And what's most likely to actually happen?", hint: "Be honest — it's almost always less dramatic than the worst case." },
      { type: "text", key: "cope", title: "If the worst did happen — how would you cope?", hint: "You've survived hard things before. You'd handle this too." },
      {
        type: "choice",
        key: "kind",
        title: "Is this something you can act on, or a what-if?",
        options: [
          { key: "act", label: "There's a small step I could take" },
          { key: "whatif", label: "It's a what-if — not a now-problem" },
        ],
      },
      { type: "text", key: "step", title: "One small step — or one thing to set down", hint: "If you can act: the next tiny move. If it's a what-if: name what you're choosing to put down for tonight.", placeholder: "e.g. Email my professor in the morning." },
    ],
    close: {
      title: "You untangled it.",
      body: "A worry feels huge until you lay it out — worst case, likely case, and the fact that you'd cope. You just did all three. That's the skill.",
    },
  },

  wins: {
    id: "wins",
    eyebrow: "Three good things",
    steps: [
      { type: "text", key: "a", title: "One good thing from today", hint: "Tiny counts. A coffee. A text back. You got up.", placeholder: "e.g. I made my bed." },
      { type: "text", key: "b", title: "A second good thing", placeholder: "e.g. Someone made me laugh." },
      { type: "text", key: "c", title: "A third — and your part in it", hint: "What did you do that helped it happen? Even a little.", placeholder: "e.g. I texted back instead of hiding." },
    ],
    close: {
      title: "Three. That's a day's evidence.",
      body: "Your brain logs the bad on its own. This is how you train it to notice the good too — and you just gave it three.",
    },
  },

  kinder: {
    id: "kinder",
    eyebrow: "Be kinder to yourself",
    steps: [
      { type: "text", key: "hard", title: "What are you being hard on yourself about?", hint: "The thing you keep replaying.", placeholder: "e.g. I wasted the whole day again." },
      { type: "text", key: "friend", title: "What would you say to a friend who told you that?", hint: "You'd never talk to them the way you talk to yourself." },
      {
        type: "choice",
        key: "human",
        title: "Can you let this be human?",
        hint: "Struggling doesn't make you broken. It makes you a person.",
        options: [
          { key: "yes", label: "Yeah — I'm allowed to be human" },
          { key: "try", label: "I'll try to believe that" },
        ],
      },
      { type: "text", key: "kind", title: "Now say the kind version to yourself", hint: "In your own words. The thing you needed to hear today.", placeholder: "e.g. I'm having a hard time, and I'm still trying. That counts." },
    ],
    close: {
      title: "That's the voice to keep.",
      body: "How you talk to yourself becomes the room you live in. You just made it a little warmer.",
    },
  },
};
