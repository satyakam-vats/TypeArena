import { useState, useRef, useEffect } from "react";
import type { TestSettings } from "../../types/typing";
import { wordSourceList } from "../../lib/typing/wordSources";

type Props = { settings: TestSettings; onChange: (settings: TestSettings) => void; disabled?: boolean };
const timeOptions = [15, 30, 60, 120] as const;
const wordOptions = [10, 25, 50, 100] as const;

export function TestControls({ settings, onChange, disabled }: Props) {
  const [showCustom, setShowCustom] = useState(false);
  const [customValue, setCustomValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const selectMode = (mode: TestSettings["mode"]) => {
    setShowCustom(false);
    onChange({ ...settings, mode, value: mode === "time" ? 30 : 25 });
  };
  
  const values = settings.mode === "time" ? timeOptions : wordOptions;
  const isCustom = !(values as readonly number[]).includes(settings.value);

  const applyCustom = () => {
    let val = parseInt(customValue, 10);
    if (!isNaN(val)) {
      if (settings.mode === "time") {
        val = Math.max(5, Math.min(300, val));
      } else {
        val = Math.max(5, Math.min(500, val));
      }
      onChange({ ...settings, value: val });
    }
    setShowCustom(false);
  };

  const handleCustomClick = () => {
    setCustomValue(settings.value.toString());
    setShowCustom(true);
  };

  useEffect(() => {
    if (showCustom && inputRef.current) {
      inputRef.current.focus();
    }
  }, [showCustom]);

  return <div className="control-row flex-wrap gap-y-2" aria-label="Test settings">
    <button disabled={disabled} onClick={() => selectMode("time")} className={settings.mode === "time" ? "control-active" : "control"}>time</button>
    <button disabled={disabled} onClick={() => selectMode("words")} className={settings.mode === "words" ? "control-active" : "control"}>words</button>
    <span className="control-divider" />
    {values.map((value) => <button key={value} disabled={disabled} onClick={() => { setShowCustom(false); onChange({ ...settings, value }); }} className={!showCustom && settings.value === value ? "control-active" : "control"}>{value}{settings.mode === "time" ? "s" : ""}</button>)}
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
      <button 
        disabled={disabled} 
        onClick={handleCustomClick} 
        className={isCustom ? "control-active" : "control"}
      >
        custom
      </button>
    )}
    <span className="control-divider" />
    {wordSourceList.map((source) => (
      <button
        key={source.id}
        disabled={disabled}
        onClick={() => onChange({ ...settings, wordSourceId: source.id })}
        className={(settings.wordSourceId || "common-en") === source.id ? "control-active" : "control"}
      >
        {source.label}
      </button>
    ))}
  </div>;
}
