import { useEffect, useRef, useState } from "react";
import type { TestSettings } from "../../types/typing";
import { selectableWordSources } from "../../lib/typing/wordSources";

type Props = {
  settings: TestSettings;
  onChange: (settings: TestSettings) => void;
  disabled?: boolean;
  compact?: boolean;
};

const timeOptions = [15, 30, 60, 120] as const;
const wordOptions = [10, 25, 50, 100] as const;
const quoteLengths = [
  { id: "short" as const, label: "short" },
  { id: "medium" as const, label: "medium" },
  { id: "long" as const, label: "long" },
  { id: "all" as const, label: "all" },
];

export function TestControls({ settings, onChange, disabled, compact }: Props) {
  const [showCustom, setShowCustom] = useState(false);
  const [customValue, setCustomValue] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [customDraft, setCustomDraft] = useState(settings.customText || "");
  const inputRef = useRef<HTMLInputElement>(null);

  const selectMode = (mode: TestSettings["mode"]) => {
    setShowCustom(false);
    if (mode === "time") onChange({ ...settings, mode, value: 30, wordSourceId: settings.wordSourceId === "quotes" ? "common-en" : settings.wordSourceId });
    else if (mode === "words") onChange({ ...settings, mode, value: 25 });
    else if (mode === "quote") onChange({ ...settings, mode, wordSourceId: "quotes", value: 50 });
    else if (mode === "zen") onChange({ ...settings, mode, value: 0 });
    else if (mode === "custom") onChange({ ...settings, mode, value: 0 });
  };

  const values = settings.mode === "time" ? timeOptions : wordOptions;
  const isCustomLen = settings.mode === "time" || settings.mode === "words"
    ? !(values as readonly number[]).includes(settings.value as never)
    : false;

  const applyCustom = () => {
    let val = parseInt(customValue, 10);
    if (!isNaN(val)) {
      if (settings.mode === "time") val = Math.max(5, Math.min(300, val));
      else val = Math.max(5, Math.min(500, val));
      onChange({ ...settings, value: val });
    }
    setShowCustom(false);
  };

  useEffect(() => {
    if (showCustom && inputRef.current) inputRef.current.focus();
  }, [showCustom]);

  useEffect(() => {
    setCustomDraft(settings.customText || "");
  }, [settings.customText]);

  const showLength = settings.mode === "time" || settings.mode === "words";
  const showPunctNum = settings.mode === "time" || settings.mode === "words" || settings.mode === "zen";
  const showSources = showPunctNum && settings.wordSourceId !== "practice";

  return (
    <div className={`test-controls-wrap ${compact ? "compact" : ""}`}>
      <div className="control-row flex-wrap gap-y-2" aria-label="Test settings">
        <button disabled={disabled} onClick={() => selectMode("time")} className={settings.mode === "time" ? "control-active" : "control"}>time</button>
        <button disabled={disabled} onClick={() => selectMode("words")} className={settings.mode === "words" ? "control-active" : "control"}>words</button>
        <button disabled={disabled} onClick={() => selectMode("quote")} className={settings.mode === "quote" ? "control-active" : "control"}>quote</button>
        <button disabled={disabled} onClick={() => selectMode("zen")} className={settings.mode === "zen" ? "control-active" : "control"}>zen</button>
        <button disabled={disabled} onClick={() => selectMode("custom")} className={settings.mode === "custom" ? "control-active" : "control"}>custom</button>

        {showLength && (
          <>
            <span className="control-divider" />
            {values.map((value) => (
              <button
                key={value}
                disabled={disabled}
                onClick={() => { setShowCustom(false); onChange({ ...settings, value }); }}
                className={!showCustom && settings.value === value ? "control-active" : "control"}
              >
                {value}{settings.mode === "time" ? "s" : ""}
              </button>
            ))}
            {showCustom ? (
              <input
                ref={inputRef}
                type="number"
                className="custom-input"
                value={customValue}
                onChange={(e) => setCustomValue(e.target.value)}
                onBlur={applyCustom}
                onKeyDown={(e) => e.key === "Enter" && applyCustom()}
                disabled={disabled}
              />
            ) : (
              <button disabled={disabled} onClick={() => { setCustomValue(String(settings.value)); setShowCustom(true); }} className={isCustomLen ? "control-active" : "control"}>
                custom
              </button>
            )}
          </>
        )}

        {settings.mode === "quote" && (
          <>
            <span className="control-divider" />
            {quoteLengths.map((q) => (
              <button
                key={q.id}
                disabled={disabled}
                onClick={() => onChange({ ...settings, quoteLength: q.id })}
                className={settings.quoteLength === q.id ? "control-active" : "control"}
              >
                {q.label}
              </button>
            ))}
          </>
        )}

        {showSources && (
          <>
            <span className="control-divider" />
            {settings.wordSourceId === "practice" ? (
              <button type="button" className="control-active" disabled title="Weak-key practice mode">practice</button>
            ) : (
              selectableWordSources.map((source) => (
                <button
                  key={source.id}
                  disabled={disabled}
                  onClick={() => onChange({ ...settings, wordSourceId: source.id })}
                  className={(settings.wordSourceId || "common-en") === source.id ? "control-active" : "control"}
                >
                  {source.label}
                </button>
              ))
            )}
          </>
        )}

        {showPunctNum && settings.wordSourceId !== "practice" && settings.wordSourceId !== "code" && (
          <>
            <span className="control-divider" />
            <button
              disabled={disabled}
              onClick={() => onChange({ ...settings, punctuation: !settings.punctuation })}
              className={settings.punctuation ? "control-active" : "control"}
              title="Add punctuation"
            >
              punct
            </button>
            <button
              disabled={disabled}
              onClick={() => onChange({ ...settings, numbers: !settings.numbers })}
              className={settings.numbers ? "control-active" : "control"}
              title="Mix in numbers"
            >
              numbers
            </button>
          </>
        )}

        <span className="control-divider" />
        <button
          type="button"
          disabled={disabled}
          className={showAdvanced ? "control-active" : "control"}
          onClick={() => setShowAdvanced((v) => !v)}
          title="Behavior settings"
        >
          more
        </button>
      </div>

      {showAdvanced && (
        <div className="control-row flex-wrap gap-y-2 mt-2 advanced-controls" aria-label="Behavior settings">
          <span className="control-label">stop</span>
          {(["off", "word", "letter"] as const).map((v) => (
            <button key={v} disabled={disabled} onClick={() => onChange({ ...settings, stopOnError: v })} className={settings.stopOnError === v ? "control-active" : "control"}>{v}</button>
          ))}
          <span className="control-divider" />
          <span className="control-label">confidence</span>
          {(["off", "on", "max"] as const).map((v) => (
            <button key={v} disabled={disabled} onClick={() => onChange({ ...settings, confidence: v })} className={settings.confidence === v ? "control-active" : "control"}>{v}</button>
          ))}
          <span className="control-divider" />
          <span className="control-label">diff</span>
          {(["normal", "expert", "master"] as const).map((v) => (
            <button key={v} disabled={disabled} onClick={() => onChange({ ...settings, difficulty: v })} className={settings.difficulty === v ? "control-active" : "control"}>{v}</button>
          ))}
          <span className="control-divider" />
          <button disabled={disabled} onClick={() => onChange({ ...settings, blind: !settings.blind })} className={settings.blind ? "control-active" : "control"}>blind</button>
          <button disabled={disabled} onClick={() => onChange({ ...settings, focusMode: !settings.focusMode })} className={settings.focusMode ? "control-active" : "control"}>focus</button>
          <button disabled={disabled} onClick={() => onChange({ ...settings, smoothCaret: !settings.smoothCaret })} className={settings.smoothCaret ? "control-active" : "control"}>smooth</button>
          <span className="control-divider" />
          <span className="control-label">caret</span>
          {(["line", "block", "underline"] as const).map((v) => (
            <button key={v} disabled={disabled} onClick={() => onChange({ ...settings, caretStyle: v, smoothCaret: true })} className={settings.caretStyle === v ? "control-active" : "control"}>{v}</button>
          ))}
        </div>
      )}

      {settings.mode === "custom" && (
        <div className="custom-text-panel">
          <textarea
            value={customDraft}
            disabled={disabled}
            placeholder="Paste custom text to type…"
            onChange={(e) => setCustomDraft(e.target.value)}
            onBlur={() => onChange({ ...settings, customText: customDraft })}
            rows={3}
            className="custom-text-area"
          />
          <button
            type="button"
            disabled={disabled || !customDraft.trim()}
            className="primary-button custom-text-apply"
            onClick={() => onChange({ ...settings, customText: customDraft })}
          >
            use text
          </button>
        </div>
      )}
    </div>
  );
}
