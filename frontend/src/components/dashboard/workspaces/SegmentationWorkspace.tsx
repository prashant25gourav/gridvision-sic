import React from 'react';
import { Network, GitCompare, RefreshCw, Layers } from 'lucide-react';
import './Workspaces.css';

export const SegmentationWorkspace: React.FC = () => {
  return (
    <div className="workspace-container">
      <header className="workspace-header">
        <div className="workspace-header-title-row">
          <h1 className="workspace-title">Behavioral Segmentation</h1>
          <span className="workspace-scope-pill">MODULE P1</span>
        </div>
        <p className="workspace-subtitle">
          Longitudinal K-Means clustering, Hungarian matching, and temporal stability analysis.
        </p>
      </header>

      <section className="workspace-card workspace-placeholder-card">
        <div className="workspace-placeholder-header">
          <Network size={28} className="workspace-placeholder-icon" />
          <div>
            <h2 className="workspace-placeholder-title">Segmentation Workspace</h2>
            <p className="workspace-placeholder-desc">
              Scheduled for detailed analytics implementation in the next phase.
            </p>
          </div>
        </div>

        <div className="workspace-specs-grid">
          <div className="workspace-spec-item">
            <span className="spec-label">
              <Layers size={14} /> Cluster Count
            </span>
            <span className="spec-val">k = 4 clusters selected via Silhouette & Elbow criteria</span>
          </div>
          <div className="workspace-spec-item">
            <span className="spec-label">
              <RefreshCw size={14} /> Temporal Alignment
            </span>
            <span className="spec-val">Hungarian algorithm mapping centroids across sequential windows</span>
          </div>
          <div className="workspace-spec-item">
            <span className="spec-label">
              <GitCompare size={14} /> Transition Tracking
            </span>
            <span className="spec-val">Household cluster transitions across successive 56-day common-calendar windows</span>
          </div>
        </div>
      </section>
    </div>
  );
};
