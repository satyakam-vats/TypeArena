import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CompletedRun, TestSettings, WpmSample } from "../types/typing";
import { calculateMetrics } from "../lib/typing/metrics";
import { soundManager } from "../lib/sound";

function wordHasError(target: string, typed: string, spaceIdx: number): boolean {
  let start = spaceIdx - 1;
  while (start >= 0 && typed[start] !== " ") {
    start--;
  }
  start++;
  const wordTyped = typed.slice(start, spaceIdx);
  const wordTarget = target.slice(start, spaceIdx);
  return wordTyped !== wordTarget;
}

export function useTypingTest(
  targetText: string,
  settings: TestSettings,
  onComplete: (run: CompletedRun) => void,
  resetKey?: string,
  raceStartedAt?: number | null,
) {
  const [typedText, setTypedText] = useState("");
  const [status, setStatus] = useState<"ready" | "running" | "finished">("ready");
  const [elapsedMs, setElapsedMs] = useState(0);
  const [comboCount, setComboCount] = useState(0);

  const typedRef = useRef("");
  const targetRef = useRef(targetText);
  const settingsRef = useRef(settings);
  const statusRef = useRef<"ready" | "running" | "finished">("ready");
  const startedAt = useRef<number | null>(null);
  const samples = useRef<WpmSample[]>([]);
  const ghostSamples = useRef<{ elapsedMs: number; charIndex: number }[]>([]);
  const finishingRef = useRef(false);

  const lastKeyTime = useRef<number | null>(null);
  const maxComboRef = useRef(0);

  targetRef.current = targetText;
  settingsRef.current = settings;

  const totalKeystrokesRef = useRef(0);

  const comboMultiplier = useMemo(() => {
    if (comboCount >= 50) return 5;
    if (comboCount >= 30) return 4;
    if (comboCount >= 20) return 3;
    if (comboCount >= 10) return 2;
    return 1;
  }, [comboCount]);

  const finish = useCallback((typed?: string) => {
    if (statusRef.current === "finished" || finishingRef.current) return;
    finishingRef.current = true;
    const finalTyped = typed ?? typedRef.current;
    const durationMs = Math.max(1, Date.now() - (startedAt.current ?? Date.now()));
    const finalMetrics = calculateMetrics(
      targetRef.current,
      finalTyped,
      durationMs,
      samples.current,
      totalKeystrokesRef.current
    );
    finalMetrics.maxCombo = maxComboRef.current;

    const completed: CompletedRun = {
      id: crypto.randomUUID(),
      kind: raceStartedAt ? "race" : "solo",
      settings: settingsRef.current,
      targetText: targetRef.current,
      typedText: finalTyped,
      metrics: finalMetrics,
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
    setComboCount(0);
    maxComboRef.current = 0;
    totalKeystrokesRef.current = 0;
    lastKeyTime.current = null;
    samples.current = [];
    ghostSamples.current = [];
    startedAt.current = null;
  }, []);

  useEffect(() => {
    hardReset();
  }, [resetKey ?? targetText, hardReset]);

  useEffect(() => {
    if (status !== "running" || startedAt.current === null) return;
    const ticker = window.setInterval(() => {
      const elapsed = Date.now() - (startedAt.current ?? Date.now());
      setElapsedMs(elapsed);
      const point = calculateMetrics(
        targetRef.current,
        typedRef.current,
        Math.max(elapsed, 1000),
        samples.current,
        totalKeystrokesRef.current
      );
      const last = samples.current.at(-1);
      if (!last || elapsed - last.elapsedMs >= 900) {
        samples.current = [...samples.current, { elapsedMs: elapsed, wpm: point.wpm, rawWpm: point.rawWpm }];
      }
      const lastGhost = ghostSamples.current.at(-1);
      if (!lastGhost || elapsed - lastGhost.elapsedMs >= 200) {
        ghostSamples.current = [...ghostSamples.current, { elapsedMs: elapsed, charIndex: typedRef.current.length }];
      }

      if (lastKeyTime.current && Date.now() - lastKeyTime.current > 1800) {
        setComboCount(0);
      }

      const mode = settingsRef.current.mode;
      if (mode === "time" && elapsed >= settingsRef.current.value * 1000) {
        finish(typedRef.current);
      }
    }, 200);
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
    const now = Date.now();

    if ((conf === "on" || conf === "max") && nextValue.length < prev.length) {
      return;
    }

    if (conf === "max" && nextValue.length > prev.length + 1) {
      nextValue = prev + nextValue.slice(prev.length, prev.length + 1);
    }

    if (statusRef.current === "ready" && nextValue.length > 0) {
      startedAt.current = now;
      setStatus("running");
      statusRef.current = "running";
    }

    if (nextValue.length > prev.length) {
      let accepted = prev;
      const added = nextValue.slice(prev.length);
      totalKeystrokesRef.current += added.length;

      for (const ch of added) {
        const idx = accepted.length;
        const expected = target[idx];
        const correct = expected !== undefined && ch === expected;

        if (!correct) {
          soundManager.playError();
          setComboCount(0);

          if (diff === "master") {
            accepted += ch;
            typedRef.current = accepted;
            setTypedText(accepted);
            if (statusRef.current === "running") finish(accepted);
            return;
          }

          if (stop === "letter") {
            continue;
          }

          accepted += ch;
          if (ch === " " && (stop === "word" || diff === "expert")) {
            if (wordHasError(target, accepted, accepted.length - 1)) {
              continue;
            }
          }
          continue;
        }

        setComboCount((prevCombo) => {
          const nextCombo = prevCombo + 1;
          if (nextCombo > maxComboRef.current) {
            maxComboRef.current = nextCombo;
          }
          // Celebrate tier-ups: SPARK(3) · WARM(9) · FLOW(18) · BLAZE(30) · FEVER(50)
          if (nextCombo === 3 || nextCombo === 9 || nextCombo === 18 || nextCombo === 30) {
            soundManager.playTierUp(nextCombo);
          }
          if (nextCombo === 50) {
            soundManager.playFeverSound();
          }
          const mult = nextCombo >= 50 ? 5 : nextCombo >= 30 ? 4 : nextCombo >= 20 ? 3 : nextCombo >= 10 ? 2 : 1;
          soundManager.playKeystroke(mult);
          return nextCombo;
        });

        lastKeyTime.current = now;
        accepted += ch;

        if (ch === " " && (stop === "word" || diff === "expert")) {
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
        finish(accepted);
      }
      return;
    }

    setComboCount(0);
    typedRef.current = nextValue;
    setTypedText(nextValue);
  }, [finish]);

  const reset = useCallback(() => {
    hardReset();
  }, [hardReset]);

  const metrics = useMemo(() => {
    const computed = calculateMetrics(targetText, typedText, Math.max(elapsedMs, 1000), samples.current);
    computed.maxCombo = maxComboRef.current;
    return computed;
  }, [elapsedMs, targetText, typedText]);

  return {
    typedText,
    status,
    elapsedMs,
    metrics,
    comboCount,
    comboMultiplier,
    updateTypedText,
    finish,
    reset,
    ghostSamples: ghostSamples.current,
  };
}
