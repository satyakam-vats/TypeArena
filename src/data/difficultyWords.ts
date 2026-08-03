import { commonEnglishWords } from "./commonEnglishWords";
import type { WordDifficulty } from "../types/typing";

/** Prefer readable practice words: letters only, no single-char noise. */
function isPracticeWord(word: string): boolean {
  return /^[a-z]+$/.test(word) && word.length >= 2;
}

const alphaWords = commonEnglishWords.filter(isPracticeWord);

/**
 * Length-based difficulty tiers for English word tests.
 * Easy  → short everyday words (2–4 letters)
 * Medium → mid-length words (5–7)
 * Hard  → longer vocabulary (8+)
 */
export const easyWords: string[] = alphaWords.filter((w) => w.length <= 4);
export const mediumWords: string[] = alphaWords.filter((w) => w.length >= 5 && w.length <= 7);
export const hardWords: string[] = alphaWords.filter((w) => w.length >= 8);

export function wordsForDifficulty(difficulty: WordDifficulty = "medium"): string[] {
  switch (difficulty) {
    case "easy":
      return easyWords.length > 50 ? easyWords : alphaWords;
    case "hard":
      return hardWords.length > 50 ? hardWords : alphaWords;
    case "all":
      return alphaWords.length > 50 ? alphaWords : commonEnglishWords;
    case "medium":
    default:
      return mediumWords.length > 50 ? mediumWords : alphaWords;
  }
}
