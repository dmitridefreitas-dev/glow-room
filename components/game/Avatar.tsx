// The player avatar — a friendly "glow sprite" that visibly levels up.
//
// This is the signature game mechanic: the character starts dull and small-aura
// at low stages and becomes radiant, sprouting and sparkling, as the member
// progresses through the 30 days. Pure SVG, so it scales crisply, animates with
// CSS, and costs zero generation credits.
//
// `stage` 0–5 maps to the six tiers / level bands. Derive it from level or tier
// where you render it (see `stageFromLevel`).

type AvatarProps = {
  stage?: number;
  size?: number;
  className?: string;
  /** Idle bob — on by default; turn off for static contexts (share images). */
  float?: boolean;
};

const STAGES = [
  { body: "#cdbfa6", deep: "#a8987c", aura: "#e3ddd0", glow: 0.12, sprout: 0.7, sparkle: 0 },
  { body: "#e7c9a0", deep: "#cf9f6e", aura: "#f8edd6", glow: 0.22, sprout: 0.85, sparkle: 0 },
  { body: "#f0b884", deep: "#dd8a55", aura: "#f6d9a0", glow: 0.32, sprout: 1.0, sparkle: 1 },
  { body: "#f3a766", deep: "#d6694a", aura: "#f1c27a", glow: 0.44, sprout: 1.1, sparkle: 2 },
  { body: "#f59455", deep: "#c94f36", aura: "#e6ad4a", glow: 0.56, sprout: 1.2, sparkle: 3 },
  { body: "#ffb066", deep: "#e2785a", aura: "#ffd479", glow: 0.72, sprout: 1.35, sparkle: 4 },
];

const SPARKS: [number, number][] = [
  [18, 26],
  [82, 30],
  [22, 82],
  [80, 80],
];

/** Map a 1-based player level to an avatar evolution stage (0–5). */
export function stageFromLevel(level: number): number {
  return Math.max(0, Math.min(5, Math.floor((level - 1) / 2)));
}

export function Avatar({ stage = 5, size = 120, className = "", float = true }: AvatarProps) {
  const s = STAGES[Math.max(0, Math.min(STAGES.length - 1, Math.round(stage)))];
  return (
    <div
      className={`relative inline-block ${float ? "anim-float" : ""} ${className}`}
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 100 100" width={size} height={size} role="img" aria-label="Your glow avatar">
        <defs>
          <filter id="glowBlur" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="6" />
          </filter>
          <radialGradient id="bodyGrad" cx="50%" cy="36%" r="68%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.55" />
            <stop offset="42%" stopColor={s.body} />
            <stop offset="100%" stopColor={s.deep} />
          </radialGradient>
        </defs>

        {/* aura */}
        <circle cx="50" cy="55" r="42" fill={s.aura} opacity={s.glow} filter="url(#glowBlur)" />

        {/* sprout on top — grows with the glow up */}
        <g transform={`translate(50 28) scale(${s.sprout}) translate(-50 -28)`}>
          <path d="M50 30 C 50 19, 57 13, 65 13 C 65 22, 57 28, 50 30 Z" fill="#6ca77f" />
          <path d="M50 30 C 50 20, 43 15, 36 15 C 36 24, 43 29, 50 30 Z" fill="#7fb890" />
          <rect x="48.6" y="25" width="2.8" height="9" rx="1.4" fill="#4f7d60" />
        </g>

        {/* body */}
        <circle cx="50" cy="56" r="30" fill="url(#bodyGrad)" />
        <ellipse cx="50" cy="82" rx="20" ry="4.5" fill="#000000" opacity="0.06" />

        {/* cheeks */}
        <circle cx="37" cy="61" r="4.5" fill="#e2785a" opacity="0.45" />
        <circle cx="63" cy="61" r="4.5" fill="#e2785a" opacity="0.45" />

        {/* eyes */}
        <circle cx="41" cy="53" r="3.4" fill="#22302c" />
        <circle cx="59" cy="53" r="3.4" fill="#22302c" />
        <circle cx="42.2" cy="51.8" r="1" fill="#ffffff" />
        <circle cx="60.2" cy="51.8" r="1" fill="#ffffff" />

        {/* smile */}
        <path d="M42 62 Q 50 69 58 62" fill="none" stroke="#22302c" strokeWidth="2.4" strokeLinecap="round" />

        {/* sparkles at higher stages */}
        {SPARKS.slice(0, s.sparkle).map(([x, y], i) => (
          <path
            key={i}
            d={`M${x} ${y - 4} L ${x + 1.3} ${y - 1.3} L ${x + 4} ${y} L ${x + 1.3} ${y + 1.3} L ${x} ${y + 4} L ${x - 1.3} ${y + 1.3} L ${x - 4} ${y} L ${x - 1.3} ${y - 1.3} Z`}
            fill="#e0a23c"
          />
        ))}
      </svg>
    </div>
  );
}
