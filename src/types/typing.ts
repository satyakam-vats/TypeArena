export type TestMode = "time" | "words";

export type TestSettings = {
  mode: TestMode;
  value: 15 | 30 | 60 | 120 | 10 | 25 | 50 | 100;
  wordSourceId: "common-en";
};

export type CharacterCounts = {
  correct: number;
  incorrect: number;
  extra: number;
  missed: number;
};

export type WpmSample = {
  elapsedMs: number;
  wpm: number;
  rawWpm: number;
};

export type RunMetrics = CharacterCounts & {
  wpm: number;
  rawWpm: number;
  accuracy: number;
  consistency: number;
  durationMs: number;
  samples: WpmSample[];
  keyErrors: Record<string, number>;
  keyTotals: Record<string, number>;
};

export type CompletedRun = {
  id: string;
  kind: "solo" | "race";
  settings: TestSettings;
  targetText: string;
  typedText: string;
  metrics: RunMetrics;
  completedAt: number;
  roomId?: string;
};

export type WordSource = {
  id: TestSettings["wordSourceId"];
  label: string;
  createText: (wordCount: number, seed: string) => string;
};
