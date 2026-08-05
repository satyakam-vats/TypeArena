import fs from "fs";

const raw = JSON.parse(fs.readFileSync("D:/TypeArena/scripts/learntyping-drills-clean.json", "utf8"));

// Skip duplicate alt pages that mirror hub content
const SKIP_CODES = new Set(["1a-alt", "1-alt"]);

const JUNK =
  /click|video|avatar|testimonial|ebook|copyright|doreen|upgrade your|learn typing course|i hope the|after just four|type the sentences below|press down the caps|press the tab|for the double quotation|find and hold the|use your left hand|use your right hand|which brings us|do not type for|keep your legs|keep both of your|be careful\.|stretch your|commas get you|when you come to tricky|type slowly with correct|left and right hand shift|embed_html|however, you are so|this is a tough touch|nail these|plus, colon/i;

function cleanDrills(drills) {
  return drills
    .map((d) => d.replace(/\s+/g, " ").trim())
    .filter((d) => d.length >= 8 && d.length <= 220)
    .filter((d) => !JUNK.test(d))
    .filter((d) => !/^[A-Z][a-z]+ Typing Lesson/.test(d));
}

function joinPractice(drills, maxChars = 420) {
  const parts = [];
  let len = 0;
  for (const d of drills) {
    if (len + d.length + 1 > maxChars && parts.length >= 3) break;
    parts.push(d);
    len += d.length + 1;
  }
  // Prefer a single continuous practice string with spaces between drill lines
  return parts.join(" ").replace(/\s+/g, " ").trim();
}

function starThresholds(tier, order) {
  if (tier === "beginner") {
    const base = 12 + order * 2;
    return { oneStar: base, twoStars: base + 10, threeStars: base + 22 };
  }
  const base = 20 + order * 3;
  return { oneStar: base, twoStars: base + 12, threeStars: base + 28 };
}

function minAccuracy(tier, order) {
  if (tier === "beginner") return Math.min(92, 85 + Math.floor(order / 2));
  return Math.min(95, 90 + Math.floor(order / 3));
}

const lessons = [];
let beginnerNum = 0;
let advancedNum = 0;

for (const item of raw) {
  if (SKIP_CODES.has(item.code)) continue;
  const drills = cleanDrills(item.drills || []);
  if (drills.length === 0) {
    console.warn("No drills for", item.title);
    continue;
  }

  const text = joinPractice(drills, item.tier === "advanced" ? 480 : 400);
  if (text.length < 20) {
    console.warn("Text too short", item.title, text);
    continue;
  }

  let id;
  let title;
  if (item.tier === "beginner") {
    beginnerNum += 1;
    id = `beginner-${item.code}`;
    title = `Beginner ${item.code.toUpperCase()}: ${item.subtitle.split(":")[0].trim()}`;
    // nicer titles from known mapping
    const titles = {
      "1a": "Beginner 1a: Home Row Keys",
      "1b": "Beginner 1b: E, U, I & R",
      "2a": "Beginner 2a: G & H",
      "2b": "Beginner 2b: W, T, O & Y",
      "3": "Beginner 3: V, B, N & M",
      "4": "Beginner 4: Capitals & C",
      "5": "Beginner 5: A, P, Q, Z & X",
      "6": "Beginner 6: Punctuation",
      "7": "Beginner 7: Common Combinations",
    };
    title = titles[item.code] || title;
  } else {
    advancedNum += 1;
    id = `advanced-${item.code}`;
    const titles = {
      "1": "Advanced 1: Letter Combinations",
      "2": "Advanced 2: Shift Keys & Capitals",
      "3": "Advanced 3: Left Hand Focus",
      "4": "Advanced 4: Right Hand Focus",
      "5": "Advanced 5: Alternating Hands",
      "6": "Advanced 6: Symbols & Special Chars",
      "7": "Advanced 7: Number Row Mastery",
    };
    title = titles[item.code] || `Advanced ${item.code}: ${item.subtitle}`;
  }

  const order = item.tier === "beginner" ? beginnerNum : advancedNum;

  lessons.push({
    id,
    tier: item.tier,
    title,
    subtitle: item.subtitle,
    targetKeys: item.targetKeys,
    fingerGuideHint: item.fingerGuideHint,
    text,
    minAccuracyToPass: minAccuracy(item.tier, order),
    starThresholds: starThresholds(item.tier, order),
    source: "learntyping.org",
    drillCount: drills.length,
  });

  console.log(`${id.padEnd(18)} ${text.length} chars | ${drills.length} drills | ${text.slice(0, 70)}...`);
}

// Emit TypeScript file
const ts = `import type { Lesson, LessonCategory } from "../types/lessons";

/**
 * Typing curriculum adapted from the free lesson progression on learntyping.org
 * (Beginner 1a–7 and Advanced 1–7). Practice drills follow the same key-introduction
 * order; content is formatted for TypeArena's lesson practice UI.
 */
export const LESSON_CATEGORIES: LessonCategory[] = [
  {
    tier: "beginner",
    title: "Beginner Lessons",
    description:
      "Build touch-typing from the home row outward — letters, capitals, punctuation, and common combinations. Work through each lesson carefully before moving on.",
    badge: "🌱 Beginner",
  },
  {
    tier: "advanced",
    title: "Advanced Lessons",
    description:
      "Speed, shift mastery, hand-focused drills, symbols, and the number row. Designed for typists who already know the full alphabet.",
    badge: "⚡ Advanced",
  },
];

export const LESSONS: Lesson[] = ${JSON.stringify(
  lessons.map(({ source, drillCount, ...rest }) => rest),
  null,
  2
).replace(/"([^"]+)":/g, "$1:")};
`;

fs.writeFileSync("D:/TypeArena/src/data/lessonsData.ts", ts);
console.log(`\nWrote ${lessons.length} lessons to src/data/lessonsData.ts`);
