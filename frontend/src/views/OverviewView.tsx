import { useState } from 'react';
import { Card } from '../components/common/Card';
import { MetricCard } from '../components/common/MetricCard';
import { Badge } from '../components/common/Badge';
import { LoadChart } from '../components/charts/LoadChart';
import { ClusterBarChart } from '../components/charts/ClusterBarChart';
import {
  mockOverviewMetrics,
  mockHourlyDemand,
  mockClusters,
  mockAlerts,
} from '../mock/mockData';

export function OverviewView() {
  const [selectedClusterId, setSelectedClusterId] = useState<number | null>(null);

  const activeCluster = selectedClusterId !== null
    ? mockClusters.find((c) => c.id === selectedClusterId)
    : null;

  return (
    <div>
      {/* Top Welcome & Substation Context */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '1.5rem',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-highlight)' }}>
            Grid Telemetry Overview
          </h1>
          <p style={{ marginTop: '0.25rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            High-level operational view across aggregated smart meter load profiles, behavioral clusters, and peak demand periods.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Badge variant="outline">Rolling Window: 24h</Badge>
          <Badge variant="cyan" dot>Telemetry Live</Badge>
        </div>
      </div>

      {/* 4 KPI Metric Cards */}
      <div className="metrics-grid">
        {mockOverviewMetrics.map((metric) => (
          <MetricCard key={metric.id} metric={metric} />
        ))}
      </div>

      {/* Split Grid: Load Chart (2fr) & Cluster Distribution (1fr) */}
      <div className="dashboard-split-grid">
        {/* Aggregated Grid Demand Chart */}
        <Card
          title="Aggregated 24-Hour Grid Demand"
          subtitle="Real-time load tracking vs 24h baseline demand curve with peak interval"
          action={
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Badge variant="neutral" size="sm">5,567 Aggregated Meters</Badge>
            </div>
          }
        >
          <LoadChart data={mockHourlyDemand} height={260} />
        </Card>

        {/* Consumer Cluster Breakdown */}
        <Card
          title="Behavioral Cluster Distribution"
          subtitle="Household segmentation by consumption archetype"
          action={
            activeCluster ? (
              <button
                type="button"
                className="btn btn-secondary"
                style={{ padding: '0.2rem 0.6rem', fontSize: '0.75rem' }}
                onClick={() => setSelectedClusterId(null)}
              >
                Clear Selection
              </button>
            ) : undefined
          }
        >
          <ClusterBarChart
            clusters={mockClusters}
            selectedClusterId={selectedClusterId}
            onSelectCluster={(id) => setSelectedClusterId(id === selectedClusterId ? null : id)}
          />

          {activeCluster && (
            <div
              style={{
                marginTop: '1rem',
                padding: '0.75rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'rgba(6, 182, 212, 0.08)',
                border: '1px solid var(--border-glow-cyan)',
                fontSize: '0.8rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                <strong style={{ color: activeCluster.color }}>{activeCluster.name} Details</strong>
                <Badge variant="neutral" size="sm">Avg {activeCluster.avgDailyKwh} kWh/day</Badge>
              </div>
              <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
                {activeCluster.description}
              </p>
            </div>
          )}
        </Card>
      </div>

      {/* Bottom Grid: Alerts & Research Scope Status */}
      <div className="two-col-grid">
        {/* Recent Anomaly & Drift Alerts */}
        <Card
          title="Grid Alerts & Telemetry Feed"
          subtitle="Recent anomaly detections and peak threshold events"
          action={<Badge variant="amber" size="sm">{mockAlerts.length} Active</Badge>}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {mockAlerts.map((alert) => {
              const isHigh = alert.severity === 'high';
              const isMed = alert.severity === 'medium';
              const badgeVariant = isHigh ? 'rose' : isMed ? 'amber' : 'neutral';

              return (
                <div
                  key={alert.id}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    padding: '0.75rem',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid var(--border-subtle)',
                    gap: '0.75rem',
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Badge variant={badgeVariant} size="sm">
                        {alert.category}
                      </Badge>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                        {alert.timestamp}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-primary)', margin: 0 }}>
                      {alert.message}
                    </p>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      Target: {alert.affectedClusterOrMeter}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Capstone Framework & Safe Readiness */}
        <Card
          title="GridVision Architecture & Foundation"
          subtitle="Current deployment state and safe modular separation"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', fontSize: '0.825rem' }}>
            <div
              style={{
                padding: '0.75rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'rgba(16, 185, 129, 0.08)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                <span className="status-dot-pulse" />
                <strong style={{ color: 'var(--accent-emerald)' }}>Research Methodology Safe State</strong>
              </div>
              <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                Core forecasting horizons, rolling-window protocols, instability formulations, and cluster alignments remain intentionally unconstrained and decoupled from UI representation.
              </p>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '0.75rem',
              }}
            >
              <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', backgroundColor: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-subtle)' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Frontend Core</span>
                <p style={{ fontWeight: 600, color: 'var(--text-highlight)', margin: '0.2rem 0 0' }}>
                  React 19 + TypeScript + Vite
                </p>
              </div>
              <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', backgroundColor: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-subtle)' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Backend Core</span>
                <p style={{ fontWeight: 600, color: 'var(--text-highlight)', margin: '0.2rem 0 0' }}>
                  FastAPI + Modular Routing
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.75rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border-subtle)' }}>
              <span>Data Pipeline: data/raw &rarr; ml/ &rarr; data/processed</span>
              <Badge variant="neutral" size="sm">Awaiting Final Masterplan</Badge>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
