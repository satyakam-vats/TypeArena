import type { TestMode } from "./typing";

export type TimeframeFilter = "all-time" | "weekly" | "daily";

export type LeaderboardEntry = {
  id: string;
  uid: string;
  displayName: string;
  photoURL: string | null;
  wpm: number;
  accuracy: number;
  consistency: number;
  mode: TestMode;
  value: number;
  kind: "solo" | "race";
  completedAt: number;
  rank?: number;
};
