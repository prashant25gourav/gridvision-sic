import { useState } from 'react';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { LoadChart } from '../components/charts/LoadChart';
import { mockHouseholds } from '../mock/mockData';
import type { DemandDataPoint } from '../types/energy';

export function HouseholdView() {
  const [selectedId, setSelectedId] = useState<string>('MAC000002');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredHouseholds = mockHouseholds.filter((h) =>
    h.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    h.clusterName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    h.tariff.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedHousehold = mockHouseholds.find((h) => h.id === selectedId) || mockHouseholds[0];

  // Convert household hourly data to DemandDataPoint format for chart
  const householdChartData: DemandDataPoint[] = selectedHousehold.hourlyConsumption.map((pt) => ({
    timestamp: `${pt.hour.toString().padStart(2, '0')}:00`,
    hour: pt.hour,
    label: `${pt.hour.toString().padStart(2, '0')}:00`,
    actualKw: pt.kw,
    baselineKw: pt.baselineKw,
    isPeak: pt.hour >= 18 && pt.hour <= 21,
  }));

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-highlight)' }}>
          Household Smart Meter Explorer
        </h1>
        <p style={{ marginTop: '0.25rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          Inspect granular half-hourly and hourly smart meter telemetry, consumer demographic segment, tariff structure, and individual load deviations.
        </p>
      </div>

      <div className="household-split-grid">
        {/* Left Side: Household Selector & Search */}
        <Card
          title="Monitored Meters"
          subtitle={`${mockHouseholds.length} sample meters in explorer`}
          headerBorder
        >
          <div style={{ marginBottom: '1rem' }}>
            <input
              type="text"
              placeholder="Search meter ID, cluster, tariff..."
              className="text-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '520px', overflowY: 'auto' }}>
            {filteredHouseholds.map((h) => {
              const isSelected = h.id === selectedHousehold.id;
              const statusBadge =
                h.status === 'alert'
                  ? 'rose'
                  : h.status === 'volatile'
                  ? 'amber'
                  : 'emerald';

              return (
                <div
                  key={h.id}
                  onClick={() => setSelectedId(h.id)}
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
                    <span
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 700,
                        color: isSelected ? 'var(--accent-cyan)' : 'var(--text-highlight)',
                        fontSize: '0.9rem',
                      }}
                    >
                      {h.id}
                    </span>
                    <Badge variant={statusBadge} size="sm" dot>
                      {h.status}
                    </Badge>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    <span>{h.clusterName}</span>
                    <span style={{ fontFamily: 'var(--font-mono)' }}>{h.avgDailyKwh} kWh/d</span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Right Side: Selected Household Detail & Curve */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Household Metadata Header */}
          <Card
            title={`Telemetry Profile: ${selectedHousehold.id}`}
            subtitle="Smart meter telemetry, demographic group, and tariff structure"
            action={
              <Badge variant={selectedHousehold.stabilityScore > 0.8 ? 'emerald' : 'amber'} dot>
                Stability: {(selectedHousehold.stabilityScore * 100).toFixed(0)}%
              </Badge>
            }
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                gap: '1rem',
                marginBottom: '1rem',
              }}
            >
              <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', backgroundColor: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-subtle)' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Acorn Demographics</span>
                <p style={{ fontWeight: 600, color: 'var(--text-highlight)', margin: '0.25rem 0 0', fontSize: '0.85rem' }}>
                  {selectedHousehold.acornGroup}
                </p>
              </div>

              <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', backgroundColor: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-subtle)' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Tariff Plan</span>
                <p style={{ fontWeight: 600, color: 'var(--text-highlight)', margin: '0.25rem 0 0', fontSize: '0.85rem' }}>
                  {selectedHousehold.tariff}
                </p>
              </div>

              <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', backgroundColor: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-subtle)' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Current Archetype</span>
                <p style={{ fontWeight: 600, color: 'var(--accent-cyan)', margin: '0.25rem 0 0', fontSize: '0.85rem' }}>
                  {selectedHousehold.clusterName}
                </p>
              </div>

              <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', backgroundColor: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-subtle)' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Observed Peak Hour</span>
                <p style={{ fontWeight: 600, color: 'var(--accent-amber)', margin: '0.25rem 0 0', fontSize: '0.85rem', fontFamily: 'var(--font-mono)' }}>
                  {selectedHousehold.peakHour}
                </p>
              </div>
            </div>

            {/* Individual 24-Hour Load Curve */}
            <div style={{ marginTop: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <h4 style={{ fontSize: '0.9rem', color: 'var(--text-highlight)' }}>
                  24-Hour Individual Load Curve (kW)
                </h4>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Hourly Interval Sampling
                </span>
              </div>
              <LoadChart data={householdChartData} height={230} />
            </div>
          </Card>

          {/* Detailed Statistics Cards */}
          <div className="two-col-grid" style={{ marginBottom: 0 }}>
            <Card title="Consumption Breakdown" subtitle="Diurnal and nocturnal energy dispersion">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.825rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.4rem', borderBottom: '1px solid var(--border-subtle)' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Daily Energy Usage:</span>
                  <strong style={{ color: 'var(--text-highlight)', fontFamily: 'var(--font-mono)' }}>
                    {selectedHousehold.avgDailyKwh} kWh
                  </strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.4rem', borderBottom: '1px solid var(--border-subtle)' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Daytime (07:00 - 18:00):</span>
                  <span style={{ color: 'var(--text-highlight)', fontFamily: 'var(--font-mono)' }}>
                    {((selectedHousehold.avgDailyKwh * 0.48)).toFixed(1)} kWh (48%)
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.4rem', borderBottom: '1px solid var(--border-subtle)' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Evening Peak (18:00 - 22:00):</span>
                  <span style={{ color: 'var(--accent-amber)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                    {((selectedHousehold.avgDailyKwh * 0.36)).toFixed(1)} kWh (36%)
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Night Baseline (22:00 - 07:00):</span>
                  <span style={{ color: 'var(--text-highlight)', fontFamily: 'var(--font-mono)' }}>
                    {((selectedHousehold.avgDailyKwh * 0.16)).toFixed(1)} kWh (16%)
                  </span>
                </div>
              </div>
            </Card>

            <Card title="Behavioral Stability Context" subtitle="Archetype alignment & drift indicator">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.825rem' }}>
                <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
                  Household <strong>{selectedHousehold.id}</strong> exhibits strong affinity with{' '}
                  <span style={{ color: 'var(--accent-cyan)', fontWeight: 600 }}>{selectedHousehold.clusterName}</span>.
                </p>
                <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', backgroundColor: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Stability Score</span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--accent-emerald)', fontFamily: 'var(--font-mono)' }}>
                      {(selectedHousehold.stabilityScore * 100).toFixed(0)} / 100
                    </span>
                  </div>
                  <div style={{ width: '100%', height: '6px', backgroundColor: 'rgba(255, 255, 255, 0.06)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${selectedHousehold.stabilityScore * 100}%`,
                        height: '100%',
                        backgroundColor: selectedHousehold.stabilityScore > 0.8 ? 'var(--accent-emerald)' : 'var(--accent-amber)',
                        borderRadius: 'var(--radius-full)',
                      }}
                    />
                  </div>
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  * Definitive mathematical instability formulations remain pending final masterplan refinement.
                </span>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
