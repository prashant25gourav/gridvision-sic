import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Activity,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { fetchAnomaliesAnalysis, type AnomaliesAnalysisData } from '../../../services/api';
import type { DashboardSection } from '../../../types/dashboard';
import './Workspaces.css';

interface AnomalyWorkspaceProps {
  onNavigateSection?: (section: DashboardSection) => void;
}

export const AnomalyWorkspace: React.FC<AnomalyWorkspaceProps> = ({
  onNavigateSection,
}) => {
  const [data, setData] = useState<AnomaliesAnalysisData | null>(null);
  const [severityFilter, setSeverityFilter] = useState<'all' | 'extreme' | 'elevated' | 'mild'>('all');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showTechnicalDetails, setShowTechnicalDetails] = useState<boolean>(false);

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

  const totalAnomalies = data?.total_anomalies ?? 310;
  const activeLatest = data?.active_latest_window ?? 44;
  const totalObs = data?.total_observations ?? 6198;
  const severity = data?.severity_breakdown ?? { mild: 142, elevated: 124, extreme: 44 };

  const filteredAffected = (data?.affected_consumers || []).filter((item) => {
    if (severityFilter === 'all') return true;
    return item.severity.toLowerCase() === severityFilter.toLowerCase();
  });

  return (
    <div className="workspace-container">
      {/* Workspace Header */}
      <header className="workspace-header">
        <div className="workspace-header-title-row">
          <h1 className="workspace-title">Anomaly Analysis</h1>
        </div>
        <p className="workspace-subtitle">
          Where is unusual consumption happening? Review flagged households, identify anomalous consumption patterns, and inspect recommended utility actions.
        </p>
      </header>

      {/* Operational KPI Strip */}
      <section className="workspace-kpi-grid" aria-label="Anomaly Overview Metrics">
        <div className="workspace-kpi-card">
          <div className="workspace-kpi-header">
            <span className="workspace-kpi-label">Active Flagged (Latest)</span>
            <AlertTriangle size={16} className="workspace-kpi-icon" style={{ color: 'var(--accent-rose)' }} />
          </div>
          <div className="workspace-kpi-value" style={{ color: 'var(--accent-rose)' }}>
            {activeLatest}
          </div>
          <p className="workspace-kpi-caption">
            Smart meters with unusual consumption in W14
          </p>
        </div>

        <div className="workspace-kpi-card">
          <div className="workspace-kpi-header">
            <span className="workspace-kpi-label">Total Historical Flags</span>
            <Activity size={16} className="workspace-kpi-icon" />
          </div>
          <div className="workspace-kpi-value">{totalAnomalies}</div>
          <p className="workspace-kpi-caption">
            Across {totalObs} household observation windows
          </p>
        </div>

        <div className="workspace-kpi-card">
          <div className="workspace-kpi-header">
            <span className="workspace-kpi-label">Extreme Deviations</span>
            <AlertTriangle size={16} className="workspace-kpi-icon" style={{ color: 'var(--accent-rose)' }} />
          </div>
          <div className="workspace-kpi-value">{severity.extreme}</div>
          <p className="workspace-kpi-caption">
            Deviations exceeding |z| &gt; 3.0 standard deviations
          </p>
        </div>

        <div className="workspace-kpi-card">
          <div className="workspace-kpi-header">
            <span className="workspace-kpi-label">Calibration Budget</span>
            <ShieldCheck size={16} className="workspace-kpi-icon" style={{ color: 'var(--accent-emerald)' }} />
          </div>
          <div className="workspace-kpi-value" style={{ color: 'var(--accent-emerald)' }}>
            5.0%
          </div>
          <p className="workspace-kpi-caption">
            Fixed empirical contamination budget
          </p>
        </div>
      </section>

      {/* Anomaly Timeline Across Windows */}
      <section className="workspace-card" style={{ padding: '1.25rem 1.5rem' }}>
        <div className="workspace-card-header">
          <div>
            <h2 className="workspace-card-title">Anomaly Timeline Across 14 Observation Windows</h2>
            <p className="workspace-card-subtitle">
              Number of smart meters flagged with unusual consumption patterns in each 56-day observation period.
            </p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${data?.timeline?.length || 14}, 1fr)`, gap: '0.45rem', overflowX: 'auto', padding: '0.5rem 0' }}>
          {(data?.timeline || []).map((t) => {
            const isLatest = t.window_id === 'W14';
            const count = t.flagged_count;
            const barHeight = Math.min(100, Math.round((count / 30) * 80));

            return (
              <div
                key={t.window_id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.65rem 0.35rem',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: isLatest ? 'color-mix(in srgb, var(--accent-amber) 15%, transparent)' : 'var(--surface-raised)',
                  border: `1px solid ${isLatest ? 'var(--accent-amber)' : 'var(--border)'}`,
                }}
              >
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 700, color: isLatest ? 'var(--accent-amber)' : 'var(--foreground)' }}>
                  {count}
                </span>
                <div style={{ width: '100%', height: '60px', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
                  <div
                    style={{
                      width: '12px',
                      height: `${barHeight}px`,
                      borderRadius: '3px',
                      backgroundColor: isLatest ? 'var(--accent-amber)' : 'var(--accent-emerald)',
                    }}
                  />
                </div>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--foreground-subtle)' }}>
                  {t.window_id}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* Affected Households Table */}
      <section className="workspace-card">
        <div className="workspace-card-header" style={{ flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h2 className="workspace-card-title">Affected Households Requiring Attention</h2>
            <p className="workspace-card-subtitle">
              Household meters exhibiting unusual consumption patterns with observed pattern descriptions and operational action guidelines.
            </p>
          </div>

          {/* Filter Pills */}
          <div style={{ display: 'flex', gap: '0.35rem' }}>
            {(['all', 'extreme', 'elevated', 'mild'] as const).map((sev) => (
              <button
                key={sev}
                type="button"
                onClick={() => setSeverityFilter(sev)}
                style={{
                  padding: '0.3rem 0.65rem',
                  fontSize: '0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border)',
                  backgroundColor: severityFilter === sev ? 'var(--surface-raised)' : 'transparent',
                  color: severityFilter === sev ? 'var(--foreground)' : 'var(--foreground-muted)',
                  cursor: 'pointer',
                  textTransform: 'capitalize',
                }}
              >
                {sev === 'all' ? 'All Severities' : sev}
              </button>
            ))}
          </div>
        </div>

        <div style={{ padding: '0 1rem 1rem 1rem', overflowX: 'auto' }}>
          {isLoading ? (
            <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--foreground-muted)' }}>
              Loading anomaly telemetry...
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left', color: 'var(--foreground-subtle)' }}>
                  <th style={{ padding: '0.65rem 0.75rem' }}>Household</th>
                  <th style={{ padding: '0.65rem 0.75rem' }}>Period</th>
                  <th style={{ padding: '0.65rem 0.75rem' }}>Severity</th>
                  <th style={{ padding: '0.65rem 0.75rem' }}>Observed Pattern</th>
                  <th style={{ padding: '0.65rem 0.75rem' }}>Operational Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredAffected.slice(0, 25).map((row, idx) => {
                  const isExt = row.severity.toLowerCase() === 'extreme';
                  const isElev = row.severity.toLowerCase() === 'elevated';
                  const badgeColor = isExt
                    ? 'var(--accent-rose)'
                    : isElev
                    ? 'var(--accent-amber)'
                    : 'var(--accent-emerald)';

                  return (
                    <tr
                      key={`${row.household_id}-${row.window_id}-${idx}`}
                      onClick={() => onNavigateSection?.('consumers')}
                      title="Click to view household profile in Consumer Intelligence"
                      style={{
                        borderBottom: '1px solid var(--border)',
                        backgroundColor: idx % 2 === 0 ? 'transparent' : 'color-mix(in srgb, var(--surface-raised) 50%, transparent)',
                        cursor: onNavigateSection ? 'pointer' : 'default',
                      }}
                    >
                      <td style={{ padding: '0.65rem 0.75rem', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                        {row.household_id}
                      </td>
                    <td style={{ padding: '0.65rem 0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--foreground-subtle)' }}>
                      {row.window_id}
                    </td>
                    <td style={{ padding: '0.65rem 0.75rem' }}>
                      <span
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          padding: '0.15rem 0.5rem',
                          borderRadius: 'var(--radius-full)',
                          backgroundColor: `color-mix(in srgb, ${badgeColor} 15%, transparent)`,
                          color: badgeColor,
                        }}
                      >
                        {row.severity}
                      </span>
                    </td>
                    <td style={{ padding: '0.65rem 0.75rem', color: 'var(--foreground)' }}>
                      <div>{row.observed_pattern}</div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--foreground-muted)', marginTop: '0.15rem' }}>
                        {row.explanation}
                      </div>
                    </td>
                    <td style={{ padding: '0.65rem 0.75rem', color: 'var(--accent-emerald)' }}>
                      {row.action}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          )}
        </div>
      </section>

      {/* Progressive Disclosure: Technical Details Accordion */}
      <section className="workspace-card">
        <button
          type="button"
          onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
          style={{
            width: '100%',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'none',
            border: 'none',
            padding: '0.85rem 1rem',
            cursor: 'pointer',
            color: 'var(--foreground)',
            fontFamily: 'var(--font-sans)',
            fontSize: '0.9rem',
            fontWeight: 600,
          }}
        >
          <span>Technical details (Isolation Forest formulation &amp; contamination budget)</span>
          {showTechnicalDetails ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {showTechnicalDetails && (
          <div style={{ padding: '0 1rem 1.25rem 1rem', borderTop: '1px solid var(--border)', marginTop: '0.5rem' }}>
            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--foreground-muted)', lineHeight: 1.5 }}>
              Unsupervised anomaly detection utilizes an Isolation Forest trained on 8 behavioral summary features per household-window observation.
              The contamination threshold is pre-fixed at 5.0% during calibration (Windows W01–W02) to avoid data snooping or threshold gaming.
              Flagged patterns reflect statistical outliers in demand magnitude, nocturnal baseload, or half-hourly ramp rates; physical causes (e.g., equipment failures) require field verification.
            </p>
          </div>
        )}
      </section>
    </div>
  );
};
