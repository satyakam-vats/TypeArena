import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { getCharacterStates, getFailedWordIndices } from "../../lib/typing/metrics";
import { getAuraInfo, getAuraProgress } from "../../lib/typing/aura";
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
  const prevTierRef = useRef<number>(0);
  const [translateY, setTranslateY] = useState(0);
  const [isTierUp, setIsTierUp] = useState(false);

  const aura = useMemo(() => getAuraInfo(comboCount), [comboCount]);
  const auraProgress = useMemo(() => getAuraProgress(comboCount), [comboCount]);

  useEffect(() => {
    if (aura.tier > prevTierRef.current && prevTierRef.current > 0) {
      setIsTierUp(true);
      const timer = setTimeout(() => setIsTierUp(false), 500);
      return () => clearTimeout(timer);
    }
    prevTierRef.current = aura.tier;
  }, [aura.tier]);

  // Continuous growth within a tier (0–1) drives CSS custom props for smooth scale-up.
  const auraStyle = useMemo((): CSSProperties => ({
    ["--aura-progress" as string]: String(auraProgress),
    ["--aura-spread" as string]: `${12 + aura.tier * 10 + auraProgress * 14}px`,
    ["--aura-intensity" as string]: String(0.22 + aura.tier * 0.12 + auraProgress * 0.1),
  }), [aura.tier, auraProgress]);

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

    if (!copyEl || !el || !caret || !container) return;

    const copyRect = copyEl.getBoundingClientRect();
    const charRect = el.getBoundingClientRect();

    // Exact sub-pixel coordinates relative to typing-copy container
    const left = charRect.left - copyRect.left;
    const top = charRect.top - copyRect.top;
    const height = charRect.height || 28;

    // Set caret position custom variables on container for local aura halo
    container.style.setProperty("--caret-left", `${left}px`);
    container.style.setProperty("--caret-top", `${top}px`);

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

    // Discrete line-by-line scroll calculations using computed line pitch (distance between lines)
    const computedLineHeight = parseFloat(window.getComputedStyle(copyEl).lineHeight);
    const linePitch = !isNaN(computedLineHeight) && computedLineHeight > 0 ? computedLineHeight : 44;

    // Lock container height to exactly 3 full lines so partial lines never clip at top/bottom
    container.style.height = `${linePitch * 3}px`;

    const lineIndex = Math.round(top / linePitch);
    const targetLine = Math.max(0, lineIndex - 1);
    const nextTranslate = Math.round(targetLine * linePitch);

    setTranslateY(nextTranslate);
  }, [displayTyped, target, replayIndex, caretStyle]);

  const caretActive = active && focused && replayIndex == null;
  const showOverlay = !focused && active && replayIndex == null;

  return (
    <div
      className={`typing-viewport-aura ${aura.className} ${aura.tier >= 5 ? "aura-fever" : ""} ${isTierUp ? "aura-tier-up-pop" : ""}`}
      style={aura.tier > 0 ? auraStyle : undefined}
      data-aura-tier={aura.tier}
    >
      {/* Background soft ambient halo */}
      {aura.tier > 0 && (
        <>
          <div className="aura-ambient-edge" />
          {aura.tier >= 3 && <div className="aura-ring" />}
          {aura.tier >= 5 && <div className="aura-sparks" />}
        </>
      )}

      <div
        className={`typing-viewport-container ${blind ? "viewport-blind" : ""} ${aura.tier >= 5 ? "fever-glow" : ""}`}
        ref={containerRef}
      >
        {/* Integrated Top Progress Track */}
        {aura.tier > 0 && (
          <div className="aura-header-strip">
            <div className="aura-progress-track">
              <div
                className="aura-progress-fill"
                style={{ width: `${Math.min(100, Math.max(0, auraProgress * 100))}%` }}
              />
            </div>
          </div>
        )}

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
          {/* Caret Local Energy Aura Halo */}
          {aura.tier > 0 && caretActive && (
            <div
              className={`caret-ambient-halo aura-halo-tier-${aura.tier}`}
              style={{
                transform: `translate3d(calc(var(--caret-left, 0px) - 24px), calc(var(--caret-top, 0px) - 12px), 0)`,
              }}
            />
          )}

          {smoothCaret && (
            <span
              ref={caretElRef}
              className={`smooth-caret caret-${caretStyle} smooth-${caretSpeed || "medium"} ${caretActive ? "active" : "hidden"} ${aura.tier > 0 ? `caret-aura-${aura.tier}` : ""}`}
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
            <span
              key={`extra-${i}`}
              ref={i === extra.length - 1 ? activeCharRef : null}
              className="char char-extra"
            >
              {ch === " " ? "\u00A0" : ch}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export default TypingViewport;
