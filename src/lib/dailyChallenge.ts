import { wordSources } from "./typing/wordSources";

const DAILY_KEY = "typearena_daily_v1";

interface DailyResult {
  wpm: number;
  accuracy: number;
  date: string;
}

export function getDailyChallengeId(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getDailyChallengeText(wordCount: number = 50): string {
  const seed = getDailyChallengeId();
  return wordSources["common-en"].createText(wordCount, seed);
}

export function hasDailyChallengeBeenCompleted(): boolean {
  const today = getDailyChallengeId();
  const data = localStorage.getItem(DAILY_KEY);
  if (!data) return false;
  try {
    const result = JSON.parse(data) as DailyResult;
    return result.date === today;
  } catch {
    return false;
  }
}

export function markDailyChallengeComplete(wpm: number, accuracy: number): void {
  const today = getDailyChallengeId();
  const currentBest = getDailyChallengeBest();
  
  // Only update if it's the first time today, or if we got a better WPM
  if (currentBest && currentBest.wpm >= wpm) {
    return;
  }
  
  const result: DailyResult = { wpm, accuracy, date: today };
  localStorage.setItem(DAILY_KEY, JSON.stringify(result));
}

export function getDailyChallengeBest(): { wpm: number; accuracy: number } | null {
  const today = getDailyChallengeId();
  const data = localStorage.getItem(DAILY_KEY);
  if (!data) return null;
  try {
    const result = JSON.parse(data) as DailyResult;
    if (result.date === today) {
      return { wpm: result.wpm, accuracy: result.accuracy };
    }
    return null;
  } catch {
    return null;
  }
}
