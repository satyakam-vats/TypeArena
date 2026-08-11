import { RotateCcw, Keyboard, ArrowRight, Target, Check } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { LiveMetrics } from "../../components/typing/LiveMetrics";
import { TestControls } from "../../components/typing/TestControls";
import { TypingViewport } from "../../components/typing/TypingViewport";
import { LiveTouchKeyboard } from "../../components/typing/LiveTouchKeyboard";
import { AdaptiveDrillCard } from "../../components/typing/AdaptiveDrillCard";
import { useAuth } from "../../context/AuthContext";
import { saveRun } from "../../lib/firestore/testRuns";
import { recordRunStats } from "../../lib/firestore/users";
import { getAllTimeKeyStatsFromStorage, saveRunToLocalStorage } from "../../lib/storage/analyticsStorage";
import { saveGhostReplay } from "../../lib/storage/ghostStorage";
import { getAdaptiveDrillRecommendation, getWeakKeys } from "../../lib/typing/practiceTextGen";
import { appendTestWords, createTestText } from "../../lib/typing/wordSources";
import { useTypingTest } from "../../hooks/useTypingTest";
import { normalizeSettings, type CompletedRun, type TestSettings } from "../../types/typing";

const DRILL_BANNER_DISMISS_KEY = "typearena_dismiss_adaptive_drill_v1";

const SETTINGS_KEY = "typearena_test_settings_v1";

function getSavedSettings(): TestSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) {
      const parsed = normalizeSettings(JSON.parse(raw) as Partial<TestSettings>);
      if (parsed.wordSourceId === "practice") {
        return { ...parsed, wordSourceId: "common-en" };
      }
      return parsed;
    }
  } catch { /* ignore */ }
  return normalizeSettings();
}

function persistSettings(settings: TestSettings) {
  if (settings.wordSourceId === "practice") return;
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch { /* ignore */ }
}

type Props = { initialWordSource?: string };

