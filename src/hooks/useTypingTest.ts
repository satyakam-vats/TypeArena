import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { calculateMetrics } from "../lib/typing/metrics";
import type { CompletedRun, TestSettings, WpmSample } from "../types/typing";
import { soundManager } from "../lib/sound";

type TestStatus = "ready" | "running" | "finished";

function wordHasError(target: string, typed: string, upToExclusive: number): boolean {
  // Check the word ending at upToExclusive (space index or end).
  const before = typed.slice(0, upToExclusive);
  const wordStart = before.lastIndexOf(" ") + 1;
  const tWord = target.slice(wordStart, upToExclusive);
  const yWord = typed.slice(wordStart, upToExclusive);
  if (yWord.length !== tWord.length) return true;
  for (let i = 0; i < tWord.length; i++) {
    if (tWord[i] !== yWord[i]) return true;
  }
  return false;
}

/**
 * @param resetKey — change this to fully reset the test. Growing `targetText` alone does not reset.
 */
export function useTypingTest(
  targetText: string,
  settings: TestSettings,
  onComplete: (run: CompletedRun) => void,
  raceStartedAt?: number,
  resetKey?: string | number,
) {
  const [typedText, setTypedText] = useState("");
  const [status, setStatus] = useState<TestStatus>("ready");
  const [elapsedMs, setElapsedMs] = useState(0);
  const startedAt = useRef<number | null>(null);
  const samples = useRef<WpmSample[]>([]);
  const ghostSamples = useRef<{ elapsedMs: number; charIndex: number }[]>([]);
  const statusRef = useRef<TestStatus>("ready");
  const typedRef = useRef("");
  const targetRef = useRef(targetText);
  const settingsRef = useRef(settings);
  const finishingRef = useRef(false);

  statusRef.current = status;
  typedRef.current = typedText;
  targetRef.current = targetText;
  settingsRef.current = settings;

  const finish = useCallback((typed = typedRef.current) => {
    if (finishingRef.current || statusRef.current === "finished" || startedAt.current === null) return;
    finishingRef.current = true;
    const durationMs = Math.max(1, Date.now() - startedAt.current);
    const completed: CompletedRun = {
      id: crypto.randomUUID(),
      kind: raceStartedAt ? "race" : "solo",
      settings: settingsRef.current,
      targetText: targetRef.current,
      typedText: typed,
      metrics: calculateMetrics(targetRef.current, typed, durationMs, samples.current),
      completedAt: Date.now(),
      ghostSamples: ghostSamples.current,
    };
    setStatus("finished");
    statusRef.current = "finished";
    soundManager.playComplete();
    onComplete(completed);
  }, [onComplete, raceStartedAt]);

  const hardReset = useCallback(() => {
    finishingRef.current = false;
    setTypedText("");
    typedRef.current = "";
    setStatus("ready");
    statusRef.current = "ready";
    setElapsedMs(0);
    samples.current = [];
    ghostSamples.current = [];
    startedAt.current = null;
  }, []);

  // Full reset only when resetKey changes (or targetText if no resetKey — race fallback).
  useEffect(() => {
    hardReset();
  }, [resetKey ?? targetText, hardReset]);

  useEffect(() => {
    if (status !== "running" || startedAt.current === null) return;
    const ticker = window.setInterval(() => {
      const elapsed = Date.now() - (startedAt.current ?? Date.now());
      setElapsedMs(elapsed);
      const point = calculateMetrics(targetRef.current, typedRef.current, Math.max(elapsed, 1000), samples.current);
      const last = samples.current.at(-1);
      if (!last || elapsed - last.elapsedMs >= 900) {
        samples.current = [...samples.current, { elapsedMs: elapsed, wpm: point.wpm, rawWpm: point.rawWpm }];
      }
      const lastGhost = ghostSamples.current.at(-1);
      if (!lastGhost || elapsed - lastGhost.elapsedMs >= 200) {
        ghostSamples.current = [...ghostSamples.current, { elapsedMs: elapsed, charIndex: typedRef.current.length }];
      }
      const mode = settingsRef.current.mode;
      if (mode === "time" && elapsed >= settingsRef.current.value * 1000) {
        finish(typedRef.current);
      }
    }, 80);
    return () => window.clearInterval(ticker);
  }, [finish, status]);

  useEffect(() => {
    if (raceStartedAt && status === "ready") {
      startedAt.current = raceStartedAt;
      setStatus("running");
      statusRef.current = "running";
    }
  }, [raceStartedAt, status]);

  const updateTypedText = useCallback((nextValue: string) => {
    if (statusRef.current === "finished" || finishingRef.current) return;

    const conf = settingsRef.current.confidence;
    const stop = settingsRef.current.stopOnError;
    const diff = settingsRef.current.difficulty;
    const mode = settingsRef.current.mode;
    const target = targetRef.current;
    const prev = typedRef.current;

    // Confidence: block backspace
    if ((conf === "on" || conf === "max") && nextValue.length < prev.length) {
      return;
    }

    // Max confidence: only allow advancing by at most one char (no jumps)
    if (conf === "max" && nextValue.length > prev.length + 1) {
      nextValue = prev + nextValue.slice(prev.length, prev.length + 1);
    }

    if (statusRef.current === "ready" && nextValue.length > 0) {
      startedAt.current = Date.now();
      setStatus("running");
      statusRef.current = "running";
    }

    if (nextValue.length > prev.length) {
      let accepted = prev;
      const added = nextValue.slice(prev.length);

      for (const ch of added) {
        const idx = accepted.length;
        const expected = target[idx];
        const correct = expected !== undefined && ch === expected;

        if (!correct) {
          soundManager.playError();

          if (stop === "letter" || diff === "master") {
            accepted += ch;
            typedRef.current = accepted;
            setTypedText(accepted);
            if (statusRef.current === "running") finish(accepted);
            return;
          }

          // Expert: wrong chars allowed inside word; fail when committing with space
          accepted += ch;
          if (ch === " " && (stop === "word" || diff === "expert")) {
            if (wordHasError(target, accepted, accepted.length - 1)) {
              typedRef.current = accepted;
              setTypedText(accepted);
              if (statusRef.current === "running") finish(accepted);
              return;
            }
          }
          continue;
        }

        soundManager.playKeystroke();
        accepted += ch;

        if (ch === " " && (stop === "word" || diff === "expert")) {
          // Space is correct — still check previous word body for latent errors
          if (wordHasError(target, accepted, accepted.length - 1)) {
            typedRef.current = accepted;
            setTypedText(accepted);
            if (statusRef.current === "running") finish(accepted);
            return;
          }
        }
      }

      typedRef.current = accepted;
      setTypedText(accepted);

      if (
        (mode === "words" || mode === "quote" || mode === "custom") &&
        accepted.length >= target.length &&
        target.length > 0
      ) {
        window.setTimeout(() => finish(accepted), 0);
      }
      return;
    }

    // Backspace / shorten
    typedRef.current = nextValue;
    setTypedText(nextValue);
  }, [finish]);

  const reset = useCallback(() => {
    hardReset();
  }, [hardReset]);

  const metrics = useMemo(
    () => calculateMetrics(targetText, typedText, Math.max(elapsedMs, 1000), samples.current),
    [elapsedMs, targetText, typedText],
  );

  return {
    typedText,
    status,
    elapsedMs,
    metrics,
    updateTypedText,
    finish,
    reset,
    ghostSamples: ghostSamples.current,
  };
}
