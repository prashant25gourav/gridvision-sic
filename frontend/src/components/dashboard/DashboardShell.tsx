import React, { useState, useEffect } from 'react';
import { Menu } from 'lucide-react';
import type { DashboardSection } from '../../types/dashboard';
import { DashboardSidebar } from './DashboardSidebar';
import { DashboardOverviewWorkspace } from './workspaces/DashboardOverviewWorkspace';
import { ForecastingWorkspace } from './workspaces/ForecastingWorkspace';
import { HouseholdWorkspace } from './workspaces/HouseholdWorkspace';
import { SegmentationWorkspace } from './workspaces/SegmentationWorkspace';
import { AnomalyWorkspace } from './workspaces/AnomalyWorkspace';
import { CopilotWorkspace } from './workspaces/CopilotWorkspace';
import { ResearchFindingsWorkspace } from './workspaces/ResearchFindingsWorkspace';
import { ResearchMethodologyWorkspace } from './workspaces/ResearchMethodologyWorkspace';
import './DashboardShell.css';

interface DashboardShellProps {
  initialSection?: DashboardSection;
}

export const DashboardShell: React.FC<DashboardShellProps> = ({
  initialSection = 'overview',
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
        return <DashboardOverviewWorkspace onNavigateSection={setActiveSection} />;
      case 'forecasting':
        return <ForecastingWorkspace />;
      case 'households':
        return <HouseholdWorkspace />;
      case 'segmentation':
        return <SegmentationWorkspace />;
      case 'anomalies':
        return <AnomalyWorkspace />;
      case 'copilot':
        return <CopilotWorkspace />;
      case 'findings':
        return <ResearchFindingsWorkspace />;
      case 'methodology':
        return <ResearchMethodologyWorkspace />;
      default:
        return <DashboardOverviewWorkspace onNavigateSection={setActiveSection} />;
    }
  };

  return (
    <div className="dashboard-shell">
      {/* Persistent minimizable sidebar */}
      <DashboardSidebar
        activeSection={activeSection}
        onSelectSection={setActiveSection}
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
