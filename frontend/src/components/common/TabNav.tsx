import type { NavTab } from '../../types/energy';

interface TabNavProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
}

export function TabNav({ activeTab, onTabChange }: TabNavProps) {
  const tabs: { id: NavTab; label: string; icon: string }[] = [
    { id: 'overview', label: 'Overview', icon: 'M3 3h7v7H3zm11 0h7v7h-7zM3 14h7v7H3zm11 0h7v7h-7z' },
    { id: 'households', label: 'Household Explorer', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { id: 'trajectories', label: 'Behavioral Trajectory', icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6' },
    { id: 'copilot', label: 'Copilot', icon: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
  ];

  return (
    <nav
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.35rem',
        backgroundColor: 'rgba(14, 22, 38, 0.7)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-subtle)',
        overflowX: 'auto',
      }}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 1rem',
              borderRadius: 'var(--radius-md)',
              border: 'none',
              backgroundColor: isActive ? 'var(--accent-cyan)' : 'transparent',
              color: isActive ? '#ffffff' : 'var(--text-secondary)',
              fontWeight: isActive ? 600 : 500,
              fontSize: '0.85rem',
              cursor: 'pointer',
              transition: 'all var(--transition-fast)',
              whiteSpace: 'nowrap',
              boxShadow: isActive ? '0 2px 10px rgba(6, 182, 212, 0.35)' : 'none',
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ flexShrink: 0 }}
            >
              <path d={tab.icon} />
            </svg>
            <span>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
