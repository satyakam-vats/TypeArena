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
  const linePitchRef = useRef<number>(0);
  const scrollLineRef = useRef<number>(0);
  const lastValidTopRef = useRef<number>(0);
  const lastValidLeftRef = useRef<number>(0);
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
    const container = containerRef.current;
    const copyEl = container?.querySelector(".typing-copy") as HTMLElement | null;
    const caret = caretElRef.current;

    if (!copyEl || !caret || !container) return;

    if (!displayTyped) {
      lastValidTopRef.current = 0;
      lastValidLeftRef.current = 0;
      scrollLineRef.current = 0;
      copyEl.style.transform = `translate3d(0, 0px, 0)`;
    }

    // Measure layout position with transform temporarily cleared so offsetTop isn't
    // mixed with a previous scroll translate (that combo caused 2nd-line thrashing).
    copyEl.style.transform = "none";

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
      // If offsetParent jumped past copyEl (positioned ancestor), fall back to rect math.
      if (curr !== copyEl) {
        const copyRect = copyEl.getBoundingClientRect();
        const elRect = el.getBoundingClientRect();
        l = elRect.left - copyRect.left;
        t = elRect.top - copyRect.top;
      }
      lastValidLeftRef.current = l;
      lastValidTopRef.current = t;
    }

    const left = lastValidLeftRef.current;
    const top = lastValidTopRef.current;
    const height = el?.offsetHeight || 28;

    // Line pitch from computed style (em-based CSS), measured once layout is real.
    if (linePitchRef.current <= 0) {
      const computedLineHeight = parseFloat(window.getComputedStyle(copyEl).lineHeight);
      const fontSize = parseFloat(window.getComputedStyle(copyEl).fontSize);
      if (!isNaN(computedLineHeight) && computedLineHeight > 0) {
        linePitchRef.current = computedLineHeight;
      } else if (!isNaN(fontSize) && fontSize > 0) {
        linePitchRef.current = fontSize * 1.85;
      } else {
        linePitchRef.current = height > 0 ? height * 1.15 : 44;
      }
    }
    const linePitch = linePitchRef.current;

    // Hysteresis so sub-pixel top wobble near line boundaries doesn't flip scroll
    // (classic 2nd-line up/down after a few seconds of typing).
    const rawLine = Math.max(0, Math.floor((top + linePitch * 0.15) / linePitch));
    let scrollLine = scrollLineRef.current;
    if (rawLine >= scrollLine + 1) {
      scrollLine = rawLine;
    } else if (rawLine <= scrollLine - 1 && top < scrollLine * linePitch - linePitch * 0.35) {
      scrollLine = rawLine;
    }
    scrollLineRef.current = scrollLine;

    // Keep caret on the middle row once we've scrolled past the first line.
    const targetLine = Math.max(0, scrollLine - 1);
    const nextTranslate = Math.round(targetLine * linePitch);

    // Halo + caret live inside .typing-copy (which scrolls), so use content-space coords.
    container.style.setProperty("--caret-left", `${left}px`);
    container.style.setProperty("--caret-top", `${top}px`);

    const lineChanged = Math.abs(top - prevTopRef.current) > linePitch * 0.4;
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

    // Only write height when it actually changes (avoids layout thrash every key).
    const lockedHeight = `${Math.round(linePitch * 3)}px`;
    if (container.style.height !== lockedHeight) {
      container.style.height = lockedHeight;
    }

    copyEl.style.transform = `translate3d(0, -${nextTranslate}px, 0)`;
  }, [displayTyped, target, replayIndex, caretStyle]);

  // New passage → remeasure line pitch / scroll lock.
  useEffect(() => {
    linePitchRef.current = 0;
    scrollLineRef.current = 0;
    lastValidTopRef.current = 0;
    lastValidLeftRef.current = 0;
    prevTopRef.current = 0;
  }, [target]);

  const caretActive = active && focused && replayIndex == null;
  const showOverlay = !focused && active && replayIndex == null;
  const activeCharIndex = Math.min(target.length - 1, displayTyped.length);

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

        <div className="typing-copy flex flex-wrap relative">
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
                const isCurrent = globalIndex === activeCharIndex && extra.length === 0;
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
