import { useState, useMemo, useId } from 'react';

type TrendChartProps = {
  data: { label: string; value: number }[];
  height?: number;
  color?: string;
  fillOpacity?: number;
  yLabel?: string;
  showDots?: boolean;
  animate?: boolean;
};

export function TrendChart({
  data,
  height = 200,
  color = 'var(--accent)',
  fillOpacity = 0.15,
  yLabel = '',
  showDots = true,
  animate = true,
}: TrendChartProps) {
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);
  const rawGradientId = useId();
  const gradientId = `areaGradient-${rawGradientId.replace(/:/g, '')}`;

  const svgWidth = 800;
  const svgHeight = height;
  const paddingX = 40;
  const paddingY = 30;

  const { points, areaPath, linePath, minVal, maxVal } = useMemo(() => {
    if (data.length === 0) return { points: [], areaPath: '', linePath: '', minVal: 0, maxVal: 0 };

    const minV = Math.min(...data.map(d => d.value));
    const maxV = Math.max(...data.map(d => d.value));
    const rangeV = maxV === minV ? 1 : maxV - minV;
    
    // Add small padding to range to avoid lines directly touching SVG edges
    const paddedMin = maxV === minV ? Math.max(0, minV - 10) : Math.max(0, minV - rangeV * 0.1);
    const paddedMax = maxV === minV ? minV + 10 || 10 : maxV + rangeV * 0.1;
    const finalRange = paddedMax - paddedMin || 1;

    const coords = data.map((d, i) => {
      const x = paddingX + (i / Math.max(1, data.length - 1)) * (svgWidth - paddingX * 1.5);
      const y = svgHeight - paddingY - ((d.value - paddedMin) / finalRange) * (svgHeight - paddingY * 2);
      return { x, y, value: d.value, label: d.label };
    });

    const lPath = coords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x},${c.y}`).join(' ');
    
    const aPath = coords.length > 1
      ? `${lPath} L ${coords[coords.length - 1].x},${svgHeight - paddingY} L ${coords[0].x},${svgHeight - paddingY} Z`
      : '';

    return { points: coords, areaPath: aPath, linePath: lPath, minVal: paddedMin, maxVal: paddedMax };
  }, [data, svgWidth, svgHeight]);

  if (data.length === 0) {
    return (
      <div 
        className="flex items-center justify-center rounded border"
        style={{ height, borderColor: 'var(--line)', background: 'var(--surface)' }}
      >
        <span style={{ color: 'var(--muted)', fontFamily: '"DM Sans", sans-serif' }}>no data yet</span>
      </div>
    );
  }

  const midVal = (minVal + maxVal) / 2;

  return (
    <div className="relative w-full" style={{ height }}>
      <svg 
        viewBox={`0 0 ${svgWidth} ${svgHeight}`} 
        className="w-full h-full overflow-visible"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={fillOpacity} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>

        {/* Y Axis Grid Lines & Labels */}
        {[minVal, midVal, maxVal].map((val, i) => {
          const y = svgHeight - paddingY - ((val - minVal) / (maxVal - minVal || 1)) * (svgHeight - paddingY * 2);
          return (
            <g key={`y-axis-${i}`}>
              <line 
                x1={paddingX} y1={y} 
                x2={svgWidth - paddingX * 0.5} y2={y} 
                stroke="var(--line)" 
                strokeDasharray="4 4"
                strokeWidth="1"
              />
              <text 
                x={paddingX - 10} y={y} 
                alignmentBaseline="middle" textAnchor="end"
                fill="var(--muted)" fontSize="12"
                style={{ fontFamily: '"IBM Plex Mono", monospace' }}
              >
                {Math.round(val)}{yLabel}
              </text>
            </g>
          );
        })}

        {/* X Axis Labels */}
        {points.length === 1 ? (
          <text 
            x={points[0].x} y={svgHeight - 10} 
            textAnchor="middle" fill="var(--muted)" fontSize="12"
            style={{ fontFamily: '"IBM Plex Mono", monospace' }}
          >
            {points[0].label}
          </text>
        ) : points.length > 1 && (
          <>
            <text 
              x={points[0].x} y={svgHeight - 10} 
              textAnchor="middle" fill="var(--muted)" fontSize="12"
              style={{ fontFamily: '"IBM Plex Mono", monospace' }}
            >
              {points[0].label}
            </text>
            <text 
              x={points[points.length - 1].x} y={svgHeight - 10} 
              textAnchor="middle" fill="var(--muted)" fontSize="12"
              style={{ fontFamily: '"IBM Plex Mono", monospace' }}
            >
              {points[points.length - 1].label}
            </text>
          </>
        )}

        {/* Filled Area */}
        {points.length > 1 && (
          <path 
            d={areaPath} 
            fill={`url(#${gradientId})`}
            className={animate ? 'chart-area-animate' : ''}
          />
        )}

        {/* Trend Line */}
        <path 
          d={linePath} 
          fill="none" 
          stroke={color} 
          strokeWidth="2.5" 
          strokeLinecap="round" 
          strokeLinejoin="round"
          className={animate ? 'chart-path-animate' : ''}
        />

        {/* Dots & Hover Interaction */}
        {showDots && points.map((p, i) => (
          <g key={i}>
            <circle
              cx={p.x} cy={p.y}
              r={hoveredPoint === i ? 6 : 4}
              fill="var(--surface)"
              stroke={color}
              strokeWidth="2"
              className="transition-all duration-200 cursor-pointer"
              onMouseEnter={() => setHoveredPoint(i)}
              onMouseLeave={() => setHoveredPoint(null)}
            />
          </g>
        ))}
      </svg>

      {/* Tooltip with edge clamping */}
      {hoveredPoint !== null && (
        <div 
          className="absolute z-10 pointer-events-none chart-tooltip px-2.5 py-1.5 rounded shadow-md text-xs whitespace-nowrap"
          style={{ 
            left: `${Math.min(92, Math.max(8, (points[hoveredPoint].x / svgWidth) * 100))}%`,
            top: `${Math.min(85, Math.max(10, (points[hoveredPoint].y / svgHeight) * 100))}%`,
            transform: 'translate(-50%, -130%)',
            background: 'var(--surface)',
            color: 'var(--ink)',
            border: '1px solid var(--line)',
            fontFamily: '"IBM Plex Mono", monospace'
          }}
        >
          <div className="font-bold mb-0.5">{points[hoveredPoint].value}{yLabel}</div>
          <div style={{ color: 'var(--muted)' }}>{points[hoveredPoint].label}</div>
        </div>
      )}
    </div>
  );
}
