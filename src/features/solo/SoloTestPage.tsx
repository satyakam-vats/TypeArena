import { RotateCcw } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LiveMetrics } from "../../components/typing/LiveMetrics";
import { TestControls } from "../../components/typing/TestControls";
import { TypingViewport } from "../../components/typing/TypingViewport";
import { useAuth } from "../../context/AuthContext";
import { saveRun } from "../../lib/firestore/testRuns";
import { recordPersonalBest } from "../../lib/firestore/users";
import { wordCountFor, wordSources } from "../../lib/typing/wordSources";
import { useTypingTest } from "../../hooks/useTypingTest";
import type { CompletedRun, TestSettings } from "../../types/typing";

const defaultSettings: TestSettings = { mode: "time", value: 30, wordSourceId: "common-en" };

export function SoloTestPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [settings, setSettings] = useState<TestSettings>(defaultSettings);
  const [round, setRound] = useState(0);
  const seed = `${settings.mode}-${settings.value}-${round}`;
  const targetText = useMemo(() => wordSources[settings.wordSourceId].createText(wordCountFor(settings.value, settings.mode), seed), [seed, settings]);
  const onComplete = useCallback((run: CompletedRun) => {
    sessionStorage.setItem("typearena-last-run", JSON.stringify(run));
    if (user) {
      void Promise.all([saveRun(user.uid, run), recordPersonalBest(user.uid, run.metrics.wpm)]);
    }
    navigate("/results");
  }, [navigate, user]);
  const test = useTypingTest(targetText, settings, onComplete);
  const remaining = settings.mode === "time" ? Math.max(0, settings.value - Math.floor(test.elapsedMs / 1000)) : settings.value;
  const reset = () => setRound((current) => current + 1);

  return <main className="mx-auto flex min-h-[calc(100vh-90px)] w-full max-w-6xl flex-col px-5 pb-10 pt-8 sm:px-8 sm:pt-16">
    <div className="mb-11 flex items-center justify-between">
      <TestControls settings={settings} onChange={setSettings} disabled={test.status === "running"} />
      <button onClick={reset} className="icon-button" aria-label="Restart test"><RotateCcw size={16} /></button>
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
        onKeyDown={(event) => { if (event.key === "Escape") reset(); }}
        aria-label="Type the displayed text"
        className="typing-input"
        spellCheck={false}
        autoCapitalize="off"
        autoCorrect="off"
      />
    </section>
    <p className="mt-10 text-center text-sm text-[var(--muted)]"><kbd>esc</kbd> restart&nbsp;&nbsp; · &nbsp;&nbsp;sign in to save your runs</p>
  </main>;
}
