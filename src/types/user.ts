import type { TestMode } from "./typing";

export type UserStats = {
  personalBestWpm: number;
  bestWpmByMode: Record<string, number>; // e.g. "time_30": 85, "words_25": 92
  testsCompleted: number;
  totalRaces: number;
  raceWins: number;
  avgWpm: number;
  avgAccuracy: number;
  avgConsistency: number;
};

export type UserProfile = {
  uid: string;
  displayName: string;
  photoURL?: string | null;
  email?: string | null;
  createdAt?: number;
  updatedAt?: number;
  stats?: UserStats;
  keyErrors?: Record<string, number>;
  keyTotals?: Record<string, number>;
};

export type AchievementBadge = {
  id: string;
  title: string;
  description: string;
  icon: string; // lucide icon name or emoji
  unlocked: boolean;
  unlockedAt?: number;
  progress?: number; // 0 to 100
  category: "speed" | "accuracy" | "stamina" | "races" | "consistency";
};
