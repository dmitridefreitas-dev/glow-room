import { Shield, Medal, Award, Gem, Crown } from "lucide-react";
import type { Tier, TierIcon } from "@/lib/points";

const ICONS: Record<TierIcon, typeof Shield> = {
  shield: Shield,
  medal: Medal,
  award: Award,
  gem: Gem,
  crown: Crown,
};

// Tier-aware intensity (R8): every tier shines; top tiers shine faster/brighter.
const BRIGHT_TIERS = new Set(["diamond", "champion"]);

const HEX_CLIP =
  "polygon(50% 3%, 91% 26.5%, 91% 73.5%, 50% 97%, 9% 73.5%, 9% 26.5%)";

/** A hexagonal metal/gem emblem for a tier (graphic, not a word). */
export function TierEmblem({
  tier,
  size = 64,
  dim = false,
  animated = false,
}: {
  tier: Tier;
  size?: number;
  dim?: boolean;
  animated?: boolean;
}) {
  const Icon = ICONS[tier.icon];
  const gid = `tier-${tier.key}`;
  const live = animated && !dim;
  const showSheen = live;

  return (
    <span
      style={{ width: size, height: size }}
      className="relative inline-flex flex-none items-center justify-center"
    >
      {/* Breathing aura in the tier's own colour, behind the emblem */}
      {live && (
        <span
          aria-hidden
          className="tier-glow pointer-events-none absolute rounded-full"
          style={{
            inset: `${-Math.round(size * 0.07)}px`,
            background: `radial-gradient(closest-side, ${tier.from}, transparent)`,
          }}
        />
      )}

      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        className={`relative ${dim ? "opacity-40 grayscale" : ""}`}
      >
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={tier.from} />
            <stop offset="100%" stopColor={tier.to} />
          </linearGradient>
        </defs>
        <polygon
          points="50,3 91,26.5 91,73.5 50,97 9,73.5 9,26.5"
          fill={`url(#${gid})`}
          stroke="rgba(255,255,255,0.55)"
          strokeWidth="3"
        />
      </svg>

      {/* Light sheen sweeping across the face, clipped to the hexagon */}
      {showSheen && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 overflow-hidden"
          style={{ clipPath: HEX_CLIP }}
        >
          <span
            className={`absolute inset-y-0 ${
              BRIGHT_TIERS.has(tier.key) ? "tier-sheen-fast" : "tier-sheen"
            }`}
            style={{
              width: "55%",
              background:
                "linear-gradient(100deg, transparent, rgba(255,255,255,0.9), transparent)",
            }}
          />
        </span>
      )}

      <span className="absolute inset-0 flex items-center justify-center">
        <Icon
          size={Math.round(size * 0.4)}
          color="#fff"
          strokeWidth={2.2}
          className={dim ? "opacity-60" : ""}
        />
      </span>
    </span>
  );
}

/** Emblem + tier name stacked. */
export function TierBadge({ tier, size = 56 }: { tier: Tier; size?: number }) {
  return (
    <span className="inline-flex flex-col items-center gap-1">
      <TierEmblem tier={tier} size={size} />
      <span className="text-xs font-bold uppercase tracking-wide text-spruce">
        {tier.label}
      </span>
    </span>
  );
}
