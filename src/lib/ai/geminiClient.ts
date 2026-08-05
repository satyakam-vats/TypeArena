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
  source?: "gemini" | "local-ai";
};

/* Standard Gemini API models supported across all regions */
const MODELS = [
  "gemini-1.5-flash",
  "gemini-1.5-pro",
  "gemini-2.0-flash-exp",
];

/**
 * 100% Reliable Local AI Analysis Generator.
 * Used as an instant fallback whenever network/VPN/CORS or API key issues prevent direct Gemini API calls.
 */
export function generateFallbackAiAnalysis(run: CompletedRun): GeminiCoachResult {
  const { wpm, rawWpm, accuracy, consistency, durationMs, keyErrors } = run.metrics;

  // Skill level determination
  let skillLevel: "beginner" | "intermediate" | "advanced" | "expert" = "beginner";
  if (wpm >= 100) skillLevel = "expert";
  else if (wpm >= 70) skillLevel = "advanced";
  else if (wpm >= 45) skillLevel = "intermediate";

  // Identify weak keys
  const weakKeys = Object.entries(keyErrors || {})
    .map(([key, errCount]) => ({ key, errCount: errCount as number }))
    .sort((a, b) => b.errCount - a.errCount)
    .slice(0, 3)
    .map((k) => k.key);

  const gap = rawWpm - wpm;

  // Generate smart summary
  let summary = "";
  if (accuracy >= 98 && wpm > 60) {
    summary = `Exceptional precision! You hit ${wpm} WPM with a pristine ${accuracy}% accuracy rating over ${Math.round(durationMs / 1000)} seconds. Your muscle memory is extremely consistent.`;
  } else if (gap > 12) {
    summary = `High raw finger speed (${rawWpm} WPM), but frequent backspacing cost you ${gap} WPM in net speed. Focus on typing smoothly without hitting backspace.`;
  } else if (accuracy < 92) {
    summary = `Current accuracy is ${accuracy}%. Pushing speed before mastering key accuracy is creating hesitation. Slow down by 10% to build clean muscle memory.`;
  } else {
    summary = `Balanced run at ${wpm} WPM and ${accuracy}% accuracy. Your consistency score of ${consistency}% shows steady pacing across the test duration.`;
  }

  // Generate diagnosis
  let diagnosis = "";
  if (weakKeys.length > 0) {
    diagnosis = `Key errors concentrated on "${weakKeys.join('", "')}". Finger positioning or reach on these specific keys is causing minor stumbles during high-speed transitions.`;
  } else if (consistency < 70) {
    diagnosis = `Speed fluctuations detected (${consistency}% consistency). Your typing rhythm varies between easy and difficult word combinations.`;
  } else {
    diagnosis = `Clean execution across the text. No major finger technique bottlenecks detected in this test.`;
  }

  // Generate action plan
  const actionPlan: string[] = [];
  if (gap > 10) {
    actionPlan.push("Resist the urge to immediately hit backspace on minor typos — maintain forward momentum.");
  } else {
    actionPlan.push("Keep your fingers rested lightly on the home row to reduce reach distance.");
  }

  if (weakKeys.length > 0) {
    actionPlan.push(`Run targeted practice drills focusing on key combinations with "${weakKeys.join('", "')}".`);
  } else {
    actionPlan.push("Maintain steady breathing and relax your wrists to sustain high WPM without tension.");
  }

  if (accuracy < 95) {
    actionPlan.push("Prioritize 98%+ accuracy on your next 3 tests before trying to push raw speed higher.");
  } else {
    actionPlan.push("Gradually push your tempo on simple words while maintaining your current accuracy standard.");
  }

  // Generate custom drill text targeting weak keys
  let drillText = "";
  if (weakKeys.length > 0) {
    const k1 = weakKeys[0] || "t";
    const k2 = weakKeys[1] || "e";
    drillText = `the ${k1}quick brown fox jumps over the lazy dog. practice making clean key transitions with ${k1} and ${k2} to build smooth finger muscle memory.`;
  } else {
    drillText = "swift typing requires clear rhythm and relaxed hands. focus on hitting every single key with light equal pressure across all words.";
  }

  // Encouragement
  let encouragement = "";
  if (wpm >= 100) encouragement = "Triple digit speed! You're operating at elite levels. 🏆";
  else if (wpm >= 70) encouragement = "Great rhythm and speed! You're in the top tier of typists. 🔥";
  else encouragement = "Every test refines your muscle memory. Great effort! 💪";

  return {
    summary,
    diagnosis,
    actionPlan,
    drillText,
    encouragement,
    skillLevel,
    source: "local-ai",
  };
}

export async function generateGeminiAnalysis(run: CompletedRun): Promise<GeminiCoachResult> {
  const apiKey = getGeminiApiKey();

  // If no user API key, return the instant smart local AI analysis right away
  if (!apiKey) {
    return generateFallbackAiAnalysis(run);
  }

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

    const prompt = `You are an expert typing coach for TypeArena. Analyze this completed typing run and provide actionable feedback.

Data:
- WPM: ${Math.round(wpm)}
- Raw WPM: ${Math.round(rawWpm)}
- Accuracy: ${accuracy.toFixed(1)}%
- Consistency: ${consistency.toFixed(1)}%
- Duration: ${Math.round(durationMs / 1000)}s
- Max Combo: ${maxCombo || "N/A"}
- Weak Keys: ${weakKeysString}
- WPM samples: ${samplesStr}

Respond with ONLY a raw JSON object (no markdown formatting, no code block backticks):
{
  "summary": "2-3 sentence personalized analysis of this test",
  "diagnosis": "Specific technique issues detected",
  "actionPlan": ["Step 1", "Step 2", "Step 3"],
  "drillText": "A 25-30 word practice text focusing on weak keys",
  "encouragement": "A motivational sentence",
  "skillLevel": "beginner"
}`;

    // Try models sequentially
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
          continue;
        }

        const data = await response.json();
        const content = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!content) {
          lastError = `${model}: empty response`;
          continue;
        }

        const cleanContent = content
          .replace(/^```(?:json)?\s*/i, "")
          .replace(/\s*```\s*$/i, "")
          .trim();

        const parsed = JSON.parse(cleanContent) as GeminiCoachResult;

        if (!parsed.summary || !parsed.actionPlan) {
          lastError = `${model}: invalid JSON structure`;
          continue;
        }

        const validLevels = ["beginner", "intermediate", "advanced", "expert"];
        if (!validLevels.includes(parsed.skillLevel)) {
          parsed.skillLevel = wpm >= 100 ? "expert" : wpm >= 70 ? "advanced" : wpm >= 45 ? "intermediate" : "beginner";
        }

        if (!Array.isArray(parsed.actionPlan)) {
          parsed.actionPlan = [String(parsed.actionPlan)];
        }

        parsed.source = "gemini";
        return parsed;
      } catch (modelErr) {
        lastError = `${model}: ${modelErr}`;
        console.warn(`Gemini model ${model} error:`, modelErr);
        continue;
      }
    }

    console.warn("Gemini API call failed or blocked by network/VPN. Using local AI analysis fallback. Error:", lastError);
    return generateFallbackAiAnalysis(run);
  } catch (error) {
    console.warn("Gemini exception. Using local AI analysis fallback:", error);
    return generateFallbackAiAnalysis(run);
  }
}
