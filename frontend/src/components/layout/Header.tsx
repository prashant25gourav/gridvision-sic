import type { NavTab } from '../../types/energy';
import { TabNav } from '../common/TabNav';
import { Badge } from '../common/Badge';

interface HeaderProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  apiConnected?: boolean;
}

export function Header({ activeTab, onTabChange, apiConnected = true }: HeaderProps) {
  return (
    <header
      style={{
        backgroundColor: 'rgba(8, 12, 21, 0.85)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--border-subtle)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}
    >
      <div
        style={{
          maxWidth: '1440px',
          margin: '0 auto',
          padding: '0.85rem 1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          flexWrap: 'wrap',
        }}
      >
        {/* Brand & Identity */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 16px rgba(6, 182, 212, 0.4)',
              color: '#ffffff',
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span
                style={{
                  fontSize: '1.25rem',
                  fontWeight: 700,
                  letterSpacing: '-0.02em',
                  color: 'var(--text-highlight)',
                }}
              >
                GridVision
              </span>
              <Badge variant="cyan" size="sm">
                v0.1 Shell
              </Badge>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0 }}>
              Smart Energy Analytics &amp; AI Copilot
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
          <TabNav activeTab={activeTab} onTabChange={onTabChange} />
        </div>

        {/* System & Connection Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.35rem 0.75rem',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid var(--border-subtle)',
              fontSize: '0.75rem',
            }}
          >
            <span className={apiConnected ? 'status-dot-pulse' : 'status-dot-amber'} />
            <span style={{ color: 'var(--text-secondary)' }}>
              {apiConnected ? 'FastAPI Connected' : 'Mock Telemetry Mode'}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
