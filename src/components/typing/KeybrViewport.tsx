import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import type { CaretStyle } from "../../types/typing";

type KeybrViewportProps = {
  target: string;
  typed: string;
  active: boolean;
  caretStyle?: CaretStyle;
  focused?: boolean;
  onRequestFocus?: () => void;
};

export function KeybrViewport({
  target,
  typed,
  active,
  caretStyle = "line",
  focused = true,
  onRequestFocus,
}: KeybrViewportProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const copyRef = useRef<HTMLDivElement | null>(null);
  const caretRef = useRef<HTMLSpanElement | null>(null);
  const activeCharRef = useRef<HTMLSpanElement | null>(null);
  const linePitchRef = useRef<number>(48);
  const lastValidTopRef = useRef<number>(0);
  const lastValidLeftRef = useRef<number>(0);

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

  const activeCharIndex = Math.min(target.length - 1, typed.length);

  useLayoutEffect(() => {
    const container = containerRef.current;
    const copyEl = copyRef.current;
    const caret = caretRef.current;

    if (!container || !copyEl || !caret) return;

    if (!typed) {
      lastValidTopRef.current = 0;
      lastValidLeftRef.current = 0;
      copyEl.style.transform = `translate3d(0, 0px, 0)`;
    }

    const el = activeCharRef.current;
    if (el) {
      let curr: HTMLElement | null = el;
      let l = 0;
      let t = 0;
      while (curr && curr !== copyEl) {
        l += curr.offsetLeft;
        t += curr.offsetTop;
        curr = curr.offsetParent as HTMLElement | null;
      }
      lastValidLeftRef.current = l;
      lastValidTopRef.current = t;
    }

    const left = lastValidLeftRef.current;
    const top = lastValidTopRef.current;
    const height = el?.offsetHeight || 32;

    // Smooth horizontal caret positioning
    caret.style.transform = `translate3d(${left}px, ${top}px, 0)`;
    caret.style.height = caretStyle === "underline" ? "3px" : `${height}px`;

    const LINE_PITCH = 48;

    // Discrete 2-line window scroll calculation (floor with tolerance prevents line jitter)
    const lineIndex = Math.floor((top + 10) / LINE_PITCH);
    const targetLine = Math.max(0, lineIndex - 1);
    const nextTranslate = targetLine * LINE_PITCH;

    // Smooth hardware GPU transform directly on copy element
    copyEl.style.transform = `translate3d(0, -${nextTranslate}px, 0)`;
  }, [typed, target, caretStyle]);

  const showOverlay = !focused && active;

  return (
    <div className="keybr-viewport-wrapper">
      <div className="keybr-viewport-container" ref={containerRef}>
        {showOverlay && (
          <button type="button" className="focus-overlay" onClick={onRequestFocus}>
            click here or press any key to focus
          </button>
        )}

        <div className="keybr-copy" ref={copyRef}>
          {active && (
            <span
              ref={caretRef}
              className={`keybr-caret caret-${caretStyle} ${focused ? "active" : "hidden"}`}
            />
          )}

          {wordTokens.map((wordObj, wordIndex) => (
            <span key={wordIndex} className="keybr-word-group">
              {wordObj.text.split("").map((ch, charOffset) => {
                const globalIndex = wordObj.startIdx + charOffset;
                const isCurrent = globalIndex === activeCharIndex;

                let state = "pending";
                if (globalIndex < typed.length) {
                  state = typed[globalIndex] === target[globalIndex] ? "correct" : "incorrect";
                }

                let cls = "keybr-char";
                if (state === "correct") cls += " keybr-correct";
                if (state === "incorrect") cls += " keybr-incorrect";

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
        </div>
      </div>
    </div>
  );
}

export default KeybrViewport;
