/* ───────────────────────────────────────────────────────────────────
 *  TypeArena – AI Coach Types
 *  100 % local, zero API calls, zero cost.
 * ─────────────────────────────────────────────────────────────────── */

export type InsightCategory =
  | "rhythm"
  | "accuracy"
  | "speed"
  | "endurance"
  | "technique"
  | "strength"
  | "improvement";

export type CoachInsight = {
  emoji: string;
  category: InsightCategory;
  title: string;
  detail: string;
  actionable: string;
  priority: 1 | 2 | 3;
};

export type CoachAnalysis = {
  insights: CoachInsight[];
  encouragement: string;
  focusArea: string;
};

/** Lightweight run summary for trend detection. */
export type RunSummary = {
  wpm: number;
  rawWpm: number;
  accuracy: number;
  consistency: number;
  durationMs: number;
  completedAt: number;
  maxCombo?: number;
};

/** Pre-computed profile assembled from localStorage run history. */
export type TypingProfile = {
  recentRuns: RunSummary[];
  avgWpm: number;
  avgAccuracy: number;
  bestWpm: number;
  trend: "improving" | "stable" | "declining";
  totalTests: number;
};
