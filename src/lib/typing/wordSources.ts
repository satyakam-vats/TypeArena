import { commonEnglishWords } from "../../data/commonEnglishWords";
import type { WordSource } from "../../types/typing";

function seededRandom(seed: string) {
  let value = Array.from(seed).reduce((total, character) => total + character.charCodeAt(0), 0) || 1;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

const commonEnglish: WordSource = {
  id: "common-en",
  label: "english",
  createText(wordCount, seed) {
    const random = seededRandom(seed);
    return Array.from({ length: wordCount }, () => commonEnglishWords[Math.floor(random() * commonEnglishWords.length)]).join(" ");
  },
};

export const wordSources: Record<WordSource["id"], WordSource> = {
  "common-en": commonEnglish,
};

export function wordCountFor(settingsValue: number, mode: "time" | "words") {
  return mode === "words" ? settingsValue : Math.max(80, Math.ceil(settingsValue * 2.6));
}
