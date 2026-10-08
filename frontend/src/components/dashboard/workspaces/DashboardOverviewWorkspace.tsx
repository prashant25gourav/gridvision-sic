import React, { useState, useEffect, useMemo } from 'react';
import {
  Zap,
  Activity,
  TrendingUp,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { LoadChart } from '../../charts/LoadChart';
import {
  fetchGridOverview,
  fetchDemandAnalysis,
  type GridOverviewData,
  type DemandAnalysisData,
  type WindowDemandData,
} from '../../../services/api';
import type { DemandDataPoint } from '../../../types/energy';
import type { DashboardSection } from '../../../types/dashboard';
import './Workspaces.css';

interface DashboardOverviewWorkspaceProps {
  onNavigateSection?: (section: DashboardSection) => void;
  onNavigateOverview?: (anchor?: string) => void;
}

const AVAILABLE_WINDOWS = [
  { id: 'all', label: 'All Windows' },
  { id: 'W01', label: 'W01' },
  { id: 'W02', label: 'W02' },
  { id: 'W03', label: 'W03' },
  { id: 'W04', label: 'W04' },
  { id: 'W05', label: 'W05' },
  { id: 'W06', label: 'W06' },
  { id: 'W07', label: 'W07' },
  { id: 'W08', label: 'W08' },
  { id: 'W09', label: 'W09' },
  { id: 'W10', label: 'W10' },
  { id: 'W11', label: 'W11' },
  { id: 'W12', label: 'W12' },
  { id: 'W13', label: 'W13' },
  { id: 'W14', label: 'W14' },
];

export const DashboardOverviewWorkspace: React.FC<DashboardOverviewWorkspaceProps> = ({
  onNavigateOverview,
}) => {
  const [selectedWindow, setSelectedWindow] = useState<string>('W14');
  const [overview, setOverview] = useState<GridOverviewData | null>(null);
  const [demandAnalysis, setDemandAnalysis] = useState<DemandAnalysisData | null>(null);
  const [activeTrendTab, setActiveTrendTab] = useState<'daily' | 'weekly' | 'longitudinal'>('daily');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initial load: fetch W14 and demand analysis (which returns the complete windows dictionary)
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    Promise.allSettled([fetchGridOverview('W14'), fetchDemandAnalysis('W14')])
      .then(([ovRes, daRes]) => {
        if (!isMounted) return;
        if (ovRes.status === 'fulfilled') {
          setOverview(ovRes.value);
        }
        if (daRes.status === 'fulfilled') {
          setDemandAnalysis(daRes.value);
        }
        setIsLoading(false);
      })
      .catch((err) => {
        console.warn('Failed to load snapshot telemetry:', err);
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Map of all 14 windows + all aggregate from backend cache
  const windowsMap: Record<string, WindowDemandData> = useMemo(() => {
    return overview?.windows || demandAnalysis?.windows || {};
  }, [overview, demandAnalysis]);

  // Active window telemetry: derived from windowsMap or fallback to overview
  const activeData = useMemo(() => {
    if (windowsMap[selectedWindow]) {
      return windowsMap[selectedWindow];
    }
    // Fallback if windows map is not yet populated
    return {
      window_id: selectedWindow,
      window_name: selectedWindow === 'all' ? 'All Windows' : `Window ${selectedWindow}`,
      start_date: overview?.window_start_date || '2013-11-21',
      end_date: overview?.window_end_date || '2014-01-15',
      date_range: overview?.window_dates || 'Nov 21, 2013 – Jan 15, 2014',
      n_households: overview?.households_monitored || 620,
      total_consumption_mwh: overview?.total_consumption_mwh ?? 200.3,
      avg_demand_kw: overview?.avg_demand_kw ?? 0.2404,
      total_avg_demand_kw: overview?.total_avg_demand_kw ?? 149.1,
      total_avg_demand_mw: overview?.total_avg_demand_mw ?? 0.149,
      peak_demand_kw: overview?.peak_demand_kw ?? 0.369,
      total_peak_demand_kw: overview?.total_peak_demand_kw ?? 228.8,
      total_peak_demand_mw: overview?.total_peak_demand_mw ?? 0.229,
      peak_time: '19:00',
      peak_timestamp: overview?.peak_timestamp || '19:00 · Evening Peak',
      latest_demand_kw: overview?.latest_demand_kw ?? 0.2229,
      total_latest_demand_kw: overview?.total_latest_demand_kw ?? 138.2,
      total_latest_demand_mw: overview?.total_latest_demand_mw ?? 0.138,
      latest_timestamp: overview?.latest_timestamp || '23:30 · Jan 15, 2014',
      diurnal_profile: overview?.diurnal_profile || [],
      weekday_vs_weekend: demandAnalysis?.weekday_vs_weekend || [],
    };
  }, [windowsMap, selectedWindow, overview, demandAnalysis]);

  // Derived KPI metrics
  const totalMWh = activeData.total_consumption_mwh;
  const avgLoadKw = activeData.avg_demand_kw;
  const totalAvgMw = activeData.total_avg_demand_mw;
  const totalPeakMw = activeData.total_peak_demand_mw;
  const peakTime = activeData.peak_time || '19:00';
  const latestDemandMw = activeData.total_latest_demand_mw;
  const latestTimestamp = activeData.latest_timestamp || '23:30 · Jan 15, 2014';

  // Dynamic period label (no "(56-Day Window)" text anywhere)
  const periodLabel = useMemo(() => {
    if (selectedWindow === 'all') {
      return `All Windows · ${activeData.date_range}`;
    }
    return `Window ${selectedWindow} · ${activeData.date_range}`;
  }, [selectedWindow, activeData.date_range]);

  // Daily Diurnal Trend points (48 slots across 24 hours) for the selected window
  const dailyTrendPoints: DemandDataPoint[] = useMemo(() => {
    const raw = activeData.diurnal_profile || [];
    return raw.map((pt) => ({
      timestamp: pt.time,
      hour: Math.floor(pt.slot / 2),
      label: pt.time,
      actualKw: pt.actual_kw,
      baselineKw: pt.predicted_kw ?? undefined,
      isPeak: pt.is_peak,
    }));
  }, [activeData.diurnal_profile]);

  // Diurnal trough calculation for compact footer
  const troughEntry = useMemo(() => {
    const raw = activeData.diurnal_profile || [];
    if (!raw.length) return null;
    return raw.reduce((min, p) => (p.actual_kw < min.actual_kw ? p : min), raw[0]);
  }, [activeData.diurnal_profile]);

  // Weekly Trend points: Weekday vs Weekend (48 slots) for the selected window
  const weeklyTrendPoints: DemandDataPoint[] = useMemo(() => {
    const raw = activeData.weekday_vs_weekend || [];
    return raw.map((pt) => ({
      timestamp: pt.time,
      hour: Math.floor(pt.slot / 2),
      label: pt.time,
      actualKw: pt.weekday_kw,
      baselineKw: pt.weekend_kw,
      isPeak: Math.floor(pt.slot / 2) >= 18 && Math.floor(pt.slot / 2) <= 21,
    }));
  }, [activeData.weekday_vs_weekend]);

  // Longitudinal table rows: all 14 rows if 'all' is selected, or filtered to selected window
  const longitudinalRows = useMemo(() => {
    const allRows = demandAnalysis?.window_trend || [];
    if (selectedWindow === 'all') {
      return allRows;
    }
    return allRows.filter((r) => r.window_id === selectedWindow);
  }, [demandAnalysis?.window_trend, selectedWindow]);

  return (
    <div className="workspace-container">
      {/* Workspace Header with Clean Single-Line Alignment */}
      <header className="workspace-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div className="workspace-header-title-row">
              <h1 className="workspace-title">Demand Snapshot</h1>
            </div>
            <p className="workspace-subtitle">
              Network demand for the selected period.
            </p>
          </div>

          {/* Clean Single-Line Right Header Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', paddingRight: '0.25rem' }}>
            {/* Global Observation Window Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <label
                htmlFor="observation-window-selector"
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
                id="observation-window-selector"
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
                  minWidth: '145px',
                }}
              >
                {AVAILABLE_WINDOWS.map((win) => (
                  <option key={win.id} value={win.id}>
                    {win.label}
                  </option>
                ))}
              </select>
            </div>

            {onNavigateOverview && (
              <button
                type="button"
                className="workspace-link-btn"
                onClick={() => onNavigateOverview('overview-demand')}
                style={{ fontSize: '0.82rem', padding: '0.35rem 0.65rem' }}
                title="Learn how demand analytics and diurnal profiles work on the Overview page"
              >
                <span>Learn about demand analytics</span>
                <ArrowRight size={14} />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Primary 4-Card KPI Strip: Equal Width, Equal Height, Large Dominant Values */}
      <section className="workspace-kpi-grid" aria-label="Key electricity demand metrics">
        {/* 1. Total Consumption */}
        <div className="workspace-kpi-card">
          <div className="workspace-kpi-header">
            <span className="workspace-kpi-label">TOTAL CONSUMPTION</span>
            <Zap size={16} className="workspace-kpi-icon" style={{ color: 'var(--accent-emerald)' }} />
          </div>
          <div className="workspace-kpi-value" style={{ color: 'var(--accent-emerald)' }}>
            {isLoading ? '...' : `${totalMWh.toFixed(1)} MWh`}
          </div>
          <p className="workspace-kpi-caption">
            {periodLabel}
          </p>
        </div>

        {/* 2. Average Demand */}
        <div className="workspace-kpi-card">
          <div className="workspace-kpi-header">
            <span className="workspace-kpi-label">AVERAGE DEMAND</span>
            <Activity size={16} className="workspace-kpi-icon" style={{ color: 'var(--accent-cyan)' }} />
          </div>
          <div className="workspace-kpi-value">
            {isLoading ? '...' : `${totalAvgMw.toFixed(3)} MW`}
          </div>
          <p className="workspace-kpi-caption">
            {avgLoadKw.toFixed(3)} kW/consumer · {selectedWindow === 'all' ? 'Across all windows' : selectedWindow}
          </p>
        </div>

        {/* 3. Peak Demand */}
        <div className="workspace-kpi-card">
          <div className="workspace-kpi-header">
            <span className="workspace-kpi-label">PEAK DEMAND</span>
            <TrendingUp size={16} className="workspace-kpi-icon" style={{ color: 'var(--accent-amber)' }} />
          </div>
          <div className="workspace-kpi-value" style={{ color: 'var(--accent-amber)' }}>
            {isLoading ? '...' : `${totalPeakMw.toFixed(3)} MW`}
          </div>
          <p className="workspace-kpi-caption" style={{ fontWeight: 600, color: 'var(--foreground)' }}>
            {peakTime} · {activeData.peak_demand_kw.toFixed(3)} kW/consumer
          </p>
        </div>

        {/* 4. Latest Observed Demand */}
        <div className="workspace-kpi-card">
          <div className="workspace-kpi-header">
            <span className="workspace-kpi-label">LATEST DEMAND</span>
            <Clock size={16} className="workspace-kpi-icon" style={{ color: 'var(--accent-indigo)' }} />
          </div>
          <div className="workspace-kpi-value">
            {isLoading ? '...' : `${latestDemandMw.toFixed(3)} MW`}
          </div>
          <p className="workspace-kpi-caption">
            {latestTimestamp.split('(')[0].trim()}
          </p>
        </div>
      </section>

      {/* Electricity Demand Trends Section with Spacious Analytical Layout */}
      <section className="workspace-card" aria-label="Demand trends visualization" style={{ padding: '1.75rem 2rem' }}>
        <div className="workspace-card-header" style={{ flexWrap: 'wrap', gap: '1.25rem', alignItems: 'center', marginBottom: '0.5rem' }}>
          <div>
            <h2 className="workspace-card-title" style={{ fontSize: '1.35rem' }}>Electricity Demand Trends</h2>
            <p className="workspace-card-subtitle" style={{ fontSize: '0.98rem', marginTop: '0.35rem' }}>
              Daily, weekly and longitudinal demand patterns across monitored consumers.
            </p>
          </div>

          {/* View Switcher: Daily, Weekly, Longitudinal */}
          <div role="tablist" style={{ display: 'flex', gap: '0.5rem' }}>
            {[
              { id: 'daily', label: 'Daily Trend (24h Diurnal)' },
              { id: 'weekly', label: 'Weekly Trend (Weekday vs Weekend)' },
              { id: 'longitudinal', label: selectedWindow === 'all' ? 'Longitudinal Trend (W01–W14)' : `Longitudinal (${selectedWindow})` },
            ].map((tab) => {
              const isActive = activeTrendTab === tab.id;
              return (
                <button
                  key={tab.id}
                  role="tab"
                  aria-selected={isActive}
                  type="button"
                  onClick={() => setActiveTrendTab(tab.id as typeof activeTrendTab)}
                  style={{
                    padding: '0.5rem 1.05rem',
                    fontSize: '0.85rem',
                    fontWeight: isActive ? 700 : 500,
                    borderRadius: 'var(--radius-sm)',
                    border: isActive ? '1px solid var(--accent-emerald)' : '1px solid var(--border)',
                    backgroundColor: isActive ? 'color-mix(in srgb, var(--accent-emerald) 18%, var(--surface))' : 'var(--surface-raised)',
                    color: isActive ? 'var(--foreground)' : 'var(--foreground-muted)',
                    cursor: 'pointer',
                    transition: 'all 150ms ease',
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab 1: Daily Trend (24-Hour Diurnal Load Curve) */}
        {activeTrendTab === 'daily' && (
          <div>
            <div className="workspace-chart-wrapper" style={{ padding: '1.25rem 0.5rem 1.5rem 0.5rem' }}>
              {isLoading ? (
                <div style={{ padding: '4.5rem', textAlign: 'center', color: 'var(--foreground-muted)', fontSize: '0.95rem' }}>
                  Loading daily telemetry...
                </div>
              ) : dailyTrendPoints.length > 0 ? (
                <LoadChart
                  data={dailyTrendPoints}
                  height={350}
                  unit="kW / consumer"
                  actualLabel="Observed Demand"
                  baselineLabel={selectedWindow === 'W01' ? undefined : 'Predicted Demand'}
                />
              ) : (
                <div style={{ padding: '4.5rem', textAlign: 'center', color: 'var(--foreground-muted)', fontSize: '0.95rem' }}>
                  Diurnal telemetry unavailable for selected window.
                </div>
              )}
            </div>
            {/* Spacious Analytical Summary Bar */}
            <div
              style={{
                padding: '1rem 1.35rem',
                backgroundColor: 'var(--surface-raised)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                display: 'flex',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '1rem',
                fontSize: '0.88rem',
                color: 'var(--foreground-muted)',
              }}
            >
              <span>Observation Period: <strong style={{ color: 'var(--foreground)' }}>{periodLabel}</strong></span>
              <span>Observed Peak: <strong style={{ color: 'var(--accent-amber)', fontFamily: 'var(--font-mono)' }}>{activeData.peak_demand_kw.toFixed(3)} kW/consumer</strong> ({peakTime})</span>
              {troughEntry && (
                <span>Observed Trough: <strong style={{ color: 'var(--foreground)', fontFamily: 'var(--font-mono)' }}>{troughEntry.actual_kw.toFixed(3)} kW/consumer</strong> ({troughEntry.time})</span>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Weekly Trend (Weekday vs Weekend Contrast) */}
        {activeTrendTab === 'weekly' && (
          <div>
            <div className="workspace-chart-wrapper" style={{ padding: '1.25rem 0.5rem 1.5rem 0.5rem' }}>
              {isLoading ? (
                <div style={{ padding: '4.5rem', textAlign: 'center', color: 'var(--foreground-muted)', fontSize: '0.95rem' }}>
                  Loading weekly telemetry...
                </div>
              ) : weeklyTrendPoints.length > 0 ? (
                <LoadChart
                  data={weeklyTrendPoints}
                  height={350}
                  unit="kW / consumer"
                  actualLabel="Weekday Demand"
                  baselineLabel="Weekend Demand"
                />
              ) : (
                <div style={{ padding: '4.5rem', textAlign: 'center', color: 'var(--foreground-muted)', fontSize: '0.95rem' }}>
                  Weekly telemetry unavailable for selected window.
                </div>
              )}
            </div>
            {/* Spacious Analytical Summary Bar */}
            <div
              style={{
                padding: '1rem 1.35rem',
                backgroundColor: 'var(--surface-raised)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                display: 'flex',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '1rem',
                fontSize: '0.88rem',
                color: 'var(--foreground-muted)',
              }}
            >
              <span>Observation Period: <strong style={{ color: 'var(--foreground)' }}>{periodLabel}</strong></span>
              <span>Trace Comparison: <strong style={{ color: 'var(--accent-emerald)' }}>Weekday Demand</strong> (Solid) · <strong style={{ color: 'var(--accent-amber)' }}>Weekend Demand</strong> (Dashed)</span>
              <span>Metric Scale: <strong style={{ color: 'var(--foreground)' }}>kW / consumer</strong></span>
            </div>
          </div>
        )}

        {/* Tab 3: Longitudinal Trend View — Spacious Presentation Table */}
        {activeTrendTab === 'longitudinal' && (
          <div style={{ padding: '0.5rem 0 1rem 0', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.90rem', marginTop: '0.5rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-strong)', textAlign: 'left', color: 'var(--foreground-subtle)', fontSize: '0.80rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  <th style={{ padding: '0.9rem 1.15rem' }}>Window</th>
                  <th style={{ padding: '0.9rem 1.15rem' }}>Calendar Period</th>
                  <th style={{ padding: '0.9rem 1.15rem' }}>Season</th>
                  <th style={{ padding: '0.9rem 1.15rem' }}>Mean Demand</th>
                  <th style={{ padding: '0.9rem 1.15rem' }}>Peak Demand</th>
                  <th style={{ padding: '0.9rem 1.15rem' }}>Peak / Avg</th>
                  <th style={{ padding: '0.9rem 1.15rem' }}>Anomalies</th>
                </tr>
              </thead>
              <tbody>
                {longitudinalRows.map((w, idx) => {
                  const isSelected = w.window_id === selectedWindow;
                  const isWinter = w.season.toLowerCase().includes('winter');
                  return (
                    <tr
                      key={w.window_id}
                      style={{
                        borderBottom: '1px solid var(--border)',
                        backgroundColor: isSelected
                          ? 'color-mix(in srgb, var(--accent-emerald) 12%, transparent)'
                          : idx % 2 === 0
                          ? 'transparent'
                          : 'color-mix(in srgb, var(--surface-raised) 45%, transparent)',
                        transition: 'background-color 120ms ease',
                      }}
                    >
                      <td style={{ padding: '0.95rem 1.15rem', fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.94rem', color: isSelected ? 'var(--accent-emerald)' : 'var(--foreground)' }}>
                        {w.window_id} {w.window_id === 'W14' ? '(Latest)' : ''}
                      </td>
                      <td style={{ padding: '0.95rem 1.15rem', fontFamily: 'var(--font-mono)', fontSize: '0.84rem', color: 'var(--foreground-muted)' }}>
                        {w.date_range}
                      </td>
                      <td style={{ padding: '0.95rem 1.15rem' }}>
                        <span
                          style={{
                            padding: '0.25rem 0.65rem',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: '0.80rem',
                            fontWeight: 600,
                            backgroundColor: 'var(--surface-raised)',
                            border: '1px solid var(--border)',
                            color: isWinter ? 'var(--accent-amber)' : 'var(--foreground-muted)',
                          }}
                        >
                          {w.season}
                        </span>
                      </td>
                      <td style={{ padding: '0.95rem 1.15rem', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                        {w.mean_load_kw.toFixed(3)} kW/consumer
                      </td>
                      <td style={{ padding: '0.95rem 1.15rem', fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--accent-amber)' }}>
                        {w.peak_load_kw.toFixed(3)} kW/consumer
                      </td>
                      <td style={{ padding: '0.95rem 1.15rem', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                        {w.p2a_ratio.toFixed(2)}x
                      </td>
                      <td style={{ padding: '0.95rem 1.15rem', fontFamily: 'var(--font-mono)' }}>
                        {w.flagged_anomalies > 0 ? (
                          <span style={{ color: 'var(--accent-rose)', fontWeight: 700, backgroundColor: 'color-mix(in srgb, var(--accent-rose) 12%, transparent)', padding: '0.2rem 0.55rem', borderRadius: 'var(--radius-sm)', border: '1px solid color-mix(in srgb, var(--accent-rose) 25%, transparent)' }}>
                            {w.flagged_anomalies} flags
                          </span>
                        ) : (
                          <span style={{ color: 'var(--foreground-subtle)' }}>0</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div style={{ padding: '1rem 0.5rem 0.25rem 0.5rem', fontSize: '0.84rem', color: 'var(--foreground-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>
                {selectedWindow === 'all'
                  ? 'Showing all 14 observation windows across monitored households.'
                  : `Showing metrics for Window ${selectedWindow}.`}
              </span>
              {selectedWindow !== 'all' && (
                <button
                  type="button"
                  onClick={() => setSelectedWindow('all')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--accent-emerald)',
                    cursor: 'pointer',
                    fontSize: '0.84rem',
                    fontWeight: 600,
                    textDecoration: 'underline',
                  }}
                >
                  View All Windows (W01–W14)
                </button>
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  );
};
