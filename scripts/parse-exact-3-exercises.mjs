import fs from "fs";

const rawData = JSON.parse(fs.readFileSync("D:/TypeArena/scripts/learntyping-full-extracted.json", "utf8"));

for (const lesson of rawData) {
  console.log(`\n==================================================`);
  console.log(`LESSON [${lesson.urlAlias}] - ${lesson.title}`);
  console.log(`==================================================`);
  
  // Find headings / exercise titles in rawTextBlocks
  const exerciseHeadings = lesson.rawTextBlocks.filter(b => /exercise|lesson/i.test(b));
  console.log("Found headings:", exerciseHeadings);
  console.log("Total raw text blocks:", lesson.rawTextBlocks.length);
}
