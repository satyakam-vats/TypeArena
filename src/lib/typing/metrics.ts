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

export function calculateMetrics(target: string, typed: string, durationMs: number, samples: WpmSample[]): RunMetrics {
  const counts = countCharacters(target, typed);
  const minutes = Math.max(durationMs / 60000, 1 / 60000);
  const grossCharacters = counts.correct + counts.incorrect + counts.extra;
  const rawWpm = grossCharacters / 5 / minutes;
  const wpm = Math.max(0, (grossCharacters / 5 - (counts.incorrect + counts.extra) / 5) / minutes);
  const accuracy = grossCharacters === 0 ? 100 : (counts.correct / grossCharacters) * 100;
  return {
    ...counts,
    wpm: Math.round(wpm),
    rawWpm: Math.round(rawWpm),
    accuracy: Math.round(accuracy * 10) / 10,
    durationMs,
    samples,
  };
}

export function liveMetrics(target: string, typed: string, elapsedMs: number) {
  return calculateMetrics(target, typed, Math.max(elapsedMs, 1000), []);
}
