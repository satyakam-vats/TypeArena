import fs from "fs";
import https from "https";

const url =
  "https://raw.githubusercontent.com/first20hours/google-10000-english/master/google-10000-english-usa-no-swears.txt";

function fetchText(u) {
  return new Promise((resolve, reject) => {
    https
      .get(u, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          fetchText(res.headers.location).then(resolve, reject);
          return;
        }
        let d = "";
        res.on("data", (c) => (d += c));
        res.on("end", () => resolve(d));
      })
      .on("error", reject);
  });
}

const cur = fs.readFileSync("src/data/commonEnglishWords.ts", "utf8");
const set = new Set([...cur.matchAll(/"([a-z]+)"/g)].map((m) => m[1]));

const text = await fetchText(url);
for (const w of text.split(/\n/)) {
  const lw = w.trim().toLowerCase().replace(/[^a-z]/g, "");
  if (lw.length >= 2 && lw.length <= 14) set.add(lw);
}

const arr = [...set].sort();
const lines = [];
for (let i = 0; i < arr.length; i += 10) {
  lines.push(
    "  " +
      arr
        .slice(i, i + 10)
        .map((w) => JSON.stringify(w))
        .join(", ") +
      (i + 10 < arr.length ? "," : "")
  );
}
fs.writeFileSync(
  "src/data/commonEnglishWords.ts",
  "export const commonEnglishWords = [\n" + lines.join("\n") + "\n];\n"
);
console.log("words", arr.length);
