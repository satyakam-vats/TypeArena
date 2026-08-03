import { commonEnglishWords } from "../../data/commonEnglishWords";
import { ngramDictionary, type NgramCategory } from "../../data/ngramWords";
import { createRandomGenerator } from "./wordSources";

/** Minimum weighted presses before a key can be considered weak. */
export const WEAK_KEY_MIN_PRESSES = 5;
/** Error rate at or above this marks a key as a weak spot. */
export const WEAK_KEY_MIN_ERROR_RATE = 0.04;
/** Default number of weak keys to surface in drills/UI. */
export const WEAK_KEY_DEFAULT_LIMIT = 8;

export type WeakKey = {
  key: string;
  errorRate: number;
  presses: number;
  errors: number;
};

export type AdaptiveDrillRecommendation = {
  weakKeys: WeakKey[];
  /** Keys suitable for letter drills (excludes space). */
  targetLetters: string[];
  /** Short copy for banners, e.g. "Focus on e, r, n". */
  summary: string;
  hasEnoughData: boolean;
};

/**
 * Rank keys by recent error rate.
 * Threshold rule: ≥ WEAK_KEY_MIN_PRESSES presses and error rate ≥ WEAK_KEY_MIN_ERROR_RATE.
 * Callers should pass recency-weighted stats (e.g. from getAllTimeKeyStatsFromStorage)
 * so the list re-evaluates as new sessions land.
 */
export function getWeakKeys(
  keyErrors: Record<string, number>,
  keyTotals: Record<string, number>,
  minPresses = WEAK_KEY_MIN_PRESSES,
  limit = WEAK_KEY_DEFAULT_LIMIT,
): WeakKey[] {
  const weakKeys: WeakKey[] = [];

  for (const key in keyTotals) {
    if (key.length !== 1 && key !== "space") continue;
    const normalized = key === "space" ? " " : key;
    if (!/^[a-z ]$/.test(normalized)) continue;

    const presses = keyTotals[key] ?? 0;
    if (presses < minPresses) continue;

    const errors = keyErrors[key] || 0;
    const errorRate = errors / presses;
    if (errorRate >= WEAK_KEY_MIN_ERROR_RATE) {
      weakKeys.push({ key, errorRate, presses, errors });
    }
  }

  return weakKeys.sort((a, b) => b.errorRate - a.errorRate).slice(0, limit);
}

/** Build a user-facing adaptive drill recommendation from key stats. */
export function getAdaptiveDrillRecommendation(
  keyErrors: Record<string, number>,
  keyTotals: Record<string, number>,
  limit = 5,
): AdaptiveDrillRecommendation {
  const totalPresses = Object.values(keyTotals).reduce((a, b) => a + b, 0);
  const hasEnoughData = totalPresses >= WEAK_KEY_MIN_PRESSES * 3;
  const weakKeys = getWeakKeys(keyErrors, keyTotals, WEAK_KEY_MIN_PRESSES, limit);
  const targetLetters = weakKeys
    .map((k) => k.key)
    .filter((k) => k.length === 1 && k !== " " && k !== "space");

  const summary =
    targetLetters.length === 0
      ? hasEnoughData
        ? "No weak keys right now — keep typing to stay sharp"
        : "Complete a few tests to unlock adaptive drills"
      : `Focus on ${targetLetters.map((l) => l.toUpperCase()).join(", ")}`;

  return { weakKeys, targetLetters, summary, hasEnoughData };
}

/** Score how useful a word is for practicing the given weak letters. */
function wordWeakScore(word: string, weakRates: Map<string, number>): number {
  let score = 0;
  let hits = 0;
  for (const ch of word.toLowerCase()) {
    const rate = weakRates.get(ch);
    if (rate != null) {
      score += rate;
      hits += 1;
    }
  }
  // Prefer denser hits (more weak letters per word) over long words with one hit.
  if (hits === 0) return 0;
  return score * (1 + hits * 0.35);
}

