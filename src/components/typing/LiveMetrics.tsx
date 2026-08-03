import { useMemo } from "react";
import type { RunMetrics } from "../../types/typing";
import { getAuraInfo } from "../../lib/typing/aura";

type LiveMetricsProps = {
  metrics: Pick<RunMetrics, "wpm" | "accuracy">;
  label?: string;
  comboCount?: number;
  comboMultiplier?: number;
};

export function LiveMetrics({
  metrics,
  label,
  comboCount = 0,
  comboMultiplier = 1,
}: LiveMetricsProps) {
  const aura = useMemo(() => getAuraInfo(comboCount), [comboCount]);
  // Show badge as soon as SPARK starts (combo ≥ 3) so feedback arrives early.
  const showCombo = comboCount >= 3 && aura.tier > 0;

  return (
    <div className="metric-strip items-center" aria-live="off">
      {showCombo && (
        <div
          className={`combo-badge aura-badge-${aura.tier} ${aura.tier >= 5 ? "fever-badge" : ""}`}
          title={`Streak: ${comboCount} · Tier: ${aura.label} · Multiplier: x${comboMultiplier}`}
        >
          <span className="combo-icon">{aura.icon}</span>
          <span className="combo-label">{aura.label}</span>
          <span className="combo-mult">x{comboMultiplier}</span>
          <span className="combo-count">{comboCount}×</span>
        </div>
      )}
      <div><span>{label ?? "wpm"}</span><strong>{metrics.wpm}</strong></div>
      <div><span>acc</span><strong>{Math.round(metrics.accuracy)}%</strong></div>
    </div>
  );
}
