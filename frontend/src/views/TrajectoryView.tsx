import { useState } from 'react';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { TrajectoryFlow } from '../components/charts/TrajectoryFlow';
import { mockTransitions } from '../mock/mockData';

export function TrajectoryView() {
  const [filterShiftOnly, setFilterShiftOnly] = useState(false);

  const displayedTransitions = filterShiftOnly
    ? mockTransitions.filter((t) => t.isShiftFlagged)
    : mockTransitions;

  const stableCount = mockTransitions.filter((t) => !t.isShiftFlagged && t.stabilityScore >= 0.8).length;
  const shiftingCount = mockTransitions.filter((t) => t.isShiftFlagged).length;

  return (
    <div>
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
            Behavioral Trajectory &amp; Cluster Migration
          </h1>
          <p style={{ marginTop: '0.25rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            Track how household energy consumption archetypes evolve across consecutive time windows, detecting persistent lifestyle shifts, solar PV adoption, and demand flexibility.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            type="button"
            className={`btn ${filterShiftOnly ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilterShiftOnly(!filterShiftOnly)}
          >
            {filterShiftOnly ? 'Showing Shifted Only' : 'Show All Transitions'}
          </button>
        </div>
      </div>

      {/* Trajectory KPIs */}
      <div className="metrics-grid">
        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Archetype Stability Rate</span>
            <Badge variant="emerald" size="sm" dot>Normal Range</Badge>
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 700, color: 'var(--accent-emerald)', fontFamily: 'var(--font-mono)' }}>
            82.4%
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0.25rem 0 0' }}>
            Households remaining within baseline archetype
          </p>
        </div>

        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Cluster Migrations</span>
            <Badge variant="amber" size="sm" dot>Flagged Shifts</Badge>
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 700, color: 'var(--accent-amber)', fontFamily: 'var(--font-mono)' }}>
            {shiftingCount} Flagged
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0.25rem 0 0' }}>
            Significant shifts across rolling analysis windows
          </p>
        </div>

        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Evaluated Cohort</span>
            <Badge variant="cyan" size="sm">Window T vs T-1</Badge>
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 700, color: 'var(--text-highlight)', fontFamily: 'var(--font-mono)' }}>
            {mockTransitions.length} Sample Meters
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0.25rem 0 0' }}>
            {stableCount} highly consistent, {mockTransitions.length - stableCount} transitioning
          </p>
        </div>
      </div>

      {/* Trajectory Flow Records */}
      <div className="dashboard-split-grid">
        <Card
          title="Cluster Transition Ledger"
          subtitle="Observed movement between consumption archetypes across observation windows"
          action={
            <Badge variant="neutral" size="sm">
              {displayedTransitions.length} Records Shown
            </Badge>
          }
        >
          <TrajectoryFlow transitions={displayedTransitions} />
        </Card>

        {/* Research Methodology Decoupling Notice */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <Card
            title="Methodological Decoupling"
            subtitle="Architectural flexibility safeguard"
            glow="indigo"
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.825rem' }}>
              <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
                Behavioral trajectory visualization currently operates on a clean, generic contract to allow seamless integration once the underlying research methodology is finalized.
              </p>

              <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', backgroundColor: 'rgba(99, 102, 241, 0.08)', border: '1px solid rgba(99, 102, 241, 0.25)' }}>
                <span style={{ fontWeight: 600, color: 'var(--accent-indigo)' }}>
                  Unresolved Parameters Kept Flexible:
                </span>
                <ul style={{ margin: '0.5rem 0 0 1.25rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  <li>Exact mathematical formulation of behavioral instability</li>
                  <li>Cluster alignment protocol (Hungarian algorithm vs Centroid distance)</li>
                  <li>Rolling-window duration (e.g. 14 days vs 30 days vs seasonal)</li>
                  <li>Extreme error thresholds &amp; volatility boundaries</li>
                </ul>
              </div>

              <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                When finalized, the ML pipeline will output standard trajectory vectors directly consumable by this view.
              </p>
            </div>
          </Card>

          <Card title="Archetype Transition Matrix Legend" subtitle="Expected migration pathways">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.8rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px solid var(--border-subtle)' }}>
                <span style={{ color: 'var(--accent-cyan)' }}>C0 &rarr; C2</span>
                <span style={{ color: 'var(--text-secondary)' }}>Remote work shift (Daytime peak adoption)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px solid var(--border-subtle)' }}>
                <span style={{ color: 'var(--accent-amber)' }}>C1 &rarr; C3</span>
                <span style={{ color: 'var(--text-secondary)' }}>EV / Heat pump addition (High nocturnal variance)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0' }}>
                <span style={{ color: 'var(--accent-emerald)' }}>C0 &rarr; C0</span>
                <span style={{ color: 'var(--text-secondary)' }}>Stable working-day schedule</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
