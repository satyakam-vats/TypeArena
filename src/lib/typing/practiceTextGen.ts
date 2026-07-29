import { commonEnglishWords } from "../../data/commonEnglishWords";
import { createRandomGenerator } from "./wordSources";

export function getWeakKeys(
  keyErrors: Record<string, number>,
  keyTotals: Record<string, number>,
  minPresses = 5,
  limit = 8
): { key: string; errorRate: number }[] {
  const weakKeys: { key: string; errorRate: number }[] = [];
  // Drop keys that are mostly fixed — only surface real problem letters.
  const MIN_ERROR_RATE = 0.04;

  for (const key in keyTotals) {
    // Skip non-letter noise for the practice chips (still used in generation via raw maps).
    if (key.length !== 1 && key !== "space") continue;
    if (!/^[a-z ]$/.test(key === "space" ? " " : key) && key !== "space") continue;

    const total = keyTotals[key];
    if (total >= minPresses) {
      const errors = keyErrors[key] || 0;
      const errorRate = errors / total;
      if (errorRate >= MIN_ERROR_RATE) {
        weakKeys.push({ key, errorRate });
      }
    }
  }

  return weakKeys.sort((a, b) => b.errorRate - a.errorRate).slice(0, limit);
}

export function generatePracticeText(
  keyErrors: Record<string, number>,
  keyTotals: Record<string, number>,
  wordCount: number,
  seed: string
): string {
  const random = createRandomGenerator(seed);
  const weakKeys = getWeakKeys(keyErrors, keyTotals, 5, 8);
  // Prefer letters; map "space" out of letter matching.
  const weakLetters = weakKeys
    .map((k) => k.key)
    .filter((k) => k.length === 1 && k !== " ");
  const weakKeySet = new Set(weakLetters);

  // Pre-filter words that contain weak letters for faster sampling.
  const focused =
    weakKeySet.size > 0
      ? commonEnglishWords.filter((w) => [...w].some((ch) => weakKeySet.has(ch)))
      : [];
  const pool = focused.length > 20 ? focused : commonEnglishWords;

  const result: string[] = [];
  let lastWord = "";

  for (let i = 0; i < wordCount; i++) {
    // ~65% from focused pool so practice targets weak keys without being pure spam.
    const useFocused = weakKeySet.size > 0 && random() < 0.65;
    const source = useFocused && focused.length > 0 ? focused : pool;
    let word = source[Math.floor(random() * source.length)];
    let guard = 0;
    while (word === lastWord && source.length > 1 && guard < 8) {
      word = source[Math.floor(random() * source.length)];
      guard += 1;
    }
    result.push(word);
    lastWord = word;
  }

  return result.join(" ");
}