export function SoloTestPage({ initialWordSource }: Props) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const searchParams = new URLSearchParams(location.search);
  const sourceParam = searchParams.get("source") || initialWordSource;
  const isPracticeMode = sourceParam === "practice";
  const isAiDrill = sourceParam === "ai-drill";

  const [settings, setSettingsState] = useState<TestSettings>(() => {
    if (isPracticeMode) {
      const saved = getSavedSettings();
      return normalizeSettings({
        ...saved,
        mode: "words",
        value: saved.mode === "words" ? saved.value : 50,
        wordSourceId: "practice",
      });
    }
    if (isAiDrill) {
      return normalizeSettings({
        ...getSavedSettings(),
        mode: "custom",
        wordSourceId: "common-en",
      });
    }
    return getSavedSettings();
  });
  const [showKeyboard, setShowKeyboard] = useState(true);
  const [testSeed, setTestSeed] = useState(() => `${Date.now()}-${Math.random().toString(36).slice(2)}`);
  const [targetText, setTargetText] = useState("");
  const [focused, setFocused] = useState(true);
  const [capsLock, setCapsLock] = useState(false);
  const [drillBannerDismissed, setDrillBannerDismissed] = useState(() => {
    try {
      return sessionStorage.getItem(DRILL_BANNER_DISMISS_KEY) === "1";
    } catch {
      return false;
    }
  });
  const appendCount = useRef(0);
  const appendLock = useRef(false);
  const didInit = useRef(false);

  // Initial text (once) aligned with testSeed
  useEffect(() => {
    if (didInit.current) return;
    didInit.current = true;
    // If AI drill, use the stored drill text
    if (isAiDrill) {
      const drillText = sessionStorage.getItem("typearena_ai_drill");
      if (drillText) {
        setTargetText(drillText);
        sessionStorage.removeItem("typearena_ai_drill");
        return;
      }
    }
    setTargetText(createTestText(settings, testSeed));
  }, [settings, testSeed, isAiDrill]);

  const setSettings = useCallback((newSettings: TestSettings) => {
    const next = normalizeSettings(
      isPracticeMode
        ? { ...newSettings, wordSourceId: "practice" as const, mode: newSettings.mode === "zen" || newSettings.mode === "quote" || newSettings.mode === "custom" ? "words" : newSettings.mode }
        : newSettings.wordSourceId === "practice"
          ? { ...newSettings, wordSourceId: "common-en" }
          : newSettings,
    );
    setSettingsState(next);
    const seed = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setTestSeed(seed);
    setTargetText(createTestText(next, seed));
    appendCount.current = 0;
    appendLock.current = false;
    persistSettings(next);
  }, [isPracticeMode]);

  const nextTest = useCallback(() => {
    const seed = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setTestSeed(seed);
    setTargetText(createTestText(settings, seed));
    appendCount.current = 0;
    appendLock.current = false;
  }, [settings]);

  // Re-read recency-weighted key stats whenever the test seed changes (new/next test).
  const { keyErrors, keyTotals } = useMemo(() => getAllTimeKeyStatsFromStorage(), [testSeed]);
  const weakKeys = useMemo(() => getWeakKeys(keyErrors, keyTotals, 5, 6), [keyErrors, keyTotals]);
  const drillRecommendation = useMemo(
    () => getAdaptiveDrillRecommendation(keyErrors, keyTotals, 5),
    [keyErrors, keyTotals],
  );

  const dismissDrillBanner = useCallback(() => {
    setDrillBannerDismissed(true);
    try {
      sessionStorage.setItem(DRILL_BANNER_DISMISS_KEY, "1");
    } catch { /* ignore */ }
  }, []);

  const getRateColorClass = (rate: number) => {
    if (rate < 0.08) return "rate-green";
    if (rate < 0.16) return "rate-yellow";
    if (rate < 0.28) return "rate-orange";
    return "rate-red";
  };

  const onComplete = useCallback((run: CompletedRun) => {
    sessionStorage.setItem("typearena-last-run", JSON.stringify(run));
    saveRunToLocalStorage(run);
    if (run.ghostSamples && run.ghostSamples.length > 0) {
      saveGhostReplay(run.settings, {
        settingsKey: "",
        targetText: run.targetText,
        samples: run.ghostSamples,
        finalWpm: run.metrics.wpm,
        completedAt: run.completedAt,
      });
    }
    if (user) {
      void Promise.all([
        saveRun(user.uid, run, user.displayName ?? undefined, user.photoURL, false),
        recordRunStats(user.uid, run),
      ]);
    } else {
      let guestId = localStorage.getItem("typearena_guest_id");
      if (!guestId) {
        guestId = "guest_" + Math.random().toString(36).substring(2, 8);
        localStorage.setItem("typearena_guest_id", guestId);
      }
      const guestName = `Guest-${guestId.slice(-4).toUpperCase()}`;
      void saveRun(guestId, run, guestName, null, true);
    }
    navigate("/results");
  }, [navigate, user]);

  const test = useTypingTest(targetText, settings, onComplete, testSeed);

  // Stream more words for time/zen when buffer runs low
  useEffect(() => {
    if (test.status !== "running") return;
    if (settings.mode !== "time" && settings.mode !== "zen") return;
    if (!targetText) return;
    const remaining = targetText.length - test.typedText.length;
    if (remaining >= 100 || appendLock.current) return;
    appendLock.current = true;
    appendCount.current += 1;
    const extra = appendTestWords(settings, `${testSeed}-a${appendCount.current}`, 80);
    if (extra) {
      setTargetText((t) => {
        appendLock.current = false;
        return t + extra;
      });
    } else {
      appendLock.current = false;
    }
  }, [test.typedText.length, test.status, targetText, settings, testSeed]);

  // Focus mode class on body
  useEffect(() => {
    document.body.classList.toggle("focus-mode", Boolean(settings.focusMode && test.status === "running"));
    return () => document.body.classList.remove("focus-mode");
  }, [settings.focusMode, test.status]);

  // Keyboard shortcuts
  useEffect(() => {
    let tabPressed = false;
    let tabTimer: number | undefined;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.getModifierState?.("CapsLock")) setCapsLock(true);
      else setCapsLock(false);

      if (e.key === "Escape") {
        e.preventDefault();
        if (settings.mode === "zen" && test.status === "running") {
          test.finish();
          return;
        }
        test.reset();
        inputRef.current?.focus();
        return;
      }

      if (e.key === "Tab") {
        e.preventDefault();
        tabPressed = true;
        window.clearTimeout(tabTimer);
        tabTimer = window.setTimeout(() => { tabPressed = false; }, 1000);
        return;
      }

      if (e.key === "Enter" && tabPressed) {
        e.preventDefault();
        tabPressed = false;
        nextTest();
        inputRef.current?.focus();
        return;
      }

      // Shift+Enter finishes zen
      if (settings.mode === "zen" && e.key === "Enter" && e.shiftKey && test.status === "running") {
        e.preventDefault();
        test.finish();
        return;
      }

      // Refocus on any printable key when blurred — but NOT if the user
      // is typing into another input (e.g. AI Chat widget, search, etc.)
      if (!focused && e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const active = document.activeElement;
        const isOtherInput =
          active instanceof HTMLInputElement ||
          active instanceof HTMLTextAreaElement ||
          active?.getAttribute("contenteditable") === "true";
        if (!isOtherInput) {
          inputRef.current?.focus();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.clearTimeout(tabTimer);
    };
  }, [test, nextTest, settings.mode, focused]);

  // Repeat from results
  useEffect(() => {
    const state = location.state as { repeat?: boolean } | null;
    if (state?.repeat) {
      test.reset();
      navigate(location.pathname, { replace: true, state: {} });
    } else if (state && state.repeat === false) {
      nextTest();
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state]); // eslint-disable-line react-hooks/exhaustive-deps

  const remaining =
    settings.mode === "time"
      ? Math.max(0, settings.value - Math.floor(test.elapsedMs / 1000))
      : settings.mode === "words"
        ? settings.value
        : null;

  const statusLabel =
    test.status === "ready"
      ? settings.mode === "zen"
        ? "zen — type freely, shift+enter or esc to finish"
        : "start typing when ready"
      : settings.mode === "time"
        ? `${remaining}s remaining`
        : settings.mode === "words"
          ? `${settings.value} words`
          : settings.mode === "quote"
            ? "quote"
            : settings.mode === "custom"
              ? "custom"
              : settings.mode === "zen"
                ? "zen"
                : "";

  return (
    <main
      className={`solo-test-page mx-auto flex w-full max-w-6xl flex-col px-5 pt-8 sm:px-8 sm:pt-12 animate-fade-in ${showKeyboard ? "solo-with-keyboard" : ""} ${isPracticeMode ? "solo-practice" : ""} ${settings.focusMode && test.status === "running" ? "is-focus" : ""}`}
    >
      {isPracticeMode && (
        <div className="practice-weak-keys-bar animate-fade-in focus-hide">
          <div className="practice-weak-keys-label">
            <Target size={12} /> adaptive drill · weak keys
          </div>
          {weakKeys.length > 0 ? (
            <div className="practice-weak-keys-list">
              {weakKeys.map((wk) => (
                <div
                  key={wk.key}
                  className="weak-key-chip"
                  title={`${(wk.errorRate * 100).toFixed(1)}% recent error rate · re-evaluates after each session`}
                >
                  <span className="weak-key-cap">{wk.key === " " || wk.key === "space" ? "␣" : wk.key.toUpperCase()}</span>
                  <span className={`weak-key-rate-pill ${getRateColorClass(wk.errorRate)}`}>
                    {(wk.errorRate * 100).toFixed(0)}%
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="practice-weak-keys-empty">
              {drillRecommendation.hasEnoughData
                ? "no weak keys right now — keep practicing"
                : "type a few tests — weak keys appear as error history builds"}
            </p>
          )}
        </div>
      )}

      {!isPracticeMode &&
        !drillBannerDismissed &&
        drillRecommendation.weakKeys.length > 0 && (
          <AdaptiveDrillCard
            recommendation={drillRecommendation}
            variant="banner"
            onDismiss={dismissDrillBanner}
            className="mb-4 focus-hide animate-fade-in"
          />
        )}

      <div className="solo-toolbar mb-8 flex items-center justify-center flex-wrap gap-4 focus-hide">
        <TestControls settings={settings} onChange={setSettings} disabled={test.status === "running"} />
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowKeyboard(!showKeyboard)}
            className={`icon-button ${showKeyboard ? "text-[var(--accent)]" : ""}`}
            title={showKeyboard ? "Hide touch typing keyboard" : "Show touch typing keyboard"}
          >
            <Keyboard size={16} />
          </button>
          {settings.mode === "zen" && test.status === "running" && (
            <button onClick={() => test.finish()} className="icon-button" title="Finish zen (Shift+Enter / Esc)">
              <Check size={16} />
            </button>
          )}
          <button onClick={() => { test.reset(); inputRef.current?.focus(); }} className="icon-button" title="Restart (Esc)">
            <RotateCcw size={16} />
          </button>
          <button onClick={() => { nextTest(); inputRef.current?.focus(); }} className="icon-button" title="Next test (Tab + Enter)">
            <ArrowRight size={16} />
          </button>
        </div>
      </div>

      <section className="typing-stage solo-typing-stage">
        <div className="mb-3 flex items-center justify-between text-sm text-[var(--muted)] focus-hide-soft">
          <span>{statusLabel}</span>
          <LiveMetrics metrics={test.metrics} comboCount={test.comboCount} comboMultiplier={test.comboMultiplier} />
        </div>
        <TypingViewport
          target={targetText}
          typed={test.typedText}
          active={test.status !== "finished"}
          blind={settings.blind}
          smoothCaret={settings.smoothCaret}
          caretStyle={settings.caretStyle}
          focused={focused}
          capsLock={capsLock}
          onRequestFocus={() => inputRef.current?.focus()}
          comboCount={test.comboCount}
          comboMultiplier={test.comboMultiplier}
        />
        <textarea
          ref={inputRef}
          autoFocus
          value={test.typedText}
          onChange={(event) => test.updateTypedText(event.target.value)}
          onPaste={(event) => event.preventDefault()}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          aria-label="Type the displayed text"
          className="typing-input"
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
        />
      </section>

      <p className="solo-hints text-center text-sm text-[var(--muted)] focus-hide">
        <kbd>esc</kbd> {settings.mode === "zen" ? "finish" : "restart"}
        &nbsp;&nbsp; · &nbsp;&nbsp;<kbd>tab</kbd> + <kbd>enter</kbd> next
        {settings.mode === "zen" && <>&nbsp;&nbsp; · &nbsp;&nbsp;<kbd>shift</kbd>+<kbd>enter</kbd> finish</>}
      </p>

      {showKeyboard && (
        <div className="solo-keyboard-dock focus-hide">
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
