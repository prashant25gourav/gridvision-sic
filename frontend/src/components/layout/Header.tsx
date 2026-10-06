import React from 'react';
import { Sun, Moon } from 'lucide-react';
import './Header.css';

interface HeaderProps {
  currentMode: 'overview' | 'dashboard';
  onNavigateWelcome: () => void;
  onNavigateOverview: () => void;
  onNavigateDashboard: () => void;
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentMode,
  onNavigateWelcome,
  onNavigateOverview,
  onNavigateDashboard,
  theme = 'dark',
  onToggleTheme,
}) => {
  return (
    <header className={`app-header ${currentMode === 'dashboard' ? 'dashboard-mode' : ''}`}>
      <div className="app-header-inner">
        {/* 1. Brand Logo & Telemetry Indicator */}
        <button
          type="button"
          className="app-header-brand"
          onClick={onNavigateWelcome}
          aria-label="Return to GridVision Welcome page"
        >
          <span className="app-header-brand-dot" aria-hidden="true" />
          <span className="app-header-brand-text">GRIDVISION</span>
        </button>

        {/* 2. Primary Application Navigation */}
        <nav className="app-header-nav" aria-label="Application navigation">
          <button
            type="button"
            className={`app-header-nav-link ${currentMode === 'overview' ? 'active' : ''}`}
            onClick={onNavigateOverview}
            aria-current={currentMode === 'overview' ? 'page' : undefined}
          >
            Overview
          </button>
          <button
            type="button"
            className={`app-header-nav-link ${currentMode === 'dashboard' ? 'active' : ''}`}
            onClick={onNavigateDashboard}
            aria-current={currentMode === 'dashboard' ? 'page' : undefined}
          >
            Dashboard
          </button>
        </nav>

        {/* 3. Theme Toggle Control (Strictly Top-Right) */}
        <div className="app-header-actions">
          {onToggleTheme && (
            <button
              type="button"
              className="app-header-theme-toggle"
              onClick={onToggleTheme}
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
              <span>{theme === 'dark' ? 'LIGHT' : 'DARK'}</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
