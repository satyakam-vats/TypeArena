import type { RunMetrics } from "../../types/typing";

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
  return (
    <div className="metric-strip items-center" aria-live="polite">
      {comboCount >= 5 && (
        <div className={`combo-badge ${comboMultiplier >= 5 ? "fever-badge" : ""}`}>
          <span className="combo-count">{comboCount}x</span>
          <span className="combo-multiplier">{comboMultiplier >= 5 ? "FEVER 🔥" : `x${comboMultiplier}`}</span>
        </div>
      )}
      <div><span>{label ?? "wpm"}</span><strong>{metrics.wpm}</strong></div>
      <div><span>acc</span><strong>{Math.round(metrics.accuracy)}%</strong></div>
    </div>
  );
}
