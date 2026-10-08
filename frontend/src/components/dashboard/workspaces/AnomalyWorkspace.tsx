import React, { useState, useEffect, useMemo } from 'react';
import { ArrowRight, X } from 'lucide-react';
import { fetchAnomaliesAnalysis, type AnomaliesAnalysisData } from '../../../services/api';
import './Workspaces.css';

interface AnomalyWorkspaceProps {
  onNavigateSection?: (section: any) => void;
  onNavigateOverview?: (anchor?: string) => void;
}

type AnomalyItem = AnomaliesAnalysisData['affected_consumers'][0];

const AVAILABLE_WINDOWS = [
  { id: 'W14', label: 'W14' },
  { id: 'W13', label: 'W13' },
  { id: 'W12', label: 'W12' },
  { id: 'W11', label: 'W11' },
  { id: 'W10', label: 'W10' },
  { id: 'W09', label: 'W09' },
  { id: 'W08', label: 'W08' },
  { id: 'W07', label: 'W07' },
  { id: 'W06', label: 'W06' },
  { id: 'W05', label: 'W05' },
  { id: 'W04', label: 'W04' },
  { id: 'W03', label: 'W03' },
  { id: 'W02', label: 'W02' },
  { id: 'W01', label: 'W01' },
];

// Clean consumer formatting helper
function formatConsumerId(rawId: string): string {
  if (!rawId) return '';
  const match = rawId.match(/MAC0*(\d+)/i);
  if (match) {
    return `Consumer ${match[1].padStart(3, '0')}`;
  }
  return `Consumer ${rawId}`;
}

// Plain-language interpretations derived strictly from existing anomaly pattern and triggering data
function getWhatWasDetected(pattern: string, triggeringStat?: string): string {
  const normPattern = (pattern || '').toLowerCase();
  const stat = (triggeringStat || '').toLowerCase();

  if (normPattern.includes('weekday') || normPattern.includes('weekend') || stat === 'weekday_weekend_contrast') {
    return "The consumer's weekday/weekend consumption pattern differed noticeably from its historical behavior.";
  }
  if (normPattern.includes('variance') || stat === 'std_load') {
    return 'The consumer showed unusually high variation in demand compared with its historical consumption pattern.';
  }
  if (normPattern.includes('surge') || normPattern.includes('peak consumption') || stat === 'peak_load') {
    return 'The consumer showed an unusually sharp demand peak compared with its typical load pattern.';
  }
  if (normPattern.includes('day/night') || normPattern.includes('night') || stat === 'day_night_ratio') {
    return "The consumer's daytime and nighttime demand pattern differed from its historical behavior.";
  }
  if (normPattern.includes('ramp') || stat === 'ramp_rate_mean') {
    return 'The consumer showed an unusual change in demand between consecutive observation intervals.';
  }
  if (normPattern.includes('peak timing') || stat === 'peak_timing') {
    return "The timing of the consumer's peak electricity demand differed from its customary schedule.";
  }
  if (normPattern.includes('mean consumption') || stat === 'mean_load') {
    return 'The consumer showed unusually high average consumption compared with its typical demand pattern.';
  }
  if (stat === 'peak_to_average_ratio') {
    return "The consumer's peak demand was disproportionately high relative to its average consumption.";
  }
  return 'The consumer exhibited an unusual demand pattern compared with its historical consumption baseline.';
}

