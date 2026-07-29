import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LiveMetrics } from "../../components/typing/LiveMetrics";
import { TypingViewport } from "../../components/typing/TypingViewport";
import { LiveTouchKeyboard } from "../../components/typing/LiveTouchKeyboard";
import { useAuth } from "../../context/AuthContext";
import { saveRun } from "../../lib/firestore/testRuns";
import { recordRunStats } from "../../lib/firestore/users";
import { getAllTimeKeyStatsFromStorage, saveRunToLocalStorage } from "../../lib/storage/analyticsStorage";
import { getWeakKeys, generatePracticeText } from "../../lib/typing/practiceTextGen";
import { useTypingTest } from "../../hooks/useTypingTest";
import { RotateCcw, Keyboard, ArrowRight } from "lucide-react";
import type { CompletedRun, TestSettings } from "../../types/typing";

export function PracticePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showKeyboard, setShowKeyboard] = useState(true);
  const [testSeed, setTestSeed] = useState(() => `${Date.now()}-${Math.random().toString(36).slice(2)}`);

  // Fixed settings for practice mode: 50 words
  const settings = useMemo<TestSettings>(() => ({ mode: "words", value: 50, wordSourceId: "practice" }), []);

  const { keyErrors, keyTotals } = useMemo(() => getAllTimeKeyStatsFromStorage(), []);
  const weakKeys = useMemo(() => getWeakKeys(keyErrors, keyTotals, 5), [keyErrors, keyTotals]);

  const targetText = useMemo(
    () => generatePracticeText(keyErrors, keyTotals, settings.value, testSeed),
    [keyErrors, keyTotals, settings.value, testSeed]
  );

  const nextTest = useCallback(() => {
    setTestSeed(`${Date.now()}-${Math.random().toString(36).slice(2)}`);
  }, []);

  const onComplete = useCallback((run: CompletedRun) => {
    sessionStorage.setItem("typearena-last-run", JSON.stringify(run));
    saveRunToLocalStorage(run);
    if (user) {
      void Promise.all([
        saveRun(user.uid, run, user.displayName ?? undefined, user.photoURL),
        recordRunStats(user.uid, run),
      ]);
    }
    navigate("/results");
  }, [navigate, user]);

  const test = useTypingTest(targetText, settings, onComplete);

  // Keyboard shortcuts
  useEffect(() => {
    let tabPressed = false;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        test.reset();
        return;
      }
      if (e.key === "Tab") {
        tabPressed = true;
        setTimeout(() => { tabPressed = false; }, 1000);
        return;
      }
      if (e.key === "Enter" && tabPressed) {
        e.preventDefault();
        tabPressed = false;
        nextTest();
        return;
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [test, nextTest]);

  const getRateColorClass = (rate: number) => {
    if (rate < 0.05) return "rate-green";
    if (rate < 0.15) return "rate-yellow";
    if (rate < 0.3) return "rate-orange";
    return "rate-red";
  };

  if (weakKeys.length === 0) {
    return (
      <main className="practice-container">
        <div className="practice-empty">
          <h2 className="text-xl font-medium text-[var(--ink)]">Not enough data</h2>
          <p>Complete some typing tests first to identify your weak spots.</p>
          <button onClick={() => navigate("/")} className="primary-button mx-auto mt-4">
            Take a Test
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-[calc(100vh-90px)] w-full max-w-6xl flex-col px-5 pb-10 pt-8 sm:px-8 sm:pt-16 animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold mb-2">Practice Weak Keys</h1>
        <p className="text-[var(--muted)] text-sm mb-4">Text generated to help you practice keys you struggle with.</p>
        <div className="weak-keys-grid">
          {weakKeys.slice(0, 8).map((wk) => (
            <div key={wk.key} className="weak-key-badge">
              <span className="weak-key-letter">{wk.key === ' ' ? 'Space' : wk.key.toUpperCase()}</span>
              <span className={`weak-key-rate ${getRateColorClass(wk.errorRate)}`}>
                {(wk.errorRate * 100).toFixed(1)}% error
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-11 flex items-center justify-end">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowKeyboard(!showKeyboard)}
            className={`icon-button ${showKeyboard ? 'text-[var(--accent)]' : ''}`}
            title={showKeyboard ? "Hide touch typing keyboard" : "Show touch typing keyboard"}
          >
            <Keyboard size={16} />
          </button>
          <button onClick={test.reset} className="icon-button" title="Restart current test (Esc)"><RotateCcw size={16} /></button>
          <button onClick={nextTest} className="icon-button" title="Next test (Tab + Enter)"><ArrowRight size={16} /></button>
        </div>
      </div>

      <section className="typing-stage">
        <div className="mb-4 flex items-center justify-between text-sm text-[var(--muted)]">
          <span>{test.status === "ready" ? "start typing when ready" : `${settings.value} words`}</span>
          <LiveMetrics metrics={test.metrics} />
        </div>
        <TypingViewport target={targetText} typed={test.typedText} active={test.status !== "finished"} />
        <textarea
          autoFocus
          value={test.typedText}
          onChange={(event) => test.updateTypedText(event.target.value)}
          onPaste={(event) => event.preventDefault()}
          aria-label="Type the displayed text"
          className="typing-input"
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
        />
        {showKeyboard && (
          <LiveTouchKeyboard
            targetText={targetText}
            typedText={test.typedText}
            active={test.status !== "finished"}
          />
        )}
      </section>
      <p className="mt-10 text-center text-sm text-[var(--muted)]"><kbd>esc</kbd> restart test&nbsp;&nbsp; · &nbsp;&nbsp;<kbd>tab</kbd> + <kbd>enter</kbd> next test</p>
    </main>
  );
}
