/* ───────────────────────────────────────────────────────────────────
 *  TypeArena – AI Coach Card
 *  Renders post-test insights from the local analysis engine.
 *  Zero API calls, zero cost, runs instantly.
 * ─────────────────────────────────────────────────────────────────── */

import { useMemo, useState } from "react";
import { Brain, ChevronDown, ChevronUp, Sparkles } from "lucide-react";
import type { CompletedRun } from "../../types/typing";
import { analyzeRun } from "../../lib/ai/coachEngine";
import type { CoachInsight } from "../../lib/ai/types";

type CoachCardProps = {
  run: CompletedRun;
  className?: string;
};

function InsightRow({ insight, defaultOpen }: { insight: CoachInsight; defaultOpen: boolean }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="coach-insight" data-priority={insight.priority}>
      <button
        type="button"
        className="coach-insight-header"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span className="coach-insight-emoji">{insight.emoji}</span>
        <span className="coach-insight-title">{insight.title}</span>
        <span className="coach-insight-tag">{insight.category}</span>
        {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>
      {open && (
        <div className="coach-insight-body">
          <p className="coach-insight-detail">{insight.detail}</p>
          <p className="coach-insight-action">
            <Sparkles size={12} />
            {insight.actionable}
          </p>
        </div>
      )}
    </div>
  );
}

export function CoachCard({ run, className }: CoachCardProps) {
  const analysis = useMemo(() => analyzeRun(run), [run]);

  if (analysis.insights.length === 0) return null;

  return (
    <section className={`coach-card ${className ?? ""}`}>
      <div className="coach-card-header">
        <div className="coach-card-title">
          <Brain size={16} />
          <span>AI Coach</span>
        </div>
        <span className="coach-card-focus">Focus: {analysis.focusArea}</span>
      </div>

      <div className="coach-insights-list">
        {analysis.insights.map((insight, i) => (
          <InsightRow key={i} insight={insight} defaultOpen={i === 0} />
        ))}
      </div>

      <div className="coach-encouragement">
        {analysis.encouragement}
      </div>
    </section>
  );
}
