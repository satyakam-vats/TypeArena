import { RotateCcw, Keyboard, ArrowRight, Target } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { LiveMetrics } from "../../components/typing/LiveMetrics";
import { TestControls } from "../../components/typing/TestControls";
import { TypingViewport } from "../../components/typing/TypingViewport";
import { LiveTouchKeyboard } from "../../components/typing/LiveTouchKeyboard";
import { useAuth } from "../../context/AuthContext";
import { saveRun } from "../../lib/firestore/testRuns";
import { recordRunStats } from "../../lib/firestore/users";
import { getAllTimeKeyStatsFromStorage, saveRunToLocalStorage } from "../../lib/storage/analyticsStorage";
import { getWeakKeys } from "../../lib/typing/practiceTextGen";
import { wordCountFor, wordSources } from "../../lib/typing/wordSources";
import { useTypingTest } from "../../hooks/useTypingTest";
import type { CompletedRun, TestSettings } from "../../types/typing";

const SETTINGS_KEY = "typearena_test_settings_v1";
const defaultSettings: TestSettings = { mode: "time", value: 30, wordSourceId: "common-en" };

function getSavedSettings(): TestSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as TestSettings;
      if (parsed && parsed.mode && parsed.value) {
        // Never restore practice from shared settings — that mode is route-only.
        if (parsed.wordSourceId === "practice") {
          return { ...parsed, wordSourceId: "common-en" };
        }
        return parsed;
      }
    }
  } catch {}
  return defaultSettings;
}

function persistSettings(settings: TestSettings) {
  if (settings.wordSourceId === "practice") return;
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {}
}

type Props = { initialWordSource?: string };

export function SoloTestPage({ initialWordSource }: Props) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  // Check URL search params for ?source=practice (or PracticePage prop)
  const searchParams = new URLSearchParams(location.search);
  const sourceParam = searchParams.get("source") || initialWordSource;
  const isPracticeMode = sourceParam === "practice";

  const [settings, setSettingsState] = useState<TestSettings>(() => {
    if (isPracticeMode) {
      const saved = getSavedSettings();
      return { mode: "words", value: saved.mode === "words" ? saved.value : 50, wordSourceId: "practice" };
    }
    return getSavedSettings();
  });
  const [showKeyboard, setShowKeyboard] = useState(true);
  const [testSeed, setTestSeed] = useState(() => `${Date.now()}-${Math.random().toString(36).slice(2)}`);

  const setSettings = useCallback((newSettings: TestSettings) => {
    // Stay locked on practice when opened via /practice.
    const next =
      isPracticeMode
        ? { ...newSettings, wordSourceId: "practice" as const }
        : newSettings.wordSourceId === "practice"
          ? { ...newSettings, wordSourceId: "common-en" }
          : newSettings;
    setSettingsState(next);
    setTestSeed(`${Date.now()}-${Math.random().toString(36).slice(2)}`);
    persistSettings(next);
  }, [isPracticeMode]);

  const nextTest = useCallback(() => {
    setTestSeed(`${Date.now()}-${Math.random().toString(36).slice(2)}`);
  }, []);

  const targetText = useMemo(
    () => (wordSources[settings.wordSourceId] || wordSources["common-en"]).createText(wordCountFor(settings.value, settings.mode), testSeed),
    [settings, testSeed]
  );

  const { keyErrors, keyTotals } = useMemo(() => getAllTimeKeyStatsFromStorage(), [testSeed]);
  const weakKeys = useMemo(() => getWeakKeys(keyErrors, keyTotals, 5, 6), [keyErrors, keyTotals]);

  const getRateColorClass = (rate: number) => {
    if (rate < 0.08) return "rate-green";
    if (rate < 0.16) return "rate-yellow";
    if (rate < 0.28) return "rate-orange";
    return "rate-red";
  };

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
  const remaining = settings.mode === "time" ? Math.max(0, settings.value - Math.floor(test.elapsedMs / 1000)) : settings.value;

  // Keyboard shortcuts: Esc = reset current test, Tab+Enter = next test
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

  return (
    <main className={`solo-test-page mx-auto flex w-full max-w-6xl flex-col px-5 pt-8 sm:px-8 sm:pt-12 animate-fade-in ${showKeyboard ? "solo-with-keyboard" : ""} ${isPracticeMode ? "solo-practice" : ""}`}>
      {isPracticeMode && (
        <div className="practice-weak-keys-bar animate-fade-in">
          <div className="practice-weak-keys-label">
            <Target size={12} /> weak keys
          </div>
          {weakKeys.length > 0 ? (
            <div className="practice-weak-keys-list">
              {weakKeys.map((wk) => (
                <div key={wk.key} className="weak-key-chip" title={`${(wk.errorRate * 100).toFixed(1)}% recent error rate`}>
                  <span className="weak-key-cap">{wk.key === " " || wk.key === "space" ? "␣" : wk.key.toUpperCase()}</span>
                  <span className={`weak-key-rate-pill ${getRateColorClass(wk.errorRate)}`}>
                    {(wk.errorRate * 100).toFixed(0)}%
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="practice-weak-keys-empty">type a few tests — weak keys appear as error history builds</p>
          )}
        </div>
      )}

      <div className="solo-toolbar mb-6 flex items-center justify-between flex-wrap gap-3">
        <TestControls settings={settings} onChange={setSettings} disabled={test.status === "running"} />
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowKeyboard(!showKeyboard)}
            className={`icon-button ${showKeyboard ? "text-[var(--accent)]" : ""}`}
            title={showKeyboard ? "Hide touch typing keyboard" : "Show touch typing keyboard"}
          >
            <Keyboard size={16} />
          </button>
          <button onClick={test.reset} className="icon-button" title="Restart current test (Esc)"><RotateCcw size={16} /></button>
          <button onClick={nextTest} className="icon-button" title="Next test (Tab + Enter)"><ArrowRight size={16} /></button>
        </div>
      </div>

      <section className="typing-stage solo-typing-stage">
        <div className="mb-3 flex items-center justify-between text-sm text-[var(--muted)]">
          <span>{test.status === "ready" ? "start typing when ready" : settings.mode === "time" ? `${remaining}s remaining` : `${settings.value} words`}</span>
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
      </section>

      <p className="solo-hints text-center text-sm text-[var(--muted)]">
        <kbd>esc</kbd> restart&nbsp;&nbsp; · &nbsp;&nbsp;<kbd>tab</kbd> + <kbd>enter</kbd> next
      </p>

      {showKeyboard && (
        <div className="solo-keyboard-dock">
          <LiveTouchKeyboard
            targetText={targetText}
            typedText={test.typedText}
            active={test.status !== "finished"}
          />
        </div>
      )}
    </main>
  );
}
