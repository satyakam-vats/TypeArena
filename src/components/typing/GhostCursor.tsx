import { useMemo } from "react";
import type { GhostReplay } from "../../lib/storage/ghostStorage";

type GhostCursorProps = {
  ghostReplay: GhostReplay | null;
  targetText: string;
  elapsedMs: number;
  active: boolean;
  typedText?: string;
};

export function GhostCursor({ ghostReplay, targetText, elapsedMs, active, typedText = "" }: GhostCursorProps) {
  const ghostPosition = useMemo(() => {
    if (!ghostReplay || elapsedMs === 0) return 0;
    const samples = ghostReplay.samples;
    if (!samples || samples.length === 0) return 0;
    
    // Binary search for sample index
    let low = 0;
    let high = samples.length - 1;
    let i = samples.length;
    
    while (low <= high) {
      const mid = (low + high) >> 1;
      if (samples[mid].elapsedMs > elapsedMs) {
        i = mid;
        high = mid - 1;
      } else {
        low = mid + 1;
      }
    }
    
    if (i === 0) return samples[0].charIndex;
    if (i === samples.length) return samples[samples.length - 1].charIndex;
    
    const prev = samples[i - 1];
    const next = samples[i];
    
    if (next.elapsedMs === prev.elapsedMs) return prev.charIndex;
    
    const ratio = (elapsedMs - prev.elapsedMs) / (next.elapsedMs - prev.elapsedMs);
    return Math.round(prev.charIndex + (next.charIndex - prev.charIndex) * ratio);
  }, [ghostReplay, elapsedMs]);

  if (!ghostReplay || !active) return null;

  const isAhead = ghostPosition > typedText.length;

  return (
    <>
      <div className="ghost-indicator" style={{ position: 'absolute', top: '-25px', left: 0 }}>
        <span>ghost: {Math.round(ghostReplay.finalWpm)} wpm</span>
        {isAhead && typedText.length > 0 && <span>(Keep pushing!)</span>}
      </div>
      <div 
        className="typing-copy" 
        style={{ 
          position: 'absolute', 
          inset: 0, 
          pointerEvents: 'none', 
          color: 'transparent',
          zIndex: 1,
          margin: 0
        }} 
        aria-hidden="true"
      >
        <span style={{ color: 'transparent' }}>{targetText.slice(0, ghostPosition)}</span>
        <span className="ghost-marker" />
        <span style={{ color: 'transparent' }}>{targetText.slice(ghostPosition)}</span>
      </div>
    </>
  );
}
