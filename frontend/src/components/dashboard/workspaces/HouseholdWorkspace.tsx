import React from 'react';
import { Users, Filter, BarChart2, CheckCircle2 } from 'lucide-react';
import './Workspaces.css';

export const HouseholdWorkspace: React.FC = () => {
  return (
    <div className="workspace-container">
      <header className="workspace-header">
        <div className="workspace-header-title-row">
          <h1 className="workspace-title">Household Explorer</h1>
          <span className="workspace-scope-pill">MODULE P1</span>
        </div>
        <p className="workspace-subtitle">
          Individual smart-meter consumption signatures, demographic attributes, and cluster assignments.
        </p>
      </header>

      <section className="workspace-card workspace-placeholder-card">
        <div className="workspace-placeholder-header">
          <Users size={28} className="workspace-placeholder-icon" />
          <div>
            <h2 className="workspace-placeholder-title">Household Workspace</h2>
            <p className="workspace-placeholder-desc">
              Scheduled for detailed analytics implementation in the next phase.
            </p>
          </div>
        </div>

        <div className="workspace-specs-grid">
          <div className="workspace-spec-item">
            <span className="spec-label">
              <Filter size={14} /> Stratification
            </span>
            <span className="spec-val">Representative sampling across all London ACORN demographic groups</span>
          </div>
          <div className="workspace-spec-item">
            <span className="spec-label">
              <BarChart2 size={14} /> Behavioral Signature
            </span>
            <span className="spec-val">Mean daily consumption profile across 48 half-hour intervals</span>
          </div>
          <div className="workspace-spec-item">
            <span className="spec-label">
              <CheckCircle2 size={14} /> Tariff Class
            </span>
            <span className="spec-val">Standard flat-rate residential meters (clean baseline)</span>
          </div>
        </div>
      </section>
    </div>
  );
};