export const AnomalyWorkspace: React.FC<AnomalyWorkspaceProps> = ({
  onNavigateOverview,
}) => {
  const [data, setData] = useState<AnomaliesAnalysisData | null>(null);
  const [selectedWindow, setSelectedWindow] = useState<string>('W14');
  const [severityFilter, setSeverityFilter] = useState<'all' | 'extreme' | 'elevated' | 'mild'>('all');
  const [visibleCount, setVisibleCount] = useState<number>(30);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // In-workspace anomaly detail modal state (does NOT redirect to Consumer Intelligence)
  const [selectedAnomaly, setSelectedAnomaly] = useState<AnomalyItem | null>(null);

  useEffect(() => {
    let isMounted = true;
    fetchAnomaliesAnalysis()
      .then((res) => {
        if (isMounted) {
          setData(res);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        console.warn('Could not load anomaly analysis data:', err);
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Reset pagination limit when filters change
  useEffect(() => {
    setVisibleCount(30);
  }, [selectedWindow, severityFilter]);

  // Anomalies matching selected observation window (or all windows)
  const scopeAnomalies = useMemo(() => {
    if (!data?.affected_consumers) return [];
    if (selectedWindow === 'all') return data.affected_consumers;
    return data.affected_consumers.filter((item) => item.window_id === selectedWindow);
  }, [data, selectedWindow]);

  // Dynamic scope severity counts strictly corresponding to the selected scope
  const scopeCounts = useMemo(() => {
    const total = scopeAnomalies.length;
    let extreme = 0;
    let elevated = 0;
    let mild = 0;
    scopeAnomalies.forEach((a) => {
      const s = a.severity.toUpperCase();
      if (s === 'HIGH' || s === 'EXTREME') extreme++;
      else if (s === 'MEDIUM' || s === 'ELEVATED') elevated++;
      else mild++;
    });
    return { total, extreme, elevated, mild };
  }, [scopeAnomalies]);

  // Maximum timeline count for scaling visual bars (W09 is peak with 49)
  const maxTimelineCount = useMemo(() => {
    if (!data?.timeline || data.timeline.length === 0) return 50;
    return Math.max(...data.timeline.map((t) => t.flagged_count), 20);
  }, [data]);

  // Section 3: Highest-Severity Anomalies (top critical events prioritized by severity)
  const highestSeverityAnomalies = useMemo(() => {
    if (!scopeAnomalies || scopeAnomalies.length === 0) return [];
    const sevRank = (sev: string) => {
      const s = sev.toUpperCase();
      if (s === 'HIGH' || s === 'EXTREME') return 0;
      if (s === 'MEDIUM' || s === 'ELEVATED') return 1;
      return 2;
    };
    return [...scopeAnomalies]
      .sort((a, b) => sevRank(a.severity) - sevRank(b.severity))
      .slice(0, 10);
  }, [scopeAnomalies]);

  // Section 4: Affected Consumers (filtered by window and severity filter)
  const filteredAffected = useMemo(() => {
    if (!scopeAnomalies) return [];
    if (severityFilter === 'all') return scopeAnomalies;
    return scopeAnomalies.filter((item) => {
      const s = item.severity.toUpperCase();
      if (severityFilter === 'extreme') return s === 'HIGH' || s === 'EXTREME';
      if (severityFilter === 'elevated') return s === 'MEDIUM' || s === 'ELEVATED';
      if (severityFilter === 'mild') return s === 'LOW' || s === 'MILD';
      return true;
    });
  }, [scopeAnomalies, severityFilter]);

  return (
    <div className="workspace-container">
      {/* Workspace Header */}
      <header className="workspace-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div className="workspace-header-title-row">
              <h1 className="workspace-title">Anomaly Analysis</h1>
            </div>
            <p className="workspace-subtitle">
              Identify unusual consumption patterns and affected consumers.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
            {/* Observation Window Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
              <label
                htmlFor="anomaly-window-selector"
                style={{
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: 'var(--foreground-muted)',
                  letterSpacing: '0.02em',
                  whiteSpace: 'nowrap',
                }}
              >
                Observation Window
              </label>
              <select
                id="anomaly-window-selector"
                value={selectedWindow}
                onChange={(e) => setSelectedWindow(e.target.value)}
                style={{
                  backgroundColor: 'var(--surface-raised)',
                  color: 'var(--foreground)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.38rem 0.85rem',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  outline: 'none',
                  minWidth: '135px',
                }}
              >
                <option value="all">All Windows</option>
                {AVAILABLE_WINDOWS.map((win) => (
                  <option key={win.id} value={win.id}>
                    {win.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Consistent top-right Overview link matching other workspaces */}
            {onNavigateOverview && (
              <button
                type="button"
                className="workspace-link-btn"
                onClick={() => onNavigateOverview('overview-anomalies')}
                style={{ fontSize: '0.82rem', padding: '0.35rem 0.65rem' }}
                title="Learn how anomaly detection works on the Overview page"
              >
                <span>Learn about anomaly analysis</span>
                <ArrowRight size={14} />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* SECTION 1: ANOMALY COUNT */}
      <section className="workspace-card" aria-label="Anomaly Count" style={{ padding: '1.35rem 1.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
          {/* Primary Metric */}
          <div>
            <div
              style={{
                fontSize: '0.74rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                color: 'var(--foreground-subtle)',
                marginBottom: '0.35rem',
              }}
            >
              Anomaly Count {selectedWindow !== 'all' ? `· ${selectedWindow}` : '· All Windows'}
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.85rem' }}>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '2.4rem',
                  fontWeight: 800,
                  color: scopeCounts.total === 0 ? 'var(--foreground-subtle)' : 'var(--accent-amber)',
                  lineHeight: 1,
                }}
              >
                {scopeCounts.total}
              </span>
              <span style={{ fontSize: '0.85rem', color: 'var(--foreground-muted)' }}>
                {selectedWindow !== 'all'
                  ? `consumers flagged in ${selectedWindow}`
                  : 'flagged consumer-window observations across all windows'}
              </span>
            </div>
          </div>

          {/* Concise Severity Breakdown */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1.25rem',
              backgroundColor: 'var(--surface-raised)',
              padding: '0.65rem 1.25rem',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--accent-rose)' }} />
              <span style={{ fontSize: '0.78rem', color: 'var(--foreground-muted)' }}>Extreme:</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.88rem', fontWeight: 700, color: 'var(--foreground)' }}>
                {scopeCounts.extreme}
              </span>
            </div>
            <div style={{ width: '1px', height: '16px', backgroundColor: 'var(--border)' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--accent-amber)' }} />
              <span style={{ fontSize: '0.78rem', color: 'var(--foreground-muted)' }}>Elevated:</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.88rem', fontWeight: 700, color: 'var(--foreground)' }}>
                {scopeCounts.elevated}
              </span>
            </div>
            <div style={{ width: '1px', height: '16px', backgroundColor: 'var(--border)' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--accent-emerald)' }} />
              <span style={{ fontSize: '0.78rem', color: 'var(--foreground-muted)' }}>Mild:</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.88rem', fontWeight: 700, color: 'var(--foreground)' }}>
                {scopeCounts.mild}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: ANOMALY TIMELINE */}
      <section className="workspace-card" aria-label="Anomaly Timeline" style={{ padding: '1.25rem 1.5rem' }}>
        <div className="workspace-card-header">
          <div>
            <h2 className="workspace-card-title">Anomaly Timeline</h2>
            <p className="workspace-card-subtitle">
              Flagged consumers across observation windows.
            </p>
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${data?.timeline?.length || 14}, 1fr)`,
            gap: '0.45rem',
            overflowX: 'auto',
            padding: '0.5rem 0',
          }}
        >
          {(data?.timeline || []).map((t) => {
            const isSelected = selectedWindow === t.window_id;
            const count = t.flagged_count;
            const barHeightPct = maxTimelineCount > 0 ? (count / maxTimelineCount) * 100 : 0;
            const barPixelHeight = Math.max(count > 0 ? (barHeightPct / 100) * 65 : 3, 3);

            return (
              <div
                key={t.window_id}
                onClick={() => setSelectedWindow(t.window_id)}
                title={`Click to select ${t.window_id} (${count} flagged)`}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.65rem 0.2rem',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: isSelected
                    ? 'color-mix(in srgb, var(--accent-amber) 16%, var(--surface))'
                    : 'var(--surface-raised)',
                  border: isSelected ? '1px solid var(--accent-amber)' : '1px solid var(--border)',
                  cursor: 'pointer',
                  transition: 'all 120ms ease',
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.84rem',
                    fontWeight: 700,
                    color: isSelected ? 'var(--accent-amber)' : count === 0 ? 'var(--foreground-subtle)' : 'var(--foreground)',
                  }}
                >
                  {count}
                </span>
                <div style={{ width: '100%', height: '65px', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
                  <div
                    style={{
                      width: '12px',
                      height: `${barPixelHeight}px`,
                      borderRadius: '2px',
                      backgroundColor: isSelected
                        ? 'var(--accent-amber)'
                        : count === 0
                        ? 'var(--border)'
                        : 'var(--accent-emerald)',
                      transition: 'height 200ms ease',
                    }}
                  />
                </div>
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.78rem',
                    fontWeight: isSelected ? 700 : 500,
                    color: isSelected ? 'var(--accent-amber)' : 'var(--foreground-subtle)',
                  }}
                >
                  {t.window_id}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* SECTION 3: HIGHEST-SEVERITY ANOMALIES */}
      <section className="workspace-card" aria-label="Highest-Severity Anomalies">
        <div className="workspace-card-header">
          <div>
            <h2 className="workspace-card-title">Highest-Severity Anomalies</h2>
            <p className="workspace-card-subtitle">
              Critical deviation events prioritized by impact severity.
            </p>
          </div>
        </div>

        <div style={{ padding: '0 1rem 1rem 1rem', overflowX: 'auto' }}>
          {isLoading ? (
            <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--foreground-muted)' }}>
              Loading anomaly data...
            </div>
          ) : highestSeverityAnomalies.length === 0 ? (
            <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--foreground-muted)' }}>
              No high-severity anomalies detected in observation window {selectedWindow}.
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left', color: 'var(--foreground-subtle)' }}>
                  <th style={{ padding: '0.65rem 0.75rem' }}>Consumer</th>
                  <th style={{ padding: '0.65rem 0.75rem' }}>Window</th>
                  <th style={{ padding: '0.65rem 0.75rem' }}>Severity</th>
                  <th style={{ padding: '0.65rem 0.75rem' }}>Pattern</th>
                </tr>
              </thead>
              <tbody>
                {highestSeverityAnomalies.map((row, idx) => {
                  const sev = row.severity.toUpperCase();
                  const isHigh = sev === 'HIGH' || sev === 'EXTREME';
                  const isMed = sev === 'MEDIUM' || sev === 'ELEVATED';
                  const badgeColor = isHigh
                    ? 'var(--accent-rose)'
                    : isMed
                    ? 'var(--accent-amber)'
                    : 'var(--accent-emerald)';

                  return (
                    <tr
                      key={`highest-${row.household_id}-${row.window_id}-${idx}`}
                      onClick={() => setSelectedAnomaly(row)}
                      title={`Click to inspect anomaly details for ${formatConsumerId(row.household_id)}`}
                      style={{
                        borderBottom: '1px solid var(--border-subtle, rgba(255,255,255,0.04))',
                        cursor: 'pointer',
                        transition: 'background-color 120ms ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--surface-raised)')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <td style={{ padding: '0.75rem 0.75rem' }}>
                        <span style={{ fontWeight: 600, color: 'var(--foreground)' }}>
                          {formatConsumerId(row.household_id)}
                        </span>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--foreground-subtle)', marginLeft: '0.5rem' }}>
                          {row.household_id}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem 0.75rem', fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--foreground-subtle)' }}>
                        {row.window_id}
                      </td>
                      <td style={{ padding: '0.75rem 0.75rem' }}>
                        <span
                          style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: '0.74rem',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            padding: '0.18rem 0.55rem',
                            borderRadius: 'var(--radius-full)',
                            backgroundColor: `color-mix(in srgb, ${badgeColor} 15%, transparent)`,
                            border: `1px solid ${badgeColor}`,
                            color: badgeColor,
                          }}
                        >
                          {sev}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem 0.75rem', color: 'var(--foreground)', fontWeight: 500 }}>
                        {row.observed_pattern}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {/* SECTION 4: AFFECTED CONSUMERS */}
      <section className="workspace-card" aria-label="Affected Consumers">
        <div className="workspace-card-header" style={{ flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h2 className="workspace-card-title">Affected Consumers</h2>
            <p className="workspace-card-subtitle">
              Consumers exhibiting abnormal demand within the selected observation window.
            </p>
          </div>

          {/* Severity Filters */}
          <div style={{ display: 'flex', gap: '0.35rem' }}>
            {[
              { id: 'all', label: 'All Severities' },
              { id: 'extreme', label: 'Extreme' },
              { id: 'elevated', label: 'Elevated' },
              { id: 'mild', label: 'Mild' },
            ].map((sev) => {
              const isSelected = severityFilter === sev.id;
              return (
                <button
                  key={sev.id}
                  type="button"
                  onClick={() => setSeverityFilter(sev.id as any)}
                  style={{
                    padding: '0.35rem 0.75rem',
                    fontSize: '0.75rem',
                    fontWeight: isSelected ? 700 : 500,
                    borderRadius: 'var(--radius-sm)',
                    border: isSelected ? '1px solid var(--accent-emerald)' : '1px solid var(--border)',
                    backgroundColor: isSelected ? 'var(--surface-raised)' : 'transparent',
                    color: isSelected ? 'var(--foreground)' : 'var(--foreground-muted)',
                    cursor: 'pointer',
                    transition: 'all 120ms ease',
                  }}
                >
                  {sev.label}
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ padding: '0 1rem 1rem 1rem', overflowX: 'auto' }}>
          {isLoading ? (
            <div style={{ padding: '3.5rem', textAlign: 'center', color: 'var(--foreground-muted)' }}>
              Loading anomaly data...
            </div>
          ) : filteredAffected.length === 0 ? (
            <div style={{ padding: '3.5rem', textAlign: 'center', color: 'var(--foreground-muted)' }}>
              No anomalies detected in observation window {selectedWindow}.
            </div>
          ) : (
            <>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left', color: 'var(--foreground-subtle)' }}>
                    <th style={{ padding: '0.65rem 0.75rem' }}>Consumer</th>
                    <th style={{ padding: '0.65rem 0.75rem' }}>Window</th>
                    <th style={{ padding: '0.65rem 0.75rem' }}>Severity</th>
                    <th style={{ padding: '0.65rem 0.75rem' }}>Pattern</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAffected.slice(0, visibleCount).map((row, idx) => {
                    const sev = row.severity.toUpperCase();
                    const isHigh = sev === 'HIGH' || sev === 'EXTREME';
                    const isMed = sev === 'MEDIUM' || sev === 'ELEVATED';
                    const badgeColor = isHigh
                      ? 'var(--accent-rose)'
                      : isMed
                      ? 'var(--accent-amber)'
                      : 'var(--accent-emerald)';

                    return (
                      <tr
                        key={`affected-${row.household_id}-${row.window_id}-${idx}`}
                        onClick={() => setSelectedAnomaly(row)}
                        title={`Click to inspect anomaly details for ${formatConsumerId(row.household_id)}`}
                        style={{
                          borderBottom: '1px solid var(--border-subtle, rgba(255,255,255,0.04))',
                          cursor: 'pointer',
                          transition: 'background-color 120ms ease',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--surface-raised)')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                      >
                        <td style={{ padding: '0.75rem 0.75rem' }}>
                          <span style={{ fontWeight: 600, color: 'var(--foreground)' }}>
                            {formatConsumerId(row.household_id)}
                          </span>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--foreground-subtle)', marginLeft: '0.5rem' }}>
                            {row.household_id}
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem 0.75rem', fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--foreground-subtle)' }}>
                          {row.window_id}
                        </td>
                        <td style={{ padding: '0.75rem 0.75rem' }}>
                          <span
                            style={{
                              fontFamily: 'var(--font-mono)',
                              fontSize: '0.68rem',
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              padding: '0.18rem 0.55rem',
                              borderRadius: 'var(--radius-full)',
                              backgroundColor: `color-mix(in srgb, ${badgeColor} 15%, transparent)`,
                              border: `1px solid ${badgeColor}`,
                              color: badgeColor,
                            }}
                          >
                            {sev}
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem 0.75rem', color: 'var(--foreground)', fontWeight: 500 }}>
                          {row.observed_pattern}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {filteredAffected.length > visibleCount && (
                <div style={{ padding: '1rem', textAlign: 'center', borderTop: '1px solid var(--border)' }}>
                  <button
                    type="button"
                    onClick={() => setVisibleCount((c) => c + 30)}
                    style={{
                      padding: '0.45rem 1.25rem',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      backgroundColor: 'var(--surface-raised)',
                      color: 'var(--foreground)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer',
                    }}
                  >
                    Show More ({visibleCount} of {filteredAffected.length} shown)
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* ANOMALY DETAIL MODAL (In-workspace detail inspection, preserves anomaly context) */}
      {selectedAnomaly && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setSelectedAnomaly(null)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.72)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1.5rem',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              width: '100%',
              maxWidth: '540px',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 20px 45px rgba(0,0,0,0.45)',
              padding: '1.75rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem',
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border)', paddingBottom: '0.85rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: 'var(--foreground)' }}>
                    {formatConsumerId(selectedAnomaly.household_id)}
                  </h3>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.74rem',
                      padding: '0.15rem 0.5rem',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: 'var(--surface-raised)',
                      border: '1px solid var(--border)',
                      color: 'var(--foreground-subtle)',
                    }}
                  >
                    {selectedAnomaly.household_id}
                  </span>
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--foreground-muted)', marginTop: '0.25rem' }}>
                  Flagged anomaly event in observation window {selectedAnomaly.window_id}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedAnomaly(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--foreground-muted)',
                  cursor: 'pointer',
                  padding: '0.35rem',
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                title="Close anomaly detail"
              >
                <X size={18} />
              </button>
            </div>

            {/* Properties Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.85rem' }}>
              <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--surface-raised)', border: '1px solid var(--border)' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--foreground-subtle)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Severity
                </span>
                <div style={{ marginTop: '0.25rem' }}>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.74rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      padding: '0.15rem 0.5rem',
                      borderRadius: 'var(--radius-full)',
                      backgroundColor:
                        selectedAnomaly.severity.toUpperCase() === 'HIGH'
                          ? 'color-mix(in srgb, var(--accent-rose) 15%, transparent)'
                          : selectedAnomaly.severity.toUpperCase() === 'MEDIUM'
                          ? 'color-mix(in srgb, var(--accent-amber) 15%, transparent)'
                          : 'color-mix(in srgb, var(--accent-emerald) 15%, transparent)',
                      border: `1px solid ${
                        selectedAnomaly.severity.toUpperCase() === 'HIGH'
                          ? 'var(--accent-rose)'
                          : selectedAnomaly.severity.toUpperCase() === 'MEDIUM'
                          ? 'var(--accent-amber)'
                          : 'var(--accent-emerald)'
                      }`,
                      color:
                        selectedAnomaly.severity.toUpperCase() === 'HIGH'
                          ? 'var(--accent-rose)'
                          : selectedAnomaly.severity.toUpperCase() === 'MEDIUM'
                          ? 'var(--accent-amber)'
                          : 'var(--accent-emerald)',
                    }}
                  >
                    {selectedAnomaly.severity}
                  </span>
                </div>
              </div>

              <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--surface-raised)', border: '1px solid var(--border)' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--foreground-subtle)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Observation Window
                </span>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.92rem', fontWeight: 700, color: 'var(--foreground)', marginTop: '0.2rem' }}>
                  {selectedAnomaly.window_id}
                </div>
              </div>

              <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--surface-raised)', border: '1px solid var(--border)', gridColumn: 'span 2' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--foreground-subtle)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Observed Pattern
                </span>
                <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--foreground)', marginTop: '0.2rem' }}>
                  {selectedAnomaly.observed_pattern}
                </div>
              </div>
            </div>

            {/* What Was Detected */}
            <div style={{ padding: '0.85rem 1rem', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--surface-raised)', border: '1px solid var(--border)' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--foreground-subtle)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '0.35rem' }}>
                What Was Detected
              </span>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--foreground-muted)', lineHeight: 1.55 }}>
                {getWhatWasDetected(selectedAnomaly.observed_pattern, selectedAnomaly.triggering_statistic)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
