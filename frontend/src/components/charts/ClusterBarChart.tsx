import type { ClusterProfile } from '../../types/energy';

interface ClusterBarChartProps {
  clusters: ClusterProfile[];
  onSelectCluster?: (clusterId: number) => void;
  selectedClusterId?: number | null;
}

export function ClusterBarChart({
  clusters,
  onSelectCluster,
  selectedClusterId,
}: ClusterBarChartProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {clusters.map((cluster) => {
        const isSelected = selectedClusterId === cluster.id;
        return (
          <div
            key={cluster.id}
            onClick={() => onSelectCluster?.(cluster.id)}
            style={{
              padding: '0.85rem',
              borderRadius: 'var(--radius-md)',
              backgroundColor: isSelected ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.02)',
              border: `1px solid ${isSelected ? cluster.color : 'var(--border-subtle)'}`,
              cursor: onSelectCluster ? 'pointer' : 'default',
              transition: 'all var(--transition-fast)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '0.4rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span
                  style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    backgroundColor: cluster.color,
                    boxShadow: `0 0 8px ${cluster.color}`,
                  }}
                />
                <span style={{ fontWeight: 600, color: 'var(--text-highlight)', fontSize: '0.85rem' }}>
                  {cluster.name}
                </span>
                <span
                  style={{
                    fontSize: '0.75rem',
                    color: 'var(--text-muted)',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  [{cluster.code}]
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span
                  style={{
                    fontSize: '0.9rem',
                    fontWeight: 700,
                    color: cluster.color,
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  {cluster.percentage}%
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  ({cluster.householdCount.toLocaleString()} meters)
                </span>
              </div>
            </div>

            {/* Progress bar track */}
            <div
              style={{
                width: '100%',
                height: '6px',
                backgroundColor: 'rgba(255, 255, 255, 0.06)',
                borderRadius: 'var(--radius-full)',
                overflow: 'hidden',
                marginBottom: '0.5rem',
              }}
            >
              <div
                style={{
                  width: `${cluster.percentage}%`,
                  height: '100%',
                  backgroundColor: cluster.color,
                  borderRadius: 'var(--radius-full)',
                  boxShadow: `0 0 8px ${cluster.color}`,
                  transition: 'width 0.6s ease-out',
                }}
              />
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '0.75rem',
                color: 'var(--text-secondary)',
              }}
            >
              <span>{cluster.description}</span>
              <span style={{ fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap', marginLeft: '0.5rem' }}>
                Peak: {cluster.peakHourWindow}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
