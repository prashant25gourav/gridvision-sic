import React from 'react';
import { AlertTriangle, ShieldCheck, Activity, Search } from 'lucide-react';
import './Workspaces.css';

export const AnomalyWorkspace: React.FC = () => {
  return (
    <div className="workspace-container">
      <header className="workspace-header">
        <div className="workspace-header-title-row">
          <h1 className="workspace-title">Anomaly Detection</h1>
          <span className="workspace-scope-pill">MODULE P3</span>
        </div>
        <p className="workspace-subtitle">
          Isolation Forest anomaly scoring, residual threshold monitoring, and synthetic injection evaluation.
        </p>
      </header>

      <section className="workspace-card workspace-placeholder-card">
        <div className="workspace-placeholder-header">
          <AlertTriangle size={28} className="workspace-placeholder-icon" />
          <div>
            <h2 className="workspace-placeholder-title">Anomaly Workspace</h2>
            <p className="workspace-placeholder-desc">
              Scheduled for detailed analytics implementation in the next phase.
            </p>
          </div>
        </div>

        <div className="workspace-specs-grid">
          <div className="workspace-spec-item">
            <span className="spec-label">
              <ShieldCheck size={14} /> Detector Model
            </span>
            <span className="spec-val">Isolation Forest unsupervised scoring on consumption features</span>
          </div>
          <div className="workspace-spec-item">
            <span className="spec-label">
              <Activity size={14} /> Outlier Cutoff
            </span>
            <span className="spec-val">Residual anomaly threshold set to 0.70 normalized score</span>
          </div>
          <div className="workspace-spec-item">
            <span className="spec-label">
              <Search size={14} /> Synthetic Benchmarks
            </span>
            <span className="spec-val">Controlled spike and drop anomaly injection test harnesses</span>
          </div>
        </div>
      </section>
    </div>
  );
};
