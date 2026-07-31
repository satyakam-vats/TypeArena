import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { getCharacterStates, getFailedWordIndices } from "../../lib/typing/metrics";
import type { CaretStyle } from "../../types/typing";

type TypingViewportProps = {
  target: string;
  typed: string;
  active: boolean;
  blind?: boolean;
  smoothCaret?: boolean;
  caretStyle?: CaretStyle;
  focused?: boolean;
  capsLock?: boolean;
  onRequestFocus?: () => void;
  replayIndex?: number | null;
  comboCount?: number;
  comboMultiplier?: number;
};

export function TypingViewport({
  target,
  typed,
  active,
  blind = false,
  smoothCaret = true,
  caretStyle = "line",
  focused = true,
  capsLock = false,
  onRequestFocus,
  replayIndex = null,
  comboCount = 0,
  comboMultiplier = 1,
}: TypingViewportProps) {
  const displayTyped = replayIndex != null ? target.slice(0, replayIndex) : typed;
  const states = getCharacterStates(target, displayTyped);
  const failed = getFailedWordIndices(target, displayTyped);
  const extra = displayTyped.length > target.length ? displayTyped.slice(target.length) : "";
  const activeCharRef = useRef<HTMLSpanElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [translateY, setTranslateY] = useState(0);
  const [caretPos, setCaretPos] = useState({ left: 0, top: 0, height: 28 });

  useLayoutEffect(() => {
    if (!displayTyped) {
      setTranslateY(0);
    }
    const el = activeCharRef.current;
    if (!el) {
      const first = containerRef.current?.querySelector(".char") as HTMLElement | null;
      if (first) {
        setCaretPos({ left: first.offsetLeft, top: first.offsetTop, height: first.offsetHeight || 28 });
      }
      return;
    }

    const charTop = el.offsetTop;
    const charHeight = el.offsetHeight || 36;
    const next = charTop <= charHeight * 1.15 ? 0 : Math.max(0, charTop - charHeight * 1.05);
    setTranslateY(next);
    setCaretPos({
      left: el.offsetLeft,
      top: el.offsetTop,
      height: el.offsetHeight || 28,
    });
  }, [displayTyped, target, replayIndex]);

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      const el = activeCharRef.current;
      if (el) {
        setCaretPos({ left: el.offsetLeft, top: el.offsetTop, height: el.offsetHeight || 28 });
      }
    });
    return () => cancelAnimationFrame(id);
  }, [translateY, displayTyped]);

  const caretActive = active && focused && replayIndex == null;
  const showOverlay = !focused && active && replayIndex == null;

  return (
    <div className={`typing-viewport-container ${blind ? "viewport-blind" : ""} ${comboMultiplier >= 5 ? "fever-glow" : ""}`} ref={containerRef}>
      {capsLock && active && (
        <div className="caps-lock-warn" role="status">Caps Lock</div>
      )}

      {comboCount >= 5 && active && replayIndex == null && (
        <div className={`combo-badge ${comboMultiplier >= 5 ? "fever-badge" : ""}`}>
          <span className="combo-count">{comboCount}x</span>
          <span className="combo-multiplier">{comboMultiplier >= 5 ? "FEVER 🔥" : `x${comboMultiplier}`}</span>
        </div>
      )}

      {showOverlay && (
        <button type="button" className="focus-overlay" onClick={onRequestFocus}>
          click here or press any key to focus
        </button>
      )}
      <div
        className="typing-copy"
        style={{ transform: `translateY(-${translateY}px)` }}
        aria-live="polite"
        aria-label="Text to type"
      >
        {Array.from(target).map((character, index) => {
          const isActive = index === displayTyped.length && active;
          const state = states[index] ?? "pending";
          const wordFail = failed.has(index);
          return (
            <span
              key={index}
              ref={isActive ? activeCharRef : null}
              className={[
                "char",
                blind && state !== "pending" ? "char-blind" : `char-${state}`,
                wordFail && !blind ? "char-word-fail" : "",
                isActive && !smoothCaret ? "char-caret" : "",
                isActive && !smoothCaret ? `caret-${caretStyle}` : "",
              ].filter(Boolean).join(" ")}
            >
              {character}
            </span>
          );
        })}
        {extra && <span className="char-extra">{extra}</span>}
        {displayTyped.length >= target.length && active && (
          <span ref={displayTyped.length >= target.length ? activeCharRef : null} className="char char-pending" />
        )}
      </div>
      {smoothCaret && caretActive && (
        <span
          className={`smooth-caret caret-${caretStyle}`}
          style={{
            transform: `translate(${caretPos.left}px, ${caretPos.top - translateY}px)`,
            height: caretStyle === "underline" ? 3 : caretPos.height * 0.87,
          }}
        />
      )}
      {replayIndex != null && (
        <span
          className="smooth-caret caret-block replay-caret"
          style={{
            transform: `translate(${caretPos.left}px, ${caretPos.top - translateY}px)`,
            height: caretPos.height * 0.87,
          }}
        />
      )}
    </div>
  );
}
