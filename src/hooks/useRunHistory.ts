import { useState, useEffect } from 'react';
import type { CompletedRun } from '../types/typing';

const RUNS_KEY = 'typearena_run_history_v1';

export function useRunHistory() {
  const [runs, setRuns] = useState<CompletedRun[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(RUNS_KEY);
      if (raw) setRuns(JSON.parse(raw));
    } catch { /* ignore */ }

    const handler = (e: StorageEvent) => {
      if (e.key === RUNS_KEY && e.newValue) {
        try { setRuns(JSON.parse(e.newValue)); } catch { /* ignore */ }
      }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  return runs;
}

export function saveRunToHistory(run: CompletedRun) {
  try {
    const existing = JSON.parse(localStorage.getItem(RUNS_KEY) || '[]') as CompletedRun[];
    const updated = [run, ...existing].slice(0, 200);
    localStorage.setItem(RUNS_KEY, JSON.stringify(updated));
  } catch { /* ignore */ }
}
