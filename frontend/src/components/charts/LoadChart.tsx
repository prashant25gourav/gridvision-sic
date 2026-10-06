import { useState } from 'react';
import type { DemandDataPoint } from '../../types/energy';

interface LoadChartProps {
  data: DemandDataPoint[];
  title?: string;
  height?: number;
}

export function LoadChart({ data, height = 240 }: LoadChartProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return <div style={{ color: 'var(--text-muted)', padding: '2rem', textAlign: 'center' }}>No telemetry data</div>;
  }

  // Viewbox coordinates
  const width = 800;
  const padding = { top: 20, right: 30, bottom: 35, left: 50 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const maxVal = Math.max(...data.flatMap((d) => [d.actualKw, d.baselineKw])) * 1.15;
  const minVal = 0;

  const getX = (index: number) => padding.left + (index / (data.length - 1)) * chartW;
  const getY = (val: number) => padding.top + chartH - ((val - minVal) / (maxVal - minVal)) * chartH;

  // Generate paths
  const actualPoints = data.map((d, i) => `${getX(i)},${getY(d.actualKw)}`);
  const actualPath = `M ${actualPoints.join(' L ')}`;

  const baselinePoints = data.map((d, i) => `${getX(i)},${getY(d.baselineKw)}`);
  const baselinePath = `M ${baselinePoints.join(' L ')}`;

  // Area path for actual demand
  const areaPath = `${actualPath} L ${getX(data.length - 1)},${padding.top + chartH} L ${getX(0)},${padding.top + chartH} Z`;

  const yTicks = [0, 250, 500, 750, 1000].filter((v) => v <= maxVal);

  return (
    <div style={{ width: '100%', position: 'relative' }}>
      {/* Legend & Summary */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '0.75rem',
          flexWrap: 'wrap',
          gap: '0.5rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', fontSize: '0.8rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ width: '12px', height: '3px', backgroundColor: 'var(--accent-emerald)', borderRadius: '2px' }} />
            <span style={{ color: 'var(--foreground)', fontWeight: 500 }}>Cohort Consumption</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span
              style={{
                width: '12px',
                height: '2px',
                borderTop: '2px dashed var(--foreground-subtle)',
              }}
            />
            <span style={{ color: 'var(--foreground-muted)' }}>Baseline Profile</span>
          </div>
        </div>
      </div>

      {/* SVG Canvas */}
      <div style={{ width: '100%', overflow: 'hidden' }}>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          style={{ width: '100%', height: 'auto', display: 'block', overflow: 'visible' }}
          onMouseLeave={() => setHoveredIdx(null)}
        >
          <defs>
            <linearGradient id="loadAreaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent-emerald)" stopOpacity="0.22" />
              <stop offset="100%" stopColor="var(--accent-emerald)" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Horizontal Grid lines */}
          {yTicks.map((val) => {
            const y = getY(val);
            return (
              <g key={val}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={padding.left + chartW}
                  y2={y}
                  stroke="var(--border)"
                  strokeDasharray="4 4"
                />
                <text
                  x={padding.left - 8}
                  y={y + 4}
                  fill="var(--foreground-subtle)"
                  fontSize="11"
                  textAnchor="end"
                  fontFamily="var(--font-mono)"
                >
                  {val}
                </text>
              </g>
            );
          })}

          {/* Area fill */}
          <path d={areaPath} fill="url(#loadAreaGradient)" />

          {/* Baseline Line */}
          <path
            d={baselinePath}
            fill="none"
            stroke="var(--foreground-subtle)"
            strokeWidth="1.75"
            strokeDasharray="5 4"
            opacity="0.85"
          />

          {/* Actual Line */}
          <path
            d={actualPath}
            fill="none"
            stroke="var(--accent-emerald)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Interactive Data points and hover detection columns */}
          {data.map((d, i) => {
            const x = getX(i);
            const y = getY(d.actualKw);
            const isHovered = hoveredIdx === i;

            return (
              <g key={d.label}>
                {/* Invisible hover trigger column */}
                <rect
                  x={x - chartW / (data.length * 2)}
                  y={padding.top}
                  width={chartW / data.length}
                  height={chartH}
                  fill="transparent"
                  onMouseEnter={() => setHoveredIdx(i)}
                  style={{ cursor: 'pointer' }}
                />

                {/* X Axis Time Labels */}
                {i % 3 === 0 && (
                  <text
                    x={x}
                    y={padding.top + chartH + 20}
                    fill="var(--foreground-subtle)"
                    fontSize="11"
                    textAnchor="middle"
                    fontFamily="var(--font-mono)"
                  >
                    {d.label}
                  </text>
                )}

                {/* Hover Indicator Vertical Line & Point */}
                {isHovered && (
                  <g>
                    <line
                      x1={x}
                      y1={padding.top}
                      x2={x}
                      y2={padding.top + chartH}
                      stroke="var(--border-strong)"
                      strokeDasharray="2 2"
                    />
                    <circle
                      cx={x}
                      cy={y}
                      r="6"
                      fill="var(--accent-emerald)"
                      stroke="var(--surface)"
                      strokeWidth="2"
                    />
                  </g>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
