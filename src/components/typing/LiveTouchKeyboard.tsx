import React, { useEffect, useRef, useState } from 'react';

type Props = {
  targetText: string;
  typedText: string;
  active: boolean;
};

const KEYBOARD_LAYOUT = [
  ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
  ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
  ['z', 'x', 'c', 'v', 'b', 'n', 'm'],
  [' ']
];

const FINGER_MAP: Record<string, string> = {
  q: 'left pinky', a: 'left pinky', z: 'left pinky',
  w: 'left ring', s: 'left ring', x: 'left ring',
  e: 'left middle', d: 'left middle', c: 'left middle',
  r: 'left index', f: 'left index', v: 'left index',
  t: 'left index', g: 'left index', b: 'left index',
  y: 'right index', h: 'right index', n: 'right index',
  u: 'right index', j: 'right index', m: 'right index',
  i: 'right middle', k: 'right middle',
  o: 'right ring', l: 'right ring',
  p: 'right pinky',
  space: 'thumb',
};

export function LiveTouchKeyboard({ targetText, typedText, active }: Props) {
  const [pressedKeys, setPressedKeys] = useState<Set<string>>(new Set());
  const [lastErrorKey, setLastErrorKey] = useState<string | null>(null);

  // Identify next key target to type for touch typing
  const nextRawChar = targetText[typedText.length]?.toLowerCase();
  const nextTargetKey = nextRawChar === ' ' ? 'space' : nextRawChar;
  const targetFinger = nextTargetKey ? FINGER_MAP[nextTargetKey] : null;

  const nextTargetKeyRef = useRef(nextTargetKey);
  nextTargetKeyRef.current = nextTargetKey;

  // Track physical key presses and error flash in real-time
  useEffect(() => {
    if (!active) {
      setPressedKeys(new Set());
      setLastErrorKey(null);
      return;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      let key = e.key.toLowerCase();
      if (key === ' ') key = 'space';

      setPressedKeys((prev) => {
        const next = new Set(prev);
        next.add(key);
        return next;
      });

      // Instantaneous 80ms error flash on wrong key stroke
      if ((key.length === 1 || key === 'space') && !e.ctrlKey && !e.altKey && !e.metaKey) {
        if (nextTargetKeyRef.current && key !== nextTargetKeyRef.current) {
          setLastErrorKey(key);
          setTimeout(() => {
            setLastErrorKey((current) => (current === key ? null : current));
          }, 80);
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      let key = e.key.toLowerCase();
      if (key === ' ') key = 'space';
      setPressedKeys((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
      setLastErrorKey((current) => (current === key ? null : current));
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [active]);

  return (
    <div className="live-touch-keyboard-container animate-fade-in">

      <div className="keyboard-layout">
        {KEYBOARD_LAYOUT.map((row, rowIndex) => (
          <div key={rowIndex} className="keyboard-row">
            {row.map((key) => {
              const lookupKey = key === ' ' ? 'space' : key;
              const isSpace = key === ' ';
              const isTarget = active && nextTargetKey === lookupKey;
              const isPressed = pressedKeys.has(lookupKey);
              const isError = lastErrorKey === lookupKey;

              return (
                <div
                  key={key}
                  className={`keyboard-key live-key ${isSpace ? 'key-space' : ''} ${isTarget ? 'key-target' : ''} ${isPressed ? 'key-pressed' : ''} ${isError ? 'key-error-flash' : ''}`}
                >
                  <span className="key-label">{isSpace ? 'space' : key}</span>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
