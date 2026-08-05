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

export async function generateGeminiAnalysis(run: CompletedRun): Promise<GeminiCoachResult | null> {
  const apiKey = getGeminiApiKey();
  if (!apiKey) return null;

  try {
    const { wpm, rawWpm, accuracy, consistency, durationMs, samples, keyErrors, keyTotals, maxCombo } = run.metrics;
    
    const weakKeysArr = Object.entries(keyErrors)
      .map(([key, errCount]) => {
        const total = keyTotals[key] || errCount;
        return { key, errCount, rate: errCount / total };
      })
      .sort((a, b) => b.rate - a.rate || b.errCount - a.errCount)
      .slice(0, 5)
      .map((k) => `${k.key} (${k.errCount} errors)`);
      
    const weakKeysString = weakKeysArr.length > 0 ? weakKeysArr.join(", ") : "None";

    const samplesStr = samples
      .slice(-10)
      .map((s) => `[${Math.round(s.elapsedMs / 1000)}s: ${Math.round(s.wpm)}wpm]`)
      .join(", ");

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

Analyze the user's typing technique, speed, and accuracy based on these metrics.
Generate a JSON object with this exact structure (do NOT use markdown formatting or code blocks around the JSON, just return raw valid JSON):

{
  "summary": "2-3 sentence personalized analysis",
  "diagnosis": "What specific technique issues were detected",
  "actionPlan": ["Step 1", "Step 2", "Step 3"],
  "drillText": "A 25-30 word practice text focusing heavily on the weak keys identified. Do not just list the keys, write actual sentences containing them.",
  "encouragement": "A motivational one-liner",
  "skillLevel": "beginner" | "intermediate" | "advanced" | "expert"
}`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }]
          }
        ],
        generationConfig: {
          response_mime_type: "application/json",
        }
      }),
    });

    if (!response.ok) {
      console.error("Gemini API Error:", response.status, await response.text());
      return null;
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!content) {
      console.error("No content from Gemini");
      return null;
    }

    const cleanContent = content.replace(/^```json\s*/i, "").replace(/\s*```$/i, "").trim();
    const parsed = JSON.parse(cleanContent) as GeminiCoachResult;
    
    return parsed;
  } catch (error) {
    console.error("Error generating Gemini analysis:", error);
    return null;
  }
}
