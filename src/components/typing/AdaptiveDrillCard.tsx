import { Link } from "react-router-dom";
import { Target, ArrowRight, X } from "lucide-react";
import type { AdaptiveDrillRecommendation } from "../../lib/typing/practiceTextGen";

type Props = {
  recommendation: AdaptiveDrillRecommendation;
  /** Compact inline banner (solo page) vs full card (results). */
  variant?: "banner" | "card";
  /** Optional dismiss for non-practice pages. */
  onDismiss?: () => void;
  className?: string;
};

function rateClass(rate: number): string {
  if (rate < 0.08) return "rate-green";
  if (rate < 0.16) return "rate-yellow";
  if (rate < 0.28) return "rate-orange";
  return "rate-red";
}

function keyLabel(key: string): string {
  return key === " " || key === "space" ? "␣" : key.toUpperCase();
}

export function AdaptiveDrillCard({
  recommendation,
  variant = "card",
  onDismiss,
  className = "",
}: Props) {
  const { weakKeys, summary, hasEnoughData } = recommendation;
  if (!hasEnoughData && weakKeys.length === 0) return null;
  if (weakKeys.length === 0) return null;

  return (
    <div
      className={`adaptive-drill ${variant === "banner" ? "adaptive-drill-banner" : "adaptive-drill-card"} ${className}`}
      role="region"
      aria-label="Recommended adaptive practice"
    >
      <div className="adaptive-drill-main">
        <div className="adaptive-drill-heading">
          <Target size={14} aria-hidden />
          <span>recommended practice</span>
        </div>
        <p className="adaptive-drill-summary">{summary}</p>
        <div className="practice-weak-keys-list">
          {weakKeys.map((wk) => (
            <div
              key={wk.key}
              className="weak-key-chip"
              title={`${(wk.errorRate * 100).toFixed(1)}% recent error rate · ${Math.round(wk.presses)} samples`}
            >
              <span className="weak-key-cap">{keyLabel(wk.key)}</span>
              <span className={`weak-key-rate-pill ${rateClass(wk.errorRate)}`}>
                {(wk.errorRate * 100).toFixed(0)}%
              </span>
            </div>
          ))}
        </div>
      </div>
      <div className="adaptive-drill-actions">
        <Link to="/practice" className="adaptive-drill-cta">
          start drill <ArrowRight size={14} aria-hidden />
        </Link>
        {onDismiss && (
          <button
            type="button"
            className="adaptive-drill-dismiss"
            onClick={onDismiss}
            title="Dismiss recommendation"
            aria-label="Dismiss recommendation"
          >
            <X size={14} />
          </button>
        )}
      </div>
    </div>
  );
}