function pickWeightedWord(
  scored: { word: string; score: number }[],
  random: () => number,
  lastWord: string,
): string {
  if (scored.length === 0) return "the";
  const total = scored.reduce((sum, s) => sum + s.score, 0);
  if (total <= 0) {
    return scored[Math.floor(random() * scored.length)]!.word;
  }

  let guard = 0;
  while (guard++ < 12) {
    let r = random() * total;
    for (const item of scored) {
      r -= item.score;
      if (r <= 0) {
        if (item.word !== lastWord || scored.length === 1) return item.word;
        break;
      }
    }
  }
  return scored[Math.floor(random() * scored.length)]!.word;
}

export function generateNgramPracticeText(
  selectedNgrams: NgramCategory[],
  wordCount: number,
  seed: string,
): string {
  const random = createRandomGenerator(seed);
  if (selectedNgrams.length === 0) {
    selectedNgrams = ["th", "ch", "sh", "ing", "str", "qu"];
  }

  const targetedPool: string[] = [];
  for (const ngram of selectedNgrams) {
    if (ngramDictionary[ngram]) {
      targetedPool.push(...ngramDictionary[ngram]);
    }
  }

  const result: string[] = [];
  let lastWord = "";

  for (let i = 0; i < wordCount; i++) {
    const useTargeted = random() < 0.7;
    const source = useTargeted && targetedPool.length > 0 ? targetedPool : commonEnglishWords;
    let word = source[Math.floor(random() * source.length)] ?? "the";
    let guard = 0;
    while (word === lastWord && source.length > 1 && guard < 8) {
      word = source[Math.floor(random() * source.length)] ?? "the";
      guard += 1;
    }
    result.push(word);
    lastWord = word;
  }

  return result.join(" ");
}

/**
 * Adaptive drill generator: biases practice text toward the user's weak keys.
 * Words that contain more / higher-error weak letters are preferred (~75% of picks).
 * Remaining picks stay from the general pool so drills stay readable.
 */
export function generatePracticeText(
  keyErrors: Record<string, number>,
  keyTotals: Record<string, number>,
  wordCount: number,
  seed: string,
): string {
  const random = createRandomGenerator(seed);
  const weakKeys = getWeakKeys(keyErrors, keyTotals, WEAK_KEY_MIN_PRESSES, WEAK_KEY_DEFAULT_LIMIT);
  const weakRates = new Map<string, number>();
  for (const wk of weakKeys) {
    if (wk.key.length === 1 && wk.key !== " ") {
      weakRates.set(wk.key, wk.errorRate);
    }
  }

  const alphaWords = commonEnglishWords.filter((w) => /^[a-z]+$/.test(w) && w.length >= 2);

  const scoredFocused = alphaWords
    .map((word) => ({ word, score: wordWeakScore(word, weakRates) }))
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score);

  // Keep the strongest targets for weighted picks; fall back to full list if sparse.
  const topFocused = scoredFocused.slice(0, Math.max(80, Math.min(400, scoredFocused.length)));
  const hasFocus = topFocused.length >= 12;

  const generalPool = alphaWords.length > 50 ? alphaWords : commonEnglishWords;
  const result: string[] = [];
  let lastWord = "";

  for (let i = 0; i < wordCount; i++) {
    const useFocused = hasFocus && random() < 0.75;
    if (useFocused) {
      const word = pickWeightedWord(topFocused, random, lastWord);
      result.push(word);
      lastWord = word;
    } else {
      let word = generalPool[Math.floor(random() * generalPool.length)] ?? "the";
      let guard = 0;
      while (word === lastWord && generalPool.length > 1 && guard < 8) {
        word = generalPool[Math.floor(random() * generalPool.length)] ?? "the";
        guard += 1;
      }
      result.push(word);
      lastWord = word;
    }
  }

  return result.join(" ");
}
