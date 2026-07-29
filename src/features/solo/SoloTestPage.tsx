import { RotateCcw, Keyboard, ArrowRight } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { LiveMetrics } from "../../components/typing/LiveMetrics";
import { TestControls } from "../../components/typing/TestControls";
import { TypingViewport } from "../../components/typing/TypingViewport";
import { LiveTouchKeyboard } from "../../components/typing/LiveTouchKeyboard";
import { useAuth } from "../../context/AuthContext";
import { saveRun } from "../../lib/firestore/testRuns";
import { recordRunStats } from "../../lib/firestore/users";
import { saveRunToLocalStorage } from "../../lib/storage/analyticsStorage";
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
      if (parsed && parsed.mode && parsed.value) return parsed;
    }
  } catch {}
  return defaultSettings;
}

export function SoloTestPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [settings, setSettingsState] = useState<TestSettings>(getSavedSettings);
  const [showKeyboard, setShowKeyboard] = useState(true);

  const [testSeed, setTestSeed] = useState(() => `${Date.now()}-${Math.random().toString(36).slice(2)}`);

  const setSettings = useCallback((newSettings: TestSettings) => {
    setSettingsState(newSettings);
    setTestSeed(`${Date.now()}-${Math.random().toString(36).slice(2)}`);
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(newSettings));
    } catch {}
  }, []);

  const nextTest = useCallback(() => {
    setTestSeed(`${Date.now()}-${Math.random().toString(36).slice(2)}`);
  }, []);

  const targetText = useMemo(
    () => wordSources[settings.wordSourceId].createText(wordCountFor(settings.value, settings.mode), testSeed),
    [settings, testSeed]
  );

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

  return <main className="mx-auto flex min-h-[calc(100vh-90px)] w-full max-w-6xl flex-col px-5 pb-10 pt-8 sm:px-8 sm:pt-16">
    <div className="mb-11 flex items-center justify-between">
      <TestControls settings={settings} onChange={setSettings} disabled={test.status === "running"} />
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
      {showKeyboard && (
        <LiveTouchKeyboard
          targetText={targetText}
          typedText={test.typedText}
          active={test.status !== "finished"}
        />
      )}
    </section>
    <p className="mt-10 text-center text-sm text-[var(--muted)]"><kbd>esc</kbd> restart test&nbsp;&nbsp; · &nbsp;&nbsp;<kbd>tab</kbd> + <kbd>enter</kbd> next test</p>
  </main>;
}
