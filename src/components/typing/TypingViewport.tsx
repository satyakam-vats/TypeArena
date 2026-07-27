import { getCharacterStates } from "../../lib/typing/metrics";

type TypingViewportProps = { target: string; typed: string; active: boolean };

export function TypingViewport({ target, typed, active }: TypingViewportProps) {
  const states = getCharacterStates(target, typed);
  const extra = typed.slice(target.length);
  return <div className="typing-copy" aria-live="polite" aria-label="Text to type">
    {Array.from(target).map((character, index) => <span key={index} className={`char char-${states[index]} ${index === typed.length && active ? "char-caret" : ""}`}>{character}</span>)}
    {extra && <span className="char-extra">{extra}</span>}
  </div>;
}
