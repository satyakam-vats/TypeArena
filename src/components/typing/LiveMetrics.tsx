import type { RunMetrics } from "../../types/typing";

export function LiveMetrics({ metrics, label }: { metrics: Pick<RunMetrics, "wpm" | "accuracy">; label?: string }) {
  return <div className="metric-strip" aria-live="polite">
    <div><span>{label ?? "wpm"}</span><strong>{metrics.wpm}</strong></div>
    <div><span>acc</span><strong>{Math.round(metrics.accuracy)}%</strong></div>
  </div>;
}
