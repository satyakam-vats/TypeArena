import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useTypingTest } from "../../hooks/useTypingTest";
import { LiveMetrics } from "../../components/typing/LiveMetrics";
import { TypingViewport } from "../../components/typing/TypingViewport";
import { saveRunToLocalStorage } from "../../lib/storage/analyticsStorage";
import { useAuth } from "../../context/AuthContext";
import { saveRun } from "../../lib/firestore/testRuns";
import { recordRunStats } from "../../lib/firestore/users";

import {
  getStreak,
  getStreakEmoji,
  recordPractice,
  StreakData
} from "../../lib/streaks";
import {
  getDailyChallengeText,
  hasDailyChallengeBeenCompleted,
  markDailyChallengeComplete,
  getDailyChallengeBest
} from "../../lib/dailyChallenge";
import { normalizeSettings, type CompletedRun, type TestSettings } from "../../types/typing";

const dailySettings: TestSettings = normalizeSettings({ mode: "words", value: 50, wordSourceId: "common-en" });

export function DailyChallengePage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [streakData, setStreakData] = useState<StreakData>(() => getStreak());
  const [completed, setCompleted] = useState(false);
  const [bestScore, setBestScore] = useState<{ wpm: number; accuracy: number } | null>(null);
  const [attemptCount, setAttemptCount] = useState(0);
  
  useEffect(() => {
    setCompleted(hasDailyChallengeBeenCompleted());
    setBestScore(getDailyChallengeBest());
    setStreakData(getStreak());
  }, [attemptCount]);

  // Use a constant seed for today's challenge text
  const targetText = useMemo(() => getDailyChallengeText(50), []);

  const onComplete = useCallback((run: CompletedRun) => {
    sessionStorage.setItem("typearena-last-run", JSON.stringify(run));
    saveRunToLocalStorage(run);
    
    if (user) {
      void Promise.all([
        saveRun(user.uid, run, user.displayName ?? undefined, user.photoURL),
        recordRunStats(user.uid, run),
      ]);
    }
    
    // Daily Challenge specific updates
    markDailyChallengeComplete(run.metrics.wpm, run.metrics.accuracy);
    recordPractice();
    setAttemptCount(c => c + 1); // trigger re-eval of stats

    navigate("/results");
  }, [navigate, user]);

  const test = useTypingTest(targetText, dailySettings, onComplete);

  const displayDate = useMemo(() => {
    const d = new Date();
    return d.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  }, []);

  return (
    <main className="daily-container">
      <div className="daily-hero">
        <h1 className="text-3xl font-medium tracking-tight mb-2">Daily Challenge</h1>
        <div className="daily-date">{displayDate}</div>
        
        {streakData.currentStreak > 0 && (
          <div className="daily-streak">
            <span>{getStreakEmoji(streakData.currentStreak)}</span>
            <span>{streakData.currentStreak} Day Streak!</span>
            <span className="text-xs ml-1 opacity-75">Keep it going!</span>
          </div>
        )}

        {completed && bestScore && (
          <div className="daily-status daily-status-complete">
            <h2 className="text-[var(--accent)] text-sm uppercase tracking-wider mb-2 font-mono">Today's Best</h2>
            <div className="flex justify-center gap-6 font-mono">
              <div>
                <span className="text-[var(--muted)] text-xs mr-2">WPM</span>
                <strong className="text-xl">{bestScore.wpm}</strong>
              </div>
              <div>
                <span className="text-[var(--muted)] text-xs mr-2">ACC</span>
                <strong className="text-xl">{Math.round(bestScore.accuracy)}%</strong>
              </div>
            </div>
            <p className="text-sm text-[var(--muted)] mt-4">You've completed today's challenge. Try to beat your score below!</p>
          </div>
        )}
      </div>

      <section className="typing-stage mt-6">
        <div className="mb-4 flex items-center justify-between text-sm text-[var(--muted)]">
          <span>{test.status === "ready" ? "Start typing to begin" : "50 words"}</span>
          <LiveMetrics metrics={test.metrics} />
        </div>
        <TypingViewport target={targetText} typed={test.typedText} active={test.status !== "finished"} focused smoothCaret />
        <textarea
          autoFocus
          value={test.typedText}
          onChange={(event) => test.updateTypedText(event.target.value)}
          onPaste={(event) => event.preventDefault()}
          aria-label="Type the daily challenge text"
          className="typing-input"
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
        />
      </section>
    </main>
  );
}
