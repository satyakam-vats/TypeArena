import React, { useEffect, useRef, useState } from "react";
import type { TestSettings } from "../../types/typing";
import { selectableWordSources } from "../../lib/typing/wordSources";
import { GITHUB_CODE_PRESETS } from "../../lib/github/githubApi";
import { SlidersHorizontal, Globe, Code2, Github, Hash, AtSign, Clock, FileText, Quote as QuoteIcon, Flame, Wrench } from "lucide-react";

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

const availableNgrams = ["th", "ch", "sh", "ion", "str", "qu"] as const;
const wordDifficultyOptions = [
  { id: "easy" as const, label: "easy" },
  { id: "medium" as const, label: "medium" },
  { id: "hard" as const, label: "hard" },
  { id: "all" as const, label: "all" },
];

export function TestControls({ settings, onChange, disabled, compact }: Props) {
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customValue, setCustomValue] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [customDraft, setCustomDraft] = useState(settings.customText || "");
  const inputRef = useRef<HTMLInputElement>(null);

  const selectMode = (mode: TestSettings["mode"]) => {
    setShowCustomInput(false);
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
    setShowCustomInput(false);
  };

  useEffect(() => {
    if (showCustomInput && inputRef.current) inputRef.current.focus();
  }, [showCustomInput]);

  useEffect(() => {
    setCustomDraft(settings.customText || "");
  }, [settings.customText]);

  const showLength = settings.mode === "time" || settings.mode === "words";
  const showPunctNum = settings.mode === "time" || settings.mode === "words" || settings.mode === "zen";
  // Word-pool difficulty only applies to the English word source (not code/quotes/practice).
  const showWordDifficulty =
    showPunctNum && (settings.wordSourceId || "common-en") === "common-en";

  const toggleNgram = (ngram: string) => {
    const current = settings.selectedNgrams || ["th", "ch", "sh", "ion", "str", "qu"];
    const exists = current.includes(ngram);
    const next = exists ? current.filter((n) => n !== ngram) : [...current, ngram];
    onChange({ ...settings, selectedNgrams: next.length > 0 ? next : [ngram] });
  };

  return (
    <div className={`test-controls-container ${compact ? "compact" : ""}`}>
      {/* Primary Monkeytype-Style 3-Capsule Navigation Bar */}
      <div className="test-controls-bar" aria-label="Test settings">
        
        {/* Capsule 1: Modifiers (@ punctuation, # numbers) */}
        {showPunctNum && settings.wordSourceId !== "practice" && settings.wordSourceId !== "code" && settings.wordSourceId !== "github" && settings.wordSourceId !== "ngram" && (
          <div className="test-control-capsule">
            <button
              disabled={disabled}
              onClick={() => onChange({ ...settings, punctuation: !settings.punctuation })}
              className={settings.punctuation ? "control-active" : "control"}
              title="Toggle punctuation"
            >
              <AtSign size={13} />
              <span>punctuation</span>
            </button>
            <button
              disabled={disabled}
              onClick={() => onChange({ ...settings, numbers: !settings.numbers })}
              className={settings.numbers ? "control-active" : "control"}
              title="Toggle numbers"
            >
              <Hash size={13} />
              <span>numbers</span>
            </button>
          </div>
        )}

        {/* Capsule 2: Modes (time, words, quote, zen, custom) */}
        <div className="test-control-capsule">
          <button disabled={disabled} onClick={() => selectMode("time")} className={settings.mode === "time" ? "control-active" : "control"}>
            <Clock size={13} />
            <span>time</span>
          </button>
          <button disabled={disabled} onClick={() => selectMode("words")} className={settings.mode === "words" ? "control-active" : "control"}>
            <FileText size={13} />
            <span>words</span>
          </button>
          <button disabled={disabled} onClick={() => selectMode("quote")} className={settings.mode === "quote" ? "control-active" : "control"}>
            <QuoteIcon size={13} />
            <span>quote</span>
          </button>
          <button disabled={disabled} onClick={() => selectMode("zen")} className={settings.mode === "zen" ? "control-active" : "control"}>
            <Flame size={13} />
            <span>zen</span>
          </button>
          <button disabled={disabled} onClick={() => selectMode("custom")} className={settings.mode === "custom" ? "control-active" : "control"}>
            <Wrench size={13} />
            <span>custom</span>
          </button>
        </div>

        {/* Capsule 3: Dynamic Mode Values (15, 30, 60, 120 or short, medium, long) */}
        {showLength && (
          <div className="test-control-capsule">
            {values.map((val) => (
              <button
                key={val}
                disabled={disabled}
                onClick={() => { setShowCustomInput(false); onChange({ ...settings, value: val }); }}
                className={!showCustomInput && settings.value === val ? "control-active" : "control"}
              >
                {val}{settings.mode === "time" ? "s" : ""}
              </button>
            ))}
            {showCustomInput ? (
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
              <button disabled={disabled} onClick={() => { setCustomValue(String(settings.value)); setShowCustomInput(true); }} className={isCustomLen ? "control-active" : "control"}>
                custom
              </button>
            )}
          </div>
        )}

        {settings.mode === "quote" && (
          <div className="test-control-capsule">
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
          </div>
        )}

        {/* Word difficulty: easy / medium / hard / all (English pool only) */}
        {showWordDifficulty && (
          <div className="test-control-capsule" aria-label="Word difficulty">
            {wordDifficultyOptions.map((opt) => (
              <button
                key={opt.id}
                type="button"
                disabled={disabled}
                title={
                  opt.id === "easy"
                    ? "Short everyday words (2–4 letters)"
                    : opt.id === "medium"
                      ? "Mid-length words (5–7 letters)"
                      : opt.id === "hard"
                        ? "Longer vocabulary (8+ letters)"
                        : "Full English word pool"
                }
                onClick={() => onChange({ ...settings, wordDifficulty: opt.id })}
                className={(settings.wordDifficulty || "medium") === opt.id ? "control-active" : "control"}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}

        {/* Settings Toggle Capsule */}
        <div className="test-control-capsule">
          <button
            type="button"
            disabled={disabled}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono rounded transition-all ${showAdvanced ? "control-active" : "control"}`}
            onClick={() => setShowAdvanced((v) => !v)}
            title="Advanced behavior settings & caret controls"
          >
            <SlidersHorizontal size={13} />
            <span>settings</span>
          </button>
        </div>
      </div>

      {/* Sub-bar: Language & Content Preset Selection */}
      {showPunctNum && settings.wordSourceId !== "practice" && (
        <div className="test-source-subbar">
          <Globe size={13} className="text-[var(--accent)]" />
          {selectableWordSources.map((source) => (
            <button
              key={source.id}
              disabled={disabled}
              onClick={() => onChange({ ...settings, wordSourceId: source.id })}
              className={(settings.wordSourceId || "common-en") === source.id ? "control-active" : "control"}
            >
              {source.label}
            </button>
          ))}
        </div>
      )}

      {/* GitHub Repo Preset Selector */}
      {settings.wordSourceId === "github" && (
        <div className="test-control-capsule mt-1">
          <span className="text-xs text-[var(--muted)] px-2 flex items-center gap-1 font-mono">
            <Github size={13} /> repo:
          </span>
          {GITHUB_CODE_PRESETS.map((preset) => (
            <button
              key={preset.id}
              disabled={disabled}
              onClick={() => onChange({ ...settings, githubPresetId: preset.id })}
              className={(settings.githubPresetId || "react-hooks") === preset.id ? "control-active" : "control"}
            >
              {preset.label}
            </button>
          ))}
        </div>
      )}

      {/* N-Gram Selection Pills */}
      {settings.wordSourceId === "ngram" && (
        <div className="test-control-capsule mt-1">
          <span className="text-xs text-[var(--muted)] px-2 font-mono">n-grams:</span>
          {availableNgrams.map((ng) => {
            const active = (settings.selectedNgrams || ["th", "ch", "sh", "ion", "str", "qu"]).includes(ng);
            return (
              <button
                key={ng}
                disabled={disabled}
                onClick={() => toggleNgram(ng)}
                className={active ? "control-active" : "control"}
              >
                {ng}
              </button>
            );
          })}
        </div>
      )}

      {/* Advanced Settings Drawer */}
      {showAdvanced && (
        <div className="advanced-settings-popover">
          <div className="advanced-row">
            <span className="advanced-row-label">stop on error</span>
            <div className="test-control-capsule">
              {(["off", "word", "letter"] as const).map((v) => (
                <button key={v} disabled={disabled} onClick={() => onChange({ ...settings, stopOnError: v })} className={settings.stopOnError === v ? "control-active" : "control"}>
                  {v}
                </button>
              ))}
            </div>
          </div>

          <div className="advanced-row">
            <span className="advanced-row-label">confidence</span>
            <div className="test-control-capsule">
              {(["off", "on", "max"] as const).map((v) => (
                <button key={v} disabled={disabled} onClick={() => onChange({ ...settings, confidence: v })} className={settings.confidence === v ? "control-active" : "control"}>
                  {v}
                </button>
              ))}
            </div>
          </div>

          <div className="advanced-row">
            <span className="advanced-row-label">difficulty</span>
            <div className="test-control-capsule">
              {(["normal", "expert", "master"] as const).map((v) => (
                <button key={v} disabled={disabled} onClick={() => onChange({ ...settings, difficulty: v })} className={settings.difficulty === v ? "control-active" : "control"}>
                  {v}
                </button>
              ))}
            </div>
          </div>

          <div className="advanced-row">
            <span className="advanced-row-label">caret style</span>
            <div className="test-control-capsule">
              {(["line", "block", "underline"] as const).map((v) => (
                <button key={v} disabled={disabled} onClick={() => onChange({ ...settings, caretStyle: v, smoothCaret: true })} className={settings.caretStyle === v ? "control-active" : "control"}>
                  {v}
                </button>
              ))}
            </div>
          </div>

          <div className="advanced-row">
            <span className="advanced-row-label">caret speed</span>
            <div className="test-control-capsule">
              {(["off", "fast", "medium", "slow"] as const).map((v) => (
                <button
                  key={v}
                  disabled={disabled}
                  onClick={() => onChange({ ...settings, caretSpeed: v, smoothCaret: v !== "off" })}
                  className={(settings.caretSpeed || "medium") === v ? "control-active" : "control"}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

          <div className="advanced-row">
            <span className="advanced-row-label">toggles</span>
            <div className="test-control-capsule">
              <button disabled={disabled} onClick={() => onChange({ ...settings, blind: !settings.blind })} className={settings.blind ? "control-active" : "control"}>
                blind
              </button>
              <button disabled={disabled} onClick={() => onChange({ ...settings, focusMode: !settings.focusMode })} className={settings.focusMode ? "control-active" : "control"}>
                focus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Text Area Panel */}
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
