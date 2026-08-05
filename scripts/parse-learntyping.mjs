import fs from "fs";

const raw = fs.readFileSync("D:/TypeArena/scripts/learntyping-site-structure.js", "utf8");
const start = raw.indexOf('"pagesData":');
let i = raw.indexOf("{", start);
let depth = 0;
let end = i;
for (; end < raw.length; end++) {
  if (raw[end] === "{") depth++;
  else if (raw[end] === "}") {
    depth--;
    if (depth === 0) {
      end++;
      break;
    }
  }
}
const pagesData = JSON.parse(raw.slice(i, end));
const pages = Object.values(pagesData)
  .map((p) => ({
    id: p.id,
    title: p.title,
    pageTitle: p.pageTitle,
    urlAlias: p.urlAlias,
    index: p.index,
    description: (p.description || "").slice(0, 160),
    keyWords: p.keyWords || "",
  }))
  .sort((a, b) => (a.index || 0) - (b.index || 0));

const lessonPages = pages.filter(
  (p) =>
    /lesson|beginner|advanced|home.?row|typing lesson/i.test(
      `${p.title} ${p.pageTitle} ${p.urlAlias}`
    )
);

console.log("=== ALL LESSON-RELATED PAGES ===");
console.log(JSON.stringify(lessonPages, null, 2));
console.log("\nTOTAL LESSON PAGES:", lessonPages.length);
console.log("\n=== ALL PAGES (title + url) ===");
for (const p of pages) {
  console.log(`${String(p.index).padStart(3)} | ${p.urlAlias?.padEnd(40)} | ${p.title}`);
}
