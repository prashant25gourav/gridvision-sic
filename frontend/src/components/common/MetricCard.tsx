import type { MetricItem } from '../../types/energy';
import { Badge } from './Badge';

interface MetricCardProps {
  metric: MetricItem;
}

export function MetricCard({ metric }: MetricCardProps) {
  const getIcon = (type: MetricItem['icon']) => {
    switch (type) {
      case 'demand':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
          </svg>
        );
      case 'meters':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
            <line x1="8" y1="21" x2="16" y2="21" />
            <line x1="12" y1="17" x2="12" y2="21" />
          </svg>
        );
      case 'peak':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        );
      case 'stability':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
          </svg>
        );
    }
  };

  const isPositive = metric.changeType === 'positive';
  const isNegative = metric.changeType === 'negative';
  const changeColor = isPositive ? 'var(--accent-emerald)' : isNegative ? 'var(--accent-rose)' : 'var(--text-secondary)';

  return (
    <div
      className="glass-card"
      style={{
        padding: '1.25rem',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        minHeight: '140px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'rgba(6, 182, 212, 0.1)',
              color: 'var(--accent-cyan)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {getIcon(metric.icon)}
          </div>
          <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-secondary)' }}>
            {metric.title}
          </span>
        </div>
        {metric.badge && (
          <Badge
            variant={
              metric.icon === 'demand'
                ? 'cyan'
                : metric.icon === 'peak'
                ? 'amber'
                : metric.icon === 'stability'
                ? 'emerald'
                : 'neutral'
            }
            size="sm"
            dot
          >
            {metric.badge}
          </Badge>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '0.5rem' }}>
        <span
          style={{
            fontSize: '1.85rem',
            fontWeight: 700,
            letterSpacing: '-0.02em',
            color: 'var(--text-highlight)',
            fontFamily: 'var(--font-mono), sans-serif',
          }}
        >
          {metric.value}
        </span>
        {metric.unit && (
          <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
            {metric.unit}
          </span>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem' }}>
        <span style={{ color: changeColor, fontWeight: 600 }}>
          {metric.change}
        </span>
        <span style={{ color: 'var(--text-muted)' }}>
          {metric.caption}
        </span>
      </div>
    </div>
  );
}
