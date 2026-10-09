import React, { useState, useEffect } from 'react';
import { Menu } from 'lucide-react';
import type { DashboardSection } from '../../types/dashboard';
import { DashboardSidebar } from './DashboardSidebar';
import { DashboardOverviewWorkspace } from './workspaces/DashboardOverviewWorkspace';
import { DemandAnalysisWorkspace } from './workspaces/DemandAnalysisWorkspace';
import { ConsumerIntelligenceWorkspace } from './workspaces/ConsumerIntelligenceWorkspace';
import { ForecastingWorkspace } from './workspaces/ForecastingWorkspace';
import { AnomalyWorkspace } from './workspaces/AnomalyWorkspace';
import { CopilotWorkspace } from './workspaces/CopilotWorkspace';
import './DashboardShell.css';

interface DashboardShellProps {
  initialSection?: DashboardSection;
  onSectionChange?: (section: DashboardSection) => void;
  onNavigateOverview?: (anchor?: string) => void;
}

export const DashboardShell: React.FC<DashboardShellProps> = ({
  initialSection = 'overview',
  onSectionChange,
  onNavigateOverview,
}) => {
  const [activeSection, setActiveSection] = useState<DashboardSection>(initialSection);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('gridvision_sidebar_collapsed');
      return saved === 'true';
    }
    return false;
  });
  const [isOpenMobile, setIsOpenMobile] = useState<boolean>(false);

  // Sync initialSection prop if changed externally
  useEffect(() => {
    setActiveSection(initialSection);
  }, [initialSection]);

  const handleSelectSection = (sec: DashboardSection) => {
    setActiveSection(sec);
    onSectionChange?.(sec);
  };

  const handleToggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('gridvision_sidebar_collapsed', String(next));
      return next;
    });
  };

  const renderActiveWorkspace = () => {
    switch (activeSection) {
      case 'overview':
        return (
          <DashboardOverviewWorkspace
            onNavigateSection={handleSelectSection}
            onNavigateOverview={onNavigateOverview}
          />
        );
      case 'demand':
      case 'segmentation':
        return <DemandAnalysisWorkspace onNavigateOverview={onNavigateOverview} />;
      case 'consumers':
        return (
          <ConsumerIntelligenceWorkspace
            initialTab="rankings"
            onNavigateSection={handleSelectSection}
            onNavigateOverview={onNavigateOverview}
          />
        );
      case 'households':
        return (
          <ConsumerIntelligenceWorkspace
            initialTab="explorer"
            onNavigateSection={handleSelectSection}
            onNavigateOverview={onNavigateOverview}
          />
        );
      case 'anomalies':
        return (
          <AnomalyWorkspace
            onNavigateSection={handleSelectSection}
            onNavigateOverview={onNavigateOverview}
          />
        );
      case 'forecasting':
        return <ForecastingWorkspace onNavigateOverview={onNavigateOverview} />;
      case 'copilot':
        return <CopilotWorkspace onNavigateOverview={onNavigateOverview} />;
      default:
        return (
          <DashboardOverviewWorkspace
            onNavigateSection={handleSelectSection}
            onNavigateOverview={onNavigateOverview}
          />
        );
    }
  };

  return (
    <div className="dashboard-shell">
      {/* Persistent minimizable sidebar */}
      <DashboardSidebar
        activeSection={activeSection}
        onSelectSection={handleSelectSection}
        isCollapsed={isCollapsed}
        onToggleCollapse={handleToggleCollapse}
        isOpenMobile={isOpenMobile}
        onCloseMobile={() => setIsOpenMobile(false)}
      />

      {/* Main Workspace Area */}
      <div className="dashboard-workspace-wrapper">
        {/* Mobile Sub-Header with Navigation Trigger */}
        <div className="dashboard-mobile-nav-bar">
          <button
            type="button"
            className="dashboard-mobile-trigger"
            onClick={() => setIsOpenMobile(true)}
            aria-label="Open navigation menu"
          >
            <Menu size={18} />
            <span className="dashboard-mobile-section-name">
              {activeSection.toUpperCase()}
            </span>
          </button>
        </div>

        {/* Dynamic Workspace Content */}
        <main className="dashboard-workspace-content" role="region" aria-label="Dashboard Workspace">
          {renderActiveWorkspace()}
        </main>
      </div>
    </div>
  );
};
