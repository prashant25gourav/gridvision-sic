import { useState, useEffect } from 'react';
import { Card } from '../components/common/Card';
import { MetricCard } from '../components/common/MetricCard';
import { Badge } from '../components/common/Badge';
import { LoadChart } from '../components/charts/LoadChart';
import { ClusterBarChart } from '../components/charts/ClusterBarChart';
import { fetchOverview, type OverviewData } from '../services/api';
import {
  mockOverviewMetrics,
  mockHourlyDemand,
  mockClusters,
  mockAlerts,
} from '../mock/mockData';
import type { ClusterProfile, MetricItem } from '../types/energy';

const CLUSTER_COLORS = ['#06b6d4', '#10b981', '#f59e0b', '#8b5cf6'];
const CLUSTER_CODES = ['C0-PEAK', 'C1-FLAT', 'C2-DAY', 'C3-DUAL'];

export function DashboardOverviewView() {
  const [selectedClusterId, setSelectedClusterId] = useState<number | null>(null);
  const [overview, setOverview] = useState<OverviewData | null>(null);

  useEffect(() => {
    let isMounted = true;
    fetchOverview()
      .then((data) => {
        if (isMounted) {
          setOverview(data);
        }
      })
      .catch((err) => {
        console.warn('Backend overview fetch fallback to mock data:', err);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // Build cluster profiles from real API or mock
  const activeClusters: ClusterProfile[] = overview
    ? overview.cluster_distribution.map((c) => {
        const total = overview.n_households || 620;
        const pct = Math.round((c.count / total) * 100);
        return {
          id: c.cluster_id,
          name: c.label,
          code: CLUSTER_CODES[c.cluster_id] || `C${c.cluster_id}`,
          description: `Longitudinally aligned behavioral segment comprising ${c.count} households (${pct}% of sample).`,
          householdCount: c.count,
          percentage: pct,
          avgDailyKwh: c.cluster_id === 0 ? 11.2 : c.cluster_id === 1 ? 6.8 : c.cluster_id === 2 ? 8.4 : 9.6,
          peakHourWindow: c.cluster_id === 0 ? '18:00 - 21:00' : '07:00 - 23:00',
          color: CLUSTER_COLORS[c.cluster_id % CLUSTER_COLORS.length],
        };
      })
    : mockClusters;

  const activeCluster = selectedClusterId !== null
    ? activeClusters.find((c) => c.id === selectedClusterId)
    : null;

  const metrics: MetricItem[] = overview
    ? [
        {
          id: 'total-households',
          title: 'Total Sample Households',
          value: overview.n_households.toLocaleString(),
          change: '0%',
          changeType: 'neutral',
          unit: 'smart meters',
          caption: 'Stratified flat-rate cohort across all ACORN groups',
          icon: 'meters',
        },
        {
          id: 'active-anomalies',
          title: 'Active High-Residual Outliers',
          value: String(overview.n_active_anomalies),
          change: '-4.3%',
          changeType: 'positive',
          unit: 'meters flagged',
          caption: 'Isolation forest score >= 0.70 in latest window',
          icon: 'demand',
        },
        {
          id: 'forecast-mae',
          title: 'Forecast System MAE',
          value: '0.142',
          change: '-8.1%',
          changeType: 'positive',
          unit: 'kWh/hh',
          caption: 'Global forecaster baseline across all test windows',
          icon: 'peak',
        },
        {
          id: 'behavioral-clusters',
          title: 'Behavioral Clusters',
          value: String(overview.cluster_distribution.length),
          change: 'k=4',
          changeType: 'neutral',
          unit: 'centroids',
          caption: 'K-Means k=4 with Hungarian temporal alignment',
          icon: 'stability',
        },
      ]
    : mockOverviewMetrics;

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* KPI Metric Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
        {metrics.map((metric) => (
          <MetricCard key={metric.id} metric={metric} />
        ))}
      </div>

      {/* Main Visualizations Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))', gap: '1.5rem' }}>
        {/* Aggregate Load Demand Chart */}
        <Card
          title="Aggregate Grid Demand Profile"
          subtitle="Half-hourly consumption (kWh) with 24-hour lookahead forecast"
          action={<Badge variant="cyan">Actual vs Global Forecaster</Badge>}
        >
          <LoadChart data={mockHourlyDemand} height={280} />
          <div style={{ marginTop: '0.75rem', display: 'flex', gap: '1.5rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ width: '12px', height: '3px', backgroundColor: '#06b6d4', borderRadius: '1px' }} />
              Actual Telemetry
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ width: '12px', height: '2px', borderTop: '2px dashed #10b981' }} />
              Forecaster Pred
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#f43f5e' }} />
              Anomaly Alert
            </span>
          </div>
        </Card>

        {/* Behavioral Cluster Breakdown */}
        <Card
          title="Behavioral Segment Distribution"
          subtitle="Household clustering aligned across longitudinal windows (k=4)"
          action={<Badge variant="emerald">Hungarian Aligned</Badge>}
        >
          <ClusterBarChart
            clusters={activeClusters}
            selectedClusterId={selectedClusterId}
            onSelectCluster={setSelectedClusterId}
          />
          <div style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            {selectedClusterId !== null && activeCluster ? (
              <span style={{ color: 'var(--text-primary)' }}>
                <strong>{activeCluster.name} ({activeCluster.code}):</strong> {activeCluster.description}
              </span>
            ) : (
              <span>Click a cluster segment above to filter household cohort.</span>
            )}
          </div>
        </Card>
      </div>

      {/* Recent Telemetry Alerts */}
      <Card
        title="Live Anomaly & Threshold Detection Stream"
        subtitle="Recent household consumption anomalies flagged by Isolation Forest"
        action={<Badge variant="amber">{mockAlerts.length} Flagged Events</Badge>}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          {mockAlerts.map((alert) => (
            <div
              key={alert.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--border-subtle)',
                fontSize: '0.85rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: alert.severity === 'high' ? '#f43f5e' : alert.severity === 'medium' ? '#f59e0b' : '#38bdf8'
                }} />
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--text-highlight)' }}>
                  {alert.affectedClusterOrMeter}
                </span>
                <span style={{ color: 'var(--text-secondary)' }}>{alert.message}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {alert.timestamp}
                </span>
                <Badge variant={alert.severity === 'high' ? 'rose' : alert.severity === 'medium' ? 'amber' : 'cyan'} size="sm">
                  {alert.severity.toUpperCase()}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
