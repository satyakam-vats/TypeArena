import { commonEnglishWords } from "../../data/commonEnglishWords";
import { createRandomGenerator } from "./wordSources";

export function getWeakKeys(
  keyErrors: Record<string, number>,
  keyTotals: Record<string, number>,
  minPresses = 5
): { key: string; errorRate: number }[] {
  const weakKeys: { key: string; errorRate: number }[] = [];
  
  for (const key in keyTotals) {
    const total = keyTotals[key];
    if (total >= minPresses) {
      const errors = keyErrors[key] || 0;
      const errorRate = errors / total;
      if (errorRate > 0) {
        weakKeys.push({ key, errorRate });
      }
    }
  }
  
  return weakKeys.sort((a, b) => b.errorRate - a.errorRate);
}

export function generatePracticeText(
  keyErrors: Record<string, number>,
  keyTotals: Record<string, number>,
  wordCount: number,
  seed: string
): string {
  const random = createRandomGenerator(seed);
  const weakKeys = getWeakKeys(keyErrors, keyTotals, 5);
  
  // Use up to top 10 weak keys for practice text generation
  const weakKeySet = new Set(weakKeys.slice(0, 10).map(k => k.key));
  
  const result: string[] = [];
  let lastWord = "";
  
  for (let i = 0; i < wordCount; i++) {
    let word = "";
    while (true) {
      const candidate = commonEnglishWords[Math.floor(random() * commonEnglishWords.length)];
      let hasWeakKey = false;
      if (weakKeySet.size > 0) {
        for (let j = 0; j < candidate.length; j++) {
          if (weakKeySet.has(candidate[j])) {
            hasWeakKey = true;
            break;
          }
        }
      }
      
      const weight = hasWeakKey ? 3 : 1;
      // Max weight is 3, so accept with probability weight / 3
      if (random() < weight / 3) {
        if (candidate !== lastWord || commonEnglishWords.length <= 1) {
          word = candidate;
          break;
        }
      }
    }
    
    result.push(word);
    lastWord = word;
  }
  
  return result.join(" ");
}
