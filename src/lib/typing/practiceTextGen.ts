import { commonEnglishWords } from "../../data/commonEnglishWords";
import { ngramDictionary, type NgramCategory } from "../../data/ngramWords";
import { createRandomGenerator } from "./wordSources";

export function getWeakKeys(
  keyErrors: Record<string, number>,
  keyTotals: Record<string, number>,
  minPresses = 5,
  limit = 8
): { key: string; errorRate: number }[] {
  const weakKeys: { key: string; errorRate: number }[] = [];
  const MIN_ERROR_RATE = 0.04;

  for (const key in keyTotals) {
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

export function generateNgramPracticeText(
  selectedNgrams: NgramCategory[],
  wordCount: number,
  seed: string
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

  const pool = targetedPool.length > 10 ? targetedPool : commonEnglishWords;
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

export function generatePracticeText(
  keyErrors: Record<string, number>,
  keyTotals: Record<string, number>,
  wordCount: number,
  seed: string
): string {
  const random = createRandomGenerator(seed);
  const weakKeys = getWeakKeys(keyErrors, keyTotals, 5, 8);
  const weakLetters = weakKeys
    .map((k) => k.key)
    .filter((k) => k.length === 1 && k !== " ");
  const weakKeySet = new Set(weakLetters);

  const focused =
    weakKeySet.size > 0
      ? commonEnglishWords.filter((w) => [...w].some((ch) => weakKeySet.has(ch)))
      : [];
  const pool = focused.length > 20 ? focused : commonEnglishWords;

  const result: string[] = [];
  let lastWord = "";

  for (let i = 0; i < wordCount; i++) {
    const useFocused = weakKeySet.size > 0 && random() < 0.65;
    const source = useFocused && focused.length > 0 ? focused : pool;
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
