import React, { useState } from 'react';
import type { DemandDataPoint } from '../../types/energy';

interface LoadChartProps {
  data: DemandDataPoint[];
  title?: string;
  height?: number;
  unit?: string;
  actualLabel?: string;
  baselineLabel?: string;
  showArea?: boolean;
}

export const LoadChart: React.FC<LoadChartProps> = ({
  data,
  height = 280,
  unit = 'kW / home',
  actualLabel = 'Observed Demand',
  baselineLabel = 'Day-Ahead Forecast',
  showArea = true,
}) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <div
        style={{
          color: 'var(--foreground-muted)',
          padding: '3rem 2rem',
          textAlign: 'center',
          backgroundColor: 'var(--surface)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border)',
        }}
      >
        Electricity demand data unavailable for selected range
      </div>
    );
  }

  // Viewbox coordinates
  const width = 800;
  const padding = { top: 25, right: 30, bottom: 42, left: 60 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  // Calculate dynamic, robust data range
  const rawMax = Math.max(
    ...data.flatMap((d) => [Number(d.actualKw) || 0, Number(d.baselineKw) || 0]),
    0.05
  );

  // Nice round max ceiling for readable ticks
  const calculateNiceMax = (val: number): number => {
    if (val <= 0.1) return 0.1;
    if (val <= 0.25) return 0.3;
    if (val <= 0.5) return 0.5;
    if (val <= 1.0) return 1.0;
    if (val <= 2.5) return 2.5;
    if (val <= 5.0) return 5.0;
    if (val <= 10.0) return 10.0;
    const factor = Math.pow(10, Math.floor(Math.log10(val)));
    return Math.ceil(val / factor) * factor;
  };

  const niceMax = calculateNiceMax(rawMax * 1.12);
  const minVal = 0;

  // 4 clean, evenly-spaced Y ticks
  const yTicks = [
    0,
    niceMax * 0.25,
    niceMax * 0.5,
    niceMax * 0.75,
    niceMax,
  ];

  const formatTickVal = (v: number): string => {
    if (v === 0) return '0';
    if (niceMax < 1) return v.toFixed(2);
    if (niceMax < 10) return v.toFixed(1);
    return Math.round(v).toString();
  };

  const getX = (index: number) => padding.left + (index / Math.max(data.length - 1, 1)) * chartW;
  const getY = (val: number) =>
    padding.top + chartH - ((Math.max(val, minVal) - minVal) / (niceMax - minVal)) * chartH;

  // Path coordinates
  const actualPoints = data.map((d, i) => `${getX(i)},${getY(Number(d.actualKw) || 0)}`);
  const actualPath = `M ${actualPoints.join(' L ')}`;

  const baselinePoints = data.map((d, i) => `${getX(i)},${getY(Number(d.baselineKw) || 0)}`);
  const baselinePath = `M ${baselinePoints.join(' L ')}`;

  // Area path
  const areaPath = `${actualPath} L ${getX(data.length - 1)},${padding.top + chartH} L ${getX(0)},${padding.top + chartH} Z`;

  const hasBaseline = Boolean(
    baselineLabel &&
      data.some((d) => d.baselineKw !== undefined && d.baselineKw !== null && Number(d.baselineKw) > 0)
  );

  const hoveredItem = hoveredIdx !== null ? data[hoveredIdx] : null;

  return (
    <div style={{ width: '100%', position: 'relative' }}>
      {/* Legend & Unit Indicator Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '0.75rem',
          flexWrap: 'wrap',
          gap: '0.75rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', fontSize: '0.88rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span
              style={{
                width: '14px',
                height: '2.5px',
                backgroundColor: 'var(--accent-emerald)',
                borderRadius: '1px',
              }}
            />
            <span style={{ color: 'var(--foreground)', fontWeight: 600 }}>{actualLabel}</span>
          </div>
          {hasBaseline && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span
                style={{
                  width: '14px',
                  height: '2px',
                  borderTop: '2px dashed var(--accent-amber)',
                }}
              />
              <span style={{ color: 'var(--foreground-muted)' }}>{baselineLabel}</span>
            </div>
          )}
        </div>

        <div
          style={{
            fontSize: '0.84rem',
            fontFamily: 'var(--font-mono)',
            color: 'var(--foreground-subtle)',
            backgroundColor: 'var(--surface-raised)',
            padding: '0.25rem 0.65rem',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border)',
          }}
        >
          Unit: <strong>{unit}</strong>
        </div>
      </div>

      {/* SVG Canvas */}
      <div style={{ width: '100%', position: 'relative', overflow: 'hidden' }}>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          style={{ width: '100%', height: 'auto', display: 'block', overflow: 'visible' }}
          onMouseLeave={() => setHoveredIdx(null)}
          role="img"
          aria-label="Electricity load profile chart"
        >
          <defs>
            <linearGradient id="loadAreaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent-emerald)" stopOpacity="0.04" />
              <stop offset="100%" stopColor="var(--accent-emerald)" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Y Axis Unit Label at top left */}
          <text
            x={padding.left}
            y={padding.top - 8}
            fill="var(--foreground-subtle)"
            fontSize="11"
            fontFamily="var(--font-mono)"
            textAnchor="start"
          >
            {unit}
          </text>

          {/* Horizontal Grid lines & Y-axis numeric labels */}
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
                  strokeDasharray="2 3"
                  strokeWidth="1"
                  opacity="0.4"
                />
                <text
                  x={padding.left - 8}
                  y={y + 4}
                  fill="var(--foreground-subtle)"
                  fontSize="11"
                  textAnchor="end"
                  fontFamily="var(--font-mono)"
                >
                  {formatTickVal(val)}
                </text>
              </g>
            );
          })}

          {/* Bottom baseline line */}
          <line
            x1={padding.left}
            y1={padding.top + chartH}
            x2={padding.left + chartW}
            y2={padding.top + chartH}
            stroke="var(--border-strong)"
            strokeWidth="1"
          />

          {/* Area fill */}
          {showArea && <path d={areaPath} fill="url(#loadAreaGradient)" />}

          {/* Baseline/Forecast dashed line */}
          {hasBaseline && (
            <path
              d={baselinePath}
              fill="none"
              stroke="var(--accent-amber)"
              strokeWidth="1.25"
              strokeDasharray="4 3"
              opacity="0.9"
            />
          )}

          {/* Actual/Observed line */}
          <path
            d={actualPath}
            fill="none"
            stroke="var(--accent-emerald)"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* X Axis Time Labels & Hover Trigger Columns */}
          {data.map((d, i) => {
            const x = getX(i);
            const isHovered = hoveredIdx === i;
            const actualY = getY(Number(d.actualKw) || 0);
            const baselineY = getY(Number(d.baselineKw) || 0);

            // Display readable time ticks every ~6 points (e.g. 00:00, 03:00, 06:00, ...)
            const stepInterval = Math.max(1, Math.round(data.length / 8));
            const showTick = i % stepInterval === 0 || i === data.length - 1;

            return (
              <g key={d.label || i}>
                {/* Invisible hover trigger column */}
                <rect
                  x={x - chartW / (data.length * 2)}
                  y={padding.top}
                  width={chartW / data.length}
                  height={chartH + 20}
                  fill="transparent"
                  onMouseEnter={() => setHoveredIdx(i)}
                  style={{ cursor: 'pointer' }}
                />

                {/* X Axis Time Label */}
                {showTick && (
                  <text
                    x={x}
                    y={padding.top + chartH + 20}
                    fill="var(--foreground-subtle)"
                    fontSize="12"
                    textAnchor="middle"
                    fontFamily="var(--font-mono)"
                  >
                    {d.label}
                  </text>
                )}

                {/* Hover Indicator Crosshair & Data Dots */}
                {isHovered && (
                  <g pointerEvents="none">
                    <line
                      x1={x}
                      y1={padding.top}
                      x2={x}
                      y2={padding.top + chartH}
                      stroke="var(--border-strong)"
                      strokeWidth="1"
                      strokeDasharray="3 3"
                    />
                    <circle
                      cx={x}
                      cy={actualY}
                      r="4.5"
                      fill="var(--accent-emerald)"
                      stroke="var(--surface)"
                      strokeWidth="2"
                    />
                    {hasBaseline && (
                      <circle
                        cx={x}
                        cy={baselineY}
                        r="4"
                        fill="var(--accent-amber)"
                        stroke="var(--surface)"
                        strokeWidth="2"
                      />
                    )}
                  </g>
                )}
              </g>
            );
          })}
        </svg>

        {/* Floating Tooltip Box */}
        {hoveredItem !== null && hoveredIdx !== null && (
          <div
            style={{
              position: 'absolute',
              top: '10px',
              left: `${Math.min(
                Math.max((getX(hoveredIdx) / width) * 100, 16),
                84
              )}%`,
              transform: 'translateX(-50%)',
              backgroundColor: 'var(--surface-raised)',
              border: '1px solid var(--border-strong)',
              borderRadius: 'var(--radius-sm)',
              padding: '0.65rem 0.95rem',
              boxShadow: 'var(--shadow-md)',
              pointerEvents: 'none',
              zIndex: 10,
              fontSize: '0.86rem',
              minWidth: '180px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: '1px solid var(--border)',
                paddingBottom: '0.35rem',
                marginBottom: '0.45rem',
                fontFamily: 'var(--font-mono)',
                fontWeight: 600,
                color: 'var(--foreground)',
              }}
            >
              <span>{hoveredItem.label}</span>
              {hoveredItem.isPeak && (
                <span
                  style={{
                    backgroundColor: 'rgba(245, 158, 11, 0.15)',
                    color: 'var(--accent-amber)',
                    fontSize: '0.74rem',
                    padding: '0.12rem 0.4rem',
                    borderRadius: '2px',
                    fontWeight: 700,
                  }}
                >
                  PEAK
                </span>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem' }}>
                <span style={{ color: 'var(--foreground-muted)' }}>{actualLabel}:</span>
                <strong style={{ color: 'var(--accent-emerald)', fontFamily: 'var(--font-mono)' }}>
                  {Number(hoveredItem.actualKw).toFixed(3)} {unit.split(' ')[0]}
                </strong>
              </div>
              {hasBaseline && (
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem' }}>
                  <span style={{ color: 'var(--foreground-muted)' }}>{baselineLabel}:</span>
                  <strong style={{ color: 'var(--accent-amber)', fontFamily: 'var(--font-mono)' }}>
                    {Number(hoveredItem.baselineKw).toFixed(3)} {unit.split(' ')[0]}
                  </strong>
                </div>
              )}
              {hasBaseline && hoveredItem.actualKw !== undefined && hoveredItem.baselineKw != null && (
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: '0.75rem',
                    fontSize: '0.80rem',
                    color: 'var(--foreground-subtle)',
                    borderTop: '1px dashed var(--border)',
                    paddingTop: '0.3rem',
                    marginTop: '0.2rem',
                  }}
                >
                  <span>Absolute Error:</span>
                  <span style={{ fontFamily: 'var(--font-mono)' }}>
                    {Math.abs(hoveredItem.actualKw - hoveredItem.baselineKw).toFixed(3)} {unit.split(' ')[0]}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
