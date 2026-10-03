import { useState, useEffect } from 'react';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { LoadChart } from '../components/charts/LoadChart';
import {
  fetchHouseholds,
  fetchHouseholdForecast,
  fetchHouseholdSegment,
  fetchHouseholdInstability,
  fetchHouseholdAnomaly,
  type HouseholdSummary,
  type ForecastData,
  type SegmentData,
  type InstabilityData,
  type AnomalyData,
} from '../services/api';
import { mockHouseholds } from '../mock/mockData';
import type { DemandDataPoint } from '../types/energy';

export function HouseholdView() {
  const [households, setHouseholds] = useState<HouseholdSummary[]>([]);
  const [selectedId, setSelectedId] = useState<string>('MAC000045');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoadingList, setIsLoadingList] = useState<boolean>(true);

  // Active household data
  const [forecast, setForecast] = useState<ForecastData | null>(null);
  const [segment, setSegment] = useState<SegmentData | null>(null);
  const [instability, setInstability] = useState<InstabilityData | null>(null);
  const [anomaly, setAnomaly] = useState<AnomalyData | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState<boolean>(false);

  // 1. Fetch household list on mount
  useEffect(() => {
    let isMounted = true;
    fetchHouseholds()
      .then((data) => {
        if (isMounted) {
          setHouseholds(data);
          if (data.length > 0) {
            setSelectedId(data[0].household_id);
          }
          setIsLoadingList(false);
        }
      })
      .catch((err) => {
        console.warn('Could not load real households, falling back to mock:', err);
        if (isMounted) {
          setIsLoadingList(false);
        }
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Fetch selected household details
  useEffect(() => {
    if (!selectedId) return;
    let isMounted = true;
    setIsLoadingDetails(true);

    Promise.allSettled([
      fetchHouseholdForecast(selectedId),
      fetchHouseholdSegment(selectedId),
      fetchHouseholdInstability(selectedId),
      fetchHouseholdAnomaly(selectedId),
    ]).then(([fcRes, segRes, instRes, anomRes]) => {
      if (!isMounted) return;

      if (fcRes.status === 'fulfilled') setForecast(fcRes.value);
      else setForecast(null);

      if (segRes.status === 'fulfilled') setSegment(segRes.value);
      else setSegment(null);

      if (instRes.status === 'fulfilled') setInstability(instRes.value);
      else setInstability(null);

      if (anomRes.status === 'fulfilled') setAnomaly(anomRes.value);
      else setAnomaly(null);

      setIsLoadingDetails(false);
    });

    return () => {
      isMounted = false;
    };
  }, [selectedId]);

  // Household list for UI sidebar
  const displayedHouseholds = households.length > 0
    ? households.filter((h) =>
        h.household_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        h.acorn_grouped.toLowerCase().includes(searchQuery.toLowerCase()) ||
        h.cluster_label.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : mockHouseholds.map((mh) => ({
        household_id: mh.id,
        acorn_grouped: mh.acornGroup,
        cluster_id: mh.currentCluster,
        cluster_label: mh.clusterName,
        instability: 1 - mh.stabilityScore,
        volatility_cv: 0.85,
        reliability_indicator: mh.status === 'alert' ? 'elevated_risk' : mh.status === 'volatile' ? 'moderate' : 'stable',
        anomaly_count: mh.status === 'alert' ? 2 : 0,
      } as HouseholdSummary));

  const currentSummary = households.find((h) => h.household_id === selectedId) || displayedHouseholds[0];

  // Convert forecast series to chart points (downsample to 48 points if full window)
  const chartData: DemandDataPoint[] = forecast && forecast.series.length > 0
    ? forecast.series.slice(0, 48).map((pt) => {
        const hhSlot = pt.slot_index % 48;
        const hr = Math.floor(hhSlot / 2);
        const mn = hhSlot % 2 === 1 ? '30' : '00';
        return {
          timestamp: pt.timestamp,
          hour: hr,
          label: `${hr.toString().padStart(2, '0')}:${mn}`,
          actualKw: pt.actual,
          baselineKw: pt.predicted_global,
          isPeak: hr >= 17 && hr <= 21,
        };
      })
    : mockHouseholds[0].hourlyConsumption.map((pt) => ({
        timestamp: `${pt.hour.toString().padStart(2, '0')}:00`,
        hour: pt.hour,
        label: `${pt.hour.toString().padStart(2, '0')}:00`,
        actualKw: pt.kw,
        baselineKw: pt.baselineKw,
        isPeak: pt.hour >= 18 && pt.hour <= 21,
      }));

  const activeAnomalies = anomaly ? anomaly.flags.filter((f) => f.is_anomaly) : [];

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-highlight)' }}>
          Household Smart Meter Explorer
        </h1>
        <p style={{ marginTop: '0.25rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          Inspect granular half-hourly load curves, global GBDT forecasts, TreeSHAP feature attributions, and Isolation Forest anomaly flags.
        </p>
      </div>

      <div className="household-split-grid">
        {/* Left Side: Household Selector & Search */}
        <Card
          title="Monitored Meters"
          subtitle={isLoadingList ? 'Loading meters...' : `${households.length || mockHouseholds.length} London smart meters in sample`}
          headerBorder
        >
          <div style={{ marginBottom: '1rem' }}>
            <input
              type="text"
              placeholder="Search meter ID, ACORN, cluster..."
              className="text-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '560px', overflowY: 'auto' }}>
            {displayedHouseholds.slice(0, 50).map((h) => {
              const isSelected = h.household_id === selectedId;
              const badgeVariant =
                h.reliability_indicator === 'elevated_risk'
                  ? 'rose'
                  : h.reliability_indicator === 'moderate'
                  ? 'amber'
                  : 'emerald';

              return (
                <div
                  key={h.household_id}
                  onClick={() => setSelectedId(h.household_id)}
                  style={{
                    padding: '0.75rem',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: isSelected ? 'rgba(6, 182, 212, 0.12)' : 'rgba(255, 255, 255, 0.02)',
                    border: `1px solid ${isSelected ? 'var(--accent-cyan)' : 'var(--border-subtle)'}`,
                    cursor: 'pointer',
                    transition: 'all var(--transition-fast)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                    <span style={{ fontWeight: 600, color: 'var(--text-highlight)', fontFamily: 'var(--font-mono)' }}>
                      {h.household_id}
                    </span>
                    <Badge variant={badgeVariant} size="sm">
                      {h.reliability_indicator}
                    </Badge>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    <span>{h.cluster_label}</span>
                    <span style={{ fontFamily: 'var(--font-mono)' }}>{h.acorn_grouped}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Right Side: Selected Household Detail & Forecast */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Header Card */}
          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-highlight)', fontFamily: 'var(--font-mono)' }}>
                    {selectedId}
                  </h2>
                  <Badge variant="cyan">{currentSummary?.acorn_grouped || 'Stratified'}</Badge>
                  <Badge variant={(instability?.reliability_indicator || currentSummary?.reliability_indicator) === 'elevated_risk' ? 'rose' : (instability?.reliability_indicator || currentSummary?.reliability_indicator) === 'moderate' ? 'amber' : 'emerald'}>
                    {(instability?.reliability_indicator || currentSummary?.reliability_indicator)?.toUpperCase() || 'STABLE'}
                  </Badge>
                </div>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Current Segment: <strong style={{ color: 'var(--text-highlight)' }}>{segment?.current_cluster_label || currentSummary?.cluster_label}</strong>
                  {forecast && ` | Forecast Target: Window ${forecast.window_id}`}
                </p>
              </div>

              <div style={{ display: 'flex', gap: '1rem', textAlign: 'right' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Global MAE</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>
                    {forecast ? `${forecast.mae_global.toFixed(3)} kW` : '0.081 kW'}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Instability</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--accent-amber)', fontFamily: 'var(--font-mono)' }}>
                    {instability ? (instability.series[instability.series.length - 1]?.instability.toFixed(2) || '0.20') : (currentSummary ? currentSummary.instability.toFixed(2) : '0.20')}
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Load Chart Card */}
          <Card
            title={`Demand Profile: Actual vs Global GBDT Forecast (${forecast ? forecast.window_id : 'Window'})`}
            subtitle="Comparing real half-hourly consumption (cyan) with out-of-sample GBDT predictions (amber baseline)"
            action={
              forecast ? (
                <Badge variant="neutral" size="sm">
                  MAE: {forecast.mae_global.toFixed(3)} kW | PerCluster: {forecast.mae_percluster.toFixed(3)} kW
                </Badge>
              ) : undefined
            }
          >
            {isLoadingDetails ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                Loading smart meter telemetry...
              </div>
            ) : (
              <LoadChart data={chartData} height={260} />
            )}
          </Card>


          {/* Two Columns: SHAP Feature Importance & Anomaly Alert Feed */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            {/* TreeSHAP Feature Attributions */}
            <Card
              title="TreeSHAP Feature Attributions"
              subtitle="Top predictive drivers for global forecaster predictions"
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {(forecast?.shap_top_features || [
                  { feature: 'mean_load', contribution: 0.135 },
                  { feature: 'half_hour', contribution: 0.082 },
                  { feature: 'std_load', contribution: 0.041 },
                  { feature: 'peak_load', contribution: 0.015 },
                ]).map((feat, i) => {
                  const maxContrib = 0.2;
                  const pct = Math.min(100, Math.round((Math.abs(feat.contribution) / maxContrib) * 100));
                  return (
                    <div key={feat.feature}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.25rem' }}>
                        <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-highlight)' }}>
                          {i + 1}. {feat.feature}
                        </span>
                        <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)' }}>
                          {feat.contribution.toFixed(4)}
                        </span>
                      </div>
                      <div style={{ height: '6px', backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div
                          style={{
                            height: '100%',
                            width: `${pct}%`,
                            backgroundColor: i === 0 ? 'var(--accent-cyan)' : 'var(--accent-amber)',
                            borderRadius: '3px',
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Isolation Forest Anomaly Feed */}
            <Card
              title="Isolation Forest Anomaly Flags"
              subtitle="Unsupervised statistical deviations (|z| score & explanations)"
              action={
                <Badge variant={activeAnomalies.length > 0 ? 'amber' : 'emerald'} size="sm">
                  {activeAnomalies.length} Flagged
                </Badge>
              }
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '200px', overflowY: 'auto' }}>
                {activeAnomalies.length > 0 ? (
                  activeAnomalies.map((anom, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '0.75rem',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: 'rgba(244, 63, 94, 0.06)',
                        border: '1px solid rgba(244, 63, 94, 0.2)',
                        fontSize: '0.8rem',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                        <strong style={{ color: 'var(--accent-rose)' }}>
                          Window {anom.window_id}: {anom.triggering_statistic}
                        </strong>
                        <Badge variant="rose" size="sm">|z| = {anom.z_score.toFixed(2)}</Badge>
                      </div>
                      <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                        {anom.explanation}
                      </p>
                    </div>
                  ))
                ) : (
                  <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    No anomalous deviations flagged for this household. Operating within normal behavioral envelope.
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
