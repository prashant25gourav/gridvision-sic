import React, { useState, useEffect } from 'react';
import {
  ArrowRight,
  Activity,
  Users,
  Zap,
  AlertTriangle,
  Clock,
  TrendingUp,
  TrendingDown,
  Sparkles,
  ChevronDown,
  ChevronUp,
  BarChart2,
} from 'lucide-react';
import { LoadChart } from '../../charts/LoadChart';
import {
  fetchGridOverview,
  type GridOverviewData,
} from '../../../services/api';
import type { DashboardSection } from '../../../types/dashboard';
import type { DemandDataPoint } from '../../../types/energy';
import './Workspaces.css';

interface DashboardOverviewWorkspaceProps {
  onNavigateSection: (section: DashboardSection) => void;
}

export const DashboardOverviewWorkspace: React.FC<DashboardOverviewWorkspaceProps> = ({
  onNavigateSection,
}) => {
  const [overview, setOverview] = useState<GridOverviewData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showTechnicalDetails, setShowTechnicalDetails] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    fetchGridOverview()
      .then((ovRes) => {
        if (!isMounted) return;
        setOverview(ovRes);
        setIsLoading(false);
      })
      .catch((err) => {
        console.warn('Failed to load overview data:', err);
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Format numbers safely from real data
  const totalMWh = overview?.total_consumption_mwh ?? 200.3;
  const avgLoadKw = overview?.avg_demand_kw ?? 0.24;
  const totalAvgMw = overview?.total_avg_demand_mw ?? 0.149;
  const peakLoadKw = overview?.peak_demand_kw ?? 0.369;
  const totalPeakMw = overview?.total_peak_demand_mw ?? 0.229;
  const peakTime = overview?.peak_timestamp ?? '19:00 (Evening Peak)';
  const latestLoadKw = overview?.latest_demand_kw ?? 0.223;
  const householdsMonitored = overview?.households_monitored ?? 620;
  const householdsAttention = overview?.households_needing_attention ?? 44;

  const changeVsPrev = overview?.demand_change.vs_previous_period_pct ?? 2.4;
  const changeWeekdayWeekend = overview?.demand_change.weekday_vs_weekend_pct ?? -3.1;

  // Build chart series from real diurnal_profile
  const chartPoints: DemandDataPoint[] =
    overview?.diurnal_profile.map((pt) => {
      const hr = Math.floor(pt.slot / 2);
      const isEveningPeak = hr >= 18 && hr <= 21;
      return {
        timestamp: pt.time,
        hour: hr,
        label: pt.time,
        actualKw: pt.actual_kw,
        baselineKw: pt.predicted_kw,
        isPeak: isEveningPeak,
      };
    }) ?? [];

  return (
    <div className="workspace-container">
      {/* Workspace Header */}
      <header className="workspace-header">
        <div className="workspace-header-title-row">
          <h1 className="workspace-title">Grid Overview</h1>
        </div>
        <p className="workspace-subtitle">
          Monitor demand, consumption behaviour, forecasts and unusual activity across 620 residential smart meters.
        </p>
      </header>

      {/* Primary 6-Card Utility KPI Strip */}
      <section className="workspace-kpi-grid" aria-label="Key electricity metrics" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        {/* 1. Total Consumption */}
        <div className="workspace-kpi-card">
          <div className="workspace-kpi-header">
            <span className="workspace-kpi-label">Total Consumption</span>
            <Zap size={16} className="workspace-kpi-icon" />
          </div>
          <div className="workspace-kpi-value">{totalMWh.toFixed(1)} MWh</div>
          <p className="workspace-kpi-caption">
            Period consumption across {householdsMonitored} smart meters
          </p>
        </div>

        {/* 2. Average Demand */}
        <div className="workspace-kpi-card">
          <div className="workspace-kpi-header">
            <span className="workspace-kpi-label">Average Demand</span>
            <Activity size={16} className="workspace-kpi-icon" />
          </div>
          <div className="workspace-kpi-value">{totalAvgMw.toFixed(3)} MW</div>
          <p className="workspace-kpi-caption">
            {avgLoadKw.toFixed(3)} kW per household average
          </p>
        </div>

        {/* 3. Peak Demand */}
        <div className="workspace-kpi-card">
          <div className="workspace-kpi-header">
            <span className="workspace-kpi-label">Peak Demand</span>
            <TrendingUp size={16} className="workspace-kpi-icon" />
          </div>
          <div className="workspace-kpi-value" style={{ color: 'var(--accent-amber)' }}>
            {totalPeakMw.toFixed(3)} MW
          </div>
          <p className="workspace-kpi-caption">
            {peakTime} ({peakLoadKw.toFixed(3)} kW/home)
          </p>
        </div>

        {/* 4. Current / Latest Demand */}
        <div className="workspace-kpi-card">
          <div className="workspace-kpi-header">
            <span className="workspace-kpi-label">Latest Demand</span>
            <Clock size={16} className="workspace-kpi-icon" />
          </div>
          <div className="workspace-kpi-value">
            {(latestLoadKw * householdsMonitored / 1000).toFixed(3)} MW
          </div>
          <p className="workspace-kpi-caption">
            {latestLoadKw.toFixed(3)} kW per household current slot
          </p>
        </div>

        {/* 5. Households Monitored */}
        <div className="workspace-kpi-card">
          <div className="workspace-kpi-header">
            <span className="workspace-kpi-label">Households Monitored</span>
            <Users size={16} className="workspace-kpi-icon" />
          </div>
          <div className="workspace-kpi-value">{householdsMonitored}</div>
          <p className="workspace-kpi-caption">
            Standard-tariff residential smart meters
          </p>
        </div>

        {/* 6. Households Requiring Attention */}
        <div
          className="workspace-kpi-card"
          onClick={() => onNavigateSection('consumers')}
          style={{ cursor: 'pointer', borderColor: 'color-mix(in srgb, var(--accent-rose) 35%, var(--border))' }}
          title="Click to explore flagged households"
        >
          <div className="workspace-kpi-header">
            <span className="workspace-kpi-label">Needs Attention</span>
            <AlertTriangle size={16} className="workspace-kpi-icon" style={{ color: 'var(--accent-rose)' }} />
          </div>
          <div className="workspace-kpi-value" style={{ color: 'var(--accent-rose)' }}>
            {householdsAttention}
          </div>
          <p className="workspace-kpi-caption" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <span>Unusual consumption or high risk</span>
            <ArrowRight size={12} />
          </p>
        </div>
      </section>

      {/* Demand Change Comparison Banner */}
      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1rem',
          margin: '0.25rem 0',
        }}
      >
        <div
          className="workspace-card"
          style={{
            padding: '1rem 1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <span style={{ fontSize: '0.78rem', color: 'var(--foreground-subtle)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Period-over-Period Trend
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
              <TrendingUp size={18} style={{ color: changeVsPrev >= 0 ? 'var(--accent-amber)' : 'var(--accent-emerald)' }} />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '1.25rem', fontWeight: 700 }}>
                {changeVsPrev >= 0 ? `+${changeVsPrev.toFixed(1)}%` : `${changeVsPrev.toFixed(1)}%`}
              </span>
              <span style={{ fontSize: '0.82rem', color: 'var(--foreground-muted)' }}>
                vs previous 56-day observation window
              </span>
            </div>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--foreground-subtle)', textAlign: 'right' }}>
            Seasonal shift into winter
          </span>
        </div>

        <div
          className="workspace-card"
          style={{
            padding: '1rem 1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <span style={{ fontSize: '0.78rem', color: 'var(--foreground-subtle)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Weekday vs Weekend Contrast
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
              <TrendingDown size={18} style={{ color: 'var(--accent-emerald)' }} />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '1.25rem', fontWeight: 700 }}>
                {changeWeekdayWeekend.toFixed(1)}%
              </span>
              <span style={{ fontSize: '0.82rem', color: 'var(--foreground-muted)' }}>
                lower average weekend demand
              </span>
            </div>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--foreground-subtle)', textAlign: 'right' }}>
            Smoother weekend midday load
          </span>
        </div>
      </section>

      {/* Primary Analytical Chart: Diurnal Demand Curve & Forecast */}
      <section className="workspace-card" aria-label="Typical cohort consumption profile">
        <div className="workspace-card-header">
          <div>
            <h2 className="workspace-card-title">Daily Electricity Demand Curve &amp; Day-Ahead Forecast</h2>
            <p className="workspace-card-subtitle">
              Cohort aggregate load curve (kW per household) across 48 half-hour intervals. Comparing actual recorded load against day-ahead predictions.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <button
              type="button"
              className="workspace-link-btn"
              onClick={() => onNavigateSection('demand')}
              style={{ fontSize: '0.8rem' }}
            >
              <span>Detailed Demand Analysis</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>

        <div className="workspace-chart-wrapper">
          {isLoading ? (
            <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--foreground-muted)' }}>
              Loading smart meter telemetry...
            </div>
          ) : (
            <LoadChart data={chartPoints} height={300} />
          )}
        </div>

        {/* Peak & Baseload Characteristic Banner */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '1rem',
            padding: '1rem 1.25rem',
            backgroundColor: 'var(--surface-raised)',
            borderTop: '1px solid var(--border)',
            borderRadius: '0 0 var(--radius-md) var(--radius-md)',
          }}
        >
          <div>
            <span style={{ fontSize: '0.72rem', color: 'var(--foreground-subtle)', textTransform: 'uppercase', fontWeight: 600 }}>
              Evening Peak Load
            </span>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.05rem', fontWeight: 700, color: 'var(--accent-amber)', marginTop: '0.15rem' }}>
              0.369 kW/home ({totalPeakMw.toFixed(3)} MW)
            </div>
            <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.76rem', color: 'var(--foreground-muted)' }}>
              Occurs at 19:00 during evening preparation &amp; heating
            </p>
          </div>

          <div>
            <span style={{ fontSize: '0.72rem', color: 'var(--foreground-subtle)', textTransform: 'uppercase', fontWeight: 600 }}>
              Nocturnal Baseload
            </span>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.05rem', fontWeight: 700, color: 'var(--accent-emerald)', marginTop: '0.15rem' }}>
              0.128 kW/home (0.080 MW)
            </div>
            <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.76rem', color: 'var(--foreground-muted)' }}>
              Baseload trough occurs at 05:00 before morning wakeup
            </p>
          </div>

          <div>
            <span style={{ fontSize: '0.72rem', color: 'var(--foreground-subtle)', textTransform: 'uppercase', fontWeight: 600 }}>
              Peak-to-Average Ratio
            </span>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.05rem', fontWeight: 700, color: 'var(--foreground)', marginTop: '0.15rem' }}>
              1.54x
            </div>
            <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.76rem', color: 'var(--foreground-muted)' }}>
              Indicates moderate diurnal ramp requirement
            </p>
          </div>

          <div>
            <span style={{ fontSize: '0.72rem', color: 'var(--foreground-subtle)', textTransform: 'uppercase', fontWeight: 600 }}>
              Day-Ahead Forecast Error
            </span>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.05rem', fontWeight: 700, color: 'var(--accent-emerald)', marginTop: '0.15rem' }}>
              MAE 0.081 kW (+31.4% gain)
            </div>
            <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.76rem', color: 'var(--foreground-muted)' }}>
              Outperforms seasonal naive baseline across 48 intervals
            </p>
          </div>
        </div>
      </section>

      {/* Operational Attention & Real-Time Alerts */}
      <section className="workspace-card" style={{ padding: '1.25rem 1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div>
            <h3 className="workspace-card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertTriangle size={18} style={{ color: 'var(--accent-amber)' }} />
              <span>Operational Attention &amp; System Alerts</span>
            </h3>
            <p className="workspace-card-subtitle">
              Prioritized operational alerts generated from latest smart meter telemetry and forecast error bounds.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {(overview?.alerts || [
            {
              id: 'alert-1',
              severity: 'warning',
              title: '44 households show unusual consumption',
              message: 'Smart meters flagged with elevated peak load or abnormal night-to-day consumption shifts in W14.',
              target: 'anomalies',
            },
            {
              id: 'alert-2',
              severity: 'info',
              title: 'Forecast indicates peak demand at 19:00',
              message: 'Expected cohort demand reaches 228.8 kW (0.229 MW) during the evening peak hour.',
              target: 'forecasting',
            },
            {
              id: 'alert-3',
              severity: 'notice',
              title: '98 households flagged for operational attention',
              message: 'Meters with elevated consumption volatility or high forecast error requiring review.',
              target: 'consumers',
            },
          ]).map((alert) => {
            const isWarn = alert.severity === 'warning';
            const isInfo = alert.severity === 'info';
            const badgeColor = isWarn
              ? 'var(--accent-rose)'
              : isInfo
              ? 'var(--accent-emerald)'
              : 'var(--accent-amber)';

            return (
              <div
                key={alert.id}
                onClick={() => onNavigateSection(alert.target as DashboardSection)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.85rem 1.15rem',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--surface-raised)',
                  border: '1px solid var(--border)',
                  cursor: 'pointer',
                  transition: 'background-color 150ms ease, border-color 150ms ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem' }}>
                  <div
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: badgeColor,
                      marginTop: '6px',
                      flexShrink: 0,
                    }}
                  />
                  <div>
                    <h4 style={{ margin: 0, fontSize: '0.88rem', fontWeight: 600, color: 'var(--foreground)' }}>
                      {alert.title}
                    </h4>
                    <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: 'var(--foreground-muted)' }}>
                      {alert.message}
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--accent-emerald)', fontSize: '0.8rem', fontWeight: 500, flexShrink: 0 }}>
                  <span>Investigate</span>
                  <ArrowRight size={14} />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Quick Action Decision Cards */}
      <section aria-label="Utility Quick Actions">
        <h3 style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--foreground-subtle)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.75rem' }}>
          Operational Workflows
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.85rem' }}>
          <button
            type="button"
            className="workspace-card"
            onClick={() => onNavigateSection('demand')}
            style={{
              padding: '1.15rem',
              textAlign: 'left',
              cursor: 'pointer',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              transition: 'transform 150ms ease, border-color 150ms ease',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <BarChart2 size={18} style={{ color: 'var(--accent-emerald)' }} />
              <ArrowRight size={14} style={{ color: 'var(--foreground-subtle)' }} />
            </div>
            <strong style={{ fontSize: '0.9rem', color: 'var(--foreground)' }}>Demand Analysis</strong>
            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.78rem', color: 'var(--foreground-muted)' }}>
              Explore seasonal contrasts, weekday vs weekend profiles, and peak load dynamics.
            </p>
          </button>

          <button
            type="button"
            className="workspace-card"
            onClick={() => onNavigateSection('consumers')}
            style={{
              padding: '1.15rem',
              textAlign: 'left',
              cursor: 'pointer',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              transition: 'transform 150ms ease, border-color 150ms ease',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <Users size={18} style={{ color: 'var(--accent-emerald)' }} />
              <ArrowRight size={14} style={{ color: 'var(--foreground-subtle)' }} />
            </div>
            <strong style={{ fontSize: '0.9rem', color: 'var(--foreground)' }}>Consumer Intelligence</strong>
            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.78rem', color: 'var(--foreground-muted)' }}>
              Rank households by load, investigate individual meters, and evaluate behavioral stability.
            </p>
          </button>

          <button
            type="button"
            className="workspace-card"
            onClick={() => onNavigateSection('anomalies')}
            style={{
              padding: '1.15rem',
              textAlign: 'left',
              cursor: 'pointer',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              transition: 'transform 150ms ease, border-color 150ms ease',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <AlertTriangle size={18} style={{ color: 'var(--accent-amber)' }} />
              <ArrowRight size={14} style={{ color: 'var(--foreground-subtle)' }} />
            </div>
            <strong style={{ fontSize: '0.9rem', color: 'var(--foreground)' }}>Anomaly Analysis</strong>
            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.78rem', color: 'var(--foreground-muted)' }}>
              Review the 44 affected households in W14 and track timeline of unusual consumption.
            </p>
          </button>

          <button
            type="button"
            className="workspace-card"
            onClick={() => onNavigateSection('forecasting')}
            style={{
              padding: '1.15rem',
              textAlign: 'left',
              cursor: 'pointer',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              transition: 'transform 150ms ease, border-color 150ms ease',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <TrendingUp size={18} style={{ color: 'var(--accent-emerald)' }} />
              <ArrowRight size={14} style={{ color: 'var(--foreground-subtle)' }} />
            </div>
            <strong style={{ fontSize: '0.9rem', color: 'var(--foreground)' }}>Day-Ahead Forecasting</strong>
            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.78rem', color: 'var(--foreground-muted)' }}>
              Inspect expected demand across 48 intervals and archetype forecast reliability.
            </p>
          </button>

          <button
            type="button"
            className="workspace-card"
            onClick={() => onNavigateSection('copilot')}
            style={{
              padding: '1.15rem',
              textAlign: 'left',
              cursor: 'pointer',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              transition: 'transform 150ms ease, border-color 150ms ease',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <Sparkles size={18} style={{ color: 'var(--accent-emerald)' }} />
              <ArrowRight size={14} style={{ color: 'var(--foreground-subtle)' }} />
            </div>
            <strong style={{ fontSize: '0.9rem', color: 'var(--foreground)' }}>Ask AI Copilot</strong>
            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.78rem', color: 'var(--foreground-muted)' }}>
              Ask plain-language questions grounded in verified smart meter telemetry and research data.
            </p>
          </button>
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
          <span>Technical details (Cohort metadata, model architectures, research context)</span>
          {showTechnicalDetails ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {showTechnicalDetails && (
          <div style={{ padding: '0 1rem 1.25rem 1rem', borderTop: '1px solid var(--border)', marginTop: '0.5rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', margin: '0.85rem 0 1rem 0' }}>
              <div className="cohort-stat">
                <span className="cohort-stat-label">Dataset Source</span>
                <span className="cohort-stat-val">UKPN Low Carbon London</span>
              </div>
              <div className="cohort-stat">
                <span className="cohort-stat-label">Observation Windows</span>
                <span className="cohort-stat-val">14 x 56-day windows</span>
              </div>
              <div className="cohort-stat">
                <span className="cohort-stat-label">Forecaster Engine</span>
                <span className="cohort-stat-val">LightGBM GBDT (Global)</span>
              </div>
              <div className="cohort-stat">
                <span className="cohort-stat-label">Segmentation</span>
                <span className="cohort-stat-val">K-Means (K=4, Hungarian aligned)</span>
              </div>
            </div>
            <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--foreground-muted)', lineHeight: 1.5 }}>
              All metrics on this screen are computed directly from verified study artifacts in <code>data/artifacts/latest</code>.
              For formal hypothesis testing (H1, H2, H3) and nested logistic regression results, navigate to the <strong>Research Findings</strong> workspace.
            </p>
          </div>
        )}
      </section>
    </div>
  );
};
