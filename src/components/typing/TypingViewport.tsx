import { useLayoutEffect, useRef, useState } from "react";
import { getCharacterStates } from "../../lib/typing/metrics";

type TypingViewportProps = { target: string; typed: string; active: boolean };

/** Monkeytype-style fixed-height viewport that keeps the caret near the top line. */
export function TypingViewport({ target, typed, active }: TypingViewportProps) {
  const states = getCharacterStates(target, typed);
  const extra = typed.slice(target.length);
  const activeCharRef = useRef<HTMLSpanElement | null>(null);
  const [translateY, setTranslateY] = useState(0);

  useLayoutEffect(() => {
    if (!typed) {
      setTranslateY(0);
      return;
    }

    const el = activeCharRef.current;
    if (!el) return;

    const charTop = el.offsetTop;
    const charHeight = el.offsetHeight || 36;
    // Keep roughly one line of context above the caret once past the first line.
    const next = charTop <= charHeight * 1.15 ? 0 : Math.max(0, charTop - charHeight * 1.05);
    setTranslateY(next);
  }, [typed, target]);

  return (
    <div className="typing-viewport-container">
      <div
        className="typing-copy"
        style={{ transform: `translateY(-${translateY}px)` }}
        aria-live="polite"
        aria-label="Text to type"
      >
        {Array.from(target).map((character, index) => {
          const isActive = index === typed.length && active;
          return (
            <span
              key={index}
              ref={isActive ? activeCharRef : null}
              className={`char char-${states[index]} ${isActive ? "char-caret" : ""}`}
            >
              {character}
            </span>
          );
        })}
        {extra && <span className="char-extra">{extra}</span>}
      </div>
    </div>
  );
}
