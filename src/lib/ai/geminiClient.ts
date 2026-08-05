import type { CompletedRun } from "../../types/typing";

const API_KEY_STORAGE_KEY = "typearena_gemini_api_key";

export function getGeminiApiKey(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(API_KEY_STORAGE_KEY);
}

export function setGeminiApiKey(key: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(API_KEY_STORAGE_KEY, key);
}

export function clearGeminiApiKey(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(API_KEY_STORAGE_KEY);
}

export function hasGeminiApiKey(): boolean {
  return !!getGeminiApiKey();
}

export type GeminiCoachResult = {
  summary: string;
  diagnosis: string;
  actionPlan: string[];
  drillText: string;
  encouragement: string;
  skillLevel: "beginner" | "intermediate" | "advanced" | "expert";
};

/* Models to try in order of preference (free tier availability varies by region). */
const MODELS = [
  "gemini-2.0-flash-lite",
  "gemini-2.0-flash",
  "gemini-1.5-flash",
];

export async function generateGeminiAnalysis(run: CompletedRun): Promise<GeminiCoachResult | null> {
  const apiKey = getGeminiApiKey();
  if (!apiKey) return null;

  try {
    const { wpm, rawWpm, accuracy, consistency, durationMs, samples, maxCombo } = run.metrics;
    const keyErrors = run.metrics.keyErrors || {};
    const keyTotals = run.metrics.keyTotals || {};

    const weakKeysArr = Object.entries(keyErrors)
      .map(([key, errCount]) => {
        const total = keyTotals[key] || errCount || 1;
        return { key, errCount: errCount as number, rate: (errCount as number) / total };
      })
      .sort((a, b) => b.rate - a.rate || b.errCount - a.errCount)
      .slice(0, 5)
      .map((k) => `${k.key} (${k.errCount} errors)`);

    const weakKeysString = weakKeysArr.length > 0 ? weakKeysArr.join(", ") : "None detected — perfect accuracy this run";

    const samplesStr = (samples || [])
      .slice(-10)
      .map((s) => `[${Math.round(s.elapsedMs / 1000)}s: ${Math.round(s.wpm)}wpm]`)
      .join(", ") || "No samples";

    const prompt = `You are an expert typing coach for TypeArena, a premium typing test app. Analyze this completed typing run and provide actionable feedback.

Data from the run:
- WPM: ${Math.round(wpm)}
- Raw WPM: ${Math.round(rawWpm)}
- Accuracy: ${accuracy.toFixed(1)}%
- Consistency: ${consistency.toFixed(1)}%
- Duration: ${Math.round(durationMs / 1000)}s
- Max Combo: ${maxCombo || "N/A"}
- Weak Keys: ${weakKeysString}
- Recent WPM samples: ${samplesStr}

Respond with ONLY a valid JSON object (no markdown, no code fences, no extra text). Use this exact structure:

{
  "summary": "2-3 sentence personalized analysis of this specific test performance",
  "diagnosis": "What specific technique issues were detected based on the data",
  "actionPlan": ["Specific actionable step 1", "Specific actionable step 2", "Specific actionable step 3"],
  "drillText": "Write a 25-30 word practice passage using common English words. If weak keys were found, include words that use those keys heavily. Write natural sentences, not random words.",
  "encouragement": "A brief motivational message",
  "skillLevel": "one of: beginner, intermediate, advanced, expert"
}`;

    // Try each model until one works
    let lastError = "";
    for (const model of MODELS) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
          }),
        });

        if (!response.ok) {
          lastError = `${model}: HTTP ${response.status}`;
          console.warn(`Gemini model ${model} failed:`, response.status);
          continue; // try next model
        }

        const data = await response.json();
        const content = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!content) {
          lastError = `${model}: empty response`;
          console.warn(`Gemini model ${model}: no content in response`);
          continue;
        }

        // Strip markdown code fences if present
        const cleanContent = content
          .replace(/^```(?:json)?\s*/i, "")
          .replace(/\s*```\s*$/i, "")
          .trim();

        const parsed = JSON.parse(cleanContent) as GeminiCoachResult;

        // Validate required fields
        if (!parsed.summary || !parsed.actionPlan) {
          lastError = `${model}: invalid JSON structure`;
          console.warn(`Gemini model ${model}: parsed but missing required fields`);
          continue;
        }

        // Normalize skillLevel
        const validLevels = ["beginner", "intermediate", "advanced", "expert"];
        if (!validLevels.includes(parsed.skillLevel)) {
          parsed.skillLevel = wpm >= 100 ? "expert" : wpm >= 70 ? "advanced" : wpm >= 40 ? "intermediate" : "beginner";
        }

        // Ensure actionPlan is an array
        if (!Array.isArray(parsed.actionPlan)) {
          parsed.actionPlan = [String(parsed.actionPlan)];
        }

        return parsed;
      } catch (modelErr) {
        lastError = `${model}: ${modelErr}`;
        console.warn(`Gemini model ${model} error:`, modelErr);
        continue;
      }
    }

    console.error("All Gemini models failed. Last error:", lastError);
    return null;
  } catch (error) {
    console.error("Error generating Gemini analysis:", error);
    return null;
  }
}
