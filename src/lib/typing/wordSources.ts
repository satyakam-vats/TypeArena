import { commonEnglishWords } from "../../data/commonEnglishWords";
import { quotes } from "../../data/quotes";
import { codeSnippets } from "../../data/codeSnippets";
import { punctuationWords } from "../../data/punctuationWords";
import { numberWords } from "../../data/numberWords";
import { GITHUB_CODE_PRESETS } from "../github/githubApi";
import { getAllTimeKeyStatsFromStorage } from "../storage/analyticsStorage";
import { generatePracticeText, generateNgramPracticeText } from "./practiceTextGen";
import type { QuoteLength, TestMode, TestSettings, WordSource } from "../../types/typing";

function cyrb128(str: string): [number, number, number, number] {
  let h1 = 1779033703, h2 = 3144134277, h3 = 1013904223, h4 = 208732341;
  for (let i = 0, ch; i < str.length; i++) {
    ch = str.charCodeAt(i);
    h1 = h2 ^ Math.imul(h1 ^ ch, 597399067);
    h2 = h3 ^ Math.imul(h2 ^ ch, 2869860233);
    h3 = h4 ^ Math.imul(h4 ^ ch, 951274213);
    h4 = h1 ^ Math.imul(h4 ^ ch, 2716044179);
  }
  h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067);
  h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233);
  h3 = Math.imul(h1 ^ (h3 >>> 17), 951274213);
  h4 = Math.imul(h2 ^ (h4 >>> 19), 2716044179);
  return [(h1 ^ h2 ^ h3 ^ h4) >>> 0, (h2 ^ h1) >>> 0, (h3 ^ h1) >>> 0, (h4 ^ h1) >>> 0];
}

function sfc32(a: number, b: number, c: number, d: number) {
  return function () {
    a >>>= 0; b >>>= 0; c >>>= 0; d >>>= 0;
    let t = (a + b | 0) + d | 0;
    d = d + 1 | 0;
    a = b ^ b >>> 9;
    b = c + (c << 3) | 0;
    c = c << 21 | c >>> 11;
    c = c + t | 0;
    return (t >>> 0) / 4294967296;
  };
}

export function createRandomGenerator(seed?: string) {
  if (!seed) return Math.random;
  const [a, b, c, d] = cyrb128(seed);
  return sfc32(a, b, c, d);
}

const PUNCT_END = [".", ",", "!", "?", ";", ":"];
const PUNCT_WRAP: Array<[string, string]> = [['"', '"'], ["'", "'"], ["(", ")"]];

function decorateWord(word: string, punctuation: boolean, numbers: boolean, random: () => number): string {
  if (numbers && random() < 0.12) {
    return numberWords[Math.floor(random() * numberWords.length)] ?? String(Math.floor(random() * 9999));
  }
  let w = word;
  if (!punctuation) return w;
  if (random() < 0.22) w = w.charAt(0).toUpperCase() + w.slice(1);
  if (random() < 0.08) {
    const [a, b] = PUNCT_WRAP[Math.floor(random() * PUNCT_WRAP.length)]!;
    w = a + w + b;
  } else if (random() < 0.28) {
    w = w + PUNCT_END[Math.floor(random() * PUNCT_END.length)]!;
  }
  return w;
}

function pickWords(
  pool: string[],
  wordCount: number,
  random: () => number,
  punctuation = false,
  numbers = false,
): string {
  const result: string[] = [];
  let lastWord = "";
  for (let i = 0; i < wordCount; i++) {
    let raw = pool[Math.floor(random() * pool.length)] ?? "the";
    let guard = 0;
    while (raw === lastWord && pool.length > 1 && guard++ < 8) {
      raw = pool[Math.floor(random() * pool.length)] ?? "the";
    }
    const word = decorateWord(raw, punctuation, numbers, random);
    result.push(word);
    lastWord = raw;
  }
  return result.join(" ");
}

const commonEnglish: WordSource = {
  id: "common-en",
  label: "english",
  createText(wordCount, seed) {
    return pickWords(commonEnglishWords, wordCount, createRandomGenerator(seed));
  },
};

const quotesSource: WordSource = {
  id: "quotes",
  label: "quotes",
  createText(_wordCount, seed) {
    return createQuoteText("all", seed);
  },
};

const codeSource: WordSource = {
  id: "code",
  label: "code",
  createText(wordCount, seed) {
    const random = createRandomGenerator(seed);
    const result: string[] = [];
    let currentWords = 0;
    let guard = 0;
    while (currentWords < wordCount && guard++ < 200) {
      const snippet = codeSnippets[Math.floor(random() * codeSnippets.length)] ?? "const x = 1;";
      const words = snippet.split(/\s+/).filter(Boolean);
      result.push(...words);
      currentWords += words.length;
    }
    return result.slice(0, wordCount).join(" ");
  },
};

