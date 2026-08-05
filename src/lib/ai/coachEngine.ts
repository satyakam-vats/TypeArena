/* ───────────────────────────────────────────────────────────────────
 *  TypeArena – Local AI Coach Engine
 *  Generates personalized typing insights with ZERO API calls.
 *  Pure algorithmic analysis of run data + history.
 * ─────────────────────────────────────────────────────────────────── */

import type { CompletedRun, WpmSample } from "../../types/typing";
import type { CoachAnalysis, CoachInsight, RunSummary, TypingProfile } from "./types";
import { getStoredRuns, getAllTimeKeyStatsFromStorage } from "../storage/analyticsStorage";

// ── Profile Builder ────────────────────────────────────────────────

export function buildTypingProfile(): TypingProfile {
  const runs = getStoredRuns().slice(0, 30);
  const summaries: RunSummary[] = runs.map((r) => ({
    wpm: r.metrics.wpm,
    rawWpm: r.metrics.rawWpm,
    accuracy: r.metrics.accuracy,
    consistency: r.metrics.consistency,
    durationMs: r.metrics.durationMs,
    completedAt: r.completedAt,
    maxCombo: r.metrics.maxCombo,
  }));

  const wpms = summaries.map((s) => s.wpm);
  const accs = summaries.map((s) => s.accuracy);

  return {
    recentRuns: summaries,
    avgWpm: wpms.length ? Math.round(wpms.reduce((a, b) => a + b, 0) / wpms.length) : 0,
    avgAccuracy: accs.length ? +(accs.reduce((a, b) => a + b, 0) / accs.length).toFixed(1) : 0,
    bestWpm: wpms.length ? Math.max(...wpms) : 0,
    trend: detectTrend(wpms),
    totalTests: runs.length,
  };
}

function detectTrend(wpms: number[]): "improving" | "stable" | "declining" {
  if (wpms.length < 5) return "stable";
  const recent5 = wpms.slice(0, 5);
  const older5 = wpms.slice(5, 10);
  if (older5.length < 3) return "stable";
  const avgRecent = recent5.reduce((a, b) => a + b, 0) / recent5.length;
  const avgOlder = older5.reduce((a, b) => a + b, 0) / older5.length;
  const diff = avgRecent - avgOlder;
  if (diff > 3) return "improving";
  if (diff < -3) return "declining";
  return "stable";
}

// ── Main Analysis Entry Point ──────────────────────────────────────

export function analyzeRun(run: CompletedRun): CoachAnalysis {
  const profile = buildTypingProfile();
  const insights: CoachInsight[] = [];

  // 1. Speed analysis
  analyzeSpeed(run, profile, insights);

  // 2. Accuracy analysis
  analyzeAccuracy(run, profile, insights);

  // 3. Consistency / rhythm analysis
  analyzeConsistency(run, insights);

  // 4. Fatigue / endurance analysis
  analyzeFatigue(run, insights);

  // 5. Weak key analysis
  analyzeWeakKeys(run, insights);

  // 6. Combo / streak analysis
  analyzeCombo(run, insights);

  // 7. Trend analysis (compare to history)
  analyzeTrend(run, profile, insights);

  // Sort by priority, cap at 4
  insights.sort((a, b) => a.priority - b.priority);
  const topInsights = insights.slice(0, 4);

  return {
    insights: topInsights,
    encouragement: pickEncouragement(run, profile),
    focusArea: pickFocusArea(topInsights),
  };
}

// ── Speed Analysis ─────────────────────────────────────────────────

function analyzeSpeed(run: CompletedRun, profile: TypingProfile, out: CoachInsight[]) {
  const { wpm, rawWpm } = run.metrics;

  // Raw vs net WPM gap (indicates lots of backspacing)
  const gap = rawWpm - wpm;
  if (gap > 15) {
    out.push({
      emoji: "🔄",
      category: "technique",
      title: "Heavy backspacing detected",
      detail: `Your raw speed is ${rawWpm} WPM but net is ${wpm} WPM — a ${gap} WPM gap from corrections.`,
      actionable: "Try slowing down slightly. Fewer corrections = higher net speed than raw typing fast.",
      priority: 1,
    });
  }

  // New personal best
  if (profile.bestWpm > 0 && wpm > profile.bestWpm && profile.totalTests > 2) {
    out.push({
      emoji: "🏆",
      category: "speed",
      title: "New personal best!",
      detail: `${wpm} WPM beats your previous record of ${profile.bestWpm} WPM.`,
      actionable: "Keep this momentum. Your muscle memory is leveling up.",
      priority: 3,
    });
  }

  // Below average performance
  if (profile.avgWpm > 0 && wpm < profile.avgWpm - 10 && profile.totalTests > 3) {
    out.push({
      emoji: "📉",
      category: "speed",
      title: "Below your average today",
      detail: `${wpm} WPM is ${profile.avgWpm - wpm} WPM below your recent average of ${profile.avgWpm}.`,
      actionable: "Might be fatigue or distraction. Try a warm-up test first next time.",
      priority: 2,
    });
  }
}

