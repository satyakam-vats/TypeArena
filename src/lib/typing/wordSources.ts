import { commonEnglishWords } from "../../data/commonEnglishWords";
import { quotes } from "../../data/quotes";
import { codeSnippets } from "../../data/codeSnippets";
import { punctuationWords } from "../../data/punctuationWords";
import { numberWords } from "../../data/numberWords";
import type { WordSource } from "../../types/typing";

function cyrb128(str: string): [number, number, number, number] {
  let h1 = 1779033703, h2 = 3144134277, h3 = 1013904223, h4 = 208732341;
  for (let i = 0, ch; i < str.length; i++) {
    ch = str.charCodeAt(i);
    h1 = h2 ^ Math.imul(h1 ^ ch, 597399067);
    h2 = h3 ^ Math.imul(h2 ^ ch, 2869860233);
    h3 = h4 ^ Math.imul(h3 ^ ch, 951274213);
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

const commonEnglish: WordSource = {
  id: "common-en",
  label: "english",
  createText(wordCount, seed) {
    const random = createRandomGenerator(seed);
    const result: string[] = [];
    let lastWord = "";
    for (let i = 0; i < wordCount; i++) {
      let word = commonEnglishWords[Math.floor(random() * commonEnglishWords.length)];
      while (word === lastWord && commonEnglishWords.length > 1) {
        word = commonEnglishWords[Math.floor(random() * commonEnglishWords.length)];
      }
      result.push(word);
      lastWord = word;
    }
    return result.join(" ");
  },
};

const quotesSource: WordSource = {
  id: "quotes",
  label: "quotes",
  createText(wordCount, seed) {
    const random = createRandomGenerator(seed);
    const result: string[] = [];
    let currentWords = 0;
    while (currentWords < wordCount) {
      const quote = quotes[Math.floor(random() * quotes.length)];
      const words = quote.split(" ");
      result.push(...words);
      currentWords += words.length;
    }
    return result.slice(0, wordCount).join(" ");
  },
};

const codeSource: WordSource = {
  id: "code",
  label: "code",
  createText(wordCount, seed) {
    const random = createRandomGenerator(seed);
    const result: string[] = [];
    let currentWords = 0;
    while (currentWords < wordCount) {
      const snippet = codeSnippets[Math.floor(random() * codeSnippets.length)];
      const words = snippet.split(" ");
      result.push(...words);
      currentWords += words.length;
    }
    return result.slice(0, wordCount).join(" ");
  },
};

const punctuationSource: WordSource = {
  id: "punctuation",
  label: "punctuation",
  createText(wordCount, seed) {
    const random = createRandomGenerator(seed);
    const result: string[] = [];
    let lastWord = "";
    for (let i = 0; i < wordCount; i++) {
      let word = punctuationWords[Math.floor(random() * punctuationWords.length)];
      while (word === lastWord && punctuationWords.length > 1) {
        word = punctuationWords[Math.floor(random() * punctuationWords.length)];
      }
      result.push(word);
      lastWord = word;
    }
    return result.join(" ");
  },
};

const numbersSource: WordSource = {
  id: "numbers",
  label: "numbers",
  createText(wordCount, seed) {
    const random = createRandomGenerator(seed);
    const result: string[] = [];
    let lastWord = "";
    for (let i = 0; i < wordCount; i++) {
      let word = numberWords[Math.floor(random() * numberWords.length)];
      while (word === lastWord && numberWords.length > 1) {
        word = numberWords[Math.floor(random() * numberWords.length)];
      }
      result.push(word);
      lastWord = word;
    }
    return result.join(" ");
  },
};

export const wordSources: Record<WordSource["id"], WordSource> = {
  "common-en": commonEnglish,
  quotes: quotesSource,
  code: codeSource,
  punctuation: punctuationSource,
  numbers: numbersSource,
};

export const wordSourceList: WordSource[] = Object.values(wordSources);

export function wordCountFor(settingsValue: number, mode: "time" | "words") {
  return mode === "words" ? settingsValue : Math.max(120, Math.ceil(settingsValue * 3.5));
}
