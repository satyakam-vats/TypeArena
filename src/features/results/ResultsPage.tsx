import { ArrowLeft, RotateCcw, Share2, Download, Play, Square } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { CompletedRun } from "../../types/typing";
import { normalizeSettings } from "../../types/typing";
import { KeyboardHeatmap } from "../heatmap/KeyboardHeatmap";
import { getAllTimeKeyStatsFromStorage } from "../../lib/storage/analyticsStorage";
import { shareShareCard, downloadShareCard } from "../../lib/shareCard";
import { TypingViewport } from "../../components/typing/TypingViewport";

function Chart({ run }: { run: CompletedRun }) {
  const samples = run.metrics.samples.length > 1
    ? run.metrics.samples
    : [{ elapsedMs: 0, wpm: 0, rawWpm: 0 }, { elapsedMs: run.metrics.durationMs, wpm: run.metrics.wpm, rawWpm: run.metrics.rawWpm }];
  const max = Math.max(...samples.map((sample) => sample.rawWpm), 10);
  const points = samples.map((sample, index) => `${(index / Math.max(samples.length - 1, 1)) * 100},${100 - sample.wpm / max * 82}`).join(" ");
  return (
    <div className="chart-shell">
      <div className="chart-labels"><span>WPM over time</span><span>{Math.round(run.metrics.durationMs / 1000)}s</span></div>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" role="img" aria-label="Words per minute over time line graph" className="w-full overflow-visible">
        <line x1="0" y1="100" x2="100" y2="100" className="chart-axis" />
        <line x1="0" y1="50" x2="100" y2="50" className="chart-grid" />
        <polyline points={points} className="chart-line" />
      </svg>
    </div>
  );
}

