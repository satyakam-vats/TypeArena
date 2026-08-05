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
console.log(Object.values(pagesData).map(p => ({ id: p.id, title: p.title, urlAlias: p.urlAlias })));
