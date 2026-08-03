export type TestMode = "time" | "words" | "quote" | "zen" | "custom";

export type TimePreset = 15 | 30 | 60 | 120;
export type WordPreset = 10 | 25 | 50 | 100;

export type StopOnError = "off" | "word" | "letter";
export type ConfidenceMode = "off" | "on" | "max";
export type Difficulty = "normal" | "expert" | "master";
/** Word-list difficulty for English tests (separate from stop-on-error difficulty). */
export type WordDifficulty = "easy" | "medium" | "hard" | "all";
export type CaretStyle = "line" | "block" | "underline";
export type CaretSpeed = "off" | "fast" | "medium" | "slow";
export type QuoteLength = "short" | "medium" | "long" | "all";

export type TestSettings = {
  mode: TestMode;
  value: number;
  wordSourceId: string;
  punctuation: boolean;
  numbers: boolean;
  stopOnError: StopOnError;
  confidence: ConfidenceMode;
  difficulty: Difficulty;
  /** easy / medium / hard English word pools; ignored for code/quotes/etc. */
  wordDifficulty: WordDifficulty;
  blind: boolean;
  smoothCaret: boolean;
  caretStyle: CaretStyle;
  caretSpeed?: CaretSpeed;
  focusMode: boolean;
  quoteLength: QuoteLength;
  customText: string;
  githubPresetId?: string;
  githubRepoUrl?: string;
  selectedNgrams?: string[];
};

export const defaultTestSettings: TestSettings = {
  mode: "time",
  value: 30,
  wordSourceId: "common-en",
  punctuation: false,
  numbers: false,
  stopOnError: "off",
  confidence: "off",
  difficulty: "normal",
  wordDifficulty: "medium",
  blind: false,
  smoothCaret: true,
  caretStyle: "line",
  focusMode: false,
  quoteLength: "medium",
  customText: "",
  githubPresetId: "react-hooks",
  githubRepoUrl: "",
  selectedNgrams: ["th", "ch", "sh", "ing", "str", "qu"],
};

/** Merge partial/legacy settings with defaults. */
export function normalizeSettings(partial?: Partial<TestSettings> | null): TestSettings {
  const base = { ...defaultTestSettings, ...(partial ?? {}) };
  const validModes: TestMode[] = ["time", "words", "quote", "zen", "custom"];
  if (!validModes.includes(base.mode)) base.mode = "time";
  if (!base.value || base.value < 1) base.value = base.mode === "words" ? 25 : 30;
  if (!base.wordSourceId) base.wordSourceId = "common-en";
  const validWordDiff: WordDifficulty[] = ["easy", "medium", "hard", "all"];
  if (!validWordDiff.includes(base.wordDifficulty)) base.wordDifficulty = "medium";
  return base;
}

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
  maxCombo?: number;
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
  ghostSamples?: { elapsedMs: number; charIndex: number }[];
};

export type WordSource = {
  id: string;
  label: string;
  createText: (wordCount: number, seed: string, settings?: TestSettings) => string;
};
