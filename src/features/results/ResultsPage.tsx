import { ArrowLeft, RotateCcw } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { CompletedRun } from "../../types/typing";
import { KeyboardHeatmap } from "../heatmap/KeyboardHeatmap";
import { getAllTimeKeyStatsFromStorage } from "../../lib/storage/analyticsStorage";

function Chart({ run }: { run: CompletedRun }) {
  const samples = run.metrics.samples.length > 1 ? run.metrics.samples : [{ elapsedMs: 0, wpm: 0, rawWpm: 0 }, { elapsedMs: run.metrics.durationMs, wpm: run.metrics.wpm, rawWpm: run.metrics.rawWpm }];
  const max = Math.max(...samples.map((sample) => sample.rawWpm), 10);
  const points = samples.map((sample, index) => `${(index / Math.max(samples.length - 1, 1)) * 100},${100 - sample.wpm / max * 82}`).join(" ");
  return <div className="chart-shell">
    <div className="chart-labels"><span>WPM over time</span><span>{Math.round(run.metrics.durationMs / 1000)}s</span></div>
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" role="img" aria-label="Words per minute over time line graph" className="w-full overflow-visible">
      <line x1="0" y1="100" x2="100" y2="100" className="chart-axis" />
      <line x1="0" y1="50" x2="100" y2="50" className="chart-grid" />
      <polyline points={points} className="chart-line" />
    </svg>
  </div>;
}

export function ResultsPage() {
  const navigate = useNavigate();
  const raw = sessionStorage.getItem("typearena-last-run");
  const run = raw ? JSON.parse(raw) as CompletedRun : null;

  const [heatmapMode, setHeatmapMode] = useState<'run' | 'alltime'>('run');

  if (!run) return <main className="center-page"><p>No completed test yet.</p><Link className="primary-button" to="/">Start a test</Link></main>;

  const restart = () => navigate("/");
  const metrics = run.metrics;

  const allTimeStats = heatmapMode === 'alltime' ? getAllTimeKeyStatsFromStorage() : null;
  const heatmapErrors = heatmapMode === 'alltime' && allTimeStats ? allTimeStats.keyErrors : (metrics.keyErrors || {});
  const heatmapTotals = heatmapMode === 'alltime' && allTimeStats ? allTimeStats.keyTotals : (metrics.keyTotals || {});

  return <main className="mx-auto w-full max-w-4xl px-5 pb-12 pt-12 sm:px-8 sm:pt-20">
    <Link to="/" className="back-link"><ArrowLeft size={16} /> back to test</Link>
    <section className="result-hero">
      <p>test complete</p>
      <div className="result-main"><strong>{metrics.wpm}</strong><span>wpm</span></div>
      <div className="result-meta"><span>raw <b>{metrics.rawWpm}</b></span><span>accuracy <b>{metrics.accuracy}%</b></span><span>consistency <b>{metrics.consistency}%</b></span></div>
    </section>
    <Chart run={run} />
    <section className="breakdown-grid" aria-label="Character breakdown">
      <div><span>correct</span><strong>{metrics.correct}</strong></div>
      <div><span>incorrect</span><strong>{metrics.incorrect}</strong></div>
      <div><span>extra</span><strong>{metrics.extra}</strong></div>
      <div><span>missed</span><strong>{metrics.missed}</strong></div>
    </section>

    {/* Keyboard Heatmap */}
    <section className="results-heatmap-section">
      <h2 className="results-section-title">keyboard heatmap</h2>
      <KeyboardHeatmap
        keyErrors={heatmapErrors}
        keyTotals={heatmapTotals}
        mode={heatmapMode}
        onModeChange={setHeatmapMode}
      />
    </section>

    <div className="mt-10 flex justify-center"><button onClick={restart} className="primary-button"><RotateCcw size={16} /> restart same settings</button></div>
  </main>;
}
