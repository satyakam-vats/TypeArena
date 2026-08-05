import fs from "fs";
import https from "https";
import http from "http";

function fetchText(url) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith("https") ? https : http;
    lib
      .get(url, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          return fetchText(res.headers.location).then(resolve, reject);
        }
        const chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
      })
      .on("error", reject);
  });
}

function extractPagesData(raw) {
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
  return JSON.parse(raw.slice(i, end));
}

function decodeEntities(s) {
  return s
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/%2525/g, "%")
    .replace(/%25/g, "%")
    .replace(/%20/g, " ")
    .replace(/%2C/g, ",")
    .replace(/%3A/g, ":")
    .replace(/%3B/g, ";")
    .replace(/%3F/g, "?")
    .replace(/%21/g, "!")
    .replace(/%22/g, '"')
    .replace(/%27/g, "'")
    .replace(/%28/g, "(")
    .replace(/%29/g, ")")
    .replace(/%2F/g, "/")
    .replace(/%5C/g, "\\")
    .replace(/%0A/g, "\n")
    .replace(/%0D/g, "")
    .replace(/\+/g, " ");
}

function stripHtml(html) {
  return decodeEntities(
    html
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>/gi, "\n")
      .replace(/<\/div>/gi, "\n")
      .replace(/<[^>]+>/g, "")
  )
    .replace(/\r/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function collectTextFromPageJs(js) {
  const texts = [];
  // text content fields often look like: "text":"...html..."
  const re = /"text"\s*:\s*"((?:\\.|[^"\\])*)"/g;
  let m;
  while ((m = re.exec(js))) {
    let raw = m[1]
      .replace(/\\n/g, "\n")
      .replace(/\\r/g, "")
      .replace(/\\t/g, "\t")
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, "\\")
      .replace(/\\u([0-9a-fA-F]{4})/g, (_, h) => String.fromCharCode(parseInt(h, 16)));
    // heavily encoded percent strings
    let prev = "";
    while (prev !== raw) {
      prev = raw;
      try {
        raw = decodeURIComponent(raw);
      } catch {
        break;
      }
    }
    const cleaned = stripHtml(raw);
    if (cleaned.length > 5) texts.push(cleaned);
  }

  // also pull plain content strings that look like drills (lots of repeated letters)
  const plainRe = /"((?:[a-zA-Z0-9;:'".,!?()&@#$%\-\/ ]{2,}(?:\s+|$)){8,})"/g;
  while ((m = plainRe.exec(js))) {
    const t = m[1].trim();
    if (t.length > 30 && /[a-z]{2,}/i.test(t) && !t.includes("http") && !t.includes("function")) {
      texts.push(t);
    }
  }

  return [...new Set(texts)];
}

const LESSON_URLS = [
  // Beginner
  { tier: "beginner", slug: "beginner-typing-lesson-1a", title: "Beginner Lesson 1(a)", id: "id1711168232395" },
  { tier: "beginner", slug: "beginner-typing-lesson-1b", title: "Beginner Lesson 1(b)", id: "id1535189613075" },
  { tier: "beginner", slug: "beginner-typing-lesson-2a", title: "Beginner Lesson 2(a)", id: "id1535202332484" },
  { tier: "beginner", slug: "beginner-typing-lesson-2b", title: "Beginner Lesson 2(b)", id: "id1535246509249" },
  { tier: "beginner", slug: "beginner-typing-lesson-3", title: "Beginner Lesson 3", id: "id1535253387674" },
  { tier: "beginner", slug: "beginner-typing-lesson-4", title: "Beginner Lesson 4", id: "id1535332774837" },
  { tier: "beginner", slug: "beginner-typing-lesson-5", title: "Beginner Lesson 5", id: "id1535761390274" },
  { tier: "beginner", slug: "beginner-typing-lesson-6", title: "Beginner Lesson 6", id: "id1535774313456" },
  { tier: "beginner", slug: "beginner-typing-lesson-7", title: "Beginner Lesson 7", id: "id1535796382341" },
  // Advanced
  { tier: "advanced", slug: "advanced-typing-lesson 1", title: "Advanced Lesson 1", id: "id1711169843868" },
  { tier: "advanced", slug: "advanced-typing-lessons-2", title: "Advanced Lesson 2", id: "id1537567887489" },
  { tier: "advanced", slug: "advanced-typing-lessons-3", title: "Advanced Lesson 3", id: "id1537587817064" },
  { tier: "advanced", slug: "advanced-typing-lessons-4", title: "Advanced Lesson 4", id: "id1537590905936" },
  { tier: "advanced", slug: "advanced-typing-lessons-5", title: "Advanced Lesson 5", id: "id1537593325275" },
  { tier: "advanced", slug: "advanced-typing-lessons-6", title: "Advanced Lesson 6", id: "id1537594824285" },
  { tier: "advanced", slug: "advanced-typing-lessons-7", title: "Advanced Lesson 7", id: "id1537598873155" },
];

// Also include hub pages which may have first lesson content
const HUB = [
  { tier: "beginner", slug: "beginner-typing-lessons", title: "Beginner Hub / Lesson 1a", id: "id1535176797760" },
  { tier: "advanced", slug: "advanced-typing-lessons", title: "Advanced Hub / Lesson 1", id: "id1535968439422" },
];

async function main() {
  const home = await fetchText("https://learntyping.org/");
  const mapMatch = home.match(/SiteFilesMap\s*=\s*(\{[\s\S]*?\});/);
  if (!mapMatch) throw new Error("SiteFilesMap not found");
  const siteFilesMap = JSON.parse(mapMatch[1]);
  fs.writeFileSync("D:/TypeArena/scripts/learntyping-files-map.json", JSON.stringify(siteFilesMap, null, 2));

  const structure = fs.readFileSync("D:/TypeArena/scripts/learntyping-site-structure.js", "utf8");
  const pagesData = extractPagesData(structure);

  const all = [...HUB, ...LESSON_URLS];
  const results = [];

  for (const lesson of all) {
    const pageKey = `page-${lesson.id}`;
    const jsUrl = siteFilesMap[pageKey];
    const meta = pagesData[lesson.id] || {};
    console.log(`\n=== ${lesson.title} (${lesson.id}) ===`);
    console.log("JS:", jsUrl || "MISSING");
    console.log("Alias:", meta.urlAlias, "| Desc:", (meta.description || "").slice(0, 100));

    if (!jsUrl) {
      results.push({ ...lesson, error: "no js url", texts: [] });
      continue;
    }

    const js = await fetchText(jsUrl);
    fs.writeFileSync(`D:/TypeArena/scripts/lt-pages/${lesson.id}.js`, js);
    const texts = collectTextFromPageJs(js);
    console.log(`Extracted ${texts.length} text blocks, top lengths:`, texts.map((t) => t.length).slice(0, 10));
    // show first few short previews
    for (const t of texts.slice(0, 8)) {
      console.log("---");
      console.log(t.slice(0, 400).replace(/\n/g, " | "));
    }
    results.push({
      ...lesson,
      urlAlias: meta.urlAlias,
      pageTitle: meta.pageTitle || meta.title,
      description: meta.description || "",
      keyWords: meta.keyWords || "",
      texts,
    });
  }

  fs.mkdirSync("D:/TypeArena/scripts/lt-pages", { recursive: true });
  fs.writeFileSync(
    "D:/TypeArena/scripts/learntyping-lessons-raw.json",
    JSON.stringify(results, null, 2)
  );
  console.log("\nWrote learntyping-lessons-raw.json");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
