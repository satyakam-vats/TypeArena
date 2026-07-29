import React from 'react';

type KeyboardHeatmapProps = {
  keyErrors: Record<string, number>;
  keyTotals: Record<string, number>;
  mode: 'run' | 'alltime';
  onModeChange: (mode: 'run' | 'alltime') => void;
};

const KEYBOARD_LAYOUT = [
  ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
  ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
  ['z', 'x', 'c', 'v', 'b', 'n', 'm'],
  [' ']
];

function getKeyColor(errors: number, total: number): string {
  if (total === 0) return 'var(--surface)';
  const rate = Math.min(errors / total, 1);
  // Interpolate from accent-soft (0%) to danger (100% via ~20% threshold)
  const intensity = Math.min(rate / 0.2, 1);
  return `color-mix(in srgb, var(--accent-soft) ${Math.round((1 - intensity) * 100)}%, var(--danger) ${Math.round(intensity * 100)}%)`;
}

export function KeyboardHeatmap({ keyErrors, keyTotals, mode, onModeChange }: KeyboardHeatmapProps) {
  return (
    <div className="keyboard-heatmap-container">
      <div className="control-row heatmap-controls">
        <button 
          className={mode === 'run' ? 'control-active' : 'control'} 
          onClick={() => onModeChange('run')}
        >
          this run
        </button>
        <button 
          className={mode === 'alltime' ? 'control-active' : 'control'} 
          onClick={() => onModeChange('alltime')}
        >
          all-time
        </button>
      </div>

      <div className="keyboard-layout">
        {KEYBOARD_LAYOUT.map((row, rowIndex) => (
          <div key={rowIndex} className="keyboard-row">
            {row.map((key) => {
              const lookupKey = key === ' ' ? 'space' : key;
              const errors = keyErrors[lookupKey] || 0;
              const total = keyTotals[lookupKey] || 0;
              const rate = total > 0 ? ((errors / total) * 100).toFixed(1) : '0.0';
              const isSpace = key === ' ';
              
              return (
                <div
                  key={key}
                  className={`keyboard-key ${isSpace ? 'key-space' : ''}`}
                  style={{ backgroundColor: getKeyColor(errors, total) }}
                  title={`${isSpace ? 'Space' : key.toUpperCase()}: ${errors}/${total} errors (${rate}%)`}
                >
                  <span className="key-label">{isSpace ? 'space' : key}</span>
                  {total > 0 && (
                    <div className="key-tooltip">
                      {rate}%
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <div className="heatmap-legend">
        <span className="legend-label">Accurate</span>
        <div className="legend-gradient"></div>
        <span className="legend-label">Error-prone</span>
      </div>
    </div>
  );
}
