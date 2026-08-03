/**
 * Combo → aura tier mapping.
 * Aura kicks in early (tier 1 at 3 correct keys) and escalates as the streak holds.
 */
export type AuraTier = 0 | 1 | 2 | 3 | 4 | 5;

export type AuraInfo = {
  tier: AuraTier;
  /** Short label for the combo badge */
  label: string;
  /** Icon symbol representing tier */
  icon: string;
  /** CSS class on the aura shell */
  className: string;
  /** Minimum combo for current tier */
  currentMin: number;
  /** Target combo for next tier */
  nextMin: number;
};

const TIERS: { min: number; tier: AuraTier; label: string; icon: string; nextMin: number }[] = [
  { min: 50, tier: 5, label: "FEVER", icon: "👑", nextMin: 50 },
  { min: 30, tier: 4, label: "BLAZE", icon: "💥", nextMin: 50 },
  { min: 18, tier: 3, label: "FLOW", icon: "🔮", nextMin: 30 },
  { min: 9, tier: 2, label: "WARM", icon: "🔥", nextMin: 18 },
  { min: 3, tier: 1, label: "SPARK", icon: "⚡", nextMin: 9 },
];

export function getAuraTier(comboCount: number): AuraTier {
  for (const t of TIERS) {
    if (comboCount >= t.min) return t.tier;
  }
  return 0;
}

export function getAuraInfo(comboCount: number): AuraInfo {
  const tier = getAuraTier(comboCount);
  const found = TIERS.find((t) => t.tier === tier);
  return {
    tier,
    label: found?.label ?? "",
    icon: found?.icon ?? "",
    className: tier > 0 ? `aura-tier-${tier}` : "",
    currentMin: found?.min ?? 0,
    nextMin: found?.nextMin ?? 3,
  };
}

/** Progress 0–1 within the current tier toward the next (for subtle continuous growth). */
export function getAuraProgress(comboCount: number): number {
  const thresholds = [0, 3, 9, 18, 30, 50, 80];
  const tier = getAuraTier(comboCount);
  const lo = thresholds[tier] ?? 0;
  const hi = thresholds[tier + 1] ?? lo + 30;
  if (hi <= lo) return 1;
  return Math.min(1, Math.max(0, (comboCount - lo) / (hi - lo)));
}
