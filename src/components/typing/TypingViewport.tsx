import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { getCharacterStates, getFailedWordIndices } from "../../lib/typing/metrics";
import type { CaretStyle, CaretSpeed } from "../../types/typing";

type TypingViewportProps = {
  target: string;
  typed: string;
  active: boolean;
  blind?: boolean;
  smoothCaret?: boolean;
  caretStyle?: CaretStyle;
  caretSpeed?: CaretSpeed;
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
  caretSpeed = "medium",
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
  const caretElRef = useRef<HTMLSpanElement | null>(null);
  const prevTopRef = useRef<number>(0);
  const [translateY, setTranslateY] = useState(0);

  // Group target text into word tokens so words never break mid-word across lines
  const wordTokens = useMemo(() => {
    const words: { startIdx: number; text: string }[] = [];
    const rawWords = target.split(" ");
    let currIdx = 0;
    for (let i = 0; i < rawWords.length; i++) {
      const w = rawWords[i];
      const textWithSpace = i < rawWords.length - 1 ? w + " " : w;
      words.push({ startIdx: currIdx, text: textWithSpace });
      currIdx += textWithSpace.length;
    }
    return words;
  }, [target]);

  useLayoutEffect(() => {
    if (!displayTyped) {
      setTranslateY(0);
    }

    const container = containerRef.current;
    const copyEl = container?.querySelector(".typing-copy") as HTMLElement | null;
    const el = activeCharRef.current || (container?.querySelector(".char") as HTMLElement | null);
    const caret = caretElRef.current;

    if (!copyEl || !el || !caret) return;

    const copyRect = copyEl.getBoundingClientRect();
    const charRect = el.getBoundingClientRect();

    // Exact sub-pixel coordinates relative to typing-copy container
    const left = charRect.left - copyRect.left;
    const top = charRect.top - copyRect.top;
    const height = charRect.height || 28;

    // Detect line wrap; disable diagonal transition animation when jumping across lines
    const lineChanged = Math.abs(top - prevTopRef.current) > 10;
    prevTopRef.current = top;

    if (lineChanged) {
      caret.classList.add("no-transition");
    } else {
      caret.classList.remove("no-transition");
    }

    caret.style.transform = `translate3d(${left}px, ${top}px, 0)`;
    if (caretStyle === "underline") {
      caret.style.height = "3px";
    } else {
      caret.style.height = `${height}px`;
    }

    // Discrete line-by-line scroll calculations
    const charHeight = charRect.height || 36;
    const lineIndex = Math.round(top / charHeight);
    const targetLine = Math.max(0, lineIndex - 1);
    const nextTranslate = Math.round(targetLine * charHeight);

    setTranslateY(nextTranslate);
  }, [displayTyped, target, replayIndex, caretStyle]);

  const caretActive = active && focused && replayIndex == null;
  const showOverlay = !focused && active && replayIndex == null;

  return (
    <div className={`typing-viewport-container ${blind ? "viewport-blind" : ""} ${comboMultiplier >= 5 ? "fever-glow" : ""}`} ref={containerRef}>
      {capsLock && active && (
        <div className="caps-lock-warn" role="status">Caps Lock</div>
      )}

      {showOverlay && (
        <button type="button" className="focus-overlay" onClick={onRequestFocus}>
          click here or press any key to focus
        </button>
      )}

      <div
        className="typing-copy flex flex-wrap relative"
        style={{ transform: `translateY(-${translateY}px)` }}
      >
        {smoothCaret && (
          <span
            ref={caretElRef}
            className={`smooth-caret caret-${caretStyle} smooth-${caretSpeed || "medium"} ${caretActive ? "active" : "hidden"}`}
          />
        )}

        {wordTokens.map((wordObj, wordIndex) => (
          <span key={wordIndex} className="word-group inline-block whitespace-nowrap">
            {wordObj.text.split("").map((ch, charOffset) => {
              const globalIndex = wordObj.startIdx + charOffset;
              const isCurrent = globalIndex === displayTyped.length;
              const st = states[globalIndex] ?? "pending";
              const isFailed = failed.has(globalIndex);
              const isBlind = blind && (st === "correct" || st === "incorrect");

              let cls = "char";
              if (st === "correct") cls += " char-correct";
              if (st === "incorrect") cls += " char-incorrect";
              if (isFailed) cls += " char-word-fail";
              if (isBlind) cls += " char-blind";

              const useHardCaret = !smoothCaret && isCurrent && caretActive;
              if (useHardCaret) cls += ` char-caret caret-${caretStyle}`;

              return (
                <span
                  key={globalIndex}
                  ref={isCurrent ? activeCharRef : null}
                  className={cls}
                >
                  {ch === " " ? "\u00A0" : ch}
                </span>
              );
            })}
          </span>
        ))}

        {extra.split("").map((ch, i) => (
          <span key={`extra-${i}`} className="char char-extra">
            {ch === " " ? "\u00A0" : ch}
          </span>
        ))}
      </div>
    </div>
  );
}

export default TypingViewport;
