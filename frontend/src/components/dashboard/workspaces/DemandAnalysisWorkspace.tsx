import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { LoadChart } from '../../charts/LoadChart';
import {
  fetchDemandAnalysis,
  type DemandAnalysisData,
  type WindowDemandData,
} from '../../../services/api';
import type { DemandDataPoint } from '../../../types/energy';
import './Workspaces.css';

interface DemandAnalysisWorkspaceProps {
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

/** Default viewport width in days */
const DEFAULT_VIEWPORT_DAYS = 7;

export const DemandAnalysisWorkspace: React.FC<DemandAnalysisWorkspaceProps> = () => {
  const [selectedWindow, setSelectedWindow] = useState<string>('W14');
  const [data, setData] = useState<DemandAnalysisData | null>(null);
  const [activeTab, setActiveTab] = useState<'load_curve' | 'daily' | 'weekly' | 'longitudinal' | 'seasonal'>('daily');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Load Curve viewport state: index of the first visible day
  const [viewportStart, setViewportStart] = useState<number>(0);

  // Initial load: fetch demand analysis for W14 (which includes windows map)
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    fetchDemandAnalysis('W14')
      .then((res) => {
        if (!isMounted) return;
        setData(res);
        setIsLoading(false);
      })
      .catch((err) => {
        console.warn('Failed to load demand analysis data:', err);
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Map of all windows from precomputed cache
  const windowsMap: Record<string, WindowDemandData> = useMemo(() => {
    return data?.windows || {};
  }, [data?.windows]);

  // Active window data
  const activeWindowData = useMemo(() => {
    if (windowsMap[selectedWindow]) {
      return windowsMap[selectedWindow];
    }
    // Fallback to top-level data
    return {
      window_id: selectedWindow,
      window_name: selectedWindow === 'all' ? 'All Windows' : `Window ${selectedWindow}`,
      start_date: '2013-11-21',
      end_date: '2014-01-15',
      date_range: 'Nov 21, 2013 – Jan 15, 2014',
      n_households: 620,
      total_consumption_mwh: 200.3,
      avg_demand_kw: 0.2404,
      total_avg_demand_kw: 149.1,
      total_avg_demand_mw: 0.149,
      peak_demand_kw: 0.369,
      total_peak_demand_kw: 228.8,
      total_peak_demand_mw: 0.229,
      peak_time: '19:00',
      peak_timestamp: '19:00 · Evening Peak',
      latest_demand_kw: 0.2229,
      total_latest_demand_kw: 138.2,
      total_latest_demand_mw: 0.138,
      latest_timestamp: '23:30 · Jan 15, 2014',
      diurnal_profile: data?.diurnal_profile || [],
      weekday_vs_weekend: data?.weekday_vs_weekend || [],
      load_curve: data?.load_curve || [],
    };
  }, [windowsMap, selectedWindow, data]);

  // Reset viewport when window changes
  useEffect(() => {
    setViewportStart(0);
  }, [selectedWindow]);

  // Period label
  const periodLabel = useMemo(() => {
    if (selectedWindow === 'all') {
      return `All Windows · ${activeWindowData.date_range}`;
    }
    return `Window ${selectedWindow} · ${activeWindowData.date_range}`;
  }, [selectedWindow, activeWindowData.date_range]);

  // FULL Load Curve data (all observations in the window)
  const fullLoadCurve = useMemo(() => {
    return activeWindowData.load_curve || [];
  }, [activeWindowData.load_curve]);

  // Unique days in the full load curve
  const uniqueDays = useMemo(() => {
    const days = new Set<string>();
    fullLoadCurve.forEach((pt) => days.add(pt.day));
    return Array.from(days).sort();
  }, [fullLoadCurve]);

  const totalDays = uniqueDays.length;
  const viewportDays = Math.min(DEFAULT_VIEWPORT_DAYS, totalDays);
  const maxViewportStart = Math.max(0, totalDays - viewportDays);

  // Visible load curve points (within viewport)
  const visibleLoadCurvePoints: DemandDataPoint[] = useMemo(() => {
    if (fullLoadCurve.length === 0) return [];
    const visibleDays = new Set(uniqueDays.slice(viewportStart, viewportStart + viewportDays));
    const filtered = fullLoadCurve.filter((pt) => visibleDays.has(pt.day));
    return filtered.map((pt) => ({
      timestamp: pt.label || pt.time,
      hour: pt.half_hour ? Math.floor(pt.half_hour / 2) : 0,
      label: pt.label || pt.time,
      actualKw: pt.actual_kw,
      baselineKw: pt.predicted_kw ?? undefined,
      isPeak: pt.is_peak,
    }));
  }, [fullLoadCurve, uniqueDays, viewportStart, viewportDays]);

  // Visible date range label
  const visibleDateRange = useMemo(() => {
    if (uniqueDays.length === 0) return '';
    const startDay = uniqueDays[viewportStart];
    const endDay = uniqueDays[Math.min(viewportStart + viewportDays - 1, uniqueDays.length - 1)];
    const formatDay = (d: string) => {
      try {
        const dt = new Date(d + 'T00:00:00');
        return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      } catch {
        return d;
      }
    };
    return `${formatDay(startDay)} – ${formatDay(endDay)}`;
  }, [uniqueDays, viewportStart, viewportDays]);

  // Viewport navigation handlers
  const canGoBack = viewportStart > 0;
  const canGoForward = viewportStart < maxViewportStart;
  const goBack = useCallback(() => setViewportStart((v) => Math.max(0, v - viewportDays)), [viewportDays]);
  const goForward = useCallback(() => setViewportStart((v) => Math.min(maxViewportStart, v + viewportDays)), [maxViewportStart, viewportDays]);

  // VIEW 2: Typical 24-Hour Diurnal Profile Points (48 half-hour slots)
  const dailyProfilePoints: DemandDataPoint[] = useMemo(() => {
    const raw = activeWindowData.diurnal_profile || [];
    return raw.map((pt) => ({
      timestamp: pt.time,
      hour: Math.floor(pt.slot / 2),
      label: pt.time,
      actualKw: pt.actual_kw,
      baselineKw: pt.predicted_kw ?? undefined,
      isPeak: pt.is_peak,
    }));
  }, [activeWindowData.diurnal_profile]);

  // Diurnal metrics
  const peakEntry = useMemo(() => {
    const raw = activeWindowData.diurnal_profile || [];
    if (!raw.length) return null;
    return raw.reduce((max, p) => (p.actual_kw > max.actual_kw ? p : max), raw[0]);
  }, [activeWindowData.diurnal_profile]);

  const troughEntry = useMemo(() => {
    const raw = activeWindowData.diurnal_profile || [];
    if (!raw.length) return null;
    return raw.reduce((min, p) => (p.actual_kw < min.actual_kw ? p : min), raw[0]);
  }, [activeWindowData.diurnal_profile]);

  const peakToAverageRatio = useMemo(() => {
    if (!peakEntry || !activeWindowData.avg_demand_kw) return 1.54;
    return (peakEntry.actual_kw / activeWindowData.avg_demand_kw).toFixed(2);
  }, [peakEntry, activeWindowData.avg_demand_kw]);

  // VIEW 3: Weekly Profile Points (Weekday vs Weekend Contrast across 48 half-hour slots)
  const weeklyProfilePoints: DemandDataPoint[] = useMemo(() => {
    const raw = activeWindowData.weekday_vs_weekend || [];
    return raw.map((pt) => ({
      timestamp: pt.time,
      hour: Math.floor(pt.slot / 2),
      label: pt.time,
      actualKw: pt.weekday_kw,
      baselineKw: pt.weekend_kw,
      isPeak: Math.floor(pt.slot / 2) >= 18 && Math.floor(pt.slot / 2) <= 21,
    }));
  }, [activeWindowData.weekday_vs_weekend]);

  // Has forecast available
  const hasForecast = selectedWindow !== 'W01';

  // Seasonal comparison data with bar chart dimensions
  const seasonalData = useMemo(() => data?.seasonal_comparison || [], [data?.seasonal_comparison]);
  const maxSeasonalDemand = useMemo(() => {
    if (!seasonalData.length) return 0.3;
    return Math.max(...seasonalData.map((s) => s.peak_load_kw)) * 1.15;
  }, [seasonalData]);

  return (
    <div className="workspace-container">
      {/* Workspace Header */}
      <header className="workspace-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div className="workspace-header-title-row">
              <h1 className="workspace-title">Demand Analysis</h1>
            </div>
            <p className="workspace-subtitle">
              Explore demand patterns across time and observation windows.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            {/* Observation Window Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', paddingRight: '0.25rem' }}>
              <label
                htmlFor="demand-analysis-window-selector"
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
                id="demand-analysis-window-selector"
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
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <div
        role="tablist"
        aria-label="Demand Analysis Views"
        style={{
          display: 'flex',
          gap: '0.5rem',
          borderBottom: '1px solid var(--border)',
          paddingBottom: '0.85rem',
          flexWrap: 'wrap',
          marginTop: '0.25rem',
        }}
      >
        {[
          { id: 'load_curve', label: 'Load Curve' },
          { id: 'daily', label: 'Daily Profile' },
          { id: 'weekly', label: 'Weekly Profile' },
          { id: 'longitudinal', label: 'Longitudinal' },
          { id: 'seasonal', label: 'Seasonal' },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              type="button"
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              style={{
                padding: '0.5rem 1rem',
                fontSize: '0.82rem',
                fontWeight: isActive ? 700 : 500,
                borderRadius: 'var(--radius-sm)',
                border: isActive
                  ? '1px solid var(--accent-emerald)'
                  : '1px solid var(--border)',
                backgroundColor: isActive
                  ? 'color-mix(in srgb, var(--accent-emerald) 18%, var(--surface))'
                  : 'var(--surface)',
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

      {/* VIEW 1: LOAD CURVE WITH VIEWPORT/SLIDER */}
      {activeTab === 'load_curve' && (
        <section className="workspace-card" aria-label="Continuous half-hourly load curve">
          <div className="workspace-card-header">
            <div style={{ flex: 1 }}>
              <h2 className="workspace-card-title">Continuous Half-Hourly Load Curve</h2>
              <p className="workspace-card-subtitle">
                Observed and forecast demand across the selected period.
              </p>
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--foreground-muted)', fontFamily: 'var(--font-mono)', textAlign: 'right' }}>
              {periodLabel}
            </div>
          </div>

          {/* Viewport Navigation */}
          {totalDays > viewportDays && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.5rem 1.25rem',
                borderBottom: '1px solid var(--border)',
                gap: '0.75rem',
              }}
            >
              <button
                type="button"
                onClick={goBack}
                disabled={!canGoBack}
                style={{
                  padding: '0.3rem 0.7rem',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: canGoBack ? 'var(--surface-raised)' : 'transparent',
                  color: canGoBack ? 'var(--foreground)' : 'var(--foreground-subtle)',
                  cursor: canGoBack ? 'pointer' : 'default',
                  opacity: canGoBack ? 1 : 0.4,
                  transition: 'all 150ms ease',
                }}
              >
                ← Previous
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
                <div
                  style={{
                    fontSize: '0.8rem',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 600,
                    color: 'var(--foreground)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {visibleDateRange}
                </div>
                {/* Slider / Range input */}
                <input
                  type="range"
                  min={0}
                  max={maxViewportStart}
                  value={viewportStart}
                  onChange={(e) => setViewportStart(Number(e.target.value))}
                  style={{
                    flex: 1,
                    accentColor: 'var(--accent-emerald)',
                    height: '4px',
                    cursor: 'pointer',
                  }}
                  aria-label="Load curve viewport position"
                />
                <span
                  style={{
                    fontSize: '0.72rem',
                    color: 'var(--foreground-subtle)',
                    fontFamily: 'var(--font-mono)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {viewportStart + 1}–{Math.min(viewportStart + viewportDays, totalDays)} of {totalDays} days
                </span>
              </div>

              <button
                type="button"
                onClick={goForward}
                disabled={!canGoForward}
                style={{
                  padding: '0.3rem 0.7rem',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: canGoForward ? 'var(--surface-raised)' : 'transparent',
                  color: canGoForward ? 'var(--foreground)' : 'var(--foreground-subtle)',
                  cursor: canGoForward ? 'pointer' : 'default',
                  opacity: canGoForward ? 1 : 0.4,
                  transition: 'all 150ms ease',
                }}
              >
                Next →
              </button>
            </div>
          )}

          <div className="workspace-chart-wrapper" style={{ padding: '0.5rem 1rem 1rem 1rem' }}>
            {isLoading ? (
              <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--foreground-muted)' }}>
                Loading load curve data...
              </div>
            ) : visibleLoadCurvePoints.length > 0 ? (
              <LoadChart
                data={visibleLoadCurvePoints}
                height={340}
                unit="kW / consumer"
                actualLabel="Observed Demand"
                baselineLabel={hasForecast ? 'Day-Ahead Forecast' : undefined}
              />
            ) : (
              <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--foreground-muted)' }}>
                Load curve data unavailable for selected window.
              </div>
            )}
          </div>
          <div style={{ padding: '0.85rem 1.25rem', backgroundColor: 'var(--surface-raised)', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', fontSize: '0.8rem', color: 'var(--foreground-muted)' }}>
            <span>Period: <strong>{periodLabel}</strong></span>
            <span>Visible: <strong>{visibleDateRange || '–'}</strong></span>
            <span>Scale: <strong>kW / consumer</strong></span>
          </div>
        </section>
      )}

      {/* VIEW 2: DAILY PROFILE */}
      {activeTab === 'daily' && (
        <section className="workspace-card" aria-label="Typical 24-hour demand profile">
          <div className="workspace-card-header">
            <div>
              <h2 className="workspace-card-title">Typical 24-Hour Demand Profile</h2>
              <p className="workspace-card-subtitle">
                Average demand across 48 half-hour time slots.
              </p>
            </div>
          </div>
          <div className="workspace-chart-wrapper" style={{ padding: '0.5rem 1rem 1rem 1rem' }}>
            {isLoading ? (
              <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--foreground-muted)' }}>
                Loading diurnal profile...
              </div>
            ) : dailyProfilePoints.length > 0 ? (
              <LoadChart
                data={dailyProfilePoints}
                height={340}
                unit="kW / consumer"
                actualLabel="Observed Demand"
                baselineLabel={hasForecast ? 'Day-Ahead Forecast' : undefined}
              />
            ) : (
              <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--foreground-muted)' }}>
                Diurnal profile unavailable for selected window.
              </div>
            )}
          </div>
          <div style={{ padding: '0.85rem 1.25rem', backgroundColor: 'var(--surface-raised)', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', fontSize: '0.8rem', color: 'var(--foreground-muted)' }}>
            <span>Period: <strong>{periodLabel}</strong></span>
            <span>Peak: <strong style={{ color: 'var(--accent-amber)' }}>{peakEntry ? `${peakEntry.actual_kw.toFixed(3)} kW / consumer · ${peakEntry.time}` : '–'}</strong></span>
            <span>Trough: <strong>{troughEntry ? `${troughEntry.actual_kw.toFixed(3)} kW / consumer · ${troughEntry.time}` : '–'}</strong></span>
            <span>Peak-to-Average: <strong>{peakToAverageRatio}×</strong></span>
          </div>
        </section>
      )}

      {/* VIEW 3: WEEKLY PROFILE (WEEKDAY VS WEEKEND) */}
      {activeTab === 'weekly' && (
        <section className="workspace-card" aria-label="Weekday vs weekend demand profile">
          <div className="workspace-card-header">
            <div>
              <h2 className="workspace-card-title">Weekday vs Weekend Demand</h2>
              <p className="workspace-card-subtitle">
                Average demand across weekdays and weekends.
              </p>
            </div>
          </div>
          <div className="workspace-chart-wrapper" style={{ padding: '0.5rem 1rem 1rem 1rem' }}>
            {isLoading ? (
              <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--foreground-muted)' }}>
                Loading weekly profile...
              </div>
            ) : weeklyProfilePoints.length > 0 ? (
              <LoadChart
                data={weeklyProfilePoints}
                height={340}
                unit="kW / consumer"
                actualLabel="Weekday Demand"
                baselineLabel="Weekend Demand"
              />
            ) : (
              <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--foreground-muted)' }}>
                Weekly profile unavailable for selected window.
              </div>
            )}
          </div>
          <div style={{ padding: '0.85rem 1.25rem', backgroundColor: 'var(--surface-raised)', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', fontSize: '0.8rem', color: 'var(--foreground-muted)' }}>
            <span>Period: <strong>{periodLabel}</strong></span>
            <span>Solid: <strong>Weekday Demand</strong> · Dashed: <strong>Weekend Demand</strong></span>
            <span>Unit: <strong>kW / consumer</strong></span>
          </div>
        </section>
      )}

      {/* VIEW 4: LONGITUDINAL ANALYSIS */}
      {activeTab === 'longitudinal' && (
        <section className="workspace-card" aria-label="Longitudinal window comparison">
          <div className="workspace-card-header">
            <div>
              <h2 className="workspace-card-title">Longitudinal Analysis (W01–W14)</h2>
              <p className="workspace-card-subtitle">
                Demand metrics across observation windows.
              </p>
            </div>
          </div>
          <div style={{ padding: '0 1.25rem 1.25rem 1.25rem', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.90rem', marginTop: '0.5rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left', color: 'var(--foreground-subtle)' }}>
                  <th style={{ padding: '0.90rem 1.15rem', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Window</th>
                  <th style={{ padding: '0.90rem 1.15rem', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Calendar Period</th>
                  <th style={{ padding: '0.90rem 1.15rem', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Season</th>
                  <th style={{ padding: '0.90rem 1.15rem', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Mean Demand</th>
                  <th style={{ padding: '0.90rem 1.15rem', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Peak Demand</th>
                  <th style={{ padding: '0.90rem 1.15rem', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Peak / Avg</th>
                  <th style={{ padding: '0.90rem 1.15rem', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Day / Night</th>
                  <th style={{ padding: '0.90rem 1.15rem', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Anomalies</th>
                </tr>
              </thead>
              <tbody>
                {(data?.window_trend || []).map((w, i) => {
                  const isSelected = w.window_id === selectedWindow;
                  const isWinter = w.season.toLowerCase().includes('winter');
                  return (
                    <tr
                      key={w.window_id}
                      style={{
                        borderBottom: '1px solid var(--border)',
                        backgroundColor: isSelected
                          ? 'color-mix(in srgb, var(--accent-emerald) 12%, transparent)'
                          : i % 2 === 0
                          ? 'transparent'
                          : 'color-mix(in srgb, var(--surface-raised) 50%, transparent)',
                        transition: 'background-color 120ms ease',
                      }}
                    >
                      <td style={{ padding: '0.95rem 1.15rem', fontFamily: 'var(--font-mono)', fontWeight: 700, color: isSelected ? 'var(--accent-emerald)' : 'var(--foreground)' }}>
                        {w.window_id} {w.window_id === 'W14' ? '(Latest)' : ''}
                      </td>
                      <td style={{ padding: '0.95rem 1.15rem', fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: 'var(--foreground-muted)' }}>
                        {w.date_range}
                      </td>
                      <td style={{ padding: '0.95rem 1.15rem' }}>
                        <span
                          style={{
                            padding: '0.2rem 0.55rem',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: '0.76rem',
                            backgroundColor: 'var(--surface-raised)',
                            border: '1px solid var(--border)',
                            color: isWinter ? 'var(--accent-amber)' : 'var(--foreground-muted)',
                            fontWeight: 500,
                          }}
                        >
                          {w.season}
                        </span>
                      </td>
                      <td style={{ padding: '0.95rem 1.15rem', fontFamily: 'var(--font-mono)', fontWeight: 500 }}>
                        {w.mean_load_kw.toFixed(3)} kW / consumer
                      </td>
                      <td style={{ padding: '0.95rem 1.15rem', fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--accent-amber)' }}>
                        {w.peak_load_kw.toFixed(3)} kW / consumer
                      </td>
                      <td style={{ padding: '0.95rem 1.15rem', fontFamily: 'var(--font-mono)' }}>
                        {w.p2a_ratio.toFixed(2)}×
                      </td>
                      <td style={{ padding: '0.95rem 1.15rem', fontFamily: 'var(--font-mono)' }}>
                        {w.day_night_ratio.toFixed(2)}
                      </td>
                      <td style={{ padding: '0.95rem 1.15rem', fontFamily: 'var(--font-mono)' }}>
                        {w.flagged_anomalies > 0 ? (
                          <span style={{ color: 'var(--accent-rose)', fontWeight: 600 }}>
                            {w.flagged_anomalies}
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
          </div>
        </section>
      )}

      {/* VIEW 5: SEASONAL COMPARISON — IMPROVED DENSITY */}
      {activeTab === 'seasonal' && (
        <section className="workspace-card" aria-label="Seasonal demand comparison">
          <div className="workspace-card-header">
            <div>
              <h2 className="workspace-card-title">Seasonal Demand Comparison</h2>
              <p className="workspace-card-subtitle">
                How demand differs across seasons.
              </p>
            </div>
          </div>

          {/* Seasonal Summary Panels — 4 across */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', padding: '1.25rem 1.25rem 0.75rem 1.25rem' }}>
            {seasonalData.map((s) => (
              <div
                key={s.season}
                style={{
                  padding: '1.15rem 1.25rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--surface-raised)',
                  border: '1px solid var(--border)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--foreground)' }}>
                    {s.season}
                  </h3>
                  <span style={{ fontSize: '0.75rem', color: 'var(--foreground-subtle)', fontFamily: 'var(--font-mono)' }}>
                    {s.window_count} {s.window_count === 1 ? 'window' : 'windows'}
                  </span>
                </div>

                <div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--foreground-subtle)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Average Demand
                  </span>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.35rem', fontWeight: 700, color: 'var(--foreground)', marginTop: '0.15rem' }}>
                    {s.mean_load_kw.toFixed(3)} <span style={{ fontSize: '0.80rem', fontWeight: 500, color: 'var(--foreground-muted)' }}>kW / consumer</span>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem', borderTop: '1px solid var(--border)', paddingTop: '0.55rem' }}>
                  <span style={{ color: 'var(--foreground-muted)' }}>Peak</span>
                  <strong style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-amber)' }}>
                    {s.peak_load_kw.toFixed(3)} kW
                  </strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem' }}>
                  <span style={{ color: 'var(--foreground-muted)' }}>Peak / Avg</span>
                  <strong style={{ fontFamily: 'var(--font-mono)' }}>
                    {s.p2a_ratio.toFixed(2)}×
                  </strong>
                </div>
              </div>
            ))}
          </div>

          {/* Seasonal Comparison Bar Chart — Professional Analytical Styling */}
          {seasonalData.length > 0 && (
            <div style={{ padding: '1rem 1.5rem 1.5rem 1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <h3 style={{ fontSize: '0.90rem', fontWeight: 600, color: 'var(--foreground-muted)', margin: 0 }}>
                  Seasonal Average vs Peak Demand (kW / consumer)
                </h3>
                {/* Legend */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', fontSize: '0.80rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <span style={{ width: '12px', height: '12px', backgroundColor: 'var(--accent-emerald)', borderRadius: '2px', opacity: 0.85 }} />
                    <span style={{ color: 'var(--foreground-muted)' }}>Average Demand</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <span style={{ width: '12px', height: '12px', backgroundColor: 'var(--accent-amber)', borderRadius: '2px', opacity: 0.85 }} />
                    <span style={{ color: 'var(--foreground-muted)' }}>Peak Demand</span>
                  </div>
                </div>
              </div>

              {/* Chart container with horizontal grid lines */}
              <div
                style={{
                  position: 'relative',
                  backgroundColor: 'var(--surface-raised)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1.5rem 2rem 1.25rem 3.5rem',
                  height: '240px',
                  display: 'flex',
                  alignItems: 'flex-end',
                }}
              >
                {/* Y-axis gridlines and labels */}
                {[1.0, 0.75, 0.5, 0.25, 0].map((frac) => {
                  const val = (maxSeasonalDemand * frac).toFixed(2);
                  const bottomPct = frac * 100;
                  return (
                    <div
                      key={frac}
                      style={{
                        position: 'absolute',
                        left: 0,
                        right: 0,
                        bottom: `${bottomPct * 0.75 + 18}%`,
                        display: 'flex',
                        alignItems: 'center',
                        pointerEvents: 'none',
                      }}
                    >
                      <span
                        style={{
                          width: '3.2rem',
                          textAlign: 'right',
                          paddingRight: '0.5rem',
                          fontSize: '0.72rem',
                          fontFamily: 'var(--font-mono)',
                          color: 'var(--foreground-subtle)',
                        }}
                      >
                        {val}
                      </span>
                      <div
                        style={{
                          flex: 1,
                          borderTop: frac === 0 ? '1px solid var(--border)' : '1px dashed color-mix(in srgb, var(--border) 60%, transparent)',
                        }}
                      />
                    </div>
                  );
                })}

                {/* Bars group */}
                <div style={{ display: 'flex', width: '100%', justifyContent: 'space-around', alignItems: 'flex-end', height: '175px', zIndex: 1 }}>
                  {seasonalData.map((s) => {
                    const avgHeight = Math.max(8, (s.mean_load_kw / maxSeasonalDemand) * 160);
                    const peakHeight = Math.max(8, (s.peak_load_kw / maxSeasonalDemand) * 160);
                    return (
                      <div key={s.season} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', height: '160px' }}>
                          {/* Average bar */}
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.74rem', fontFamily: 'var(--font-mono)', color: 'var(--foreground-muted)', marginBottom: '4px' }}>
                              {s.mean_load_kw.toFixed(3)}
                            </span>
                            <div
                              style={{
                                width: '32px',
                                height: `${avgHeight}px`,
                                backgroundColor: 'var(--accent-emerald)',
                                borderRadius: '3px 3px 0 0',
                                opacity: 0.88,
                                transition: 'height 250ms ease',
                              }}
                              title={`${s.season} Average: ${s.mean_load_kw.toFixed(3)} kW / consumer`}
                            />
                          </div>
                          {/* Peak bar */}
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.74rem', fontFamily: 'var(--font-mono)', color: 'var(--accent-amber)', marginBottom: '4px' }}>
                              {s.peak_load_kw.toFixed(3)}
                            </span>
                            <div
                              style={{
                                width: '32px',
                                height: `${peakHeight}px`,
                                backgroundColor: 'var(--accent-amber)',
                                borderRadius: '3px 3px 0 0',
                                opacity: 0.88,
                                transition: 'height 250ms ease',
                              }}
                              title={`${s.season} Peak: ${s.peak_load_kw.toFixed(3)} kW / consumer`}
                            />
                          </div>
                        </div>
                        <span style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--foreground)', marginTop: '0.25rem' }}>
                          {s.season}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
};
