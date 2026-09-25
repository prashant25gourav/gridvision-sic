import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  className?: string;
  glow?: 'cyan' | 'emerald' | 'indigo' | 'amber' | 'none';
  headerBorder?: boolean;
}

export function Card({
  children,
  title,
  subtitle,
  action,
  className = '',
  glow = 'none',
  headerBorder = true,
}: CardProps) {
  const glowStyle =
    glow === 'cyan'
      ? { boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.5), 0 0 15px -3px rgba(6, 182, 212, 0.25)' }
      : glow === 'emerald'
      ? { boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.5), 0 0 15px -3px rgba(16, 185, 129, 0.25)' }
      : glow === 'indigo'
      ? { boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.5), 0 0 15px -3px rgba(99, 102, 241, 0.25)' }
      : glow === 'amber'
      ? { boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.5), 0 0 15px -3px rgba(245, 158, 11, 0.25)' }
      : {};

  return (
    <div
      className={`glass-card ${className}`}
      style={{
        padding: '1.25rem',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
        ...glowStyle,
      }}
    >
      {(title || subtitle || action) && (
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: '1rem',
            marginBottom: '1rem',
            paddingBottom: headerBorder ? '0.75rem' : '0',
            borderBottom: headerBorder ? '1px solid var(--border-subtle)' : 'none',
          }}
        >
          <div>
            {title && (
              <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-highlight)' }}>
                {title}
              </h3>
            )}
            {subtitle && (
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                {subtitle}
              </p>
            )}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      <div style={{ flex: 1 }}>{children}</div>
    </div>
  );
}