// ── Accuracy Analysis ──────────────────────────────────────────────

function analyzeAccuracy(run: CompletedRun, profile: TypingProfile, out: CoachInsight[]) {
  const { accuracy, incorrect, extra } = run.metrics;

  if (accuracy < 90) {
    out.push({
      emoji: "🎯",
      category: "accuracy",
      title: "Accuracy needs attention",
      detail: `${accuracy}% accuracy with ${incorrect} wrong and ${extra} extra characters.`,
      actionable: "Focus on hitting the right keys first. Speed will follow naturally once accuracy is above 95%.",
      priority: 1,
    });
  } else if (accuracy >= 98 && run.metrics.wpm > 50) {
    out.push({
      emoji: "💎",
      category: "accuracy",
      title: "Exceptional accuracy",
      detail: `${accuracy}% accuracy at ${run.metrics.wpm} WPM is excellent precision.`,
      actionable: "Your accuracy is solid — try pushing speed a bit. You have room to make a few more mistakes.",
      priority: 3,
    });
  }

  // Speed vs accuracy tradeoff
  if (profile.avgAccuracy > 0 && accuracy < profile.avgAccuracy - 5 && run.metrics.wpm > profile.avgWpm + 5) {
    out.push({
      emoji: "⚖️",
      category: "technique",
      title: "Trading accuracy for speed",
      detail: `You're ${(run.metrics.wpm - profile.avgWpm).toFixed(0)} WPM faster than average but ${(profile.avgAccuracy - accuracy).toFixed(1)}% less accurate.`,
      actionable: "Find your sweet spot — the best WPM is the fastest one you can sustain at 95%+ accuracy.",
      priority: 2,
    });
  }
}

// ── Consistency / Rhythm ───────────────────────────────────────────

function analyzeConsistency(run: CompletedRun, out: CoachInsight[]) {
  const { consistency, samples } = run.metrics;

  if (consistency < 70 && samples.length > 3) {
    const wpms = samples.map((s) => s.wpm);
    const maxWpm = Math.max(...wpms);
    const minWpm = Math.min(...wpms);

    out.push({
      emoji: "🌊",
      category: "rhythm",
      title: "Uneven typing rhythm",
      detail: `Your speed swung between ${minWpm} and ${maxWpm} WPM (${consistency}% consistency).`,
      actionable: "Practice with a metronome mindset — aim for steady pace over bursts of speed.",
      priority: 1,
    });
  } else if (consistency >= 90) {
    out.push({
      emoji: "🎵",
      category: "rhythm",
      title: "Rock-solid rhythm",
      detail: `${consistency}% consistency — your typing cadence is very even.`,
      actionable: "Great rhythm! Now gradually push the tempo while maintaining this consistency.",
      priority: 3,
    });
  }
}

// ── Fatigue / Endurance ────────────────────────────────────────────

function analyzeFatigue(run: CompletedRun, out: CoachInsight[]) {
  const samples = run.metrics.samples;
  if (samples.length < 4) return;

  const mid = Math.floor(samples.length / 2);
  const firstHalf = samples.slice(0, mid);
  const secondHalf = samples.slice(mid);

  const avgFirst = firstHalf.reduce((s, p) => s + p.wpm, 0) / firstHalf.length;
  const avgSecond = secondHalf.reduce((s, p) => s + p.wpm, 0) / secondHalf.length;
  const drop = avgFirst - avgSecond;

  if (drop > 10) {
    out.push({
      emoji: "🔋",
      category: "endurance",
      title: "Fatigue detected in second half",
      detail: `Speed dropped from ~${Math.round(avgFirst)} WPM to ~${Math.round(avgSecond)} WPM in the second half (${Math.round(drop)} WPM decline).`,
      actionable: "Your fingers tire mid-test. Try shorter tests to build speed, then gradually increase duration.",
      priority: 1,
    });
  } else if (drop < -8) {
    out.push({
      emoji: "🚀",
      category: "endurance",
      title: "Strong finish — you speed up over time",
      detail: `You went from ~${Math.round(avgFirst)} WPM to ~${Math.round(avgSecond)} WPM — a warm-up effect.`,
      actionable: "You perform better once warmed up. Do a quick throwaway test before important ones.",
      priority: 3,
    });
  }
}

// ── Weak Keys ──────────────────────────────────────────────────────

