import React, { useEffect, useState } from 'react';

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

  // Track physical key presses in real-time
  useEffect(() => {
    if (!active) {
      setPressedKeys(new Set());
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
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      let key = e.key.toLowerCase();
      if (key === ' ') key = 'space';
      setPressedKeys((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [active]);

  // Flash error key when user makes a mistake
  useEffect(() => {
    if (typedText.length === 0) {
      setLastErrorKey(null);
      return;
    }

    const idx = typedText.length - 1;
    const targetChar = targetText[idx]?.toLowerCase();
    const typedChar = typedText[idx]?.toLowerCase();

    if (targetChar && typedChar && targetChar !== typedChar) {
      const errorKey = typedChar === ' ' ? 'space' : typedChar;
      setLastErrorKey(errorKey);
      const timer = setTimeout(() => setLastErrorKey(null), 400);
      return () => clearTimeout(timer);
    }
  }, [typedText, targetText]);

  // Identify next key target to type for touch typing
  const nextRawChar = targetText[typedText.length]?.toLowerCase();
  const nextTargetKey = nextRawChar === ' ' ? 'space' : nextRawChar;
  const targetFinger = nextTargetKey ? FINGER_MAP[nextTargetKey] : null;

  return (
    <div className="live-touch-keyboard-container animate-fade-in">
      {targetFinger && active && (
        <div className="touch-finger-hint">
          next finger: <span className="finger-highlight">{targetFinger}</span> (<span className="key-highlight">{nextTargetKey === 'space' ? 'spacebar' : nextTargetKey.toUpperCase()}</span>)
        </div>
      )}

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
