import React from 'react';
import { ArrowRight } from 'lucide-react';
import { CapstoneVisual } from './CapstoneVisual';
import { ResearchVisual } from './ResearchVisual';
import './OverviewGateway.css';

interface OverviewGatewayProps {
  onExploreCapstone: () => void;
  onExploreResearch: () => void;
}

export const OverviewGateway: React.FC<OverviewGatewayProps> = ({
  onExploreCapstone,
  onExploreResearch,
}) => {
  return (
    <div className="overview-page-container">
      <div className="overview-inner">
        {/* 1. Header Section */}
        <header className="overview-header">
          <div className="overview-category-pill">
            <span>OVERVIEW</span>
          </div>
          <h1 className="overview-main-title">
            Explore GridVision
          </h1>
        </header>

        {/* 2. Two Large Equal Editorial Panels */}
        <div className="overview-grid" role="region" aria-label="Two sides of GridVision">
          {/* Panel 1: CAPSTONE */}
          <article
            className="overview-panel"
            onClick={onExploreCapstone}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onExploreCapstone();
              }
            }}
            tabIndex={0}
            role="button"
            aria-label="Explore Capstone Smart Energy Analytics"
          >
            {/* Visual Area */}
            <div className="overview-panel-visual">
              <CapstoneVisual />
            </div>

            {/* Editorial Content */}
            <div className="overview-panel-body">
              <div className="overview-panel-header">
                <span className="overview-eyebrow">CAPSTONE</span>
                <h2 className="overview-panel-title">
                  Smart Energy Analytics
                </h2>
                <p className="overview-panel-features">
                  Forecasting · Behavioral Segmentation · Anomaly Detection · AI Copilot
                </p>
              </div>

              {/* Action Button Footer */}
              <div className="overview-panel-footer">
                <button
                  type="button"
                  className="overview-cta-btn"
                  tabIndex={-1}
                  aria-hidden="true"
                >
                  <span>EXPLORE</span>
                  <ArrowRight size={17} className="overview-cta-arrow" />
                </button>
              </div>
            </div>
          </article>

          {/* Panel 2: RESEARCH STUDY */}
          <article
            className="overview-panel"
            onClick={onExploreResearch}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onExploreResearch();
              }
            }}
            tabIndex={0}
            role="button"
            aria-label="Explore Research Study on Temporal Cluster Instability"
          >
            {/* Visual Area */}
            <div className="overview-panel-visual">
              <ResearchVisual />
            </div>

            {/* Editorial Content */}
            <div className="overview-panel-body">
              <div className="overview-panel-header">
                <span className="overview-eyebrow">RESEARCH STUDY</span>
                <h2 className="overview-panel-title">
                  Temporal Cluster Instability as a Predictor of Extreme Household Load-Forecast Failure
                </h2>
                <p className="overview-panel-features">
                  Longitudinal behavioral analysis · Forecast failure · Statistical study
                </p>
              </div>

              {/* Action Button Footer */}
              <div className="overview-panel-footer">
                <button
                  type="button"
                  className="overview-cta-btn"
                  tabIndex={-1}
                  aria-hidden="true"
                >
                  <span>EXPLORE</span>
                  <ArrowRight size={17} className="overview-cta-arrow" />
                </button>
              </div>
            </div>
          </article>
        </div>
      </div>
    </div>
  );
};
