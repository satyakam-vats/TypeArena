import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { calculateMetrics, liveMetrics } from "../lib/typing/metrics";
import type { CompletedRun, TestSettings, WpmSample } from "../types/typing";

type TestStatus = "ready" | "running" | "finished";

export function useTypingTest(targetText: string, settings: TestSettings, onComplete: (run: CompletedRun) => void, raceStartedAt?: number) {
  const [typedText, setTypedText] = useState("");
  const [status, setStatus] = useState<TestStatus>("ready");
  const [elapsedMs, setElapsedMs] = useState(0);
  const startedAt = useRef<number | null>(null);
  const samples = useRef<WpmSample[]>([]);

  const finish = useCallback((typed = typedText) => {
    if (status === "finished" || startedAt.current === null) return;
    const durationMs = Math.max(1, Date.now() - startedAt.current);
    const completed: CompletedRun = {
      id: crypto.randomUUID(),
      kind: "solo",
      settings,
      targetText,
      typedText: typed,
      metrics: calculateMetrics(targetText, typed, durationMs, samples.current),
      completedAt: Date.now(),
    };
    setStatus("finished");
    onComplete(completed);
  }, [onComplete, settings, status, targetText, typedText]);

  useEffect(() => {
    if (status !== "running" || startedAt.current === null) return;
    const ticker = window.setInterval(() => {
      const elapsed = Date.now() - (startedAt.current ?? Date.now());
      setElapsedMs(elapsed);
      if (elapsed % 1000 < 85) {
        const point = liveMetrics(targetText, typedText, elapsed);
        const last = samples.current.at(-1);
        if (!last || elapsed - last.elapsedMs >= 900) {
          samples.current = [...samples.current, { elapsedMs: elapsed, wpm: point.wpm, rawWpm: point.rawWpm }];
        }
      }
      if (settings.mode === "time" && elapsed >= settings.value * 1000) finish();
    }, 80);
    return () => window.clearInterval(ticker);
  }, [finish, settings, status, targetText, typedText]);

  useEffect(() => {
    setTypedText("");
    setStatus("ready");
    setElapsedMs(0);
    samples.current = [];
    startedAt.current = null;
  }, [targetText]);

  useEffect(() => {
    if (raceStartedAt && status === "ready") {
      startedAt.current = raceStartedAt;
      setStatus("running");
    }
  }, [raceStartedAt, status]);

  const updateTypedText = useCallback((nextValue: string) => {
    if (status === "finished") return;
    if (status === "ready" && nextValue.length > 0) {
      startedAt.current = Date.now();
      setStatus("running");
    }
    setTypedText(nextValue);
    if (settings.mode === "words" && nextValue.length >= targetText.length) {
      window.setTimeout(() => finish(nextValue), 0);
    }
  }, [finish, settings.mode, status, targetText.length]);

  const metrics = useMemo(() => liveMetrics(targetText, typedText, elapsedMs), [elapsedMs, targetText, typedText]);
  return { typedText, status, elapsedMs, metrics, updateTypedText, finish };
}
