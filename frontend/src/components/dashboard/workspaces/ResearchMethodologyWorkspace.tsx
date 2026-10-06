import React from 'react';
import { FileText, Shield, KeyRound, CalendarCheck } from 'lucide-react';
import './Workspaces.css';

export const ResearchMethodologyWorkspace: React.FC = () => {
  return (
    <div className="workspace-container">
      <header className="workspace-header">
        <div className="workspace-header-title-row">
          <h1 className="workspace-title">Research Methodology</h1>
          <span className="workspace-scope-pill">PROTOCOL LOCKED</span>
        </div>
        <p className="workspace-subtitle">
          Locked calibration design, sequential calendar windows, and research integrity rules.
        </p>
      </header>

      <section className="workspace-card workspace-placeholder-card">
        <div className="workspace-placeholder-header">
          <FileText size={28} className="workspace-placeholder-icon" />
          <div>
            <h2 className="workspace-placeholder-title">Locked Research Protocol</h2>
            <p className="workspace-placeholder-desc">
              Scheduled for detailed protocol and workflow visualization in the next phase.
            </p>
          </div>
        </div>

        <div className="workspace-specs-grid">
          <div className="workspace-spec-item">
            <span className="spec-label">
              <CalendarCheck size={14} /> Common Calendar Windows
            </span>
            <span className="spec-val">Sequential 56-day windows synchronized across all households (14 windows total)</span>
          </div>
          <div className="workspace-spec-item">
            <span className="spec-label">
              <KeyRound size={14} /> Calibration Assignment
            </span>
            <span className="spec-val">First 2 usable 56-day windows per household strictly reserved for calibration</span>
          </div>
          <div className="workspace-spec-item">
            <span className="spec-label">
              <Shield size={14} /> Leakage Prevention
            </span>
            <span className="spec-val">No temporal lookahead, locked Hungarian alignment, zero data contamination</span>
          </div>
        </div>
      </section>
    </div>
  );
};
