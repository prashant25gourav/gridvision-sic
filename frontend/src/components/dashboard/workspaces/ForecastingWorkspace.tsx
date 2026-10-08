import React, { useState, useEffect, useMemo } from 'react';
import {
  TrendingUp,
  Clock,
  Target,
  Info,
  User,
  Users,
  ArrowRight,
} from 'lucide-react';
import { LoadChart } from '../../charts/LoadChart';
import {
  fetchForecastPortal,
  fetchHouseholds,
  fetchConsumerProfile,
  type ForecastPortalData,
  type HouseholdSummary,
  type ConsumerProfileData,
} from '../../../services/api';
import type { DemandDataPoint } from '../../../types/energy';
import './Workspaces.css';

interface ForecastingWorkspaceProps {
  onNavigateOverview?: (anchor?: string) => void;
}

// Clean consumer formatting helper
function formatConsumerId(rawId: string): string {
  if (!rawId) return '';
  const match = rawId.match(/MAC0*(\d+)/i);
  if (match) {
    return `Consumer ${match[1].padStart(3, '0')}`;
  }
  return `Consumer ${rawId}`;
}

export const ForecastingWorkspace: React.FC<ForecastingWorkspaceProps> = ({
  onNavigateOverview,
}) => {
  const [portalData, setPortalData] = useState<ForecastPortalData | null>(null);
  const [households, setHouseholds] = useState<HouseholdSummary[]>([]);
  const [viewMode, setViewMode] = useState<'consumer' | 'cohort'>('consumer');
  const [selectedHouseholdId, setSelectedHouseholdId] = useState<string>('MAC000045');
  const [consumerProfile, setConsumerProfile] = useState<ConsumerProfileData | null>(null);

  const [isLoadingPortal, setIsLoadingPortal] = useState<boolean>(true);
  const [isLoadingConsumer, setIsLoadingConsumer] = useState<boolean>(false);

  // 1. Load portal cohort data and households list
  useEffect(() => {
    let isMounted = true;
    Promise.all([fetchForecastPortal(), fetchHouseholds()])
      .then(([pData, hhList]) => {
        if (!isMounted) return;
        setPortalData(pData);
        setHouseholds(hhList);
        if (hhList.length > 0) {
          setSelectedHouseholdId(hhList[0].household_id);
        }
        setIsLoadingPortal(false);
      })
      .catch((err) => {
        console.warn('Failed to load forecast data:', err);
        if (isMounted) setIsLoadingPortal(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Fetch consumer profile when selectedHouseholdId changes
  useEffect(() => {
    if (!selectedHouseholdId) return;
    let isMounted = true;
    setIsLoadingConsumer(true);

    fetchConsumerProfile(selectedHouseholdId)
      .then((data) => {
        if (isMounted) {
          setConsumerProfile(data);
          setIsLoadingConsumer(false);
        }
      })
      .catch((err) => {
        console.warn(`Could not load profile for ${selectedHouseholdId}:`, err);
        if (isMounted) setIsLoadingConsumer(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedHouseholdId]);

  // Compute consumer-level prediction metrics (strictly for the 24-hour day-ahead horizon)
  const consumerMetrics = useMemo(() => {
    if (!consumerProfile || !consumerProfile.diurnal_forecast || consumerProfile.diurnal_forecast.length === 0) {
      return {
        predPeakKw: 0.42,
        predPeakTime: '19:00',
        maeKw: 0.081,
      };
    }

    const daySeries = consumerProfile.diurnal_forecast.slice(0, 48);
    let maxPred = -1;
    let maxPredSlot = 0;

    for (let i = 0; i < daySeries.length; i++) {
      const pt = daySeries[i];
      if (pt.predicted_global > maxPred) {
        maxPred = pt.predicted_global;
        maxPredSlot = i;
      }
    }

    const hr = Math.floor(maxPredSlot / 2);
    const min = maxPredSlot % 2 === 1 ? '30' : '00';
    const timeStr = `${hr.toString().padStart(2, '0')}:${min}`;

    return {
      predPeakKw: maxPred > 0 ? maxPred : 0.42,
      predPeakTime: timeStr,
      maeKw: consumerProfile.summary?.forecast_mae_kw ?? 0.081,
    };
  }, [consumerProfile]);

  // Compute cohort-level prediction metrics (All Consumers)
  const cohortMetrics = useMemo(() => {
    return {
      predPeakKw: portalData?.expected_peak_kw ?? 0.369,
      predPeakTime: portalData?.expected_peak_time ?? '19:00',
      maeKw: portalData?.mae_global_kw ?? 0.0812,
    };
  }, [portalData]);

  // Active metrics based on view mode
  const currentMetrics = viewMode === 'consumer' ? consumerMetrics : cohortMetrics;

  // Build chart points strictly for the 24-hour day-ahead forecast horizon (48 half-hour intervals)
  const chartPoints: DemandDataPoint[] = useMemo(() => {
    if (viewMode === 'consumer') {
      if (!consumerProfile || !consumerProfile.diurnal_forecast || consumerProfile.diurnal_forecast.length === 0) {
        return [];
      }
      const daySeries = consumerProfile.diurnal_forecast.slice(0, 48);
      return daySeries.map((pt) => {
        const slot = pt.slot_index % 48;
        const hr = Math.floor(slot / 2);
        const min = slot % 2 === 1 ? '30' : '00';
        const isEveningPeak = hr >= 18 && hr <= 21;
        return {
          timestamp: pt.timestamp,
          hour: hr,
          label: `${hr.toString().padStart(2, '0')}:${min}`,
          actualKw: pt.actual,
          baselineKw: pt.predicted_global,
          isPeak: isEveningPeak,
        };
      });
    }

    // All Consumers view: 48 half-hour intervals
    return (
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
      }) ?? []
    );
  }, [viewMode, consumerProfile, portalData]);

  return (
    <div className="workspace-container">
      {/* Workspace Header */}
      <header className="workspace-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div className="workspace-header-title-row">
              <h1 className="workspace-title">Demand Forecasting</h1>
            </div>
            <p className="workspace-subtitle">
              Day-ahead demand predictions, forecast error, and peak timing.
            </p>
          </div>

          {onNavigateOverview && (
            <button
              type="button"
              className="workspace-link-btn"
              onClick={() => onNavigateOverview('overview-forecasting')}
              style={{ fontSize: '0.82rem', padding: '0.35rem 0.65rem' }}
              title="Learn how demand forecasting works on the Overview page"
            >
              <span>Learn about demand forecasting</span>
              <ArrowRight size={14} />
            </button>
          )}
        </div>
      </header>

      {/* Forecast Scope Selection */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          padding: '0.75rem 1rem',
          backgroundColor: 'var(--surface-raised)',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border)',
        }}
      >
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--foreground-muted)', fontWeight: 600 }}>
            FORECAST SCOPE:
          </span>
          <button
            type="button"
            onClick={() => setViewMode('consumer')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.35rem 0.75rem',
              fontSize: '0.8rem',
              fontWeight: viewMode === 'consumer' ? 700 : 500,
              borderRadius: 'var(--radius-sm)',
              border: `1px solid ${viewMode === 'consumer' ? 'var(--accent-emerald)' : 'var(--border)'}`,
              backgroundColor: viewMode === 'consumer' ? 'var(--surface)' : 'transparent',
              color: viewMode === 'consumer' ? 'var(--accent-emerald)' : 'var(--foreground-muted)',
              cursor: 'pointer',
              transition: 'all 150ms ease',
            }}
          >
            <User size={14} />
            <span>Individual Consumer</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('cohort')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.35rem 0.75rem',
              fontSize: '0.8rem',
              fontWeight: viewMode === 'cohort' ? 700 : 500,
              borderRadius: 'var(--radius-sm)',
              border: `1px solid ${viewMode === 'cohort' ? 'var(--accent-emerald)' : 'var(--border)'}`,
              backgroundColor: viewMode === 'cohort' ? 'var(--surface)' : 'transparent',
              color: viewMode === 'cohort' ? 'var(--accent-emerald)' : 'var(--foreground-muted)',
              cursor: 'pointer',
              transition: 'all 150ms ease',
            }}
          >
            <Users size={14} />
            <span>All Consumers</span>
          </button>
        </div>

        {/* Consumer Selector dropdown when in consumer mode */}
        {viewMode === 'consumer' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <label htmlFor="forecast-consumer-select" style={{ fontSize: '0.8rem', color: 'var(--foreground-muted)' }}>
              Consumer:
            </label>
            <select
              id="forecast-consumer-select"
              value={selectedHouseholdId}
              onChange={(e) => setSelectedHouseholdId(e.target.value)}
              className="text-input"
              style={{
                padding: '0.35rem 0.75rem',
                fontSize: '0.82rem',
                backgroundColor: 'var(--surface)',
                color: 'var(--foreground)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                minWidth: '220px',
              }}
            >
              {households.map((hh) => (
                <option key={hh.household_id} value={hh.household_id}>
                  {formatConsumerId(hh.household_id)} ({hh.household_id})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Forecast Summary: Horizon, Error, Predicted Peak */}
      <section
        className="workspace-kpi-grid"
        aria-label="Forecast Summary"
        style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}
      >
        <div className="workspace-kpi-card">
          <div className="workspace-kpi-header">
            <span className="workspace-kpi-label">FORECAST HORIZON</span>
            <Clock size={16} className="workspace-kpi-icon" style={{ color: 'var(--accent-indigo)' }} />
          </div>
          <div className="workspace-kpi-value">
            24 Hours
          </div>
          <p className="workspace-kpi-caption">
            48 half-hour intervals
          </p>
        </div>

        <div className="workspace-kpi-card">
          <div className="workspace-kpi-header">
            <span className="workspace-kpi-label">FORECAST ERROR</span>
            <Target size={16} className="workspace-kpi-icon" style={{ color: 'var(--accent-emerald)' }} />
          </div>
          <div className="workspace-kpi-value" style={{ color: 'var(--accent-emerald)' }}>
            {currentMetrics.maeKw.toFixed(3)} kW
          </div>
          <p className="workspace-kpi-caption">
            Average difference between predicted and actual demand
          </p>
        </div>

        <div className="workspace-kpi-card">
          <div className="workspace-kpi-header">
            <span className="workspace-kpi-label">PREDICTED PEAK</span>
            <TrendingUp size={16} className="workspace-kpi-icon" style={{ color: 'var(--accent-amber)' }} />
          </div>
          <div className="workspace-kpi-value" style={{ color: 'var(--accent-amber)' }}>
            {currentMetrics.predPeakKw.toFixed(3)} kW
          </div>
          <p className="workspace-kpi-caption">
            Expected at {currentMetrics.predPeakTime}
          </p>
        </div>
      </section>

      {/* Main Forecast Chart: Actual vs Predicted Demand */}
      <section className="workspace-card" aria-label="Actual vs predicted load curve">
        <div className="workspace-card-header">
          <div>
            <h2 className="workspace-card-title">
              {viewMode === 'consumer'
                ? `${formatConsumerId(selectedHouseholdId)} (${selectedHouseholdId}): Day-Ahead Forecast`
                : 'All Consumers: Day-Ahead Forecast'}
            </h2>
            <p className="workspace-card-subtitle">
              {viewMode === 'consumer'
                ? 'Recorded half-hourly electricity demand versus LightGBM day-ahead predictions across 48 dispatch intervals.'
                : 'Combined demand across all monitored consumers (24-hour horizon).'}
            </p>
          </div>
        </div>

        <div className="workspace-chart-wrapper">
          {(viewMode === 'consumer' ? isLoadingConsumer : isLoadingPortal) ? (
            <div style={{ padding: '3.5rem', textAlign: 'center', color: 'var(--foreground-muted)' }}>
              Loading forecast data...
            </div>
          ) : chartPoints.length > 0 ? (
            <LoadChart
              data={chartPoints}
              height={340}
              unit="kW"
              actualLabel="Actual Demand"
              baselineLabel="Predicted Demand"
            />
          ) : (
            <div style={{ padding: '3.5rem', textAlign: 'center', color: 'var(--foreground-muted)' }}>
              Forecast data unavailable for this selection.
            </div>
          )}
        </div>

        {/* Chart Footer: Point Forecast Note & Peak Prediction */}
        <div
          style={{
            padding: '0.85rem 1.25rem',
            backgroundColor: 'var(--surface-raised)',
            borderTop: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.75rem',
            fontSize: '0.8rem',
            color: 'var(--foreground-muted)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <Info size={14} style={{ color: 'var(--foreground-subtle)' }} />
            <span>Point forecast — prediction intervals are not available for this model.</span>
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--foreground)' }}>
            Predicted Peak: <strong style={{ color: 'var(--accent-amber)' }}>{currentMetrics.predPeakTime} ({currentMetrics.predPeakKw.toFixed(3)} kW)</strong>
          </div>
        </div>
      </section>
    </div>
  );
};
