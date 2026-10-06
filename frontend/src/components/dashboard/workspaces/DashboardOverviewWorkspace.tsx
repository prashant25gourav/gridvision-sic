import React from 'react';
import { ArrowRight, Activity, Users, Layers, ShieldCheck } from 'lucide-react';
import { LoadChart } from '../../charts/LoadChart';
import { mockHourlyDemand } from '../../../mock/mockData';
import type { DashboardSection } from '../../../types/dashboard';
import './Workspaces.css';

interface DashboardOverviewWorkspaceProps {
  onNavigateSection: (section: DashboardSection) => void;
}

export const DashboardOverviewWorkspace: React.FC<DashboardOverviewWorkspaceProps> = ({
  onNavigateSection,
}) => {
  return (
    <div className="workspace-container">
      {/* Workspace Header */}
      <header className="workspace-header">
        <div className="workspace-header-title-row">
          <h1 className="workspace-title">Analytics Overview</h1>
          <span className="workspace-scope-pill">HOUSEHOLD ENERGY ANALYTICS</span>
        </div>
        <p className="workspace-subtitle">
          Household consumption patterns, forecasts, behavioral segments, and anomalies.
        </p>
      </header>

      {/* KPI / Structural Scope Strip */}
      <section className="workspace-kpi-grid" aria-label="Cohort parameters">
        <div className="workspace-kpi-card">
          <div className="workspace-kpi-header">
            <span className="workspace-kpi-label">Sample Cohort</span>
            <Users size={15} className="workspace-kpi-icon" />
          </div>
          <div className="workspace-kpi-value">620</div>
          <p className="workspace-kpi-caption">
            Stratified sample of flat-rate households across ACORN groups
          </p>
        </div>

        <div className="workspace-kpi-card">
          <div className="workspace-kpi-header">
            <span className="workspace-kpi-label">Behavioral Clusters</span>
            <Layers size={15} className="workspace-kpi-icon" />
          </div>
          <div className="workspace-kpi-value">k = 4</div>
          <p className="workspace-kpi-caption">
            Four behavioral segments aligned across time
          </p>
        </div>

        <div className="workspace-kpi-card">
          <div className="workspace-kpi-header">
            <span className="workspace-kpi-label">Evaluation Horizon</span>
            <Activity size={15} className="workspace-kpi-icon" />
          </div>
          <div className="workspace-kpi-value">w + 1</div>
          <p className="workspace-kpi-caption">
            Next usable window
          </p>
        </div>

        <div className="workspace-kpi-card">
          <div className="workspace-kpi-header">
            <span className="workspace-kpi-label">Anomaly Detection</span>
            <ShieldCheck size={15} className="workspace-kpi-icon" />
          </div>
          <div className="workspace-kpi-value">Isolation Forest</div>
          <p className="workspace-kpi-caption">
            Detect unusual household consumption patterns
          </p>
        </div>
      </section>

      {/* Primary Analytical Visualization Area */}
      <section className="workspace-card" aria-label="Cohort consumption profile">
        <div className="workspace-card-header">
          <div>
            <h2 className="workspace-card-title">Cohort Consumption Profile</h2>
            <p className="workspace-card-subtitle">
              Half-hourly aggregated household consumption across the study cohort
            </p>
          </div>
        </div>
        <div className="workspace-chart-wrapper">
          <LoadChart data={mockHourlyDemand} height={260} />
        </div>
      </section>

      {/* Secondary Modular Entry Points */}
      <div className="workspace-grid-two-col">
        {/* Behavioral Segmentation Entry */}
        <section className="workspace-card">
          <div className="workspace-card-header">
            <div>
              <h2 className="workspace-card-title">Behavioral Segmentation</h2>
              <p className="workspace-card-subtitle">
                Four distinct longitudinal consumption patterns identified via K-Means
              </p>
            </div>
          </div>
          <div className="workspace-segment-list">
            <div className="workspace-segment-item">
              <span className="segment-bullet segment-c0" />
              <div className="segment-info">
                <span className="segment-name">Cluster 0: Evening Peakers</span>
                <span className="segment-desc">Pronounced 18:00–21:00 evening consumption peak</span>
              </div>
            </div>
            <div className="workspace-segment-item">
              <span className="segment-bullet segment-c1" />
              <div className="segment-info">
                <span className="segment-name">Cluster 1: Baseload / Flat</span>
                <span className="segment-desc">Low variance steady-state consumption across all hours</span>
              </div>
            </div>
            <div className="workspace-segment-item">
              <span className="segment-bullet segment-c2" />
              <div className="segment-info">
                <span className="segment-name">Cluster 2: Daytime Active</span>
                <span className="segment-desc">Elevated daytime consumption between 09:00 and 16:00</span>
              </div>
            </div>
            <div className="workspace-segment-item">
              <span className="segment-bullet segment-c3" />
              <div className="segment-info">
                <span className="segment-name">Cluster 3: Dual Peak</span>
                <span className="segment-desc">Bimodal morning and evening consumption peaks</span>
              </div>
            </div>
          </div>
          <div className="workspace-card-footer">
            <button
              type="button"
              className="workspace-link-btn"
              onClick={() => onNavigateSection('segmentation')}
            >
              <span>Explore Segmentation</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </section>

        {/* Household Telemetry Entry */}
        <section className="workspace-card">
          <div className="workspace-card-header">
            <div>
              <h2 className="workspace-card-title">Household Explorer</h2>
              <p className="workspace-card-subtitle">
                Per-household consumption profiles, Acorn demographics, and tariff groups
              </p>
            </div>
          </div>
          <div className="workspace-cohort-summary">
            <div className="cohort-stat">
              <span className="cohort-stat-label">Demographic Stratification</span>
              <span className="cohort-stat-val">Acorn Groups A–Q</span>
            </div>
            <div className="cohort-stat">
              <span className="cohort-stat-label">Tariff Class</span>
              <span className="cohort-stat-val">Standard Flat Rate (Locked)</span>
            </div>
            <div className="cohort-stat">
              <span className="cohort-stat-label">Observation Window</span>
              <span className="cohort-stat-val">56-Day Common Calendar</span>
            </div>
            <div className="cohort-stat">
              <span className="cohort-stat-label">Sample Size</span>
              <span className="cohort-stat-val">620 Households</span>
            </div>
          </div>
          <div className="workspace-card-footer">
            <button
              type="button"
              className="workspace-link-btn"
              onClick={() => onNavigateSection('households')}
            >
              <span>Explore Household Profiles</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};
