import React, { useState, useEffect } from 'react';
import {
  Activity,
  Calendar,
  Clock,
  TrendingUp,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { LoadChart } from '../../charts/LoadChart';
import { fetchDemandAnalysis, type DemandAnalysisData } from '../../../services/api';
import type { DemandDataPoint } from '../../../types/energy';
import './Workspaces.css';

export const DemandAnalysisWorkspace: React.FC = () => {
  const [data, setData] = useState<DemandAnalysisData | null>(null);
  const [activeTab, setActiveTab] = useState<'daily' | 'weekly' | 'trend' | 'seasonal'>('daily');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showTechnicalDetails, setShowTechnicalDetails] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    fetchDemandAnalysis()
      .then((res) => {
        if (isMounted) {
          setData(res);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        console.warn('Failed to load demand analysis data:', err);
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const peak = data?.peak_summary;

  // Chart data for daily diurnal profile
  const dailyChartPoints: DemandDataPoint[] =
    data?.diurnal_profile.map((pt) => ({
      timestamp: pt.time,
      hour: Math.floor(pt.slot / 2),
      label: pt.time,
      actualKw: pt.actual_kw,
      baselineKw: pt.predicted_kw,
      isPeak: pt.is_peak,
    })) ?? [];

  // Chart data for weekday vs weekend
  const weeklyChartPoints: DemandDataPoint[] =
    data?.weekday_vs_weekend.map((pt) => ({
      timestamp: pt.time,
      hour: Math.floor(pt.slot / 2),
      label: pt.time,
      actualKw: pt.weekday_kw,
      baselineKw: pt.weekend_kw,
      isPeak: Math.floor(pt.slot / 2) >= 18 && Math.floor(pt.slot / 2) <= 21,
    })) ?? [];

  return (
    <div className="workspace-container">
      {/* Workspace Header */}
      <header className="workspace-header">
        <div className="workspace-header-title-row">
          <h1 className="workspace-title">Demand Analysis</h1>
        </div>
        <p className="workspace-subtitle">
          Understand how electricity demand behaves: 24-hour diurnal load curves, weekday versus weekend contrasts, multi-window longitudinal trends, and seasonal load shapes.
        </p>
      </header>

      {/* Practical Electricity Questions Strip */}
      <section className="workspace-kpi-grid" aria-label="Key Demand Characteristics">
        <div className="workspace-kpi-card">
          <div className="workspace-kpi-header">
            <span className="workspace-kpi-label">Peak Demand Timing</span>
            <Clock size={16} className="workspace-kpi-icon" />
          </div>
          <div className="workspace-kpi-value" style={{ color: 'var(--accent-amber)' }}>
            {peak?.peak_time ?? '19:00'}
          </div>
          <p className="workspace-kpi-caption">
            Evening peak load: {(peak?.cohort_peak_mw ?? 0.229).toFixed(3)} MW ({(peak?.peak_load_kw ?? 0.369).toFixed(3)} kW/home)
          </p>
        </div>

        <div className="workspace-kpi-card">
          <div className="workspace-kpi-header">
            <span className="workspace-kpi-label">Baseload Trough</span>
            <Activity size={16} className="workspace-kpi-icon" />
          </div>
          <div className="workspace-kpi-value" style={{ color: 'var(--accent-emerald)' }}>
            {peak?.baseload_time ?? '05:00'}
          </div>
          <p className="workspace-kpi-caption">
            Nocturnal minimum: {(peak?.cohort_baseload_mw ?? 0.080).toFixed(3)} MW ({(peak?.baseload_kw ?? 0.128).toFixed(3)} kW/home)
          </p>
        </div>

        <div className="workspace-kpi-card">
          <div className="workspace-kpi-header">
            <span className="workspace-kpi-label">Peak-to-Average Ratio</span>
            <TrendingUp size={16} className="workspace-kpi-icon" />
          </div>
          <div className="workspace-kpi-value">
            {(peak?.peak_to_average_ratio ?? 1.54).toFixed(2)}x
          </div>
          <p className="workspace-kpi-caption">
            Ratio of peak demand to average diurnal load
          </p>
        </div>

        <div className="workspace-kpi-card">
          <div className="workspace-kpi-header">
            <span className="workspace-kpi-label">Weekend Difference</span>
            <Calendar size={16} className="workspace-kpi-icon" />
          </div>
          <div className="workspace-kpi-value" style={{ color: 'var(--accent-emerald)' }}>
            -3.1%
          </div>
          <p className="workspace-kpi-caption">
            Weekend aggregate load is slightly lower with broader midday usage
          </p>
        </div>
      </section>

      {/* Analytical View Switcher Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem', flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={() => setActiveTab('daily')}
          style={{
            padding: '0.45rem 0.9rem',
            fontSize: '0.85rem',
            fontWeight: activeTab === 'daily' ? 600 : 500,
            borderRadius: 'var(--radius-sm)',
            border: `1px solid ${activeTab === 'daily' ? 'var(--border-strong)' : 'transparent'}`,
            backgroundColor: activeTab === 'daily' ? 'var(--surface-raised)' : 'transparent',
            color: activeTab === 'daily' ? 'var(--foreground)' : 'var(--foreground-muted)',
            cursor: 'pointer',
          }}
        >
          24-Hour Diurnal Profile
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('weekly')}
          style={{
            padding: '0.45rem 0.9rem',
            fontSize: '0.85rem',
            fontWeight: activeTab === 'weekly' ? 600 : 500,
            borderRadius: 'var(--radius-sm)',
            border: `1px solid ${activeTab === 'weekly' ? 'var(--border-strong)' : 'transparent'}`,
            backgroundColor: activeTab === 'weekly' ? 'var(--surface-raised)' : 'transparent',
            color: activeTab === 'weekly' ? 'var(--foreground)' : 'var(--foreground-muted)',
            cursor: 'pointer',
          }}
        >
          Weekday vs Weekend Contrast
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('trend')}
          style={{
            padding: '0.45rem 0.9rem',
            fontSize: '0.85rem',
            fontWeight: activeTab === 'trend' ? 600 : 500,
            borderRadius: 'var(--radius-sm)',
            border: `1px solid ${activeTab === 'trend' ? 'var(--border-strong)' : 'transparent'}`,
            backgroundColor: activeTab === 'trend' ? 'var(--surface-raised)' : 'transparent',
            color: activeTab === 'trend' ? 'var(--foreground)' : 'var(--foreground-muted)',
            cursor: 'pointer',
          }}
        >
          Longitudinal Window Trend (W01–W14)
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('seasonal')}
          style={{
            padding: '0.45rem 0.9rem',
            fontSize: '0.85rem',
            fontWeight: activeTab === 'seasonal' ? 600 : 500,
            borderRadius: 'var(--radius-sm)',
            border: `1px solid ${activeTab === 'seasonal' ? 'var(--border-strong)' : 'transparent'}`,
            backgroundColor: activeTab === 'seasonal' ? 'var(--surface-raised)' : 'transparent',
            color: activeTab === 'seasonal' ? 'var(--foreground)' : 'var(--foreground-muted)',
            cursor: 'pointer',
          }}
        >
          Seasonal Comparison
        </button>
      </div>

      {/* Tab 1: 24-Hour Diurnal Load Curve */}
      {activeTab === 'daily' && (
        <section className="workspace-card">
          <div className="workspace-card-header">
            <div>
              <h2 className="workspace-card-title">Typical 24-Hour Diurnal Demand Curve</h2>
              <p className="workspace-card-subtitle">
                Average consumption profile (kW/home) across 48 half-hour slots. Green curve indicates observed load; dashed line indicates day-ahead forecast expectation.
              </p>
            </div>
          </div>
          <div className="workspace-chart-wrapper">
            {isLoading ? (
              <div style={{ padding: '3.5rem', textAlign: 'center', color: 'var(--foreground-muted)' }}>
                Loading demand telemetry...
              </div>
            ) : (
              <LoadChart data={dailyChartPoints} height={320} />
            )}
          </div>
          <div style={{ padding: '1rem 1.25rem', backgroundColor: 'var(--surface-raised)', borderTop: '1px solid var(--border)', fontSize: '0.82rem', color: 'var(--foreground-muted)', lineHeight: 1.5 }}>
            <strong style={{ color: 'var(--foreground)' }}>Analytical Interpretation:</strong> Residential demand exhibits a mild morning peak between 07:30 and 09:00 (0.24 kW/home), flattens during afternoon hours, and reaches the daily maximum during the evening cooking and heating window between 18:00 and 21:00 (peaking at 19:00 with 0.369 kW/home).
          </div>
        </section>
      )}

      {/* Tab 2: Weekday vs Weekend Profile */}
      {activeTab === 'weekly' && (
        <section className="workspace-card">
          <div className="workspace-card-header">
            <div>
              <h2 className="workspace-card-title">Weekday vs. Weekend Consumption Profile</h2>
              <p className="workspace-card-subtitle">
                Comparing residential load patterns between working weekdays (Monday–Friday) and weekend days (Saturday–Sunday).
              </p>
            </div>
          </div>
          <div className="workspace-chart-wrapper">
            {isLoading ? (
              <div style={{ padding: '3.5rem', textAlign: 'center', color: 'var(--foreground-muted)' }}>
                Loading weekly telemetry...
              </div>
            ) : (
              <LoadChart data={weeklyChartPoints} height={320} />
            )}
          </div>
          <div style={{ padding: '1rem 1.25rem', backgroundColor: 'var(--surface-raised)', borderTop: '1px solid var(--border)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--foreground-subtle)', textTransform: 'uppercase' }}>
                Weekday Profile (Solid Line)
              </span>
              <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.82rem', color: 'var(--foreground-muted)', lineHeight: 1.5 }}>
                Sharper morning ramp starting at 06:30 as occupants prepare for school/work, followed by a noticeable daytime dip and a steep evening ramp.
              </p>
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--foreground-subtle)', textTransform: 'uppercase' }}>
                Weekend Profile (Dashed Line)
              </span>
              <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.82rem', color: 'var(--foreground-muted)', lineHeight: 1.5 }}>
                Later morning wakeup (peak delayed to 10:30), sustained midday home occupancy consumption, and approximately 3.1% lower evening peak demand.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Tab 3: Longitudinal Window Trend (W01 to W14) */}
      {activeTab === 'trend' && (
        <section className="workspace-card">
          <div className="workspace-card-header">
            <div>
              <h2 className="workspace-card-title">Longitudinal Demand Evolution Across 14 Observation Windows</h2>
              <p className="workspace-card-subtitle">
                Tracking mean demand, peak demand, peak-to-average ratio, and flagged anomalies across 14 consecutive 56-day observation periods (2.1 years).
              </p>
            </div>
          </div>
          <div style={{ padding: '1rem', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left', color: 'var(--foreground-subtle)' }}>
                  <th style={{ padding: '0.65rem 0.75rem' }}>Window</th>
                  <th style={{ padding: '0.65rem 0.75rem' }}>Season</th>
                  <th style={{ padding: '0.65rem 0.75rem' }}>Mean Load (kW)</th>
                  <th style={{ padding: '0.65rem 0.75rem' }}>Peak Load (kW)</th>
                  <th style={{ padding: '0.65rem 0.75rem' }}>Peak-to-Average</th>
                  <th style={{ padding: '0.65rem 0.75rem' }}>Day/Night Ratio</th>
                  <th style={{ padding: '0.65rem 0.75rem' }}>Anomalies Flagged</th>
                </tr>
              </thead>
              <tbody>
                {(data?.window_trend || []).map((w, i) => (
                  <tr
                    key={w.window_id}
                    style={{
                      borderBottom: '1px solid var(--border)',
                      backgroundColor: i % 2 === 0 ? 'transparent' : 'color-mix(in srgb, var(--surface-raised) 50%, transparent)',
                    }}
                  >
                    <td style={{ padding: '0.65rem 0.75rem', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                      {w.window_id}
                    </td>
                    <td style={{ padding: '0.65rem 0.75rem' }}>
                      <span
                        style={{
                          padding: '0.15rem 0.45rem',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '0.72rem',
                          backgroundColor: 'var(--surface-raised)',
                          border: '1px solid var(--border)',
                        }}
                      >
                        {w.season}
                      </span>
                    </td>
                    <td style={{ padding: '0.65rem 0.75rem', fontFamily: 'var(--font-mono)' }}>
                      {w.mean_load_kw.toFixed(3)} kW
                    </td>
                    <td style={{ padding: '0.65rem 0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--accent-amber)' }}>
                      {w.peak_load_kw.toFixed(3)} kW
                    </td>
                    <td style={{ padding: '0.65rem 0.75rem', fontFamily: 'var(--font-mono)' }}>
                      {w.p2a_ratio.toFixed(2)}x
                    </td>
                    <td style={{ padding: '0.65rem 0.75rem', fontFamily: 'var(--font-mono)' }}>
                      {w.day_night_ratio.toFixed(2)}
                    </td>
                    <td style={{ padding: '0.65rem 0.75rem', fontFamily: 'var(--font-mono)', color: w.flagged_anomalies > 23 ? 'var(--accent-rose)' : 'var(--foreground)' }}>
                      {w.flagged_anomalies}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Tab 4: Seasonal Comparison */}
      {activeTab === 'seasonal' && (
        <section className="workspace-card">
          <div className="workspace-card-header">
            <div>
              <h2 className="workspace-card-title">Seasonal Demand Comparison</h2>
              <p className="workspace-card-subtitle">
                Aggregate demand metrics across Winter, Spring, Summer, and Autumn observation windows.
              </p>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', padding: '1.25rem' }}>
            {(data?.seasonal_comparison || []).map((s) => (
              <div
                key={s.season}
                style={{
                  padding: '1.25rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--surface-raised)',
                  border: '1px solid var(--border)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.65rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--foreground)' }}>
                    {s.season}
                  </h3>
                  <span style={{ fontSize: '0.72rem', color: 'var(--foreground-subtle)', fontFamily: 'var(--font-mono)' }}>
                    {s.window_count} Windows
                  </span>
                </div>

                <div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--foreground-subtle)', textTransform: 'uppercase' }}>
                    Average Demand
                  </span>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.2rem', fontWeight: 700, color: 'var(--foreground)', marginTop: '0.15rem' }}>
                    {s.mean_load_kw.toFixed(3)} kW
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: '0.5rem', fontSize: '0.78rem' }}>
                  <span style={{ color: 'var(--foreground-muted)' }}>Peak Load:</span>
                  <strong style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-amber)' }}>
                    {s.peak_load_kw.toFixed(3)} kW
                  </strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                  <span style={{ color: 'var(--foreground-muted)' }}>Peak-to-Average:</span>
                  <strong style={{ fontFamily: 'var(--font-mono)' }}>
                    {s.p2a_ratio.toFixed(2)}x
                  </strong>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

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
          <span>Technical details (Calendar window protocol &amp; aggregation methodology)</span>
          {showTechnicalDetails ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {showTechnicalDetails && (
          <div style={{ padding: '0 1rem 1.25rem 1rem', borderTop: '1px solid var(--border)', marginTop: '0.5rem' }}>
            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--foreground-muted)', lineHeight: 1.5 }}>
              Demand telemetry is pre-aggregated across 620 smart meters using standardized 56-day common-calendar windows (W01–W14).
              Half-hourly intervals are indexed from slot 0 (00:00) to slot 47 (23:30).
              Baseline comparisons use day-ahead LightGBM predictions validated under the strict forward-only holdout protocol.
            </p>
          </div>
        )}
      </section>
    </div>
  );
};
