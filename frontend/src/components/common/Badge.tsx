import type { ReactNode } from 'react';

export type BadgeVariant =
  | 'cyan'
  | 'emerald'
  | 'indigo'
  | 'amber'
  | 'rose'
  | 'neutral'
  | 'outline';

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
  dot?: boolean;
}

export function Badge({
  children,
  variant = 'neutral',
  size = 'md',
  dot = false,
}: BadgeProps) {
  const styles: Record<BadgeVariant, { bg: string; color: string; border: string }> = {
    cyan: {
      bg: 'rgba(6, 182, 212, 0.12)',
      color: '#38bdf8',
      border: 'rgba(6, 182, 212, 0.3)',
    },
    emerald: {
      bg: 'rgba(16, 185, 129, 0.12)',
      color: '#34d399',
      border: 'rgba(16, 185, 129, 0.3)',
    },
    indigo: {
      bg: 'rgba(99, 102, 241, 0.12)',
      color: '#a5b4fc',
      border: 'rgba(99, 102, 241, 0.3)',
    },
    amber: {
      bg: 'rgba(245, 158, 11, 0.12)',
      color: '#fbbf24',
      border: 'rgba(245, 158, 11, 0.3)',
    },
    rose: {
      bg: 'rgba(244, 63, 94, 0.12)',
      color: '#fb7185',
      border: 'rgba(244, 63, 94, 0.3)',
    },
    neutral: {
      bg: 'rgba(255, 255, 255, 0.06)',
      color: '#cbd5e1',
      border: 'rgba(255, 255, 255, 0.1)',
    },
    outline: {
      bg: 'transparent',
      color: 'var(--text-secondary)',
      border: 'rgba(255, 255, 255, 0.15)',
    },
  };

  const current = styles[variant];
  const isSmall = size === 'sm';

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.35rem',
        padding: isSmall ? '0.15rem 0.45rem' : '0.25rem 0.65rem',
        borderRadius: 'var(--radius-full)',
        backgroundColor: current.bg,
        color: current.color,
        border: `1px solid ${current.border}`,
        fontSize: isSmall ? '0.7rem' : '0.75rem',
        fontWeight: 500,
        lineHeight: 1.2,
        letterSpacing: '0.02em',
        whiteSpace: 'nowrap',
      }}
    >
      {dot && (
        <span
          style={{
            width: isSmall ? 5 : 6,
            height: isSmall ? 5 : 6,
            borderRadius: '50%',
            backgroundColor: current.color,
            boxShadow: `0 0 6px ${current.color}`,
          }}
        />
      )}
      {children}
    </span>
  );
}
