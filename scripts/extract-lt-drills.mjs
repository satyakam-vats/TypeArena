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

function unescapeJsString(s) {
  return s
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "")
    .replace(/\\t/g, "\t")
    .replace(/\\"/g, '"')
    .replace(/\\'/g, "'")
    .replace(/\\\\/g, "\\")
    .replace(/\\u([0-9a-fA-F]{4})/g, (_, h) => String.fromCharCode(parseInt(h, 16)));
}

function decodeHtml(s) {
  return s
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&apos;/gi, "'");
}

function stripTags(html) {
  return decodeHtml(
    html
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/(p|div|li|h[1-6]|tr)>/gi, "\n")
      .replace(/<[^>]+>/g, "")
  );
}

/** Extract practice drill lines from learntyping page JS. */
function extractDrills(js) {
  // Unescape the whole file enough to see HTML
  // Content lives inside heavily escaped HTML strings in text widgets
  const htmlChunks = [];

  // Match long quoted strings that contain font tags or input practice fields
  const strRe = /"((?:\\.|[^"\\]){80,})"/g;
  let m;
  while ((m = strRe.exec(js))) {
    const raw = unescapeJsString(m[1]);
    if (
      raw.includes("<font") ||
      raw.includes("<input") ||
      raw.includes("Georgia") ||
      /[a-z]{2,}\s+[a-z]{2,}\s+[a-z]{2,}/i.test(raw)
    ) {
      htmlChunks.push(raw);
    }
  }

  const plain = htmlChunks.map(stripTags).join("\n");
  const lines = plain
    .split(/\n+/)
    .map((l) => l.replace(/\s+/g, " ").trim())
    .filter(Boolean);

  // Drill lines: mostly repeated letters/words, short tokens, little prose
  const drills = [];
  const instructions = [];

  for (const line of lines) {
    if (line.length < 8) continue;
    if (/https?:\/\//i.test(line)) continue;
    if (/copyright|doreen|learn typing|cookie|privacy/i.test(line)) continue;

    // Count ratio of short "typing tokens"
    const tokens = line.split(/\s+/);
    const shortTokens = tokens.filter((t) => t.length <= 12 && /^[\w;:'".,!?()&@#$%\-\/]+$/.test(t));
    const letterHeavy = (line.match(/[a-zA-Z]/g) || []).length / line.length;
    const hasRepeatPattern =
      /(.)\1{2,}/.test(line) || // ffff dddd
      /(\b\w+\b)(?:\s+\1){2,}/.test(line) || // asdf asdf asdf
      tokens.length >= 6;

    const looksLikeProse =
      /\b(the|and|you|your|with|this|that|will|from|learn|type|finger|should|practice|keyboard|hands?|keys?)\b/i.test(
        line
      ) && tokens.filter((t) => t.length > 5).length >= 4;

    if (looksLikeProse && !hasRepeatPattern) {
      if (line.length > 30 && line.length < 400) instructions.push(line);
      continue;
    }

    if (hasRepeatPattern && letterHeavy > 0.4 && shortTokens.length >= 4) {
      drills.push(line);
    } else if (
      // pure drill lines like "ffff dddd ssss aaaa"
      /^[a-zA-Z0-9;:'".,!?()&@#$%\-\/\s]+$/.test(line) &&
      tokens.length >= 4 &&
      shortTokens.length / tokens.length > 0.7 &&
      !looksLikeProse
    ) {
      drills.push(line);
    }
  }

  // Also pull content directly from <font ...>DRILL</font> patterns in raw JS
  const fontRe = /<font[^>]*>([\s\S]*?)<\/font>/gi;
  const fullUnescaped = js; // search raw too after light unescape of common sequences
  const lightly = js
    .replace(/\\n/g, "\n")
    .replace(/\\"/g, '"')
    .replace(/&nbsp;/g, " ")
    .replace(/<br\s*\/?>/gi, "\n");

  while ((m = fontRe.exec(lightly))) {
    const t = stripTags(m[1]).replace(/\s+/g, " ").trim();
    if (t.length >= 8 && !drills.includes(t)) {
      const tokens = t.split(/\s+/);
      if (tokens.length >= 3 && tokens.every((x) => x.length <= 20)) {
        drills.push(t);
      }
    }
  }

  // Dedupe while preserving order
  const seen = new Set();
  const uniqueDrills = [];
  for (const d of drills) {
    const key = d.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    uniqueDrills.push(d);
  }

  return {
    drills: uniqueDrills,
    instructions: [...new Set(instructions)].slice(0, 20),
    sampleLines: lines.slice(0, 40),
  };
}

const LESSONS = [
  {
    id: "id1535176797760",
    tier: "beginner",
    order: 1,
    code: "1a",
    title: "Beginner Lesson 1(a)",
    subtitle: "Home row keys: A S D F J K L ;",
    targetKeys: ["a", "s", "d", "f", "j", "k", "l", ";", "space"],
    fingerGuideHint:
      "Rest left fingers on A S D F and right fingers on J K L ;. Thumbs on spacebar. Feel the bumps on F and J.",
    fallbackUrl: "beginner-typing-lessons",
  },
  {
    id: "id1711168232395",
    tier: "beginner",
    order: 1,
    code: "1a-alt",
    title: "Beginner Lesson 1(a) Practice",
    subtitle: "Home row keys continued",
    targetKeys: ["a", "s", "d", "f", "j", "k", "l", ";", "space"],
    fingerGuideHint: "Keep fingers on the home row. Eyes on the screen, not the keyboard.",
    fallbackUrl: "beginner-typing-lesson-1a",
  },
  {
    id: "id1535189613075",
    tier: "beginner",
    order: 2,
    code: "1b",
    title: "Beginner Lesson 1(b)",
    subtitle: "Vowels E, U, I and letter R",
    targetKeys: ["e", "u", "i", "r", "a", "s", "d", "f", "j", "k", "l", "space"],
    fingerGuideHint: "Reach up to E (left middle), R (left index), U (right index), I (right middle). Return to home row after each key.",
    fallbackUrl: "beginner-typing-lesson-1b",
  },
  {
    id: "id1535202332484",
    tier: "beginner",
    order: 3,
    code: "2a",
    title: "Beginner Lesson 2(a)",
    subtitle: "Key letters G and H",
    targetKeys: ["g", "h", "a", "s", "d", "f", "j", "k", "l", "space"],
    fingerGuideHint: "Left index reaches right to G; right index reaches left to H. Always return to F and J.",
    fallbackUrl: "beginner-typing-lesson-2a",
  },
  {
    id: "id1535246509249",
    tier: "beginner",
    order: 4,
    code: "2b",
    title: "Beginner Lesson 2(b)",
    subtitle: "Letters W, T, O, Y (plus S, L)",
    targetKeys: ["w", "t", "o", "y", "s", "l", "space"],
    fingerGuideHint: "Left ring to W, left index up to T, right ring to O, right index up-left to Y.",
    fallbackUrl: "beginner-typing-lesson-2b",
  },
  {
    id: "id1535253387674",
    tier: "beginner",
    order: 5,
    code: "3",
    title: "Beginner Lesson 3",
    subtitle: "Bottom row: V, B, N, M",
    targetKeys: ["v", "b", "n", "m", "space"],
    fingerGuideHint: "Left index down to V and further to B; right index down to N and M. Keep other fingers on home row.",
    fallbackUrl: "beginner-typing-lesson-3",
  },
  {
    id: "id1535332774837",
    tier: "beginner",
    order: 6,
    code: "4",
    title: "Beginner Lesson 4",
    subtitle: "Capitals with Shift keys + letter C",
    targetKeys: ["c", "Shift", "space"],
    fingerGuideHint: "Use the opposite pinky for Shift when capitalizing. Left middle reaches down to C.",
    fallbackUrl: "beginner-typing-lesson-4",
  },
  {
    id: "id1535761390274",
    tier: "beginner",
    order: 7,
    code: "5",
    title: "Beginner Lesson 5",
    subtitle: "Letters A, P, Q, Z, X",
    targetKeys: ["a", "p", "q", "z", "x", "space"],
    fingerGuideHint: "Pinkies handle Q, A, Z, P, and often X reaches. Stay light on the keys.",
    fallbackUrl: "beginner-typing-lesson-5",
  },
  {
    id: "id1535774313456",
    tier: "beginner",
    order: 8,
    code: "6",
    title: "Beginner Lesson 6",
    subtitle: "Punctuation: , . ; ? - ( ) \" !",
    targetKeys: [",", ".", ";", "?", "-", "(", ")", '"', "!", "space"],
    fingerGuideHint: "Right hand handles most punctuation. Use Shift with the opposite pinky for ? ! \" ( ).",
    fallbackUrl: "beginner-typing-lesson-6",
  },
  {
    id: "id1535796382341",
    tier: "beginner",
    order: 9,
    code: "7",
    title: "Beginner Lesson 7",
    subtitle: "Common letter combinations for speed",
    targetKeys: ["a", "e", "i", "o", "u", "t", "h", "n", "s", "r", "space"],
    fingerGuideHint: "Type common digraphs as single smooth motions. Accuracy first, then rhythm.",
    fallbackUrl: "beginner-typing-lesson-7",
  },
  // Advanced
  {
    id: "id1535968439422",
    tier: "advanced",
    order: 1,
    code: "1",
    title: "Advanced Lesson 1",
    subtitle: "Common letter combinations",
    targetKeys: ["t", "h", "e", "i", "n", "g", "s", "r", "space"],
    fingerGuideHint: "Build automatic combos: th, he, in, er, an, re, on, at, en, nd.",
    fallbackUrl: "advanced-typing-lessons",
  },
  {
    id: "id1711169843868",
    tier: "advanced",
    order: 1,
    code: "1-alt",
    title: "Advanced Lesson 1 Practice",
    subtitle: "Common letter combinations continued",
    targetKeys: ["t", "h", "e", "i", "n", "g", "s", "r", "space"],
    fingerGuideHint: "Keep an even cadence. Do not look down at the keys.",
    fallbackUrl: "advanced-typing-lesson 1",
  },
  {
    id: "id1537567887489",
    tier: "advanced",
    order: 2,
    code: "2",
    title: "Advanced Lesson 2",
    subtitle: "Left and right Shift keys",
    targetKeys: ["Shift", "A", "B", "C", "space"],
    fingerGuideHint: "Capitalize left-hand letters with right Shift, and right-hand letters with left Shift.",
    fallbackUrl: "advanced-typing-lessons-2",
  },
  {
    id: "id1537587817064",
    tier: "advanced",
    order: 3,
    code: "3",
    title: "Advanced Lesson 3",
    subtitle: "Left hand key focus",
    targetKeys: ["q", "w", "e", "r", "t", "a", "s", "d", "f", "g", "z", "x", "c", "v", "b", "space"],
    fingerGuideHint: "Emphasize left-hand reaches while the right hand anchors on home row / Shift.",
    fallbackUrl: "advanced-typing-lessons-3",
  },
  {
    id: "id1537590905936",
    tier: "advanced",
    order: 4,
    code: "4",
    title: "Advanced Lesson 4",
    subtitle: "Right hand key focus",
    targetKeys: ["y", "u", "i", "o", "p", "h", "j", "k", "l", ";", "n", "m", ",", ".", "/", "space"],
    fingerGuideHint: "Emphasize right-hand reaches while the left hand anchors on home row / Shift.",
    fallbackUrl: "advanced-typing-lessons-4",
  },
  {
    id: "id1537593325275",
    tier: "advanced",
    order: 5,
    code: "5",
    title: "Advanced Lesson 5",
    subtitle: "Alternate left and right hand drills",
    targetKeys: ["a", "s", "d", "f", "j", "k", "l", ";", "space"],
    fingerGuideHint: "Alternate hands smoothly. Short words then longer words to build flow.",
    fallbackUrl: "advanced-typing-lessons-5",
  },
  {
    id: "id1537594824285",
    tier: "advanced",
    order: 6,
    code: "6",
    title: "Advanced Lesson 6",
    subtitle: "Numbers and special characters (& % @ $)",
    targetKeys: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "&", "%", "@", "$", "space"],
    fingerGuideHint: "Reach to the number row without lifting wrists. Use Shift for symbols above numbers.",
    fallbackUrl: "advanced-typing-lessons-6",
  },
  {
    id: "id1537598873155",
    tier: "advanced",
    order: 7,
    code: "7",
    title: "Advanced Lesson 7",
    subtitle: "Focus on numbers",
    targetKeys: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "space"],
    fingerGuideHint: "Map each number to its home-row finger. Return to home keys after every number.",
    fallbackUrl: "advanced-typing-lessons-7",
  },
];

async function ensurePageJs(id, siteFilesMap) {
  const dir = "D:/TypeArena/scripts/lt-pages";
  fs.mkdirSync(dir, { recursive: true });
  const path = `${dir}/${id}.js`;
  if (fs.existsSync(path) && fs.statSync(path).size > 1000) {
    return fs.readFileSync(path, "utf8");
  }
  const url = siteFilesMap[`page-${id}`];
  if (!url) throw new Error(`No URL for ${id}`);
  console.log("Downloading", id, url);
  const js = await fetchText(url);
  fs.writeFileSync(path, js);
  return js;
}

async function main() {
  let siteFilesMap;
  const mapPath = "D:/TypeArena/scripts/learntyping-files-map.json";
  if (fs.existsSync(mapPath)) {
    siteFilesMap = JSON.parse(fs.readFileSync(mapPath, "utf8"));
  } else {
    const home = await fetchText("https://learntyping.org/");
    const mapMatch = home.match(/SiteFilesMap\s*=\s*(\{[\s\S]*?\});/);
    siteFilesMap = JSON.parse(mapMatch[1]);
    fs.writeFileSync(mapPath, JSON.stringify(siteFilesMap, null, 2));
  }

  const extracted = [];
  for (const lesson of LESSONS) {
    try {
      const js = await ensurePageJs(lesson.id, siteFilesMap);
      const { drills, instructions, sampleLines } = extractDrills(js);
      console.log(`\n=== ${lesson.title} === drills:${drills.length} instr:${instructions.length}`);
      drills.slice(0, 6).forEach((d, i) => console.log(`  D${i + 1}: ${d.slice(0, 120)}`));
      extracted.push({ ...lesson, drills, instructions, sampleLines: sampleLines.slice(0, 15) });
    } catch (e) {
      console.error("FAIL", lesson.id, e.message);
      extracted.push({ ...lesson, drills: [], instructions: [], error: e.message });
    }
  }

  fs.writeFileSync(
    "D:/TypeArena/scripts/learntyping-drills.json",
    JSON.stringify(extracted, null, 2)
  );
  console.log("\nWrote learntyping-drills.json");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