const githubSource: WordSource = {
  id: "github",
  label: "github",
  createText(_wordCount, _seed, settings) {
    const preset = GITHUB_CODE_PRESETS.find((p) => p.id === settings?.githubPresetId) ?? GITHUB_CODE_PRESETS[0]!;
    return preset.fallbackCode.trim().replace(/\s+/g, " ");
  },
};

const ngramSource: WordSource = {
  id: "ngram",
  label: "n-grams",
  createText(wordCount, seed, settings) {
    const ngrams = (settings?.selectedNgrams || ["th", "ch", "sh", "ing", "str", "qu"]) as any[];
    return generateNgramPracticeText(ngrams, wordCount, seed);
  },
};

const punctuationSource: WordSource = {
  id: "punctuation",
  label: "punctuation",
  createText(wordCount, seed) {
    return pickWords(punctuationWords, wordCount, createRandomGenerator(seed));
  },
};

const numbersSource: WordSource = {
  id: "numbers",
  label: "numbers",
  createText(wordCount, seed) {
    return pickWords(numberWords, wordCount, createRandomGenerator(seed));
  },
};

const practiceSource: WordSource = {
  id: "practice",
  label: "practice",
  createText(wordCount, seed) {
    const { keyErrors, keyTotals } = getAllTimeKeyStatsFromStorage();
    return generatePracticeText(keyErrors, keyTotals, wordCount, seed);
  },
};

export const wordSources: Record<string, WordSource> = {
  "common-en": commonEnglish,
  practice: practiceSource,
  quotes: quotesSource,
  code: codeSource,
  github: githubSource,
  ngram: ngramSource,
  punctuation: punctuationSource,
  numbers: numbersSource,
};

export const wordSourceList: WordSource[] = Object.values(wordSources);

export const selectableWordSources: WordSource[] = wordSourceList.filter(
  (s) => s.id !== "practice" && s.id !== "quotes" && s.id !== "punctuation" && s.id !== "numbers",
);

export function wordCountFor(settingsValue: number, mode: TestMode) {
  if (mode === "words") return settingsValue;
  if (mode === "zen") return 200;
  if (mode === "quote" || mode === "custom") return 50;
  return Math.max(200, Math.ceil(settingsValue * 8));
}

export function quoteWordCount(q: string) {
  return q.trim().split(/\s+/).filter(Boolean).length;
}

export function createQuoteText(length: QuoteLength, seed: string): string {
  const random = createRandomGenerator(seed);
  const ranked = quotes.map((q) => ({ q, n: quoteWordCount(q) }));
  const filtered =
    length === "short" ? ranked.filter((x) => x.n <= 12) :
    length === "medium" ? ranked.filter((x) => x.n > 12 && x.n <= 30) :
    length === "long" ? ranked.filter((x) => x.n > 30) :
    ranked;
  const pool = filtered.length > 0 ? filtered : ranked;
  return pool[Math.floor(random() * pool.length)]!.q;
}

export function createTestText(settings: TestSettings, seed: string): string {
  if (settings.mode === "custom") {
    const custom = settings.customText.trim().replace(/\s+/g, " ");
    return custom || "type your custom text here after pasting it in settings";
  }
  if (settings.mode === "quote" || settings.wordSourceId === "quotes") {
    return createQuoteText(settings.quoteLength || "medium", seed);
  }
  if (settings.wordSourceId === "github") {
    const preset = GITHUB_CODE_PRESETS.find((p) => p.id === settings.githubPresetId) ?? GITHUB_CODE_PRESETS[0]!;
    return preset.fallbackCode.trim().replace(/\s+/g, " ");
  }

  const count = wordCountFor(settings.value, settings.mode);
  const sourceId = settings.wordSourceId === "practice" ? "practice" : (settings.wordSourceId || "common-en");
  const source = wordSources[sourceId] || commonEnglish;

  if (sourceId === "punctuation" || sourceId === "numbers" || sourceId === "code" || sourceId === "practice" || sourceId === "ngram") {
    return source.createText(count, seed, settings);
  }

  return pickWords(
    commonEnglishWords,
    count,
    createRandomGenerator(seed),
    settings.punctuation,
    settings.numbers,
  );
}

export function appendTestWords(settings: TestSettings, seed: string, wordCount = 40): string {
  if (settings.mode === "quote" || settings.mode === "custom" || settings.mode === "words" || settings.wordSourceId === "github") return "";
  const sourceId = settings.wordSourceId === "practice" ? "practice" : (settings.wordSourceId || "common-en");
  if (sourceId === "code" || sourceId === "practice" || sourceId === "ngram") {
    return " " + (wordSources[sourceId] || commonEnglish).createText(wordCount, seed, settings);
  }
  if (sourceId === "punctuation") {
    return " " + pickWords(punctuationWords, wordCount, createRandomGenerator(seed));
  }
  if (sourceId === "numbers") {
    return " " + pickWords(numberWords, wordCount, createRandomGenerator(seed));
  }
  return " " + pickWords(commonEnglishWords, wordCount, createRandomGenerator(seed), settings.punctuation, settings.numbers);
}
