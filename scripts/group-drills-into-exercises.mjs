import fs from "fs";

const raw = JSON.parse(fs.readFileSync("D:/TypeArena/scripts/learntyping-drills-clean.json", "utf8"));

for (const item of raw) {
  console.log(`\nLesson ID: ${item.id} | Code: ${item.code} | Title: ${item.title}`);
  console.log(`Total drill lines: ${item.drills.length}`);
  item.drills.forEach((d, idx) => console.log(`  Line ${idx + 1}: ${d.slice(0, 50)}...`));
}
