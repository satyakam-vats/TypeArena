import type { CompletedRun } from "../../types/typing";

const RUNS_KEY = "typearena_run_history_v1";

export function saveRunToLocalStorage(run: CompletedRun): void {
  try {
    const existing = getStoredRuns();
    const updated = [run, ...existing].slice(0, 200); // keep last 200 runs
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

export function getAllTimeKeyStatsFromStorage(): {
  keyErrors: Record<string, number>;
  keyTotals: Record<string, number>;
} {
  const runs = getStoredRuns();
  const keyErrors: Record<string, number> = {};
  const keyTotals: Record<string, number> = {};

  for (const run of runs) {
    if (run.metrics.keyErrors) {
      for (const [key, errCount] of Object.entries(run.metrics.keyErrors)) {
        keyErrors[key] = (keyErrors[key] || 0) + errCount;
      }
    }
    if (run.metrics.keyTotals) {
      for (const [key, totalCount] of Object.entries(run.metrics.keyTotals)) {
        keyTotals[key] = (keyTotals[key] || 0) + totalCount;
      }
    }
  }

  return { keyErrors, keyTotals };
}
