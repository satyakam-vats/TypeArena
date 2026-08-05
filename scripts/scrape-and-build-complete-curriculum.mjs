import fs from "fs";
import path from "path";

const PAGES_DIR = "D:/TypeArena/scripts/lt-pages";

const TARGET_PAGES = [
  { id: "id1711168232395", code: "1a", tier: "beginner", title: "Beginner Lesson 1(a): Home Row Keys" },
  { id: "id1535189613075", code: "1b", tier: "beginner", title: "Beginner Lesson 1(b): E, U, I & R" },
  { id: "id1535202332484", code: "2a", tier: "beginner", title: "Beginner Lesson 2(a): G & H" },
  { id: "id1535246509249", code: "2b", tier: "beginner", title: "Beginner Lesson 2(b): O, T, W & R" },
  { id: "id1535253387674", code: "3",  tier: "beginner", title: "Beginner Lesson 3: Shift Keys & Capitals" },
  { id: "id1535332774837", code: "4",  tier: "beginner", title: "Beginner Lesson 4: C, V, M & N" },
  { id: "id1535761390274", code: "5",  tier: "beginner", title: "Beginner Lesson 5: B & Y" },
  { id: "id1535774313456", code: "6",  tier: "beginner", title: "Beginner Lesson 6: P, Q, X & Z" },
  { id: "id1535796382341", code: "7",  tier: "beginner", title: "Beginner Lesson 7: Paragraph Practice" },
  { id: "id1711169843868", code: "1",  tier: "advanced", title: "Advanced Lesson 1: Speed & Rhythm" },
  { id: "id1537567887489", code: "2",  tier: "advanced", title: "Advanced Lesson 2: Shift Mastery" },
  { id: "id1537587817064", code: "3",  tier: "advanced", title: "Advanced Lesson 3: Left Hand Focus" },
  { id: "id1537590905936", code: "4",  tier: "advanced", title: "Advanced Lesson 4: Right Hand Focus" },
  { id: "id1537593325275", code: "5",  tier: "advanced", title: "Advanced Lesson 5: Alternating Hands" },
  { id: "id1537594824285", code: "6",  tier: "advanced", title: "Advanced Lesson 6: Symbols & Special Characters" },
  { id: "id1537598873155", code: "7",  tier: "advanced", title: "Advanced Lesson 7: Number Row Mastery" },
];

const lessonsOutput = [];

for (const target of TARGET_PAGES) {
  const filePath = path.join(PAGES_DIR, `${target.id}.js`);
  if (!fs.existsSync(filePath)) {
    console.warn(`File not found: ${filePath}`);
    continue;
  }

  const fileContent = fs.readFileSync(filePath, "utf8");
  const jsonStart = fileContent.indexOf("=") + 1;
  const struct = JSON.parse(fileContent.slice(jsonStart).trim());

  const rawBlocks = [];
  const walk = (elem) => {
    if (elem.elementProperties?.formattedText) {
      const text = elem.elementProperties.formattedText
        .replace(/<[^>]+>/g, " ")
        .replace(/&nbsp;/gi, " ")
        .replace(/&amp;/gi, "&")
        .replace(/&lt;/gi, "<")
        .replace(/&gt;/gi, ">")
        .replace(/\s+/g, " ")
        .trim();
      if (text.length > 3) {
        rawBlocks.push(text);
      }
    }
    if (elem.childElements) {
      elem.childElements.forEach(walk);
    }
  };

  if (struct.structures) {
    struct.structures.forEach(walk);
  }

  // Filter text blocks to identify individual exercises
  const exercises = [];
  let currentTitle = "";

  for (const block of rawBlocks) {
    // If block looks like an exercise heading (e.g., "Exercise 1", "Exercise 2")
    if (/exercise\s+\d+/i.test(block)) {
      currentTitle = block;
    } else if (block.length >= 15 && !block.includes("Copyright") && !block.includes("Learn Typing") && !block.includes("Think of a word")) {
      exercises.push({
        title: currentTitle || `Exercise ${exercises.length + 1}`,
        text: block,
      });
      currentTitle = "";
    }
  }

  lessonsOutput.push({
    id: `${target.tier}-${target.code}`,
    tier: target.tier,
    code: target.code,
    title: target.title,
    subtitle: target.title,
    exercisesCount: exercises.length,
    exercises: exercises.map((ex, idx) => ({
      id: `${target.tier}-${target.code}-ex${idx + 1}`,
      title: ex.title || `Exercise ${idx + 1}`,
      text: ex.text,
    })),
  });
}

console.log("=== EXTRACTED LESSONS SUMMARY ===");
for (const l of lessonsOutput) {
  console.log(`[${l.tier.toUpperCase()}] Lesson ${l.code}: "${l.title}" -> ${l.exercisesCount} Exercises`);
}

fs.writeFileSync("D:/TypeArena/scripts/learntyping-full-exercises.json", JSON.stringify(lessonsOutput, null, 2));
console.log("\nSaved to scripts/learntyping-full-exercises.json");
