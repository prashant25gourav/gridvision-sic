import React from 'react';
import {
  LayoutDashboard,
  TrendingUp,
  Users,
  Activity,
  AlertTriangle,
  Sparkles,
  BookOpen,
  FileText,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import type { DashboardSection } from '../../types/dashboard';
import './DashboardSidebar.css';

interface DashboardSidebarProps {
  activeSection: DashboardSection;
  onSelectSection: (section: DashboardSection) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

interface NavItem {
  id: DashboardSection;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}

const OVERVIEW_ITEMS: NavItem[] = [
  { id: 'overview', label: 'Grid Overview', icon: LayoutDashboard },
];

const ANALYTICS_ITEMS: NavItem[] = [
  { id: 'demand', label: 'Demand Analysis', icon: Activity },
  { id: 'consumers', label: 'Consumer Intelligence', icon: Users },
  { id: 'anomalies', label: 'Anomaly Analysis', icon: AlertTriangle },
  { id: 'forecasting', label: 'Forecasting', icon: TrendingUp },
];

const INTELLIGENCE_ITEMS: NavItem[] = [
  { id: 'copilot', label: 'AI Copilot', icon: Sparkles },
];

const RESEARCH_ITEMS: NavItem[] = [
  { id: 'findings', label: 'Research Findings', icon: BookOpen },
  { id: 'methodology', label: 'Methodology', icon: FileText },
];

export const DashboardSidebar: React.FC<DashboardSidebarProps> = ({
  activeSection,
  onSelectSection,
  isCollapsed,
  onToggleCollapse,
  isOpenMobile,
  onCloseMobile,
}) => {
  const handleItemClick = (sectionId: DashboardSection) => {
    onSelectSection(sectionId);
    if (isOpenMobile) {
      onCloseMobile();
    }
  };

  const renderNavGroup = (title: string, items: NavItem[]) => (
    <div className="sidebar-group">
      {!isCollapsed ? (
        <span className="sidebar-group-title">{title}</span>
      ) : (
        <div className="sidebar-group-divider" aria-hidden="true" />
      )}
      <ul className="sidebar-nav-list" role="list">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive =
            activeSection === item.id ||
            (item.id === 'consumers' && activeSection === 'households') ||
            (item.id === 'demand' && activeSection === 'segmentation');

          return (
            <li key={item.id} className="sidebar-nav-item">
              <button
                type="button"
                className={`sidebar-nav-btn ${isActive ? 'active' : ''} ${isCollapsed ? 'collapsed' : ''}`}
                onClick={() => handleItemClick(item.id)}
                aria-current={isActive ? 'page' : undefined}
                aria-label={item.label}
                title={isCollapsed ? item.label : undefined}
              >
                <span className="sidebar-icon-wrapper">
                  <Icon size={18} className="sidebar-icon" />
                </span>
                {!isCollapsed && <span className="sidebar-label">{item.label}</span>}
                {isCollapsed && (
                  <span className="sidebar-tooltip" role="tooltip">
                    {item.label}
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          className="sidebar-mobile-backdrop"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      {/* Main Sidebar Element */}
      <aside
        className={`dashboard-sidebar ${isCollapsed ? 'collapsed' : 'expanded'} ${
          isOpenMobile ? 'mobile-open' : ''
        }`}
        aria-label="Dashboard workspace navigation"
      >
        <div className="sidebar-inner">
          <nav className="sidebar-nav" aria-label="Sections">
            {renderNavGroup('OVERVIEW', OVERVIEW_ITEMS)}
            {renderNavGroup('ANALYTICS', ANALYTICS_ITEMS)}
            {renderNavGroup('INTELLIGENCE', INTELLIGENCE_ITEMS)}
            {renderNavGroup('RESEARCH', RESEARCH_ITEMS)}
          </nav>

          {/* Bottom Sidebar Controls (Collapse / Expand) */}
          <div className="sidebar-footer">
            <button
              type="button"
              className={`sidebar-toggle-btn ${isCollapsed ? 'collapsed' : ''}`}
              onClick={onToggleCollapse}
              aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              <span className="sidebar-icon-wrapper">
                {isCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
              </span>
              {!isCollapsed && <span className="sidebar-toggle-text">Collapse</span>}
              {isCollapsed && (
                <span className="sidebar-tooltip" role="tooltip">
                  Expand sidebar
                </span>
              )}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
