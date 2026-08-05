import fs from "fs";

function unescapeLight(s) {
  return s
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "")
    .replace(/\\t/g, "\t")
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, "\\")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<\/div>/gi, "\n");
}

function stripTags(html) {
  return html
    .replace(/<[^>]+>/g, "")
    .replace(/\u200b/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function isDrillLine(line) {
  if (!line || line.length < 6) return false;
  if (/https?:\/\//i.test(line)) return false;
  if (/click|video|avatar|testimonial|ebook|copyright|doreen|lesson \d|beginner typing|advanced typing|follow the|thank you|i am |i've |i have |please |watch this/i.test(line)) {
    // allow if clearly a drill of repeated words
    if (!/(\b\w+\b)(?:\s+\1){3,}/.test(line) && !/(.)\1{3,}/.test(line)) return false;
  }

  const tokens = line.split(/\s+/);
  if (tokens.length < 3) return false;

  // Mostly short tokens suitable for typing drills
  const shortRatio = tokens.filter((t) => t.length <= 14).length / tokens.length;
  if (shortRatio < 0.75) return false;

  // Looks like repeated practice pattern OR many short words
  const repeated = /(\b[\w;:'".,!?()&@#$%\-\/]+\b)(?:\s+\1){2,}/.test(line);
  const letterRuns = /(.)\1{2,}/.test(line); // ffff dddd
  const mostlyWords =
    tokens.length >= 5 &&
    tokens.filter((t) => /^[\w;:'".,!?()&@#$%\-\/]+$/.test(t)).length / tokens.length > 0.85;

  // Reject long prose sentences (many function words + no repetition)
  const proseWords = (line.match(/\b(the|and|you|your|with|this|that|will|from|have|been|they|for|are|was|were|but|not|can|just|more|than|about|what|when|which|their|there|would|should|could)\b/gi) || []).length;
  if (proseWords >= 5 && !repeated && !letterRuns) return false;

  return repeated || letterRuns || (mostlyWords && tokens.length >= 6 && proseWords < 4);
}

function extractFromJs(js) {
  const text = unescapeLight(js);
  const drills = [];

  // 1) Georgia font practice lines (primary on learntyping)
  const fontRe = /<font[^>]*>([\s\S]*?)<\/font>/gi;
  let m;
  while ((m = fontRe.exec(text))) {
    const inner = m[1];
    // may contain multiple lines via <br>
    const parts = inner
      .split(/\n+/)
      .map((p) => stripTags(p))
      .filter(Boolean);
    for (const p of parts) {
      if (isDrillLine(p)) drills.push(p);
    }
  }

  // 2) Also any &nbsp; drill-looking lines near inputs
  const nearInput = />([^<>]{8,200})<\s*(?:br|\/p|input)/gi;
  while ((m = nearInput.exec(text))) {
    const p = stripTags(m[1]);
    if (isDrillLine(p)) drills.push(p);
  }

  // 3) span text that looks like drills
  const spanRe = /<span[^>]*>([^<]{10,300})<\/span>/gi;
  while ((m = spanRe.exec(text))) {
    const p = stripTags(m[1]);
    if (isDrillLine(p)) drills.push(p);
  }

  const seen = new Set();
  const unique = [];
  for (const d of drills) {
    const key = d.toLowerCase().replace(/\s+/g, " ");
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(d.replace(/\s+/g, " ").trim());
  }
  return unique;
}

const meta = JSON.parse(fs.readFileSync("D:/TypeArena/scripts/learntyping-drills.json", "utf8"));

const refined = meta.map((lesson) => {
  const path = `D:/TypeArena/scripts/lt-pages/${lesson.id}.js`;
  if (!fs.existsSync(path)) {
    return { ...lesson, drills: [], note: "missing js" };
  }
  const js = fs.readFileSync(path, "utf8");
  const drills = extractFromJs(js);
  console.log(`\n=== ${lesson.title} (${drills.length} drills) ===`);
  drills.slice(0, 12).forEach((d, i) => console.log(`  ${i + 1}. ${d.slice(0, 140)}`));
  return {
    id: lesson.id,
    tier: lesson.tier,
    order: lesson.order,
    code: lesson.code,
    title: lesson.title,
    subtitle: lesson.subtitle,
    targetKeys: lesson.targetKeys,
    fingerGuideHint: lesson.fingerGuideHint,
    fallbackUrl: lesson.fallbackUrl,
    drills,
  };
});

fs.writeFileSync("D:/TypeArena/scripts/learntyping-drills-clean.json", JSON.stringify(refined, null, 2));
console.log("\nWrote clean drills");
