import React from 'react';
import { Sparkles, MessageSquare, Database, FileCheck } from 'lucide-react';
import './Workspaces.css';

export const CopilotWorkspace: React.FC = () => {
  return (
    <div className="workspace-container">
      <header className="workspace-header">
        <div className="workspace-header-title-row">
          <h1 className="workspace-title">Energy Copilot</h1>
          <span className="workspace-scope-pill">MODULE P4</span>
        </div>
        <p className="workspace-subtitle">
          Retrieval-augmented intelligence for querying household consumption patterns, research findings, and behavioral segments.
        </p>
      </header>

      <section className="workspace-card workspace-placeholder-card">
        <div className="workspace-placeholder-header">
          <Sparkles size={28} className="workspace-placeholder-icon" />
          <div>
            <h2 className="workspace-placeholder-title">AI Copilot Workspace</h2>
            <p className="workspace-placeholder-desc">
              Scheduled for detailed interactive implementation in the next phase.
            </p>
          </div>
        </div>

        <div className="workspace-specs-grid">
          <div className="workspace-spec-item">
            <span className="spec-label">
              <Database size={14} /> Vector Store
            </span>
            <span className="spec-val">FAISS index indexing locked research artifacts and metrics</span>
          </div>
          <div className="workspace-spec-item">
            <span className="spec-label">
              <FileCheck size={14} /> Grounding
            </span>
            <span className="spec-val">Strictly cited answers backed by empirical pipeline outputs</span>
          </div>
          <div className="workspace-spec-item">
            <span className="spec-label">
              <MessageSquare size={14} /> Telemetry Querying
            </span>
            <span className="spec-val">Natural language lookups for cluster profiles and anomaly events</span>
          </div>
        </div>
      </section>
    </div>
  );
};
