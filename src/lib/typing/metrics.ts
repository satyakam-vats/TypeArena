import type { CharacterCounts, RunMetrics, WpmSample } from "../../types/typing";

export type CharacterState = "correct" | "incorrect" | "pending" | "extra";

export function countCharacters(target: string, typed: string): CharacterCounts {
  let correct = 0;
  let incorrect = 0;
  for (let index = 0; index < Math.min(target.length, typed.length); index += 1) {
    if (target[index] === typed[index]) correct += 1;
    else incorrect += 1;
  }
  return {
    correct,
    incorrect,
    extra: Math.max(0, typed.length - target.length),
    missed: Math.max(0, target.length - typed.length),
  };
}

export function getCharacterStates(target: string, typed: string): CharacterState[] {
  return Array.from({ length: target.length }, (_, index) => {
    if (index >= typed.length) return "pending";
    return target[index] === typed[index] ? "correct" : "incorrect";
  });
}

export function calculateKeyStats(target: string, typed: string) {
  const keyErrors: Record<string, number> = {};
  const keyTotals: Record<string, number> = {};

  const minLength = Math.min(target.length, typed.length);
  for (let i = 0; i < minLength; i += 1) {
    const targetChar = target[i].toLowerCase();
    const typedChar = typed[i].toLowerCase();
    const key = targetChar === " " ? "space" : targetChar;
    keyTotals[key] = (keyTotals[key] || 0) + 1;
    if (typedChar !== targetChar) {
      keyErrors[key] = (keyErrors[key] || 0) + 1;
    }
  }

  if (typed.length > target.length) {
    for (let i = target.length; i < typed.length; i += 1) {
      const extraChar = typed[i].toLowerCase();
      const key = extraChar === " " ? "space" : extraChar;
      keyTotals[key] = (keyTotals[key] || 0) + 1;
      keyErrors[key] = (keyErrors[key] || 0) + 1;
    }
  }

  return { keyErrors, keyTotals };
}

export function calculateConsistency(samples: WpmSample[], finalWpm: number): number {
  if (samples.length < 2) return 100;
  const wpms = samples.map((s) => s.wpm);
  const mean = wpms.reduce((a, b) => a + b, 0) / wpms.length;
  if (mean === 0) return 100;
  const variance = wpms.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / wpms.length;
  const stdDev = Math.sqrt(variance);
  const cv = stdDev / mean;
  return Math.max(0, Math.min(100, Math.round((1 - cv) * 100)));
}

export function calculateMetrics(target: string, typed: string, durationMs: number, samples: WpmSample[]): RunMetrics {
  const counts = countCharacters(target, typed);
  const minutes = Math.max(durationMs / 60000, 1 / 60000);
  const grossCharacters = counts.correct + counts.incorrect + counts.extra;
  const rawWpm = grossCharacters / 5 / minutes;
  const wpm = Math.max(0, (grossCharacters / 5 - (counts.incorrect + counts.extra) / 5) / minutes);
  const accuracy = grossCharacters === 0 ? 100 : (counts.correct / grossCharacters) * 100;
  const roundedWpm = Math.round(wpm);
  const consistency = calculateConsistency(samples, roundedWpm);
  const { keyErrors, keyTotals } = calculateKeyStats(target, typed);

  return {
    ...counts,
    wpm: roundedWpm,
    rawWpm: Math.round(rawWpm),
    accuracy: Math.round(accuracy * 10) / 10,
    consistency,
    durationMs,
    samples,
    keyErrors,
    keyTotals,
  };
}

export function liveMetrics(target: string, typed: string, elapsedMs: number) {
  return calculateMetrics(target, typed, Math.max(elapsedMs, 1000), []);
}
