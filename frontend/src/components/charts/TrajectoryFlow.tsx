import type { BehavioralTransition } from '../../types/energy';
import { Badge } from '../common/Badge';

interface TrajectoryFlowProps {
  transitions: BehavioralTransition[];
}

export function TrajectoryFlow({ transitions }: TrajectoryFlowProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {transitions.map((t) => {
        const isTransition = t.fromCluster !== t.toCluster;
        return (
          <div
            key={t.householdId}
            style={{
              padding: '1rem',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'rgba(255, 255, 255, 0.02)',
              border: `1px solid ${t.isShiftFlagged ? 'rgba(245, 158, 11, 0.4)' : 'var(--border-subtle)'}`,
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '0.5rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 700,
                    color: 'var(--accent-cyan)',
                    fontSize: '0.9rem',
                  }}
                >
                  {t.householdId}
                </span>

                {/* Trajectory badge */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem' }}>
                  <span
                    style={{
                      padding: '0.2rem 0.5rem',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    {t.fromClusterName}
                  </span>
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke={isTransition ? 'var(--accent-amber)' : 'var(--text-muted)'}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                  <span
                    style={{
                      padding: '0.2rem 0.5rem',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: isTransition ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                      color: isTransition ? 'var(--accent-amber)' : 'var(--accent-emerald)',
                      fontWeight: 600,
                    }}
                  >
                    {t.toClusterName}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Badge variant={t.stabilityScore > 0.8 ? 'emerald' : 'amber'} size="sm">
                  Stability: {(t.stabilityScore * 100).toFixed(0)}%
                </Badge>
                {t.isShiftFlagged && (
                  <Badge variant="amber" size="sm" dot>
                    Shift Flagged
                  </Badge>
                )}
              </div>
            </div>

            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
              {t.notes}
            </p>
          </div>
        );
      })}
    </div>
  );
}
