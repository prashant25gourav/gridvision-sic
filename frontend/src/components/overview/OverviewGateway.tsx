import React, { useEffect } from 'react';
import { ArrowDown, ArrowRight, LayoutDashboard, Activity, Users, AlertTriangle, TrendingUp, Sparkles } from 'lucide-react';
import type { DashboardSection } from '../../types/dashboard';
import { ResearchVisual } from './ResearchVisual';
import './OverviewGateway.css';

interface OverviewGatewayProps {
  onExploreCapstone?: () => void;
  onExploreResearch?: () => void;
  onLaunchDashboard?: () => void;
  onNavigateSection?: (section: DashboardSection) => void;
  onQueryCopilot?: (query: string) => void;
}

export const OverviewGateway: React.FC<OverviewGatewayProps> = ({
  onLaunchDashboard = () => {},
  onNavigateSection,
}) => {
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash) {
      const hashId = window.location.hash.replace('#', '');
      const el = document.getElementById(hashId);
      if (el) {
        setTimeout(() => {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 120);
      }
    }
  }, []);

  const scrollToSection = (sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      if (typeof window !== 'undefined') {
        window.history.replaceState(null, '', `#${sectionId}`);
      }
    }
  };

  const handleOpenSection = (sectionName: DashboardSection) => {
    if (onNavigateSection) {
      onNavigateSection(sectionName);
    } else {
      onLaunchDashboard();
    }
  };

  return (
    <article className="overview-page-container">
      <div className="overview-inner">
        {/* ========================================================================= */}
        {/* MASTHEAD HERO                                                             */}
        {/* ========================================================================= */}
        <header className="overview-editorial-hero">
          <div className="editorial-meta-line">
            <span className="editorial-kicker">SYSTEM REFERENCE MANUAL &bull; TECHNICAL SPECIFICATION</span>
            <span className="editorial-version-tag">STABLE 1.0 &bull; VERIFIED COHORT</span>
          </div>

          <h1 className="editorial-headline">GridVision System Reference</h1>

          <div className="editorial-strapline">
            A comprehensive textbook guide to methodology, telemetry, analytics pipelines, and dashboard operations.
          </div>

          <p className="editorial-lede">
            GridVision is an operational electricity intelligence platform designed for utility operators,
            grid engineers, and energy analysts. It transforms raw high-frequency smart meter readings into
            interpretable behavioral archetypes, system load profiles, anomaly detections, and day-ahead demand
            forecasts through an automated, reproducible analytical pipeline.
          </p>

          <div className="editorial-hero-actions">
            <button
              type="button"
              className="editorial-btn primary"
              onClick={onLaunchDashboard}
            >
              <span>Launch Live Dashboard</span>
              <ArrowRight size={16} />
            </button>
            <button
              type="button"
              className="editorial-btn text-link"
              onClick={() => scrollToSection('sec-intro')}
            >
              <span>Read Documentation</span>
              <ArrowDown size={14} />
            </button>
          </div>
        </header>

        {/* ========================================================================= */}
        {/* NAVIGATION INDEX BAR                                                      */}
        {/* ========================================================================= */}
        <nav className="editorial-index-bar" aria-label="Reference Table of Contents">
          <span className="index-bar-label">CHAPTER INDEX:</span>
          <div className="index-bar-links">
            <button type="button" onClick={() => scrollToSection('sec-intro')}>
              § 1.0 Introduction
            </button>
            <span className="index-divider">/</span>
            <button type="button" onClick={() => scrollToSection('sec-dataset')}>
              § 2.0 Dataset &amp; Telemetry
            </button>
            <span className="index-divider">/</span>
            <button type="button" onClick={() => scrollToSection('sec-workflow')}>
              § 3.0 Processing Workflow
            </button>
            <span className="index-divider">/</span>
            <button type="button" onClick={() => scrollToSection('sec-features')}>
              § 4.0 Dashboard Features
            </button>
            <span className="index-divider">/</span>
            <button type="button" onClick={() => scrollToSection('sec-research')}>
              § 5.0 Research Appendix
            </button>
          </div>
        </nav>

        {/* ========================================================================= */}
        {/* 1. INTRODUCTION                                                           */}
        {/* ========================================================================= */}
        <section id="sec-intro" className="editorial-section" aria-label="Introduction">
          <div className="section-number-header">
            <span className="section-index-num">§ 1.0</span>
            <div className="section-header-text">
              <span className="section-eyebrow">FOUNDATIONS &amp; OBJECTIVES</span>
              <h2 className="section-heading">Introduction</h2>
            </div>
          </div>

          <div className="editorial-prose-block">
            <p className="editorial-body-text">
              Modern power distribution networks are undergoing a fundamental transformation driven by the electrification
              of heating and transport, the proliferation of distributed energy resources, and the widespread rollout of
              advanced metering infrastructure (AMI). While modern smart meters capture half-hourly kilowatt-hour readings
              at scale, utility operators frequently struggle to translate these high-volume time-series streams into actionable
              operational intelligence.
            </p>

            <div className="textbook-callout">
              <strong>Core Engineering Objective:</strong> Bridge the operational divide between raw meter telemetry and grid
              dispatch decisions through automated behavioral clustering, empirical diurnal profiling, anomaly screening, and
              day-ahead forecasting.
            </div>

            <h3 className="module-subheading" style={{ marginTop: '1rem' }}>Key Architectural Principles</h3>
            <ul className="textbook-points-list">
              <li>
                <span className="point-number">1.1</span>
                <div className="point-body">
                  <strong>Strict Empirical Grounding:</strong> All analyses, distributions, and feature vectors are derived
                  directly from real-world smart meter records without synthetic profile generation or imputed data fabrication.
                </div>
              </li>
              <li>
                <span className="point-number">1.2</span>
                <div className="point-body">
                  <strong>Temporal Non-Contamination:</strong> Longitudinal evaluation relies on strictly partitioned,
                  non-overlapping observation epochs with zero future-data leakage across model training, clustering, and testing phases.
                </div>
              </li>
              <li>
                <span className="point-number">1.3</span>
                <div className="point-body">
                  <strong>Interpretable Analytics:</strong> Every customer segmentation and anomaly score is supported by transparent,
                  standardized electrical engineering metrics rather than opaque black-box representations.
                </div>
              </li>
              <li>
                <span className="point-number">1.4</span>
                <div className="point-body">
                  <strong>Verified Operator Assistance:</strong> The embedded AI Copilot retrieves information strictly from computed
                  artifacts and runbooks, guaranteeing factual answers with cited calculations.
                </div>
              </li>
            </ul>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 2. DATASET                                                                */}
        {/* ========================================================================= */}
        <section id="sec-dataset" className="editorial-section" aria-label="Dataset Specifications">
          <div className="section-number-header">
            <span className="section-index-num">§ 2.0</span>
            <div className="section-header-text">
              <span className="section-eyebrow">DATA ARCHITECTURE &amp; PREPROCESSING</span>
              <h2 className="section-heading">Dataset &amp; Smart Meter Telemetry</h2>
            </div>
          </div>

          <div className="editorial-prose-block">
            <p className="editorial-body-text">
              GridVision is evaluated on smart meter records from the landmark <strong>Low Carbon London (LCL)</strong> project
              conducted by UK Power Networks. This trial monitored thousands of residential consumers in Greater London,
              recording consumption at high temporal resolution under standard flat-rate and dynamic tariffs.
            </p>

            <div className="textbook-table-wrapper">
              <table className="textbook-table">
                <thead>
                  <tr>
                    <th style={{ width: '28%' }}>Parameter</th>
                    <th style={{ width: '24%' }}>Specification</th>
                    <th>Analytical Significance</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>Sampling Interval</strong></td>
                    <td className="mono">30 Minutes</td>
                    <td>Yields 48 discrete observation slots per diurnal cycle (00:00 to 23:30).</td>
                  </tr>
                  <tr>
                    <td><strong>Telemetry Unit</strong></td>
                    <td className="mono">kWh / half-hour</td>
                    <td>Converted to continuous power using <span className="mono">kW = kWh × 2</span> for power-flow analysis.</td>
                  </tr>
                  <tr>
                    <td><strong>Census Population</strong></td>
                    <td className="mono">5,566 Households</td>
                    <td>Total smart meters deployed during the UK Power Networks trial.</td>
                  </tr>
                  <tr>
                    <td><strong>Flat-Rate Cohort</strong></td>
                    <td className="mono">4,443 Households</td>
                    <td>Households on standard tariffs without external price-elastic distortion.</td>
                  </tr>
                  <tr>
                    <td><strong>Balanced Working Sample</strong></td>
                    <td className="mono">570 Households</td>
                    <td>Rigorous balanced sub-cohort verified for continuous recording across all study windows.</td>
                  </tr>
                  <tr>
                    <td><strong>Observation Epoch</strong></td>
                    <td className="mono">56 Days (8 Weeks)</td>
                    <td>Length of non-overlapping longitudinal analytical windows (W01 to W14).</td>
                  </tr>
                  <tr>
                    <td><strong>Total Usable Windows</strong></td>
                    <td className="mono">6,191 Windows</td>
                    <td>Total validated household-window instances analyzed across the longitudinal study.</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h3 className="module-subheading">Data Sanitization &amp; Quality Control Rules</h3>
            <ul className="textbook-points-list">
              <li>
                <span className="point-number">QC-1</span>
                <div className="point-body">
                  <strong>Completeness Gate:</strong> An analytical window requires &ge; 90% non-missing half-hourly observations.
                  Windows failing this threshold are rejected to prevent sampling bias.
                </div>
              </li>
              <li>
                <span className="point-number">QC-2</span>
                <div className="point-body">
                  <strong>Non-Negativity Verification:</strong> Readings must strictly satisfy <span className="mono">kWh &ge; 0</span>.
                  Spurious negative records from meter reboot transients are screened out.
                </div>
              </li>
              <li>
                <span className="point-number">QC-3</span>
                <div className="point-body">
                  <strong>Zero-Variance Rejection:</strong> Continuous flatline series indicating vacated premises or disconnected
                  CT sensors are identified and isolated.
                </div>
              </li>
              <li>
                <span className="point-number">QC-4</span>
                <div className="point-body">
                  <strong>UTC Timestamp Alignment:</strong> All timestamps are normalized to UTC to prevent phase shifts across
                  British Summer Time (BST) transitions.
                </div>
              </li>
            </ul>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 3. WORKFLOW & FLOWCHART                                                   */}
        {/* ========================================================================= */}
        <section id="sec-workflow" className="editorial-section" aria-label="Analytical Workflow">
          <div className="section-number-header">
            <span className="section-index-num">§ 3.0</span>
            <div className="section-header-text">
              <span className="section-eyebrow">PROCESSING PIPELINE</span>
              <h2 className="section-heading">Analytical Workflow</h2>
            </div>
          </div>

          <div className="editorial-prose-block">
            <p className="editorial-body-text">
              GridVision processes raw electricity telemetry through an ordered 5-stage pipeline.
              Data transforms deterministically from raw telemetry streams into standardized behavioral dimensions,
              branching into specialized analytics engines before publishing to the dashboard and AI copilot.
            </p>

            {/* FLOWCHART SVG */}
            <div className="textbook-flowchart-container">
              <svg
                viewBox="0 0 880 340"
                style={{ width: '100%', height: 'auto', display: 'block' }}
                aria-label="GridVision End-to-End Analytical Workflow Flowchart"
              >
                <defs>
                  <marker id="flowArrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="var(--foreground-muted)" />
                  </marker>
                  <marker id="flowArrowActive" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="var(--accent-emerald, #059669)" />
                  </marker>
                </defs>

                {/* Stage 1: Ingestion */}
                <g transform="translate(30, 20)">
                  <rect x="0" y="0" width="220" height="52" rx="4" fill="var(--surface-raised)" stroke="var(--border)" strokeWidth="1.5" />
                  <text x="110" y="22" textAnchor="middle" fill="var(--foreground)" fontSize="11" fontWeight="700" fontFamily="var(--font-mono)">
                    STAGE 1: RAW INGESTION
                  </text>
                  <text x="110" y="38" textAnchor="middle" fill="var(--foreground-muted)" fontSize="9.5" fontFamily="var(--font-sans)">
                    5,566 Meters &bull; 30-min kWh Streams
                  </text>
                </g>

                {/* Arrow 1 -> 2 */}
                <line x1="250" y1="46" x2="310" y2="46" stroke="var(--border-strong)" strokeWidth="1.5" markerEnd="url(#flowArrow)" />

                {/* Stage 2: QC & Windowing */}
                <g transform="translate(315, 20)">
                  <rect x="0" y="0" width="250" height="52" rx="4" fill="var(--surface-raised)" stroke="var(--border)" strokeWidth="1.5" />
                  <text x="125" y="22" textAnchor="middle" fill="var(--foreground)" fontSize="11" fontWeight="700" fontFamily="var(--font-mono)">
                    STAGE 2: QC &amp; WINDOWING
                  </text>
                  <text x="125" y="38" textAnchor="middle" fill="var(--foreground-muted)" fontSize="9.5" fontFamily="var(--font-sans)">
                    Completeness Filter &bull; 56-Day Epochs (W01–W14)
                  </text>
                </g>

                {/* Arrow 2 -> 3 */}
                <line x1="565" y1="46" x2="625" y2="46" stroke="var(--border-strong)" strokeWidth="1.5" markerEnd="url(#flowArrow)" />

                {/* Stage 3: Feature Engineering */}
                <g transform="translate(630, 20)">
                  <rect x="0" y="0" width="220" height="52" rx="4" fill="var(--surface-raised)" stroke="var(--border)" strokeWidth="1.5" />
                  <text x="110" y="22" textAnchor="middle" fill="var(--foreground)" fontSize="11" fontWeight="700" fontFamily="var(--font-mono)">
                    STAGE 3: FEATURES
                  </text>
                  <text x="110" y="38" textAnchor="middle" fill="var(--foreground-muted)" fontSize="9.5" fontFamily="var(--font-sans)">
                    8 Standardized Behavioral Dimensions
                  </text>
                </g>

                {/* Branching Trunk from Stage 3 to Parallel Engines */}
                <path d="M 740 72 L 740 100 L 110 100 L 110 125" fill="none" stroke="var(--border-strong)" strokeWidth="1.5" markerEnd="url(#flowArrow)" />
                <path d="M 330 100 L 330 125" fill="none" stroke="var(--border-strong)" strokeWidth="1.5" markerEnd="url(#flowArrow)" />
                <path d="M 550 100 L 550 125" fill="none" stroke="var(--border-strong)" strokeWidth="1.5" markerEnd="url(#flowArrow)" />
                <path d="M 770 100 L 770 125" fill="none" stroke="var(--border-strong)" strokeWidth="1.5" markerEnd="url(#flowArrow)" />

                {/* STAGE 4: 4 PARALLEL ANALYTICS ENGINES */}
                {/* Engine A: Demand Analysis */}
                <g transform="translate(20, 130)">
                  <rect x="0" y="0" width="180" height="74" rx="4" fill="var(--surface-raised)" stroke="var(--border)" strokeWidth="1.5" />
                  <text x="90" y="22" textAnchor="middle" fill="var(--accent-emerald, #059669)" fontSize="10.5" fontWeight="700" fontFamily="var(--font-mono)">
                    DEMAND PROFILING
                  </text>
                  <text x="90" y="40" textAnchor="middle" fill="var(--foreground)" fontSize="10" fontWeight="600" fontFamily="var(--font-sans)">
                    Diurnal 48-Slot Curves
                  </text>
                  <text x="90" y="58" textAnchor="middle" fill="var(--foreground-muted)" fontSize="8.5" fontFamily="var(--font-mono)">
                    Weekday / Weekend / Peaks
                  </text>
                </g>

                {/* Engine B: Consumer Intelligence */}
                <g transform="translate(240, 130)">
                  <rect x="0" y="0" width="180" height="74" rx="4" fill="var(--surface-raised)" stroke="var(--border)" strokeWidth="1.5" />
                  <text x="90" y="22" textAnchor="middle" fill="var(--accent-emerald, #059669)" fontSize="10.5" fontWeight="700" fontFamily="var(--font-mono)">
                    CLUSTERING (K = 4)
                  </text>
                  <text x="90" y="40" textAnchor="middle" fill="var(--foreground)" fontSize="10" fontWeight="600" fontFamily="var(--font-sans)">
                    Consumer Intelligence
                  </text>
                  <text x="90" y="58" textAnchor="middle" fill="var(--foreground-muted)" fontSize="8.5" fontFamily="var(--font-mono)">
                    4 Behavioral Archetypes
                  </text>
                </g>

                {/* Engine C: Anomaly Analysis */}
                <g transform="translate(460, 130)">
                  <rect x="0" y="0" width="180" height="74" rx="4" fill="var(--surface-raised)" stroke="var(--border)" strokeWidth="1.5" />
                  <text x="90" y="22" textAnchor="middle" fill="var(--accent-emerald, #059669)" fontSize="10.5" fontWeight="700" fontFamily="var(--font-mono)">
                    ISOLATION FOREST
                  </text>
                  <text x="90" y="40" textAnchor="middle" fill="var(--foreground)" fontSize="10" fontWeight="600" fontFamily="var(--font-sans)">
                    Anomaly Detection
                  </text>
                  <text x="90" y="58" textAnchor="middle" fill="var(--foreground-muted)" fontSize="8.5" fontFamily="var(--font-mono)">
                    Spike &amp; Dropout Screening
                  </text>
                </g>

                {/* Engine D: Forecasting */}
                <g transform="translate(680, 130)">
                  <rect x="0" y="0" width="180" height="74" rx="4" fill="var(--surface-raised)" stroke="var(--border)" strokeWidth="1.5" />
                  <text x="90" y="22" textAnchor="middle" fill="var(--accent-emerald, #059669)" fontSize="10.5" fontWeight="700" fontFamily="var(--font-mono)">
                    HYBRID FORECASTER
                  </text>
                  <text x="90" y="40" textAnchor="middle" fill="var(--foreground)" fontSize="10" fontWeight="600" fontFamily="var(--font-sans)">
                    ARIMA + GBDT Trees
                  </text>
                  <text x="90" y="58" textAnchor="middle" fill="var(--foreground-muted)" fontSize="8.5" fontFamily="var(--font-mono)">
                    Day-Ahead (48 Intervals)
                  </text>
                </g>

                {/* Converging Lines to Stage 5 */}
                <path d="M 110 204 L 110 238 L 440 238 L 440 258" fill="none" stroke="var(--border-strong)" strokeWidth="1.5" />
                <path d="M 330 204 L 330 238" fill="none" stroke="var(--border-strong)" strokeWidth="1.5" />
                <path d="M 550 204 L 550 238" fill="none" stroke="var(--border-strong)" strokeWidth="1.5" />
                <path d="M 770 204 L 770 238 L 440 238 L 440 258" fill="none" stroke="var(--border-strong)" strokeWidth="1.5" markerEnd="url(#flowArrowActive)" />

                {/* STAGE 5: GROUNDED AI COPILOT & DASHBOARD */}
                <g transform="translate(120, 260)">
                  <rect x="0" y="0" width="640" height="56" rx="4" fill="var(--surface)" stroke="var(--accent-emerald, #059669)" strokeWidth="1.5" />
                  <text x="320" y="24" textAnchor="middle" fill="var(--foreground)" fontSize="12" fontWeight="700" fontFamily="var(--font-mono)">
                    STAGE 5: OPERATIONAL DASHBOARD &amp; GROUNDED AI COPILOT
                  </text>
                  <text x="320" y="42" textAnchor="middle" fill="var(--foreground-muted)" fontSize="10" fontFamily="var(--font-sans)">
                    Interactive Telemetry Exploration &bull; Deterministic Metric Lookups &bull; Verified Retrieval (RAG)
                  </text>
                </g>
              </svg>
            </div>

            <h3 className="module-subheading">Pipeline Execution Stages</h3>
            <ul className="textbook-points-list">
              <li>
                <span className="point-number">STEP 1</span>
                <div className="point-body">
                  <strong>Telemetry Ingestion:</strong> Continuous streams of half-hourly kWh readings are aggregated, validated,
                  and converted to instantaneous load (kW).
                </div>
              </li>
              <li>
                <span className="point-number">STEP 2</span>
                <div className="point-body">
                  <strong>Temporal Windowing:</strong> Readings are partitioned into non-overlapping 56-day (8-week) observation
                  windows (W01 to W14). Each window captures 2,688 half-hour slots per consumer.
                </div>
              </li>
              <li>
                <span className="point-number">STEP 3</span>
                <div className="point-body">
                  <strong>Behavioral Feature Extraction:</strong> For every household-window pair, 8 standardized features are
                  computed: Mean Load, Peak Load, Peak-to-Average Ratio, Variability (&sigma;), Ramp Rate, Day/Night Ratio,
                  Weekday/Weekend Differential, and Peak Timing Hour.
                </div>
              </li>
              <li>
                <span className="point-number">STEP 4</span>
                <div className="point-body">
                  <strong>Parallel Engine Execution:</strong> Standardized features and load curves simultaneously feed four
                  analytical models: diurnal aggregation, K-Means clustering, Isolation Forest anomaly scoring, and hybrid demand forecasting.
                </div>
              </li>
              <li>
                <span className="point-number">STEP 5</span>
                <div className="point-body">
                  <strong>Operational Delivery:</strong> Processed results are published to the web dashboard and indexed into the
                  grounded AI Copilot knowledge base for natural language queries.
                </div>
              </li>
            </ul>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 4. DASHBOARD INDIVIDUAL FEATURES                                          */}
        {/* ========================================================================= */}
        <section id="sec-features" className="editorial-section" aria-label="System Features">
          <div className="section-number-header">
            <span className="section-index-num">§ 4.0</span>
            <div className="section-header-text">
              <span className="section-eyebrow">MODULE REFERENCE</span>
              <h2 className="section-heading">Dashboard Features &amp; Operations</h2>
            </div>
          </div>

          <p className="editorial-body-text">
            Each feature in GridVision is organized according to the dashboard sidebar sequence:
            <strong> Demand Snapshot</strong>, <strong>Demand Analysis</strong>, <strong>Consumer Intelligence</strong>,
            <strong> Anomaly Analysis</strong>, <strong>Forecasting</strong>, and <strong>AI Copilot</strong>.
            Refer to the technical specifications below for operational runbooks, formulas, and metric interpretations.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* --------------------------------------------------------------------- */}
            {/* 4.1 DEMAND SNAPSHOT                                                  */}
            {/* --------------------------------------------------------------------- */}
            <div id="feat-snapshot" className="module-manual-entry">
              <div className="module-header-row">
                <div className="module-title-group">
                  <span className="module-code-badge">MOD-01</span>
                  <h3 className="module-title">Demand Snapshot</h3>
                </div>
                <span className="module-category-tag">SNAPSHOT GROUP</span>
              </div>

              <div className="editorial-prose-block">
                <p className="editorial-body-text">
                  <strong>Operational Objective:</strong> Provide immediate high-level situational awareness across the active
                  observation window. Serves as the executive summary cockpit for grid planners and control-room dispatchers.
                </p>

                <div className="textbook-table-wrapper">
                  <table className="textbook-table">
                    <thead>
                      <tr>
                        <th style={{ width: '25%' }}>Indicator</th>
                        <th style={{ width: '25%' }}>Formula / Unit</th>
                        <th>Operational Meaning</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td><strong>Total Energy</strong></td>
                        <td className="mono">MWh / Window</td>
                        <td>Cumulative electrical energy consumed across all cohort meters during the 56-day epoch.</td>
                      </tr>
                      <tr>
                        <td><strong>Mean Demand</strong></td>
                        <td className="mono">kW / Consumer</td>
                        <td>Continuous average electrical draw per household. Indicates baseline cohort intensity.</td>
                      </tr>
                      <tr>
                        <td><strong>System Peak Demand</strong></td>
                        <td className="mono">kW (with Timestamp)</td>
                        <td>Highest instantaneous concurrent load recorded, identifying peak distribution stress.</td>
                      </tr>
                      <tr>
                        <td><strong>Load Factor</strong></td>
                        <td className="mono">(Mean / Peak) × 100%</td>
                        <td>System asset utilization efficiency. Higher values signify uniform demand; lower values indicate sharp peak vulnerability.</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <h4 className="module-subheading">Operator Runbook</h4>
                <ul className="textbook-points-list">
                  <li>
                    <span className="point-number">1</span>
                    <div className="point-body">
                      Select the desired observation epoch from the <strong>Observation Window selector</strong> (W01 to W14)
                      at the top right of the workspace.
                    </div>
                  </li>
                  <li>
                    <span className="point-number">2</span>
                    <div className="point-body">
                      Verify whether the cohort peak falls within the expected evening dispatch period (18:00–21:00) or represents an off-peak anomaly.
                    </div>
                  </li>
                </ul>

                <button
                  type="button"
                  className="module-action-btn"
                  onClick={() => handleOpenSection('overview')}
                >
                  <LayoutDashboard size={15} />
                  <span>Open Demand Snapshot Workspace</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>

            {/* --------------------------------------------------------------------- */}
            {/* 4.2 DEMAND ANALYSIS                                                  */}
            {/* --------------------------------------------------------------------- */}
            <div id="feat-demand" className="module-manual-entry">
              <div className="module-header-row">
                <div className="module-title-group">
                  <span className="module-code-badge">MOD-02</span>
                  <h3 className="module-title">Demand Analysis</h3>
                </div>
                <span className="module-category-tag">ANALYTICS GROUP</span>
              </div>

              <div className="editorial-prose-block">
                <p className="editorial-body-text">
                  <strong>Operational Objective:</strong> Decompose daily consumption into granular half-hourly load curves,
                  isolating morning and evening ramp rates, weekday versus weekend contrasts, and longitudinal seasonal drift.
                </p>

                <div className="textbook-table-wrapper">
                  <table className="textbook-table">
                    <thead>
                      <tr>
                        <th style={{ width: '25%' }}>Analytical View</th>
                        <th style={{ width: '25%' }}>Resolution</th>
                        <th>Methodological Purpose</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td><strong>Diurnal Profile</strong></td>
                        <td className="mono">48 Slots (30 min)</td>
                        <td>Averaged 24-hour demand shape showing diurnal ramps, afternoon plateaus, and evening peak durations.</td>
                      </tr>
                      <tr>
                        <td><strong>Weekday vs. Weekend</strong></td>
                        <td className="mono">Bimodal Curve</td>
                        <td>Contrasts commercial/workday routines against domestic weekend load profiles.</td>
                      </tr>
                      <tr>
                        <td><strong>Longitudinal Evolution</strong></td>
                        <td className="mono">W01 to W14 (Bi-monthly)</td>
                        <td>Tracks multi-season baseline shifts, heating electrification surges in winter, and summer baseload drops.</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <h4 className="module-subheading">Operator Runbook</h4>
                <ul className="textbook-points-list">
                  <li>
                    <span className="point-number">1</span>
                    <div className="point-body">
                      Use the top tab toggles to switch between <strong>24-Hour Diurnal</strong>, <strong>Weekday vs. Weekend</strong>,
                      and <strong>Longitudinal Trends</strong>.
                    </div>
                  </li>
                  <li>
                    <span className="point-number">2</span>
                    <div className="point-body">
                      Hover over discrete 30-minute intervals to inspect exact kilowatt levels and evaluate ramping requirements.
                    </div>
                  </li>
                </ul>

                <button
                  type="button"
                  className="module-action-btn"
                  onClick={() => handleOpenSection('demand')}
                >
                  <Activity size={15} />
                  <span>Open Demand Analysis Workspace</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>

            {/* --------------------------------------------------------------------- */}
            {/* 4.3 CONSUMER INTELLIGENCE                                            */}
            {/* --------------------------------------------------------------------- */}
            <div id="feat-consumers" className="module-manual-entry">
              <div className="module-header-row">
                <div className="module-title-group">
                  <span className="module-code-badge">MOD-03</span>
                  <h3 className="module-title">Consumer Intelligence</h3>
                </div>
                <span className="module-category-tag">ANALYTICS GROUP</span>
              </div>

              <div className="editorial-prose-block">
                <p className="editorial-body-text">
                  <strong>Operational Objective:</strong> Segment heterogeneous consumers into interpretable behavioral archetypes
                  using unsupervised machine learning, provide cohort rankings, and enable individual meter telemetry drilldowns.
                </p>

                <h4 className="module-subheading">The 4 Behavioral Archetypes</h4>
                <div className="textbook-table-wrapper">
                  <table className="textbook-table">
                    <thead>
                      <tr>
                        <th style={{ width: '18%' }}>Archetype</th>
                        <th style={{ width: '16%' }}>Peak Window</th>
                        <th style={{ width: '14%' }}>Peak Demand</th>
                        <th>Behavioral Profile &amp; Grid Impact</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td><strong style={{ color: '#f59e0b' }}>Cluster 1: Evening Peaker</strong></td>
                        <td className="mono">18:00 – 21:00</td>
                        <td className="mono">1.385 kW</td>
                        <td>Dominant residential cohort (~41.8%). Characterized by strong post-work cooking and lighting surges.</td>
                      </tr>
                      <tr>
                        <td><strong style={{ color: '#3b82f6' }}>Cluster 2: Baseload Steady</strong></td>
                        <td className="mono">Consistent</td>
                        <td className="mono">2.546 kW</td>
                        <td>Flat, high-volume baseload (~19.5%). Steady refrigeration or continuous heating with minimal diurnal swings.</td>
                      </tr>
                      <tr>
                        <td><strong style={{ color: '#10b981' }}>Cluster 3: Daytime Active</strong></td>
                        <td className="mono">09:00 – 16:00</td>
                        <td className="mono">1.969 kW</td>
                        <td>Midday peak (~16.2%). Corresponds to remote work, home occupancy, or daytime EV/appliance scheduling.</td>
                      </tr>
                      <tr>
                        <td><strong style={{ color: '#a855f7' }}>Cluster 4: Dual Peaker</strong></td>
                        <td className="mono">07:30 &amp; 19:30</td>
                        <td className="mono">2.134 kW</td>
                        <td>Bimodal consumption (~22.5%). Pronounced morning wake-up routine coupled with secondary evening dinner peak.</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <h4 className="module-subheading">Workspace Capabilities</h4>
                <ul className="textbook-points-list">
                  <li>
                    <span className="point-number">TAB 1</span>
                    <div className="point-body">
                      <strong>Consumer Rankings:</strong> Ranks all meters by Mean Demand or Peak Demand to identify high-draw consumers.
                    </div>
                  </li>
                  <li>
                    <span className="point-number">TAB 2</span>
                    <div className="point-body">
                      <strong>Load Factor Ranking:</strong> Sorts consumers by load factor percentage to locate volatile peaking households.
                    </div>
                  </li>
                  <li>
                    <span className="point-number">TAB 3</span>
                    <div className="point-body">
                      <strong>Peak-to-Average (P2A):</strong> Isolates extreme spiking behavior with graphical bar rankings.
                    </div>
                  </li>
                  <li>
                    <span className="point-number">TAB 4</span>
                    <div className="point-body">
                      <strong>Consumer Clusters:</strong> Interactive cards and clean diurnal profile overlays with distinctive cluster color-coding.
                    </div>
                  </li>
                  <li>
                    <span className="point-number">TAB 5</span>
                    <div className="point-body">
                      <strong>Consumer Profiles Directory:</strong> Search any meter (e.g. <span className="mono">MAC000045</span>)
                      to inspect its 24-hour diurnal profile and assigned cluster.
                    </div>
                  </li>
                </ul>

                <button
                  type="button"
                  className="module-action-btn"
                  onClick={() => handleOpenSection('consumers')}
                >
                  <Users size={15} />
                  <span>Open Consumer Intelligence Workspace</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>

            {/* --------------------------------------------------------------------- */}
            {/* 4.4 ANOMALY ANALYSIS                                                 */}
            {/* --------------------------------------------------------------------- */}
            <div id="feat-anomalies" className="module-manual-entry">
              <div className="module-header-row">
                <div className="module-title-group">
                  <span className="module-code-badge">MOD-04</span>
                  <h3 className="module-title">Anomaly Analysis</h3>
                </div>
                <span className="module-category-tag">ANALYTICS GROUP</span>
              </div>

              <div className="editorial-prose-block">
                <p className="editorial-body-text">
                  <strong>Operational Objective:</strong> Detect erratic consumption departures, meter hardware faults,
                  unauthorized tap events, and sudden behavioral transitions using unsupervised Isolation Forest algorithms.
                </p>

                <div className="textbook-callout amber">
                  <strong>Algorithmic Method:</strong> Multi-dimensional isolation tree ensembles recursively isolate data points.
                  Points requiring fewer random partitions receive higher anomaly scores:
                  <span className="mono" style={{ display: 'block', marginTop: '0.4rem' }}>
                    s(x, n) = 2^(-E(h(x)) / c(n))
                  </span>
                </div>

                <div className="textbook-table-wrapper">
                  <table className="textbook-table">
                    <thead>
                      <tr>
                        <th style={{ width: '25%' }}>Anomaly Category</th>
                        <th style={{ width: '25%' }}>Signature Pattern</th>
                        <th>Operational Remediation</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td><strong>Extreme Peaking</strong></td>
                        <td className="mono">P2A &gt; 12.0×</td>
                        <td>Flag for transformer branch load assessment and potential circuit breaker stress.</td>
                      </tr>
                      <tr>
                        <td><strong>Sudden Dropout</strong></td>
                        <td className="mono">Demand &rarr; 0 kW sustained</td>
                        <td>Inspect meter hardware connection, communications link, or property vacancy.</td>
                      </tr>
                      <tr>
                        <td><strong>Structural Drift</strong></td>
                        <td className="mono">Cluster transition jump</td>
                        <td>Update customer behavioral baseline for accurate downstream tariff and forecasting models.</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <h4 className="module-subheading">Operator Runbook</h4>
                <ul className="textbook-points-list">
                  <li>
                    <span className="point-number">1</span>
                    <div className="point-body">
                      Inspect the cohort anomaly rate across observation windows to track system-wide anomaly frequency.
                    </div>
                  </li>
                  <li>
                    <span className="point-number">2</span>
                    <div className="point-body">
                      Select flagged anomalous households from the table to inspect their exact feature departure and severity score.
                    </div>
                  </li>
                </ul>

                <button
                  type="button"
                  className="module-action-btn"
                  onClick={() => handleOpenSection('anomalies')}
                >
                  <AlertTriangle size={15} />
                  <span>Open Anomaly Analysis Workspace</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>

            {/* --------------------------------------------------------------------- */}
            {/* 4.5 FORECASTING                                                      */}
            {/* --------------------------------------------------------------------- */}
            <div id="feat-forecasting" className="module-manual-entry">
              <div className="module-header-row">
                <div className="module-title-group">
                  <span className="module-code-badge">MOD-05</span>
                  <h3 className="module-title">Demand Forecasting</h3>
                </div>
                <span className="module-category-tag">ANALYTICS GROUP</span>
              </div>

              <div className="editorial-prose-block">
                <p className="editorial-body-text">
                  <strong>Operational Objective:</strong> Predict day-ahead half-hourly electricity demand across 48 discrete
                  dispatch intervals to guide generation reserve scheduling and feeder management.
                </p>

                <h4 className="module-subheading">Two-Stage Hybrid Architecture</h4>
                <ul className="textbook-points-list">
                  <li>
                    <span className="point-number">STAGE 1</span>
                    <div className="point-body">
                      <strong>Statistical Baseline (ARIMA / Seasonal Naive):</strong> Captures recurring daily diurnal periodicity
                      and weekly inertia without risk of overfitting.
                    </div>
                  </li>
                  <li>
                    <span className="point-number">STAGE 2</span>
                    <div className="point-body">
                      <strong>Residual Gradient Boosting (GBDT / LightGBM):</strong> Learns non-linear temperature sensitivities,
                      calendar effects, and high-frequency autoregressive error residuals.
                    </div>
                  </li>
                </ul>

                <div className="textbook-table-wrapper">
                  <table className="textbook-table">
                    <thead>
                      <tr>
                        <th style={{ width: '25%' }}>Evaluation Metric</th>
                        <th style={{ width: '25%' }}>Formula</th>
                        <th>Standard Benchmark Goal</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td><strong>MAE</strong> (Mean Absolute Error)</td>
                        <td className="mono">(1/N) &Sigma; |y - &ycirc;|</td>
                        <td>Lower is better; evaluates average deviation magnitude in kW.</td>
                      </tr>
                      <tr>
                        <td><strong>RMSE</strong> (Root Mean Squared)</td>
                        <td className="mono">&radic;((1/N) &Sigma; (y - &ycirc;)&sup2;)</td>
                        <td>Penalizes large outlier forecast errors; essential for peak capacity sizing.</td>
                      </tr>
                      <tr>
                        <td><strong>MAPE</strong> (Percentage Error)</td>
                        <td className="mono">(100%/N) &Sigma; |(y - &ycirc;) / y|</td>
                        <td>Normalizes performance across seasons; target &lt; 5.0% on aggregate cohort load.</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <h4 className="module-subheading">Operator Runbook</h4>
                <ul className="textbook-points-list">
                  <li>
                    <span className="point-number">1</span>
                    <div className="point-body">
                      Evaluate predicted demand curve against actual load curves across the 48 daily time slots.
                    </div>
                  </li>
                  <li>
                    <span className="point-number">2</span>
                    <div className="point-body">
                      Review upper and lower 95% confidence intervals to ensure adequate operational spinning reserves.
                    </div>
                  </li>
                </ul>

                <button
                  type="button"
                  className="module-action-btn"
                  onClick={() => handleOpenSection('forecasting')}
                >
                  <TrendingUp size={15} />
                  <span>Open Forecasting Workspace</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>

            {/* --------------------------------------------------------------------- */}
            {/* 4.6 AI COPILOT                                                       */}
            {/* --------------------------------------------------------------------- */}
            <div id="feat-copilot" className="module-manual-entry">
              <div className="module-header-row">
                <div className="module-title-group">
                  <span className="module-code-badge">MOD-06</span>
                  <h3 className="module-title">AI Copilot</h3>
                </div>
                <span className="module-category-tag">INTELLIGENCE GROUP</span>
              </div>

              <div className="editorial-prose-block">
                <p className="editorial-body-text">
                  <strong>Operational Objective:</strong> Natural language decision support for utility operators and analysts.
                  Answers complex operational queries, retrieves specific consumer metrics, and explains pipeline formulas
                  with strict mathematical grounding.
                </p>

                <div className="textbook-callout">
                  <strong>Zero-Hallucination Retrieval (RAG):</strong> The Copilot does not invent data. All numerical outputs
                  and statistical summaries are retrieved deterministically from computed backend pipeline artifacts and official runbooks.
                </div>

                <h4 className="module-subheading">Example Operator Inquiries</h4>
                <ul className="textbook-points-list">
                  <li>
                    <span className="point-number">&bull;</span>
                    <div className="point-body">
                      <em>&ldquo;What is the peak demand and peak window for Cluster 1 in Window W14?&rdquo;</em>
                    </div>
                  </li>
                  <li>
                    <span className="point-number">&bull;</span>
                    <div className="point-body">
                      <em>&ldquo;How does the load factor of Baseload Steady compare to Evening Peaker?&rdquo;</em>
                    </div>
                  </li>
                  <li>
                    <span className="point-number">&bull;</span>
                    <div className="point-body">
                      <em>&ldquo;Which consumers showed the highest anomaly score in Window W12?&rdquo;</em>
                    </div>
                  </li>
                  <li>
                    <span className="point-number">&bull;</span>
                    <div className="point-body">
                      <em>&ldquo;Explain how the 8 standardized behavioral features are calculated.&rdquo;</em>
                    </div>
                  </li>
                </ul>

                <button
                  type="button"
                  className="module-action-btn"
                  onClick={() => handleOpenSection('copilot')}
                >
                  <Sparkles size={15} />
                  <span>Open AI Copilot Workspace</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 5. RESEARCH APPENDIX                                                      */}
        {/* ========================================================================= */}
        <section id="sec-research" className="editorial-section" aria-label="Research Appendix">
          <div className="section-number-header">
            <span className="section-index-num">§ 5.0</span>
            <div className="section-header-text">
              <span className="section-eyebrow">EMPIRICAL STUDY APPENDIX</span>
              <h2 className="section-heading">Behavioral Mobility &amp; Forecast Tail Errors</h2>
            </div>
          </div>

          <div className="research-appendix-container">
            <p className="editorial-body-text">
              Beyond standard grid monitoring, GridVision includes an empirical longitudinal research investigation:
              <strong> Does household mobility between behavioral consumption archetypes predict subsequent extreme
              forecast failures?</strong>
            </p>

            <ul className="textbook-points-list">
              <li>
                <span className="point-number">STEP 1</span>
                <div className="point-body">
                  <strong>Consumption Clustering:</strong> Households are clustered into 4 archetypes (C0 to C3) across
                  14 consecutive 56-day observation windows.
                </div>
              </li>
              <li>
                <span className="point-number">STEP 2</span>
                <div className="point-body">
                  <strong>Mobility Tracking:</strong> Household transitions between clusters are tracked over time.
                  Households exhibiting frequent transitions are categorized as behaviorally unstable.
                </div>
              </li>
              <li>
                <span className="point-number">STEP 3</span>
                <div className="point-body">
                  <strong>Tail Error Evaluation:</strong> Day-ahead forecast errors in the 95th and 99th percentiles are identified.
                </div>
              </li>
              <li>
                <span className="point-number">STEP 4</span>
                <div className="point-body">
                  <strong>Clustered Logistics:</strong> Logistic regression models evaluate odds ratios to determine whether
                  cluster transitions significantly elevate tail forecast risk.
                </div>
              </li>
            </ul>

            <div className="editorial-visual-wrapper">
              <ResearchVisual />
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* BACKWARD COMPATIBILITY ANCHOR TARGETS                                     */}
        {/* ========================================================================= */}
        <div id="overview-problem" style={{ display: 'none' }} />
        <div id="overview-dataset" style={{ display: 'none' }} />
        <div id="overview-workflow" style={{ display: 'none' }} />
        <div id="overview-capabilities" style={{ display: 'none' }} />
        <div id="overview-explore" style={{ display: 'none' }} />
        <div id="overview-demand" style={{ display: 'none' }} />
        <div id="overview-consumers" style={{ display: 'none' }} />
        <div id="overview-segmentation" style={{ display: 'none' }} />
        <div id="overview-anomalies" style={{ display: 'none' }} />
        <div id="overview-forecasting" style={{ display: 'none' }} />
        <div id="overview-copilot" style={{ display: 'none' }} />
        <div id="overview-research" style={{ display: 'none' }} />
        <div id="overview-product-showcase" style={{ display: 'none' }} />
        <div id="overview-stability" style={{ display: 'none' }} />
        <div id="overview-architecture" style={{ display: 'none' }} />
        <div id="overview-limitations" style={{ display: 'none' }} />
      </div>
    </article>
  );
};
