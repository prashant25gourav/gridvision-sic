import React from 'react';
import { BookOpen, Scale, Award, FileSpreadsheet } from 'lucide-react';
import './Workspaces.css';

export const ResearchFindingsWorkspace: React.FC = () => {
  return (
    <div className="workspace-container">
      <header className="workspace-header">
        <div className="workspace-header-title-row">
          <h1 className="workspace-title">Research Findings</h1>
          <span className="workspace-scope-pill">MODULE P2</span>
        </div>
        <p className="workspace-subtitle">
          Empirical evaluation of temporal cluster instability as a predictor of extreme forecast failure.
        </p>
      </header>

      <section className="workspace-card workspace-placeholder-card">
        <div className="workspace-placeholder-header">
          <BookOpen size={28} className="workspace-placeholder-icon" />
          <div>
            <h2 className="workspace-placeholder-title">Research Study Findings</h2>
            <p className="workspace-placeholder-desc">
              Scheduled for detailed statistical table and visualization presentation in the next phase.
            </p>
          </div>
        </div>

        <div className="workspace-specs-grid">
          <div className="workspace-spec-item">
            <span className="spec-label">
              <Scale size={14} /> Statistical Design
            </span>
            <span className="spec-val">Odds Ratio (OR) regression and Wilcoxon rank-sum hypothesis testing</span>
          </div>
          <div className="workspace-spec-item">
            <span className="spec-label">
              <Award size={14} /> Metric Contracts
            </span>
            <span className="spec-val">Extreme forecast failure defined via 95th percentile standardized residual threshold</span>
          </div>
          <div className="workspace-spec-item">
            <span className="spec-label">
              <FileSpreadsheet size={14} /> Artifact Output
            </span>
            <span className="spec-val">Structured empirical table output from locked pipeline execution</span>
          </div>
        </div>
      </section>
    </div>
  );
};
