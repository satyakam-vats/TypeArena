import type { TestSettings } from "../../types/typing";

type Props = { settings: TestSettings; onChange: (settings: TestSettings) => void; disabled?: boolean };
const timeOptions = [15, 30, 60, 120] as const;
const wordOptions = [10, 25, 50, 100] as const;

export function TestControls({ settings, onChange, disabled }: Props) {
  const selectMode = (mode: TestSettings["mode"]) => onChange({ ...settings, mode, value: mode === "time" ? 30 : 25 });
  const values = settings.mode === "time" ? timeOptions : wordOptions;
  return <div className="control-row" aria-label="Test settings">
    <button disabled={disabled} onClick={() => selectMode("time")} className={settings.mode === "time" ? "control-active" : "control"}>time</button>
    <button disabled={disabled} onClick={() => selectMode("words")} className={settings.mode === "words" ? "control-active" : "control"}>words</button>
    <span className="control-divider" />
    {values.map((value) => <button key={value} disabled={disabled} onClick={() => onChange({ ...settings, value })} className={settings.value === value ? "control-active" : "control"}>{value}{settings.mode === "time" ? "s" : ""}</button>)}
  </div>;
}
