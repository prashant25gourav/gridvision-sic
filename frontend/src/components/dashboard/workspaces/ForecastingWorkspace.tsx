import React from 'react';
import { TrendingUp, Clock, Target, Layers } from 'lucide-react';
import './Workspaces.css';

export const ForecastingWorkspace: React.FC = () => {
  return (
    <div className="workspace-container">
      <header className="workspace-header">
        <div className="workspace-header-title-row">
          <h1 className="workspace-title">Forecasting</h1>
          <span className="workspace-scope-pill">MODULE P2</span>
        </div>
        <p className="workspace-subtitle">
          Day-ahead household load forecasting, calibration assignment, and standardized residual tracking.
        </p>
      </header>

      <section className="workspace-card workspace-placeholder-card">
        <div className="workspace-placeholder-header">
          <TrendingUp size={28} className="workspace-placeholder-icon" />
          <div>
            <h2 className="workspace-placeholder-title">Forecasting Workspace</h2>
            <p className="workspace-placeholder-desc">
              Scheduled for detailed analytics implementation in the next phase.
            </p>
          </div>
        </div>

        <div className="workspace-specs-grid">
          <div className="workspace-spec-item">
            <span className="spec-label">
              <Clock size={14} /> Horizon
            </span>
            <span className="spec-val">48 half-hours (24 hours day-ahead)</span>
          </div>
          <div className="spec-item workspace-spec-item">
            <span className="spec-label">
              <Layers size={14} /> Architecture
            </span>
            <span className="spec-val">Global pooled vs. Per-cluster LightGBM baselines</span>
          </div>
          <div className="spec-item workspace-spec-item">
            <span className="spec-label">
              <Target size={14} /> Calibration
            </span>
            <span className="spec-val">Calibration-window evaluation with median AE standardization</span>
          </div>
        </div>
      </section>
    </div>
  );
};
