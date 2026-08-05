import type { CompletedRun } from "../../types/typing";

import { saveRunToDB } from "./dbStorage";

const RUNS_KEY = "typearena_run_history_v1";

export function saveRunToLocalStorage(run: CompletedRun): void {
  // Save to IndexedDB asynchronously for long-term storage
  void saveRunToDB(run);

  try {
    const existing = getStoredRuns();
    const lite = { ...run, ghostSamples: undefined, targetText: run.targetText.slice(0, 100), typedText: run.typedText.slice(0, 100) };
    const updated = [lite, ...existing].slice(0, 50); // keep last 50 runs in quick LS cache
    localStorage.setItem(RUNS_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error("Failed to save run to localStorage", err);
  }
}

export function getStoredRuns(): CompletedRun[] {
  try {
    const raw = localStorage.getItem(RUNS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as CompletedRun[];
  } catch (err) {
    console.error("Failed to parse runs from localStorage", err);
    return [];
  }
}

/**
 * Recency-weighted key stats (Monkeytype-style).
 * Recent correct presses pull keys off the weak list instead of lifetime errors locking them in.
 */
export function getAllTimeKeyStatsFromStorage(): {
  keyErrors: Record<string, number>;
  keyTotals: Record<string, number>;
} {
  const runs = getStoredRuns().slice(0, 40); // newest-first history
  const keyErrors: Record<string, number> = {};
  const keyTotals: Record<string, number> = {};

  runs.forEach((run, index) => {
    // Newer runs weigh more; oldest in the window still counts a little.
    const weight = Math.pow(0.92, index);

    if (run.metrics.keyTotals) {
      for (const [key, totalCount] of Object.entries(run.metrics.keyTotals)) {
        keyTotals[key] = (keyTotals[key] || 0) + totalCount * weight;
      }
    }
    if (run.metrics.keyErrors) {
      for (const [key, errCount] of Object.entries(run.metrics.keyErrors)) {
        keyErrors[key] = (keyErrors[key] || 0) + errCount * weight;
      }
    }
  });

  return { keyErrors, keyTotals };
}