export function ResultsPage() {
  const navigate = useNavigate();
  const raw = sessionStorage.getItem("typearena-last-run");
  const run = raw ? JSON.parse(raw) as CompletedRun : null;

  const [heatmapMode, setHeatmapMode] = useState<"run" | "alltime">("run");
  const [isSharing, setIsSharing] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [replaying, setReplaying] = useState(false);
  const [replayIndex, setReplayIndex] = useState<number | null>(null);
  const replayRaf = useRef<number | null>(null);

  const handleShare = async () => {
    if (!run) return;
    setIsSharing(true);
    try { await shareShareCard(run); } finally { setIsSharing(false); }
  };

  const handleDownload = async () => {
    if (!run) return;
    setIsDownloading(true);
    try { await downloadShareCard(run); } finally { setIsDownloading(false); }
  };

  const stopReplay = () => {
    if (replayRaf.current != null) cancelAnimationFrame(replayRaf.current);
    replayRaf.current = null;
    setReplaying(false);
    setReplayIndex(null);
  };

  const startReplay = () => {
    if (!run?.ghostSamples?.length) return;
    stopReplay();
    setReplaying(true);
    const samples = run.ghostSamples;
    const t0 = performance.now();
    const duration = Math.max(samples[samples.length - 1]!.elapsedMs, 1);

    const tick = (now: number) => {
      const elapsed = now - t0;
      if (elapsed >= duration) {
        setReplayIndex(samples[samples.length - 1]!.charIndex);
        setReplaying(false);
        return;
      }
      let i = 0;
      while (i < samples.length && samples[i]!.elapsedMs <= elapsed) i++;
      if (i === 0) setReplayIndex(samples[0]!.charIndex);
      else if (i >= samples.length) setReplayIndex(samples[samples.length - 1]!.charIndex);
      else {
        const prev = samples[i - 1]!;
        const next = samples[i]!;
        const ratio = (elapsed - prev.elapsedMs) / Math.max(1, next.elapsedMs - prev.elapsedMs);
        setReplayIndex(Math.round(prev.charIndex + (next.charIndex - prev.charIndex) * ratio));
      }
      replayRaf.current = requestAnimationFrame(tick);
    };
    replayRaf.current = requestAnimationFrame(tick);
  };

  useEffect(() => () => { if (replayRaf.current != null) cancelAnimationFrame(replayRaf.current); }, []);

  useEffect(() => {
    let tabPressed = false;
    let tabTimer: number | undefined;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        navigate("/", { state: { repeat: true } });
        return;
      }
      if (e.key === "Tab") {
        e.preventDefault();
        tabPressed = true;
        window.clearTimeout(tabTimer);
        tabTimer = window.setTimeout(() => { tabPressed = false; }, 1200);
        return;
      }
      if (e.key === "Enter" && tabPressed) {
        e.preventDefault();
        tabPressed = false;
        navigate("/", { state: { repeat: false } });
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.clearTimeout(tabTimer);
    };
  }, [navigate]);

  if (!run) {
    return (
      <main className="center-page">
        <p>No completed test yet.</p>
        <Link className="primary-button" to="/">Start a test</Link>
      </main>
    );
  }

  const settings = normalizeSettings(run.settings);
  const repeatTest = () => navigate("/", { state: { repeat: true } });
  const nextTest = () => navigate("/", { state: { repeat: false } });
  const metrics = run.metrics;

  const allTimeStats = heatmapMode === "alltime" ? getAllTimeKeyStatsFromStorage() : null;
  const heatmapErrors = heatmapMode === "alltime" && allTimeStats ? allTimeStats.keyErrors : (metrics.keyErrors || {});
  const heatmapTotals = heatmapMode === "alltime" && allTimeStats ? allTimeStats.keyTotals : (metrics.keyTotals || {});

  const modeLabel = `${settings.mode}${settings.mode === "time" ? ` ${settings.value}s` : settings.mode === "words" ? ` ${settings.value}` : ""}`;

  return (
    <main className="mx-auto w-full max-w-4xl px-5 pb-12 pt-12 sm:px-8 sm:pt-20">
      <Link to="/" className="back-link"><ArrowLeft size={16} /> back to test</Link>
      <section className="result-hero">
        <p>test complete · {modeLabel}</p>
        <div className="result-main"><strong>{metrics.wpm}</strong><span>wpm</span></div>
        <div className="result-meta">
          <span>raw <b>{metrics.rawWpm}</b></span>
          <span>accuracy <b>{metrics.accuracy}%</b></span>
          <span>consistency <b>{metrics.consistency}%</b></span>
        </div>
      </section>
      <Chart run={run} />
      <section className="breakdown-grid" aria-label="Character breakdown">
        <div><span>correct</span><strong>{metrics.correct}</strong></div>
        <div><span>incorrect</span><strong>{metrics.incorrect}</strong></div>
        <div><span>extra</span><strong>{metrics.extra}</strong></div>
        <div><span>missed</span><strong>{metrics.missed}</strong></div>
      </section>

      {run.ghostSamples && run.ghostSamples.length > 1 && (
        <section className="replay-section">
          <div className="replay-header">
            <h2 className="results-section-title">replay</h2>
            <button
              type="button"
              className="share-btn"
              onClick={() => (replaying ? stopReplay() : startReplay())}
            >
              {replaying ? <><Square size={14} /> stop</> : <><Play size={14} /> watch replay</>}
            </button>
          </div>
          {(replaying || replayIndex != null) && (
            <TypingViewport
              target={run.targetText}
              typed={run.typedText}
              active
              focused
              smoothCaret
              caretStyle="block"
              replayIndex={replayIndex ?? 0}
            />
          )}
        </section>
      )}

      <section className="results-heatmap-section">
        <h2 className="results-section-title">keyboard heatmap</h2>
        <KeyboardHeatmap
          keyErrors={heatmapErrors}
          keyTotals={heatmapTotals}
          mode={heatmapMode}
          onModeChange={setHeatmapMode}
        />
      </section>

      <div className="share-row">
        <button onClick={handleShare} disabled={isSharing} className="share-btn">
          <Share2 size={14} /> {isSharing ? "generating..." : "share"}
        </button>
        <button onClick={handleDownload} disabled={isDownloading} className="share-btn">
          <Download size={14} /> {isDownloading ? "generating..." : "download"}
        </button>
      </div>

      <div className="mt-10 flex flex-col items-center gap-4">
        <div className="flex flex-wrap items-center justify-center gap-4">
          <button onClick={repeatTest} className="control hover:text-[var(--ink)] flex items-center gap-2 px-4 py-2 border border-[var(--line)] rounded">
            <RotateCcw size={16} /> repeat test <kbd className="text-xs text-[var(--muted)]">esc</kbd>
          </button>
          <button onClick={nextTest} autoFocus className="primary-button flex items-center gap-2 px-5 py-2">
            next test <kbd className="text-xs opacity-80">tab + enter</kbd>
          </button>
        </div>
      </div>
    </main>
  );
}
