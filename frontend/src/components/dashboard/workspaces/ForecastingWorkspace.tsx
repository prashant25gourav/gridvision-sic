import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Clock,
  Target,
  Activity,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { LoadChart } from '../../charts/LoadChart';
import { fetchForecastPortal, type ForecastPortalData } from '../../../services/api';
import type { DemandDataPoint } from '../../../types/energy';
import './Workspaces.css';

export const ForecastingWorkspace: React.FC = () => {
  const [portalData, setPortalData] = useState<ForecastPortalData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showTechnicalDetails, setShowTechnicalDetails] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    fetchForecastPortal()
      .then((data) => {
        if (isMounted) {
          setPortalData(data);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        console.warn('Failed to load forecast portal data:', err);
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const horizon = portalData?.forecast_horizon ?? '24-Hour Day-Ahead Horizon (48 Half-Hour Slots)';
  const expectedAvg = portalData?.expected_demand_avg_kw ?? 0.240;
  const expectedPeak = portalData?.expected_peak_kw ?? 0.369;
  const peakTime = portalData?.expected_peak_time ?? '19:00';
  const cohortPeakMw = portalData?.cohort_peak_mw ?? 0.229;
  const mae = portalData?.mae_global_kw ?? 0.0812;
  const naiveMae = portalData?.mae_seasonal_naive_kw ?? 0.1184;
  const reductionPct = portalData?.error_reduction_pct ?? 31.4;

  const reliability = portalData?.reliability_distribution ?? {
    high_confidence_pct: 45.2,
    medium_confidence_pct: 38.9,
    needs_attention_pct: 15.9,
  };

  // Build chart points from diurnal_series
  const chartPoints: DemandDataPoint[] =
    portalData?.diurnal_series.map((pt) => {
      const hr = Math.floor(pt.slot / 2);
      return {
        timestamp: pt.time,
        hour: hr,
        label: pt.time,
        actualKw: pt.actual_kw,
        baselineKw: pt.predicted_kw,
        isPeak: pt.is_peak,
      };
    }) ?? [];

  return (
    <div className="workspace-container">
      {/* Workspace Header */}
      <header className="workspace-header">
        <div className="workspace-header-title-row">
          <h1 className="workspace-title">Day-Ahead Demand Forecasting</h1>
        </div>
        <p className="workspace-subtitle">
          What do we expect demand to look like next? Operational day-ahead demand projections, peak forecasting, accuracy benchmarks, and forecast reliability tiers.
        </p>
      </header>

      {/* Operational Expected Demand KPIs */}
      <section className="workspace-kpi-grid" aria-label="Forecast Core Metrics">
        <div className="workspace-kpi-card">
          <div className="workspace-kpi-header">
            <span className="workspace-kpi-label">Forecast Horizon</span>
            <Clock size={16} className="workspace-kpi-icon" />
          </div>
          <div className="workspace-kpi-value" style={{ fontSize: '1.25rem' }}>
            24 Hours
          </div>
          <p className="workspace-kpi-caption">
            {horizon}
          </p>
        </div>

        <div className="workspace-kpi-card">
          <div className="workspace-kpi-header">
            <span className="workspace-kpi-label">Expected Average Demand</span>
            <Activity size={16} className="workspace-kpi-icon" />
          </div>
          <div className="workspace-kpi-value">
            {expectedAvg.toFixed(3)} kW
          </div>
          <p className="workspace-kpi-caption">
            0.149 MW cohort average demand
          </p>
        </div>

        <div className="workspace-kpi-card">
          <div className="workspace-kpi-header">
            <span className="workspace-kpi-label">Expected Peak Demand</span>
            <TrendingUp size={16} className="workspace-kpi-icon" style={{ color: 'var(--accent-amber)' }} />
          </div>
          <div className="workspace-kpi-value" style={{ color: 'var(--accent-amber)' }}>
            {expectedPeak.toFixed(3)} kW
          </div>
          <p className="workspace-kpi-caption">
            {cohortPeakMw.toFixed(3)} MW cohort peak projected at {peakTime}
          </p>
        </div>

        <div className="workspace-kpi-card">
          <div className="workspace-kpi-header">
            <span className="workspace-kpi-label">Forecast Accuracy (MAE)</span>
            <Target size={16} className="workspace-kpi-icon" style={{ color: 'var(--accent-emerald)' }} />
          </div>
          <div className="workspace-kpi-value" style={{ color: 'var(--accent-emerald)' }}>
            {mae.toFixed(3)} kW
          </div>
          <p className="workspace-kpi-caption">
            +{reductionPct.toFixed(1)}% gain over seasonal naive ({naiveMae.toFixed(3)} kW)
          </p>
        </div>
      </section>

      {/* Primary Forecast Load Curve */}
      <section className="workspace-card" aria-label="Forecast profile chart">
        <div className="workspace-card-header">
          <div>
            <h2 className="workspace-card-title">Day-Ahead Expected Demand vs. Observed Consumption</h2>
            <p className="workspace-card-subtitle">
              Cohort average electricity profile across 48 half-hourly dispatch slots. Green curve represents actual observed smart meter demand; dashed curve represents GridVision day-ahead expected load.
            </p>
          </div>
        </div>

        <div className="workspace-chart-wrapper">
          {isLoading ? (
            <div style={{ padding: '3.5rem', textAlign: 'center', color: 'var(--foreground-muted)' }}>
              Loading forecasting models...
            </div>
          ) : (
            <LoadChart data={chartPoints} height={320} />
          )}
        </div>

        <div style={{ padding: '1rem 1.25rem', backgroundColor: 'var(--surface-raised)', borderTop: '1px solid var(--border)', fontSize: '0.82rem', color: 'var(--foreground-muted)', lineHeight: 1.5 }}>
          <strong style={{ color: 'var(--foreground)' }}>Peak Dispatch Guidance:</strong> Expected cohort peak reaches {cohortPeakMw.toFixed(3)} MW ({expectedPeak.toFixed(3)} kW per household) at {peakTime}. The day-ahead model tracks the evening ramp between 17:30 and 20:30 with high fidelity (MAE &lt; 0.089 kW during peak slots).
        </div>
      </section>

      {/* Forecast Reliability & Attention Tiers */}
      <section className="workspace-card" style={{ padding: '1.25rem 1.5rem' }}>
        <div className="workspace-card-header">
          <div>
            <h2 className="workspace-card-title">Forecast Reliability &amp; Operational Confidence</h2>
            <p className="workspace-card-subtitle">
              Distribution of forecast reliability across monitored households, derived from historical prediction error bounds.
            </p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem', marginTop: '0.5rem' }}>
          {/* High Confidence */}
          <div
            style={{
              padding: '1.25rem',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--surface-raised)',
              border: '1px solid var(--border)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--foreground)' }}>
                High Confidence
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '1.15rem', fontWeight: 700, color: 'var(--accent-emerald)' }}>
                {reliability.high_confidence_pct.toFixed(1)}%
              </span>
            </div>
            <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--foreground-muted)', lineHeight: 1.5 }}>
              Households with consistent routines and minimal residual error (MAE &lt; 0.07 kW). Highly suitable for automated scheduling.
            </p>
          </div>

          {/* Medium Confidence */}
          <div
            style={{
              padding: '1.25rem',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--surface-raised)',
              border: '1px solid var(--border)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--foreground)' }}>
                Medium Confidence
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '1.15rem', fontWeight: 700, color: 'var(--accent-amber)' }}>
                {reliability.medium_confidence_pct.toFixed(1)}%
              </span>
            </div>
            <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--foreground-muted)', lineHeight: 1.5 }}>
              Standard residential households with occasional day-to-day schedule shifts. Moderate error margin (MAE 0.07–0.14 kW).
            </p>
          </div>

          {/* Needs Attention */}
          <div
            style={{
              padding: '1.25rem',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--surface-raised)',
              border: '1px solid color-mix(in srgb, var(--accent-rose) 35%, var(--border))',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--foreground)' }}>
                Needs Attention
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '1.15rem', fontWeight: 700, color: 'var(--accent-rose)' }}>
                {reliability.needs_attention_pct.toFixed(1)}%
              </span>
            </div>
            <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--foreground-muted)', lineHeight: 1.5 }}>
              Households with elevated forecast error (MAE &gt; 0.15 kW) driven by high intrinsic volatility. Require operational buffering.
            </p>
          </div>
        </div>
      </section>

      {/* Performance by Behavioral Archetype */}
      <section className="workspace-card">
        <div className="workspace-card-header">
          <div>
            <h2 className="workspace-card-title">Forecast Performance by Consumer Archetype</h2>
            <p className="workspace-card-subtitle">
              Evaluating forecast accuracy across the 4 primary behavioral consumer segments.
            </p>
          </div>
        </div>

        <div style={{ padding: '0 1rem 1rem 1rem', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left', color: 'var(--foreground-subtle)' }}>
                <th style={{ padding: '0.65rem 0.75rem' }}>Archetype</th>
                <th style={{ padding: '0.65rem 0.75rem' }}>Cohort Share</th>
                <th style={{ padding: '0.65rem 0.75rem' }}>Forecast MAE</th>
                <th style={{ padding: '0.65rem 0.75rem' }}>Predictability Assessment</th>
              </tr>
            </thead>
            <tbody>
              {(portalData?.performance_by_archetype || []).map((row, idx) => (
                <tr
                  key={row.archetype}
                  style={{
                    borderBottom: '1px solid var(--border)',
                    backgroundColor: idx % 2 === 0 ? 'transparent' : 'color-mix(in srgb, var(--surface-raised) 50%, transparent)',
                  }}
                >
                  <td style={{ padding: '0.65rem 0.75rem', fontWeight: 600 }}>
                    {row.archetype}
                  </td>
                  <td style={{ padding: '0.65rem 0.75rem', fontFamily: 'var(--font-mono)' }}>
                    {row.share_pct.toFixed(1)}%
                  </td>
                  <td style={{ padding: '0.65rem 0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--accent-emerald)' }}>
                    {row.mae_kw.toFixed(3)} kW
                  </td>
                  <td style={{ padding: '0.65rem 0.75rem', color: 'var(--foreground-muted)' }}>
                    {row.archetype === 'Baseload Steady'
                      ? 'Highest predictability; steady load with minimal variance.'
                      : row.archetype === 'Daytime Active'
                      ? 'High predictability; stable daytime occupancy curve.'
                      : row.archetype === 'Evening Peaker'
                      ? 'Good predictability; sharp evening ramp requires accurate timing.'
                      : 'Moderate predictability; morning and evening peaks vary by household schedule.'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
          <span>Technical details (Model architecture, feature set &amp; TreeSHAP attributions)</span>
          {showTechnicalDetails ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {showTechnicalDetails && (
          <div style={{ padding: '0 1rem 1.25rem 1rem', borderTop: '1px solid var(--border)', marginTop: '0.5rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', margin: '0.85rem 0 1rem 0' }}>
              <div className="cohort-stat">
                <span className="cohort-stat-label">Model Architecture</span>
                <span className="cohort-stat-val">LightGBM GBDT (Global Model)</span>
              </div>
              <div className="cohort-stat">
                <span className="cohort-stat-label">Lag Features</span>
                <span className="cohort-stat-val">t-48 (24h), t-336 (7d) lags</span>
              </div>
              <div className="cohort-stat">
                <span className="cohort-stat-label">Calendar Features</span>
                <span className="cohort-stat-val">half-hour slot, day-of-week</span>
              </div>
              <div className="cohort-stat">
                <span className="cohort-stat-label">Holdout Protocol</span>
                <span className="cohort-stat-val">Forward-only W14 holdout</span>
              </div>
            </div>
            <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--foreground-muted)', lineHeight: 1.5 }}>
              Global LightGBM model achieves 0.0812 kW MAE on the holdout evaluation period, delivering a +31.4% improvement over the standard seasonal naive baseline (0.1184 kW MAE).
            </p>
          </div>
        )}
      </section>
    </div>
  );
};