function analyzeWeakKeys(run: CompletedRun, out: CoachInsight[]) {
  const { keyErrors, keyTotals } = run.metrics;
  if (!keyErrors || !keyTotals) return;

  // Also check all-time stats for persistent weaknesses
  const allTime = getAllTimeKeyStatsFromStorage();

  const weakKeys: { key: string; errorRate: number; isAllTime: boolean }[] = [];

  // This run's weak keys
  for (const [key, errors] of Object.entries(keyErrors)) {
    const total = keyTotals[key] || 1;
    const rate = errors / total;
    if (rate > 0.15 && total >= 3) {
      weakKeys.push({ key, errorRate: rate, isAllTime: false });
    }
  }

  // Persistent all-time weak keys
  for (const [key, errors] of Object.entries(allTime.keyErrors)) {
    const total = allTime.keyTotals[key] || 1;
    const rate = errors / total;
    if (rate > 0.12 && total >= 10 && !weakKeys.find((w) => w.key === key)) {
      weakKeys.push({ key, errorRate: rate, isAllTime: true });
    }
  }

  weakKeys.sort((a, b) => b.errorRate - a.errorRate);

  if (weakKeys.length > 0) {
    const top3 = weakKeys.slice(0, 3);
    const keyList = top3.map((k) => `"${k.key}" (${Math.round(k.errorRate * 100)}% error rate)`).join(", ");
    const persistent = top3.some((k) => k.isAllTime);

    out.push({
      emoji: "⌨️",
      category: "technique",
      title: persistent ? "Persistent weak keys" : "Weak keys this test",
      detail: `Your trickiest keys: ${keyList}.`,
      actionable: "Head to the Practice tab — targeted drills on these keys will fix them fast.",
      priority: persistent ? 1 : 2,
    });
  }
}

// ── Combo / Streak ─────────────────────────────────────────────────

function analyzeCombo(run: CompletedRun, out: CoachInsight[]) {
  const maxCombo = run.metrics.maxCombo ?? 0;

  if (maxCombo >= 50) {
    out.push({
      emoji: "🔥",
      category: "strength",
      title: `FEVER streak — ${maxCombo}× combo!`,
      detail: "You hit the maximum multiplier tier. That's elite-level consecutive accuracy.",
      actionable: "You're in the zone. This kind of flow state is where real gains happen.",
      priority: 3,
    });
  } else if (maxCombo >= 30) {
    out.push({
      emoji: "💥",
      category: "strength",
      title: `Great streak — ${maxCombo}× combo`,
      detail: `You sustained ${maxCombo} correct characters in a row. Just ${50 - maxCombo} more for FEVER tier!`,
      actionable: "Focus on accuracy through tricky words to keep combos alive longer.",
      priority: 3,
    });
  }
}

// ── Trend Analysis ─────────────────────────────────────────────────

function analyzeTrend(run: CompletedRun, profile: TypingProfile, out: CoachInsight[]) {
  if (profile.totalTests < 5) return;

  if (profile.trend === "improving") {
    const recent3 = profile.recentRuns.slice(0, 3);
    const avgRecent = Math.round(recent3.reduce((s, r) => s + r.wpm, 0) / recent3.length);
    out.push({
      emoji: "📈",
      category: "improvement",
      title: "Upward trend detected",
      detail: `Your recent average is ${avgRecent} WPM — you're consistently improving.`,
      actionable: "Don't change what's working. Keep your practice routine consistent.",
      priority: 3,
    });
  } else if (profile.trend === "declining") {
    out.push({
      emoji: "⚠️",
      category: "improvement",
      title: "Slight decline in recent tests",
      detail: "Your last few tests are trending below your average.",
      actionable: "This might be fatigue or boredom. Try a different mode (quotes, code) to refresh.",
      priority: 2,
    });
  }
}

// ── Encouragement & Focus ──────────────────────────────────────────

function pickEncouragement(run: CompletedRun, profile: TypingProfile): string {
  const { wpm, accuracy } = run.metrics;

  if (wpm >= 120) return "You're typing faster than 99% of people. Absolutely elite. 🏆";
  if (wpm >= 100) return "Triple digits! You're in the top tier of typists. Keep it up! 🔥";
  if (wpm >= 80) return "Solid performance. You're well above average. The next milestone is in reach. 💪";
  if (wpm >= 60) return "Good speed! Consistent practice will push you past the next barrier. 📈";
  if (wpm >= 40) return "You're building a strong foundation. Every test makes you faster. 🌱";
  if (accuracy >= 95) return "Your accuracy is excellent — speed will come naturally with practice. 🎯";
  return "Every keystroke is practice. You're making progress even when it doesn't feel like it. 💫";
}

function pickFocusArea(insights: CoachInsight[]): string {
  const p1 = insights.find((i) => i.priority === 1);
  if (p1) return p1.title;
  const p2 = insights.find((i) => i.priority === 2);
  if (p2) return p2.title;
  return insights[0]?.title ?? "Keep practicing!";
}
