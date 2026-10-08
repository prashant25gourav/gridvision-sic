import React, { useEffect } from 'react';
import {
  ArrowDown,
  ArrowRight,
  Bot,
  LineChart,
  ShieldAlert,
  Scale,
  Users,
  Activity,
  CheckCircle2,
  HelpCircle,
  Cpu,
  ShieldCheck,
  AlertTriangle,
  Workflow,
} from 'lucide-react';
import { CapstoneVisual } from './CapstoneVisual';
import { ResearchVisual } from './ResearchVisual';
import './OverviewGateway.css';

interface OverviewGatewayProps {
  onExploreCapstone?: () => void;
  onExploreResearch?: () => void;
  onLaunchDashboard?: () => void;
}

export const OverviewGateway: React.FC<OverviewGatewayProps> = ({
  onLaunchDashboard = () => {},
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

  return (
    <div className="overview-page-container">
      <div className="overview-inner">
        {/* ========================================================================= */}
        {/* 1. HERO / EDITORIAL GATEWAY INTRO                                        */}
        {/* ========================================================================= */}
        <header className="overview-header">
          <div className="overview-category-pill">
            <span>SMART ENERGY ANALYTICS PLATFORM</span>
          </div>
          <h1 className="overview-main-title">
            GridVision turns smart-meter data into actionable electricity-demand intelligence.
          </h1>
          <p className="overview-lead-paragraph">
            A comprehensive energy analytics platform that transforms raw household electricity consumption readings into
            supervised demand forecasts, behavioral consumption profiles, anomaly screening, and grounded natural-language assistance.
          </p>
        </header>

        {/* Two Editorial Gateway Entry Panels (Capstone vs Research) */}
        <div className="overview-grid" role="region" aria-label="Two sides of GridVision">
          {/* Panel 1: CAPSTONE APPLICATION */}
          <article
            className="overview-panel"
            onClick={() => scrollToSection('overview-capabilities')}
            tabIndex={0}
            role="button"
            aria-label="Scroll to Capstone Application section"
          >
            <div className="overview-panel-visual">
              <CapstoneVisual />
            </div>

            <div className="overview-panel-body">
              <div className="overview-panel-header">
                <span className="overview-eyebrow">CAPSTONE APPLICATION</span>
                <h2 className="overview-panel-title">Operational Demand Intelligence &amp; AI Copilot</h2>
                <p className="overview-panel-features">
                  Demand Profiling • Behavioral Archetypes • Anomaly Screening • Day-Ahead Forecasting • Grounded Copilot
                </p>
              </div>

              <div className="overview-panel-footer">
                <button
                  type="button"
                  className="overview-cta-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    scrollToSection('overview-capabilities');
                  }}
                >
                  <span>EXPLORE CAPSTONE</span>
                  <ArrowDown size={16} className="overview-cta-arrow" />
                </button>
              </div>
            </div>
          </article>

          {/* Panel 2: SEPARATE RESEARCH STUDY */}
          <article
            className="overview-panel"
            onClick={() => scrollToSection('overview-research')}
            tabIndex={0}
            role="button"
            aria-label="Scroll to Research Study section"
          >
            <div className="overview-panel-visual">
              <ResearchVisual />
            </div>

            <div className="overview-panel-body">
              <div className="overview-panel-header">
                <span className="overview-eyebrow">RELATED RESEARCH STUDY</span>
                <h2 className="overview-panel-title">Behavioral Instability &amp; Forecast Failure</h2>
                <p className="overview-panel-features">
                  Longitudinal Cluster Mobility • Standardized Failure Thresholds • Clustered Logistic Regression • Null Finding
                </p>
              </div>

              <div className="overview-panel-footer">
                <button
                  type="button"
                  className="overview-cta-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    scrollToSection('overview-research');
                  }}
                >
                  <span>EXPLORE RESEARCH</span>
                  <ArrowDown size={16} className="overview-cta-arrow" />
                </button>
              </div>
            </div>
          </article>
        </div>

        {/* Quick Jump Navigation Bar for Section Browsing */}
        <nav className="overview-nav-bar" aria-label="Quick jump to sections">
          <span className="overview-nav-label">SECTIONS:</span>
          {[
            { id: 'overview-problem', label: '1. The Problem' },
            { id: 'overview-capabilities', label: '2. What It Does' },
            { id: 'overview-workflow', label: '3. How It Works' },
            { id: 'overview-forecasting', label: '4. Forecasting' },
            { id: 'overview-segmentation', label: '5. Consumer Profiles' },
            { id: 'overview-anomalies', label: '6. Anomaly Screening' },
            { id: 'overview-stability', label: '7. Stability & Tiers' },
            { id: 'overview-copilot', label: '8. AI Copilot' },
            { id: 'overview-architecture', label: '9. Architecture' },
            { id: 'overview-research', label: '10. Related Research' },
            { id: 'overview-limitations', label: '11. Limitations' },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              className="overview-nav-item"
              onClick={() => scrollToSection(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* ========================================================================= */}
        {/* 2. THE PROBLEM                                                            */}
        {/* ========================================================================= */}
        <section
          id="overview-problem"
          className="overview-full-section"
          aria-label="The Practical Challenge"
        >
          <div id="overview-demand" />
          <div id="overview-motivation" />

          <span className="section-kicker" style={{ color: 'var(--accent-amber)' }}>
            THE PRACTICAL CHALLENGE
          </span>
          <h2 className="section-heading">
            1. Beyond Simple Electricity Totals
          </h2>
          <p className="section-subheading">
            Electricity consumption changes continuously over time and differs substantially between consumers.
            Traditional monthly metering merely records aggregate consumption after the fact, leaving distribution engineers blind to load dynamics.
          </p>

          <p className="editorial-prose">
            Modern residential electricity demand is characterized by rapid, nonlinear fluctuations driven by electric space heating, heat pumps, electric vehicles, and varied domestic routines. Because alternating current cannot be stored cost-free at scale on the distribution network, supply and demand must match continuously. To schedule generation, manage feeder congestion, and plan peak reserves, grid operators need granular, anticipatory insights rather than retroactive billing sums.
          </p>

          <div className="editorial-text-panel">
            <h3 className="editorial-panel-title">
              <HelpCircle size={22} style={{ color: 'var(--accent-amber)' }} />
              <span>The Five Core Questions Distribution Operators Must Answer</span>
            </h3>
            <p className="editorial-prose" style={{ margin: 0 }}>
              A truly operational demand intelligence system must answer far more than <em>&ldquo;How much total energy was consumed?&rdquo;</em> It must reliably resolve:
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginTop: '0.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent-amber)', fontSize: '0.92rem' }}>01.</span>
                <span style={{ fontSize: '0.96rem', color: 'var(--foreground)', lineHeight: 1.6 }}>
                  <strong>What demand is expected next?</strong> Day-ahead half-hourly trajectories for scheduling generation dispatch, storage charging, and reserve margins.
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent-amber)', fontSize: '0.92rem' }}>02.</span>
                <span style={{ fontSize: '0.96rem', color: 'var(--foreground)', lineHeight: 1.6 }}>
                  <strong>What type of consumption behavior does each consumer exhibit?</strong> Identifying whether a consumer is an Evening Peaker, a steady baseload account, or a daytime-active household to tailor tariffs and demand-side incentives.
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent-amber)', fontSize: '0.92rem' }}>03.</span>
                <span style={{ fontSize: '0.96rem', color: 'var(--foreground)', lineHeight: 1.6 }}>
                  <strong>Is current consumption unusual or aberrant?</strong> Screening anomalous deviation events to isolate communication failures, stuck meters, or unexpected physical demand surges before they escalate.
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent-amber)', fontSize: '0.92rem' }}>04.</span>
                <span style={{ fontSize: '0.96rem', color: 'var(--foreground)', lineHeight: 1.6 }}>
                  <strong>How consistent is each consumer&apos;s routine over time?</strong> Measuring behavioral stability across seasons to assess whether an account represents dependable demand-response flexibility or volatile risk.
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent-amber)', fontSize: '0.92rem' }}>05.</span>
                <span style={{ fontSize: '0.96rem', color: 'var(--foreground)', lineHeight: 1.6 }}>
                  <strong>Can operators query the system directly in natural language?</strong> Providing an authoritative natural-language interface that retrieves verified metrics and domain procedures without hallucination.
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 3. WHAT GRIDVISION DOES                                                   */}
        {/* ========================================================================= */}
        <section
          id="overview-capabilities"
          className="overview-full-section"
          aria-label="Core Capabilities"
        >
          <div id="capstone-section" />

          <span className="section-kicker" style={{ color: 'var(--accent-emerald)' }}>
            CORE CAPABILITIES
          </span>
          <h2 className="section-heading">
            2. What GridVision Does
          </h2>
          <p className="section-subheading">
            Five complementary analytical capabilities designed to provide comprehensive demand intelligence across the distribution network.
          </p>

          <div className="capability-stack">
            <div className="capability-row">
              <div className="capability-row-icon" style={{ color: 'var(--accent-emerald)' }}>
                <LineChart size={24} />
              </div>
              <div className="capability-row-content">
                <h3 className="capability-row-title">Forecast Demand Ahead of Time</h3>
                <p className="capability-row-desc">
                  Predicts upcoming electricity demand trajectories across a 24-hour day-ahead horizon in 30-minute intervals. By utilizing supervised gradient boosting on historical consumption and calendar indicators, GridVision enables operators to anticipate peak ramping and schedule adequate reserve capacity.
                </p>
              </div>
            </div>

            <div className="capability-row">
              <div className="capability-row-icon" style={{ color: 'var(--accent-blue)' }}>
                <Users size={24} />
              </div>
              <div className="capability-row-content">
                <h3 className="capability-row-title">Understand Consumer Behavioral Archetypes</h3>
                <p className="capability-row-desc">
                  Groups consumers with similar behavioral load patterns into interpretable, standardized consumption archetypes (such as Evening Peakers, Baseload Steady, and Daytime Active). This reveals recurring daily habits without exposing private personal details or requiring intrusive in-home sensors.
                </p>
              </div>
            </div>

            <div className="capability-row">
              <div className="capability-row-icon" style={{ color: 'var(--accent-rose)' }}>
                <ShieldAlert size={24} />
              </div>
              <div className="capability-row-content">
                <h3 className="capability-row-title">Detect Unusual Consumption Behavior</h3>
                <p className="capability-row-desc">
                  Screens observations that deviate substantially from established consumption baselines using multi-dimensional tree isolation. Unusual events are stratified by severity so distribution teams can quickly prioritize inspections, distinguish communication dropouts from true physical surges, and investigate meter abnormalities.
                </p>
              </div>
            </div>

            <div className="capability-row">
              <div className="capability-row-icon" style={{ color: 'var(--accent-amber)' }}>
                <Activity size={24} />
              </div>
              <div className="capability-row-content">
                <h3 className="capability-row-title">Assess Behavioral Stability &amp; Reliability</h3>
                <p className="capability-row-desc">
                  Tracks whether a consumer&apos;s behavioral load archetype remains persistent over consecutive observation periods or transitions frequently between different profiles. Accounts are classified into operational reliability tiers (Stable, Moderate, Elevated Risk) to assess demand-response predictability.
                </p>
              </div>
            </div>

            <div className="capability-row">
              <div className="capability-row-icon" style={{ color: 'var(--accent-purple, #a855f7)' }}>
                <Bot size={24} />
              </div>
              <div className="capability-row-content">
                <h3 className="capability-row-title">Ask the System in Natural Language (AI Copilot)</h3>
                <p className="capability-row-desc">
                  Enables engineers and analysts to query the platform conversationally. The Copilot orchestrates deterministic backend analytics tools and retrieves operational runbooks using local cosine similarity, enforcing strict numeric verification to ensure all answers are grounded in real data.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 4. HOW THE SYSTEM WORKS (PIPELINE & FLOWCHART)                           */}
        {/* ========================================================================= */}
        <section
          id="overview-workflow"
          className="overview-full-section"
          aria-label="How the System Works"
        >
          <span className="section-kicker" style={{ color: 'var(--accent-blue)' }}>
            END-TO-END PIPELINE
          </span>
          <h2 className="section-heading">
            3. How the System Works
          </h2>
          <p className="section-subheading">
            From raw smart-meter readings to grounded operational answers through structured, complementary machine learning and deterministic artifact contracts.
          </p>

          {/* Simple Illustrative Flowchart */}
          <div className="flowchart-container">
            <div className="flowchart-header">
              <h3 className="flowchart-title">GridVision Information &amp; Analytical Flow</h3>
              <p className="flowchart-subtitle">
                How data flows from physical smart meters through preprocessing and specialized machine learning to grounded operator decisions.
              </p>
            </div>

            <div className="pipeline-diagram">
              {/* Step 1 */}
              <div className="pipeline-node">
                <div className="pipeline-node-main">
                  <span className="pipeline-step-badge">STEP 1</span>
                  <div>
                    <h4 className="pipeline-node-title">Smart-Meter Consumption Stream</h4>
                    <p className="pipeline-node-detail">Half-hourly electricity consumption readings from London residential trials (UKPN Low Carbon London)</p>
                  </div>
                </div>
                <span className="pipeline-node-tag">30-min kWh data</span>
              </div>

              <div className="pipeline-arrow"><ArrowDown size={18} /></div>

              {/* Step 2 */}
              <div className="pipeline-node">
                <div className="pipeline-node-main">
                  <span className="pipeline-step-badge">STEP 2</span>
                  <div>
                    <h4 className="pipeline-node-title">Data Preparation &amp; Quality Gate</h4>
                    <p className="pipeline-node-detail">Quality audit verifying &ge;95% slot completeness, standardizing to kilowatts (kW), and aligning into 56-day observation windows</p>
                  </div>
                </div>
                <span className="pipeline-node-tag">&ge;95% Complete</span>
              </div>

              <div className="pipeline-arrow"><ArrowDown size={18} /></div>

              {/* Step 3 */}
              <div className="pipeline-node">
                <div className="pipeline-node-main">
                  <span className="pipeline-step-badge">STEP 3</span>
                  <div>
                    <h4 className="pipeline-node-title">Feature Engineering &amp; Lag Construction</h4>
                    <p className="pipeline-node-detail">Constructing autoregressive lags (t-48, t-336) and extracting 8 standardized behavioral indicators without lookahead leakage</p>
                  </div>
                </div>
                <span className="pipeline-node-tag">8 Behavioral Metrics</span>
              </div>

              <div className="pipeline-arrow"><ArrowDown size={18} /></div>

              {/* Step 4: Parallel ML Models */}
              <div className="pipeline-parallel-group">
                <div className="pipeline-parallel-card forecasting">
                  <span className="pipeline-card-engine" style={{ color: 'var(--accent-emerald)' }}>SUPERVISED LEARNING</span>
                  <h4 className="pipeline-card-title">Day-Ahead Forecaster</h4>
                  <p className="pipeline-card-desc">
                    LightGBM gradient-boosted decision trees predicting 24h demand trajectory across half-hourly intervals.
                  </p>
                </div>

                <div className="pipeline-parallel-card segmentation">
                  <span className="pipeline-card-engine" style={{ color: 'var(--accent-blue)' }}>UNSUPERVISED CLUSTERING</span>
                  <h4 className="pipeline-card-title">Behavioral Profiler</h4>
                  <p className="pipeline-card-desc">
                    Standardized K-Means with Hungarian centroid alignment tracking archetypes across observation windows.
                  </p>
                </div>

                <div className="pipeline-parallel-card anomalies">
                  <span className="pipeline-card-engine" style={{ color: 'var(--accent-rose)' }}>OUTLIER SCREENING</span>
                  <h4 className="pipeline-card-title">Anomaly Detector</h4>
                  <p className="pipeline-card-desc">
                    Isolation Forest screening multi-dimensional behavioral deviations and stratifying alerts by severity.
                  </p>
                </div>
              </div>

              <div className="pipeline-arrow"><ArrowDown size={18} /></div>

              {/* Step 5 */}
              <div className="pipeline-node">
                <div className="pipeline-node-main">
                  <span className="pipeline-step-badge">STEP 5</span>
                  <div>
                    <h4 className="pipeline-node-title">Verified Parquet Artifact Storage &amp; FastAPI Engine</h4>
                    <p className="pipeline-node-detail">Deterministic analytical artifacts served via sub-millisecond in-memory cache and REST endpoints</p>
                  </div>
                </div>
                <span className="pipeline-node-tag">FastAPI Service</span>
              </div>

              <div className="pipeline-arrow"><ArrowDown size={18} /></div>

              {/* Step 6 */}
              <div className="pipeline-node">
                <div className="pipeline-node-main">
                  <span className="pipeline-step-badge">STEP 6</span>
                  <div>
                    <h4 className="pipeline-node-title">AI Copilot Orchestrator &amp; Operational Dashboards</h4>
                    <p className="pipeline-node-detail">Strict numeric grounding verification combining deterministic tools and TF-IDF operational runbooks</p>
                  </div>
                </div>
                <span className="pipeline-node-tag">Actionable Insights</span>
              </div>
            </div>
          </div>

          <p className="editorial-prose">
            Rather than forcing a single massive model to perform every analytical task, GridVision deliberately separates tasks into specialized, verifiable stages: supervised regression for temporal prediction, geometric distance clustering for behavioral archetypes, and recursive tree isolation for outlier screening. This design ensures that every metric presented to an operator is deterministic, explainable, and fully auditable.
          </p>
        </section>

        {/* ========================================================================= */}
        {/* 5. FORECASTING                                                            */}
        {/* ========================================================================= */}
        <section
          id="overview-forecasting"
          className="overview-full-section"
          aria-label="Day-Ahead Demand Forecasting"
        >
          <span className="section-kicker" style={{ color: 'var(--accent-emerald)' }}>
            SUPERVISED MACHINE LEARNING
          </span>
          <h2 className="section-heading">
            4. Day-Ahead Demand Forecasting
          </h2>
          <p className="section-subheading">
            Estimating 24-hour lookahead electricity demand across half-hourly time intervals using supervised gradient boosting.
          </p>

          <p className="editorial-prose">
            <strong>The Operational Motivation:</strong> In power systems, supply and demand must balance continuously. Day-ahead load forecasting provides distribution engineers and energy suppliers with anticipated consumption trajectories 24 hours into the future, enabling cost-effective generator unit commitment, battery storage scheduling, and peak-load reserve allocation.
          </p>

          <p className="editorial-prose">
            <strong>The LightGBM Formulation:</strong> GridVision formulates forecasting as a supervised regression task using <strong>LightGBM (Light Gradient Boosting Machine)</strong>. LightGBM is uniquely suited to smart-meter tabular time-series data: it captures complex nonlinear interactions between recent consumption patterns and cyclical calendar features while maintaining sub-second inference speeds and transparent feature importance.
          </p>

          <div className="technical-callout-panel">
            <div className="technical-callout-header">
              <Cpu size={16} />
              <span>Feature Engineering &amp; Evaluation Integrity</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <p className="technical-callout-content">
                <strong>Autoregressive Lag Features:</strong> Historical consumption readings at lag <em>t-48</em> (the exact same half-hour interval on the previous day) and lag <em>t-336</em> (the exact same half-hour interval on the previous week) capture recurring diurnal habits and weekly work/weekend cycles.
              </p>
              <p className="technical-callout-content">
                <strong>Calendar &amp; Cyclical Indicators:</strong> Half-hour interval indices (0 to 47), day-of-week indices (0 to 6), and binary weekend flags provide structural cyclical rhythms without relying on external weather telemetry that may fail in remote deployment environments.
              </p>
              <p className="technical-callout-content">
                <strong>Forward-Only Evaluation Protocol:</strong> Models are trained on historical observation windows and evaluated strictly forward-in-time on subsequent holdout windows. This eliminates future lookahead bias, ensuring that reported accuracy metrics (MAE, RMSE) reflect real-world operational performance.
              </p>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 6. CONSUMPTION SEGMENTATION                                               */}
        {/* ========================================================================= */}
        <section
          id="overview-segmentation"
          className="overview-full-section"
          aria-label="Consumer Intelligence and Load Profiling"
        >
          <div id="overview-consumers" />

          <span className="section-kicker" style={{ color: 'var(--accent-blue)' }}>
            UNSUPERVISED MACHINE LEARNING
          </span>
          <h2 className="section-heading">
            5. Consumer Intelligence &amp; Load Profiling
          </h2>
          <p className="section-subheading">
            Grouping consumers with similar behavioral load patterns into interpretable, standardized consumption archetypes.
          </p>

          <p className="editorial-prose">
            <strong>Why Behavioral Segmentation Matters:</strong> Treating all residential consumers as identical baseload accounts obscures localized peak timing and hides demand-side flexibility. By characterizing consumers according to <em>how</em> and <em>when</em> they use power, utilities can design targeted demand-response tariffs, identify feeder stress points, and support tailored energy efficiency programs.
          </p>

          <p className="editorial-prose">
            <strong>Behavioral Representation:</strong> Rather than clustering raw high-dimensional 48-slot load curves directly (which suffer from the curse of dimensionality and phase shifting), GridVision extracts 8 standardized behavioral indicators for every consumer in each 56-day observation window: average consumption, peak consumption, variance, peak-to-average ratio, ramping rate, day-to-night ratio, weekday-to-weekend contrast, and peak timing.
          </p>

          {/* 4 Archetypes Display in 2x2 Grid */}
          <div className="archetypes-grid">
            <div className="archetype-panel" style={{ borderLeft: '4px solid var(--accent-amber)' }}>
              <span className="archetype-badge" style={{ color: 'var(--accent-amber)' }}>ARCHETYPE 1</span>
              <h4 className="archetype-title">Evening Peakers</h4>
              <p className="archetype-timing">Peak Window: 17:30 – 21:30</p>
              <p className="archetype-description">
                Marked by dinner, entertainment, and appliance usage following the return from work or school. Represents standard working-household occupancy with low daytime demand.
              </p>
            </div>

            <div className="archetype-panel" style={{ borderLeft: '4px solid var(--accent-emerald)' }}>
              <span className="archetype-badge" style={{ color: 'var(--accent-emerald)' }}>ARCHETYPE 2</span>
              <h4 className="archetype-title">Baseload Steady</h4>
              <p className="archetype-timing">Peak Window: Continuous flat profile</p>
              <p className="archetype-description">
                Characterized by low-variance, stable 24-hour demand with a high load factor and negligible sharp ramping. High proportion of continuous background refrigeration or automated loads.
              </p>
            </div>

            <div className="archetype-panel" style={{ borderLeft: '4px solid var(--accent-blue)' }}>
              <span className="archetype-badge" style={{ color: 'var(--accent-blue)' }}>ARCHETYPE 3</span>
              <h4 className="archetype-title">Daytime Active</h4>
              <p className="archetype-timing">Peak Window: 09:00 – 16:00</p>
              <p className="archetype-description">
                Elevated daytime electricity consumption between morning and late afternoon, typical of home-based workers, retired occupants, or daytime solar self-consumption routines.
              </p>
            </div>

            <div className="archetype-panel" style={{ borderLeft: '4px solid var(--accent-purple, #a855f7)' }}>
              <span className="archetype-badge" style={{ color: 'var(--accent-purple, #a855f7)' }}>ARCHETYPE 4</span>
              <h4 className="archetype-title">Dual Peakers</h4>
              <p className="archetype-timing">Peak Windows: 07:30 &amp; 19:30</p>
              <p className="archetype-description">
                Distinct bimodal consumption spikes during morning routine preparation and evening cooking, separated by a pronounced afternoon lull when occupants leave the dwelling.
              </p>
            </div>
          </div>

          <div className="technical-callout-panel">
            <div className="technical-callout-header">
              <Workflow size={16} />
              <span>Hungarian Centroid Alignment Protocol</span>
            </div>
            <p className="technical-callout-content">
              Because unsupervised K-Means cluster labels are permutation-invariant across independent runs, running clustering separately in consecutive observation windows would arbitrarily scramble cluster identifiers (e.g., Cluster 1 in Window 2 might represent what was Cluster 3 in Window 1).
            </p>
            <p className="technical-callout-content">
              To solve this fundamental challenge, GridVision implements the <strong>Kuhn-Munkres Hungarian bipartite matching algorithm</strong> to align cluster centroids between successive observation windows by minimizing Euclidean distance in standardized feature space. This ensures that an archetype label like &ldquo;Evening Peakers&rdquo; corresponds to consistent real-world behavior over longitudinal time.
            </p>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 7. ANOMALY DETECTION                                                      */}
        {/* ========================================================================= */}
        <section
          id="overview-anomalies"
          className="overview-full-section"
          aria-label="Consumption Anomaly Detection"
        >
          <span className="section-kicker" style={{ color: 'var(--accent-rose)' }}>
            UNSUPERVISED OUTLIER SCREENING
          </span>
          <h2 className="section-heading">
            6. Consumption Anomaly Detection
          </h2>
          <p className="section-subheading">
            Screening observations that differ substantially from normal consumption baselines to prioritize operational investigation.
          </p>

          <p className="editorial-prose">
            <strong>The Purpose of Anomaly Screening:</strong> On large distribution networks comprising thousands of endpoints, human operators cannot inspect every individual meter trace. Automated anomaly screening isolates observations that display aberrant behavioral characteristics across the 8 behavioral dimensions, allowing grid engineers to triage potential issues before equipment damages occur.
          </p>

          <p className="editorial-prose">
            <strong>Isolation Forest Formulation:</strong> GridVision uses <strong>Isolation Forest</strong> to identify outliers without requiring pre-labeled training data. Because anomalies are few and structurally distinct, they are isolated near the roots of random decision trees with significantly shorter path lengths compared to typical normal observations.
          </p>

          <div className="technical-callout-panel" style={{ borderLeft: '4px solid var(--accent-rose)' }}>
            <div className="technical-callout-header" style={{ color: 'var(--accent-rose)' }}>
              <AlertTriangle size={16} />
              <span>Responsible Operational Interpretation</span>
            </div>
            <p className="technical-callout-content">
              <strong>An anomaly flag indicates unusual behavior; it does not by itself prove a hardware fault or equipment failure.</strong>
            </p>
            <p className="technical-callout-content">
              Unusual demand can stem from legitimate residential activities—such as family gatherings, extended vacations, home renovations, or electric vehicle charging additions—as well as telemetry dropouts, stuck meters, or physical faults. GridVision stratifies alerts into High, Medium, and Low severity tiers, empowering operators to review communication health and feeder events before dispatching field crews.
            </p>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 8. BEHAVIORAL STABILITY / RELIABILITY                                     */}
        {/* ========================================================================= */}
        <section
          id="overview-stability"
          className="overview-full-section"
          aria-label="Behavioral Stability and Reliability Tiers"
        >
          <span className="section-kicker" style={{ color: 'var(--accent-amber)' }}>
            LONGITUDINAL TRACKING
          </span>
          <h2 className="section-heading">
            7. Behavioral Stability &amp; Reliability Tiers
          </h2>
          <p className="section-subheading">
            Tracking how consistently a consumer remains associated with the same load archetype across successive observation periods.
          </p>

          <p className="editorial-prose">
            <strong>What is Behavioral Stability?</strong> A household&apos;s daily routine is not fixed permanently; changes in employment, seasonal heating, or occupancy alter consumption patterns over time. GridVision quantifies behavioral stability by tracking the transition frequency across longitudinal cluster assignments across 14 consecutive observation windows.
          </p>

          <p className="editorial-prose">
            <strong>Operational Value for Demand Response:</strong> When planning demand-response events, utilities need to know which consumers can be counted upon to reduce load reliably during peak hours. GridVision translates stability metrics into operational Reliability Tiers:
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', margin: '0.5rem 0 1.5rem 0' }}>
            <div className="editorial-text-panel" style={{ padding: '1.25rem 1.5rem', margin: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <strong style={{ color: 'var(--accent-emerald)', fontSize: '1.02rem' }}>Tier 1: Stable Reliability</strong>
                <span className="pipeline-node-tag">Transition Rate &le; 15%</span>
              </div>
              <p style={{ margin: '0.4rem 0 0 0', fontSize: '0.94rem', color: 'var(--foreground-muted)', lineHeight: 1.6 }}>
                Consumers with deeply ingrained habits who remain within the same behavioral archetype window after window. Ideal for committed capacity contracts and predictable demand reduction.
              </p>
            </div>

            <div className="editorial-text-panel" style={{ padding: '1.25rem 1.5rem', margin: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <strong style={{ color: 'var(--accent-amber)', fontSize: '1.02rem' }}>Tier 2: Moderate Reliability</strong>
                <span className="pipeline-node-tag">Transition Rate 16% – 35%</span>
              </div>
              <p style={{ margin: '0.4rem 0 0 0', fontSize: '0.94rem', color: 'var(--foreground-muted)', lineHeight: 1.6 }}>
                Consumers whose routines shift seasonally (e.g., transition between Evening Peaker in winter and Daytime Active in summer). Suitable for flexible tariffs with adaptive parameters.
              </p>
            </div>

            <div className="editorial-text-panel" style={{ padding: '1.25rem 1.5rem', margin: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <strong style={{ color: 'var(--accent-rose)', fontSize: '1.02rem' }}>Tier 3: Elevated Risk</strong>
                <span className="pipeline-node-tag">Transition Rate &gt; 35%</span>
              </div>
              <p style={{ margin: '0.4rem 0 0 0', fontSize: '0.94rem', color: 'var(--foreground-muted)', lineHeight: 1.6 }}>
                Consumers whose load profiles change frequently across windows. Planners should apply conservative safety margins when forecasting load contributions from these accounts.
              </p>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 9. AI COPILOT                                                             */}
        {/* ========================================================================= */}
        <section
          id="overview-copilot"
          className="overview-full-section"
          aria-label="The GridVision AI Copilot"
        >
          <span className="section-kicker" style={{ color: 'var(--accent-purple, #a855f7)' }}>
            GROUNDED NATURAL-LANGUAGE ASSISTANCE
          </span>
          <h2 className="section-heading">
            8. The GridVision AI Copilot
          </h2>
          <p className="section-subheading">
            A natural-language orchestration interface that queries verified analytics tools and domain knowledge without replacing underlying machine-learning models.
          </p>

          <p className="editorial-prose">
            <strong>An Orchestration Layer, Not an ML Predictor:</strong> The AI Copilot provides a natural-language bridge between human operators and complex energy data. <strong>The language model does not calculate forecasts or detect anomalies itself; rather, it orchestrates existing GridVision analytics engines</strong> by calling deterministic backend tools to fetch real data before composing responses.
          </p>

          <div className="editorial-text-panel">
            <h3 className="editorial-panel-title">
              <CheckCircle2 size={22} style={{ color: 'var(--accent-emerald)' }} />
              <span>Two Strictly Separated Knowledge Channels</span>
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.25rem' }}>
              <div>
                <strong style={{ color: 'var(--foreground)', fontSize: '1.0rem', display: 'block', marginBottom: '0.25rem' }}>
                  1. Analytics Tools (Deterministic Execution)
                </strong>
                <p style={{ margin: 0, fontSize: '0.94rem', color: 'var(--foreground-muted)', lineHeight: 1.6 }}>
                  Pre-registered Python functions (e.g. <code>get_forecast_evaluation</code>, <code>get_cluster_stability</code>, <code>get_anomaly_summary</code>) that query precomputed Parquet artifacts. If an operator asks <em>&ldquo;What is the MAE for Window 3?&rdquo;</em>, the Copilot executes the tool and retrieves the exact numeric metric rather than guessing.
                </p>
              </div>
              <div>
                <strong style={{ color: 'var(--foreground)', fontSize: '1.0rem', display: 'block', marginBottom: '0.25rem' }}>
                  2. Domain Knowledge Retrieval (Local TF-IDF RAG)
                </strong>
                <p style={{ margin: 0, fontSize: '0.94rem', color: 'var(--foreground-muted)', lineHeight: 1.6 }}>
                  Operational standard operating procedures, meter inspection protocols, and electrical glossary definitions indexed using local TF-IDF cosine similarity. Requires zero external API connectivity and maintains total offline security.
                </p>
              </div>
            </div>
          </div>

          <div className="technical-callout-panel">
            <div className="technical-callout-header">
              <ShieldCheck size={16} />
              <span>Strict Numeric Grounding Verification</span>
            </div>
            <p className="technical-callout-content">
              To eliminate language model hallucinations in high-stakes utility operations, GridVision implements an automated <strong>Numeric Grounding Guard</strong>. Every integer, decimal, and percentage in the Copilot&apos;s answer is extracted and cross-checked against the tool execution outputs or retrieved runbook chunks from that specific turn. If an ungrounded or fabricated number is detected, the response is explicitly flagged.
            </p>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 10. END-TO-END ARCHITECTURE                                               */}
        {/* ========================================================================= */}
        <section
          id="overview-architecture"
          className="overview-full-section"
          aria-label="System Architecture"
        >
          <span className="section-kicker" style={{ color: 'var(--accent-emerald)' }}>
            SYSTEM ARCHITECTURE
          </span>
          <h2 className="section-heading">
            9. End-to-End System Architecture
          </h2>
          <p className="section-subheading">
            A clean modular design connecting data pipelines, machine-learning analytics, local retrieval, and dashboard presentation.
          </p>

          <p className="editorial-prose">
            The GridVision application is engineered as a production-grade decoupled architecture built entirely with open-source technologies:
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', margin: '0.5rem 0 2rem 0' }}>
            <div className="editorial-text-panel" style={{ padding: '1.35rem 1.75rem', margin: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, color: 'var(--foreground)' }}>Frontend Presentation Tier</h4>
                <span className="pipeline-node-tag">React 19 + TypeScript + Vite</span>
              </div>
              <p style={{ margin: 0, fontSize: '0.94rem', color: 'var(--foreground-muted)', lineHeight: 1.6 }}>
                Componentized single-page application featuring responsive layout shells, custom interactive SVG time-series visualizations, dual light/dark themes, and client-side routing. Optimized for zero layout thrashing and presentation readability.
              </p>
            </div>

            <div className="editorial-text-panel" style={{ padding: '1.35rem 1.75rem', margin: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, color: 'var(--foreground)' }}>Backend Analytics Service</h4>
                <span className="pipeline-node-tag">FastAPI + PyArrow + Scikit-Learn</span>
              </div>
              <p style={{ margin: 0, fontSize: '0.94rem', color: 'var(--foreground-muted)', lineHeight: 1.6 }}>
                High-performance asynchronous Python REST API serving verified analytics from immutable columnar Apache Parquet artifacts. Implements in-memory caching and offline TF-IDF RAG retrieval with sub-millisecond response latency.
              </p>
            </div>

            <div className="editorial-text-panel" style={{ padding: '1.35rem 1.75rem', margin: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, color: 'var(--foreground)' }}>Containerized Packaging &amp; Deployment</h4>
                <span className="pipeline-node-tag">Multi-Stage Docker</span>
              </div>
              <p style={{ margin: 0, fontSize: '0.94rem', color: 'var(--foreground-muted)', lineHeight: 1.6 }}>
                Unified single-container deployment bundling the compiled static frontend and Python backend service. Operates entirely self-contained with zero external database or cloud subscription dependencies.
              </p>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 11. RELATED RESEARCH                                                      */}
        {/* ========================================================================= */}
        <section
          id="overview-research"
          className="overview-full-section"
          aria-label="Related Research Study Technical Explanation"
        >
          <div id="research-section" />

          <span className="section-kicker" style={{ color: 'var(--accent-indigo)' }}>
            ACADEMIC EXTENSION
          </span>
          <h2 className="section-heading">
            10. Related Research: Temporal Cluster Instability &amp; Forecast Failure
          </h2>
          <p className="section-subheading">
            A standalone empirical investigation conducted alongside the engineering capstone to test whether behavioral archetype transitions provide early warning of severe forecasting failures.
          </p>

          <p className="editorial-prose">
            <strong>The Academic Research Question:</strong> In energy data science literature, many works propose dynamic customer segmentation to improve forecasting. We tested this premise empirically: <em>&ldquo;Does instability in a consumer&apos;s behavioral-cluster assignment help identify periods when the next forecast is more likely to fail badly, after accounting for the consumer&apos;s underlying consumption volatility?&rdquo;</em>
          </p>

          {/* Headline Finding Banner */}
          <div className="overview-research-verdict-card">
            <div className="verdict-card-inner">
              <div className="verdict-badge">
                <span>CENTRAL RESEARCH FINDING &amp; EMPIRICAL VERDICT</span>
              </div>
              <h3 className="verdict-title">
                Behavioral Cluster Instability is Not an Independent Predictor of Extreme Forecast Failure
              </h3>
              <p className="verdict-statement">
                &ldquo;After controlling for baseline consumption volatility, temporal cluster instability was not independently associated with extreme load-forecast failure (Odds Ratio = 0.9183, p = 0.7481). The null hypothesis (H0) was supported.&rdquo;
              </p>
              <p className="verdict-subtext">
                Supervised gradient boosting models adapt smoothly across behavioral regime shifts. Underlying high-frequency demand volatility remains the dominant physical driver of extreme forecast errors (Odds Ratio = 7.4459, p &lt; 0.0001).
              </p>
            </div>
          </div>

          <div className="editorial-text-panel">
            <h3 className="editorial-panel-title">
              <Scale size={22} style={{ color: 'var(--accent-indigo)' }} />
              <span>Rigorous Experimental Protocol</span>
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <p className="editorial-prose" style={{ margin: 0 }}>
                <strong>1. Prospective Threshold Definition:</strong> Extreme forecast failure was defined prospectively using the 95th percentile standardized error threshold (2.53438) calibrated on baseline training data to avoid post-hoc threshold manipulation.
              </p>
              <p className="editorial-prose" style={{ margin: 0 }}>
                <strong>2. Household-Clustered Standard Errors:</strong> Logistic regression models were estimated with <strong>cluster-robust standard errors grouped at the household level</strong> across 3,676 consumer-window observations. This correctly adjusts for longitudinal repeated measures and avoids pseudo-replication.
              </p>
              <p className="editorial-prose" style={{ margin: 0 }}>
                <strong>3. Clear Separation of Capstone vs Research:</strong> The capstone application uses clustering for operational consumer understanding, where it succeeds brilliantly. The research study evaluated whether that same clustering also predicted forecast breakdown—a distinct hypothesis that proved false. This honest reporting demonstrates genuine scientific integrity.
              </p>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 12. LIMITATIONS & RESPONSIBLE INTERPRETATION                              */}
        {/* ========================================================================= */}
        <section
          id="overview-limitations"
          className="overview-full-section"
          aria-label="Methodological Limitations and Scope"
        >
          <span className="section-kicker" style={{ color: 'var(--accent-rose)' }}>
            RESPONSIBLE INTERPRETATION
          </span>
          <h2 className="section-heading">
            11. Methodological Limitations &amp; Scope
          </h2>
          <p className="section-subheading">
            Important boundaries to consider when interpreting GridVision findings and transferring conclusions to other power systems.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', margin: '0.5rem 0 2rem 0' }}>
            <div className="editorial-text-panel" style={{ padding: '1.35rem 1.75rem', margin: 0 }}>
              <h4 style={{ margin: '0 0 0.35rem 0', fontSize: '1.1rem', fontWeight: 600, color: 'var(--foreground)' }}>
                Observational Design &amp; Associational Boundaries
              </h4>
              <p style={{ margin: 0, fontSize: '0.94rem', color: 'var(--foreground-muted)', lineHeight: 1.6 }}>
                The research analysis is observational and prospective. <strong>Findings demonstrate statistical associations, not causal relationships.</strong> Behavioral cluster mobility cannot be assumed to cause or prevent forecast failures.
              </p>
            </div>

            <div className="editorial-text-panel" style={{ padding: '1.35rem 1.75rem', margin: 0 }}>
              <h4 style={{ margin: '0 0 0.35rem 0', fontSize: '1.1rem', fontWeight: 600, color: 'var(--foreground)' }}>
                Seasonal Space-Heating Demand Expansion
              </h4>
              <p style={{ margin: 0, fontSize: '0.94rem', color: 'var(--foreground-muted)', lineHeight: 1.6 }}>
                Winter heating demand expansion induces absolute load and residual variance expansion that outpaces scale-invariant coefficient of variation (CV). Consequently, extreme absolute forecast residuals concentrate heavily in winter calendar periods.
              </p>
            </div>

            <div className="editorial-text-panel" style={{ padding: '1.35rem 1.75rem', margin: 0 }}>
              <h4 style={{ margin: '0 0 0.35rem 0', fontSize: '1.1rem', fontWeight: 600, color: 'var(--foreground)' }}>
                Flat-Rate Tariff Environment Context
              </h4>
              <p style={{ margin: 0, fontSize: '0.94rem', color: 'var(--foreground-muted)', lineHeight: 1.6 }}>
                The trial cohort reflects residential households billed on flat electricity rates without automated home energy management systems (HEMS). Consumption routines reflect spontaneous human occupancy habits rather than automated price-responsive curtailment.
              </p>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 13. FINAL TAKEAWAY & LAUNCH DASHBOARD                                    */}
        {/* ========================================================================= */}
        <section
          id="overview-takeaway"
          className="overview-full-section"
          aria-label="Final Takeaway and Launch Dashboard"
          style={{ marginBottom: '2rem' }}
        >
          <div
            style={{
              padding: '2.75rem',
              backgroundColor: 'var(--surface-raised)',
              border: '1px solid var(--border-strong)',
              borderRadius: 'var(--radius-lg)',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.35rem',
            }}
          >
            <div>
              <span className="section-kicker" style={{ color: 'var(--accent-emerald)' }}>
                FINAL TAKEAWAY
              </span>
              <h2 style={{ margin: '0.4rem 0 0.85rem 0', fontSize: '2.0rem', fontWeight: 700, color: 'var(--foreground)' }}>
                Operational Energy Intelligence Built on Rigorous Data Science
              </h2>
              <p style={{ margin: 0, fontSize: '1.05rem', color: 'var(--foreground-muted)', lineHeight: 1.75, maxWidth: '920px' }}>
                GridVision proves that modern smart-meter analytics do not need to choose between rigorous data science and intuitive operational utility. By formulating clean complementary tasks—supervised gradient boosting for forecasting, distance clustering for load profiling, isolation trees for anomaly screening, and strictly grounded language orchestration for human interaction—the platform empowers distribution engineers and energy analysts to make confident, data-driven decisions.
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.85rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="overview-cta-btn"
                onClick={onLaunchDashboard}
                style={{
                  padding: '0.85rem 1.85rem',
                  fontSize: '0.92rem',
                  backgroundColor: 'var(--foreground)',
                  color: 'var(--background)',
                  borderRadius: 'var(--radius-sm)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.65rem',
                }}
              >
                <span>LAUNCH OPERATIONAL DASHBOARD</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
