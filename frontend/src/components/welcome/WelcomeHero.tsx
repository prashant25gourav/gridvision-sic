import React from 'react';
import { ArrowRight, Sun, Moon } from 'lucide-react';
import './WelcomeHero.css';

interface WelcomeHeroProps {
  onNavigateOverview: () => void;
  onNavigateDashboard: () => void;
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
}

export const WelcomeHero: React.FC<WelcomeHeroProps> = ({
  onNavigateOverview,
  onNavigateDashboard,
  theme = 'dark',
  onToggleTheme,
}) => {
  return (
    <section className="welcome-hero-container">
      {/* 1. Structural Architectural Divide Grid (1 | 3 | 4 | 3 | 1 cols) */}
      <div className="welcome-grid-overlay" aria-hidden="true">
        <div className="welcome-grid-columns">
          <div className="welcome-grid-col-1" />
          <div className="welcome-grid-col-3a" />
          <div className="welcome-grid-col-4" />
          <div className="welcome-grid-col-3b" />
          <div className="welcome-grid-col-1b" />
        </div>
      </div>

      {/* 2. Fullscreen Background Image with Adaptive Dual Scrim for Seamless Theme Cross-Fade */}
      <div
        className="welcome-hero-bg"
        style={{ backgroundImage: `url('/images/gridvision-hero.png')` }}
      >
        <div className="welcome-hero-scrim welcome-hero-scrim-dark" aria-hidden="true" />
        <div className="welcome-hero-scrim welcome-hero-scrim-light" aria-hidden="true" />
      </div>

      {/* 3. Top Navigation: Theme Control ONLY (Top-Right) */}
      <header className="welcome-top-nav">
        <div className="welcome-nav-actions">
          {onToggleTheme && (
            <button
              type="button"
              className="welcome-theme-toggle"
              onClick={onToggleTheme}
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
              <span>{theme === 'dark' ? 'LIGHT' : 'DARK'}</span>
            </button>
          )}
        </div>
      </header>

      {/* 4. Central Dominant Hero Content */}
      <div className="welcome-hero-content">
        {/* Category Pill: High Readability, Restrained, Non-Neon */}
        <div className="welcome-hero-pill">
          <span>ENERGY ANALYTICS &amp; RESEARCH</span>
        </div>

        {/* Central Dominant Title */}
        <h1 className="welcome-hero-title">
          GRIDVISION
        </h1>

        {/* Two Prominent, Balanced Buttons */}
        <div className="welcome-hero-actions">
          <button
            type="button"
            className="hero-btn hero-btn-overview"
            onClick={onNavigateOverview}
            aria-label="View Project Overview"
          >
            OVERVIEW
          </button>

          <button
            type="button"
            className="hero-btn hero-btn-dashboard"
            onClick={onNavigateDashboard}
            aria-label="Enter Workspace Dashboard"
          >
            <span>DASHBOARD</span>
            <ArrowRight size={18} className="hero-btn-arrow" aria-hidden="true" />
          </button>
        </div>
      </div>
    </section>
  );
};
