import fs from "fs";

const rawData = JSON.parse(fs.readFileSync("D:/TypeArena/scripts/learntyping-full-exercises.json", "utf8"));

const TARGET_KEYS_MAP = {
  "beginner-1a": ["a", "s", "d", "f", "j", "k", "l", ";", "space"],
  "beginner-1b": ["e", "u", "i", "r", "a", "s", "d", "f", "j", "k", "l", "space"],
  "beginner-2a": ["g", "h", "a", "s", "d", "f", "j", "k", "l", "space"],
  "beginner-2b": ["o", "t", "w", "r", "a", "s", "d", "f", "j", "k", "l", "space"],
  "beginner-3": ["Shift", "A", "S", "D", "F", "J", "K", "L", "space"],
  "beginner-4": ["c", "v", "m", "n", "a", "s", "d", "f", "j", "k", "l", "space"],
  "beginner-5": ["b", "y", "a", "s", "d", "f", "j", "k", "l", "space"],
  "beginner-6": ["p", "q", "x", "z", "a", "s", "d", "f", "j", "k", "l", "space"],
  "beginner-7": ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z", "space"],
  "advanced-1": ["a", "s", "d", "f", "j", "k", "l", ";", "e", "r", "t", "y", "u", "i", "o", "p", "space"],
  "advanced-2": ["Shift", "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z", "space"],
  "advanced-3": ["q", "w", "e", "r", "t", "a", "s", "d", "f", "g", "z", "x", "c", "v", "b", "space"],
  "advanced-4": ["y", "u", "i", "o", "p", "h", "j", "k", "l", ";", "n", "m", "space"],
  "advanced-5": ["a", "s", "d", "f", "g", "h", "j", "k", "l", "q", "w", "e", "r", "t", "y", "u", "i", "o", "p", "space"],
  "advanced-6": ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "&", "%", "@", "$", "space"],
  "advanced-7": ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "space"],
};

const FINGER_HINTS_MAP = {
  "beginner-1a": "Rest left fingers on A S D F and right fingers on J K L ;. Thumbs on spacebar. Feel the bumps on F and J.",
  "beginner-1b": "Reach up to E (left middle), R (left index), U (right index), I (right middle). Return to home row after each key.",
  "beginner-2a": "Left index reaches right to G; right index reaches left to H. Always return to F and J.",
  "beginner-2b": "Reach up to O, T, W, R. Maintain your home row posture.",
  "beginner-3": "Use opposite pinky for the Shift key. Left Shift for right-hand keys, Right Shift for left-hand keys.",
  "beginner-4": "Reach down to C, V (left hand) and M, N (right hand). Keep wrists stable.",
  "beginner-5": "Left index reaches down to B; right index reaches up-left to Y.",
  "beginner-6": "Reach out to P (right pinky), Q (left pinky), X, Z (bottom row).",
  "beginner-7": "Full paragraph typing. Focus on smooth rhythm over raw speed.",
  "advanced-1": "Maintain steady cadence without hesitating between easy and hard keys.",
  "advanced-2": "Fluid shift key transitions. Keep pinkies relaxed.",
  "advanced-3": "Left hand focus drills. Keep right hand steady on home row.",
  "advanced-4": "Right hand focus drills. Maintain light touch on key caps.",
  "advanced-5": "Alternate left and right hand key combinations for maximum flow.",
  "advanced-6": "Reach up to the symbol/number row without lifting your wrists.",
  "advanced-7": "Map every number to its home row finger. Return to home keys instantly.",
};

const formattedLessons = rawData.map((l) => {
  const targetKeys = TARGET_KEYS_MAP[l.id] || ["a", "s", "d", "f", "j", "k", "l", "space"];
  const fingerGuideHint = FINGER_HINTS_MAP[l.id] || "Maintain home row position and stay relaxed.";

  // Combined text for fallback
  const combinedText = l.exercises.map((e) => e.text).join(" ");

  return {
    id: l.id,
    tier: l.tier,
    code: l.code,
    title: l.title,
    subtitle: l.subtitle,
    targetKeys,
    fingerGuideHint,
    text: combinedText,
    exercises: l.exercises.map((ex, idx) => ({
      id: ex.id,
      title: `Exercise ${idx + 1}`,
      text: ex.text,
      targetKeys,
      minAccuracyToPass: 85 + (idx % 5),
    })),
    minAccuracyToPass: 86,
    starThresholds: {
      oneStar: 15,
      twoStars: 25,
      threeStars: 40,
    },
  };
});

const fileContent = `import type { Lesson, LessonCategory } from "../types/lessons";

export const LESSON_CATEGORIES: LessonCategory[] = [
  {
    tier: "beginner",
    title: "Beginner Lessons",
    description: "Build touch-typing from the home row outward — letters, capitals, punctuation, and common combinations from learntyping.org.",
    badge: "🌱 Beginner",
  },
  {
    tier: "advanced",
    title: "Advanced Lessons",
    description: "Speed, shift mastery, hand-focused drills, symbols, and number row from learntyping.org.",
    badge: "⚡ Advanced",
  },
];

export const LESSONS: Lesson[] = ${JSON.stringify(formattedLessons, null, 2)};
`;

fs.writeFileSync("D:/TypeArena/src/data/lessonsData.ts", fileContent);
console.log("Successfully generated src/data/lessonsData.ts with exact exercises!");
