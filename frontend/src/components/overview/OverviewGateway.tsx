import React from 'react';
import { ArrowDown, ArrowRight } from 'lucide-react';
import type { DashboardSection } from '../../types/dashboard';
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
  const scrollTo = (elementId: string) => {
    const el = document.getElementById(elementId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
        {/* 1. HERO SECTION                                                           */}
        {/* ========================================================================= */}
        <header className="overview-hero">
          <span className="overview-brand-kicker">GRIDVISION</span>

          <h1 className="overview-hero-title">Smart Energy Analytics &amp; AI Copilot</h1>

          <div className="overview-hero-tagline">
            &ldquo;From smart-meter data to actionable electricity intelligence.&rdquo;
          </div>

          <p className="overview-hero-lede">
            GridVision transforms high-frequency electricity consumption data into practical analytical
            insight. It combines demand analysis, behavioral segmentation, forecasting, anomaly detection
            and a grounded AI Copilot to help users understand electricity consumption across households
            and over time.
          </p>

          <div className="overview-hero-actions">
            <button
              type="button"
              className="overview-btn-primary"
              onClick={onLaunchDashboard}
            >
              <span>Launch Dashboard</span>
              <ArrowRight size={16} />
            </button>
            <button
              type="button"
              className="overview-btn-text"
              onClick={() => scrollTo('overview-intro')}
            >
              <span>Learn How It Works</span>
              <ArrowDown size={14} />
            </button>
          </div>
        </header>

        {/* ========================================================================= */}
        {/* 2. SUB-NAVIGATION                                                         */}
        {/* ========================================================================= */}
        <nav className="overview-subnav" aria-label="Page navigation">
          <button type="button" onClick={() => scrollTo('overview-intro')}>
            Introduction
          </button>
          <span className="overview-subnav-divider">/</span>
          <button type="button" onClick={() => scrollTo('overview-dataset')}>
            Dataset &amp; Smart-Meter Data
          </button>
          <span className="overview-subnav-divider">/</span>
          <button type="button" onClick={() => scrollTo('overview-how-it-works')}>
            How GridVision Works
          </button>
          <span className="overview-subnav-divider">/</span>
          <button type="button" onClick={() => scrollTo('overview-workspaces')}>
            What You Can Explore
          </button>
          <span className="overview-subnav-divider">/</span>
          <button type="button" onClick={() => scrollTo('overview-copilot')}>
            AI Copilot
          </button>
        </nav>

        {/* ========================================================================= */}
        {/* 3. INTRODUCTION                                                           */}
        {/* ========================================================================= */}
        <section id="overview-intro" className="overview-section" aria-label="Introduction">
          <h2 className="overview-section-title">Introduction</h2>

          <p className="overview-prose">
            Smart meters generate large volumes of electricity readings every day. The challenge is not
            simply collecting those measurements — it is turning them into information that people can
            understand and act on.
          </p>

          <p className="overview-prose">
            GridVision brings several analytical views together in one platform: demand patterns, household
            consumption behavior, future demand, unusual activity and natural-language exploration.
          </p>

          <ul className="overview-feature-list">
            <li>
              <span className="overview-bullet-dot" />
              <span><strong>Understand daily patterns:</strong> See how electricity demand changes throughout the day.</span>
            </li>
            <li>
              <span className="overview-bullet-dot" />
              <span><strong>Compare consumption:</strong> Group and compare behavior across participating households.</span>
            </li>
            <li>
              <span className="overview-bullet-dot" />
              <span><strong>Forecast future demand:</strong> Predict upcoming electricity demand across dispatch intervals.</span>
            </li>
            <li>
              <span className="overview-bullet-dot" />
              <span><strong>Identify unusual activity:</strong> Surface unusual consumption patterns for review.</span>
            </li>
            <li>
              <span className="overview-bullet-dot" />
              <span><strong>Explore with AI:</strong> Query metrics and findings through a grounded AI Copilot.</span>
            </li>
          </ul>
        </section>

        {/* ========================================================================= */}
        {/* 4. DATASET & SMART-METER DATA                                             */}
        {/* ========================================================================= */}
        <section id="overview-dataset" className="overview-section" aria-label="Dataset & Smart-Meter Data">
          <h2 className="overview-section-title">Dataset &amp; Smart-Meter Data</h2>

          <p className="overview-prose">
            GridVision uses smart-meter data from the Low Carbon London project, conducted by UK Power Networks.
          </p>

          <p className="overview-prose">
            Each day contains 48 half-hour electricity readings. GridVision organizes these readings into 56-day
            analytical windows so that consumption can be studied consistently over time.
          </p>

          {/* Clean typographic stats */}
          <div className="overview-data-stats">
            <div className="overview-stat-col">
              <span className="overview-stat-number">5,566</span>
              <span className="overview-stat-label">Households in source metadata</span>
            </div>
            <div className="overview-stat-col">
              <span className="overview-stat-number">4,443</span>
              <span className="overview-stat-label">Flat-rate (Std) households</span>
            </div>
            <div className="overview-stat-col">
              <span className="overview-stat-number">620</span>
              <span className="overview-stat-label">Final working sample</span>
            </div>
            <div className="overview-stat-col">
              <span className="overview-stat-number">6,191</span>
              <span className="overview-stat-label">Usable household windows</span>
            </div>
            <div className="overview-stat-col">
              <span className="overview-stat-number">56 Days</span>
              <span className="overview-stat-label">Analytical window length</span>
            </div>
          </div>

          <p className="overview-prose">
            The final working sample contains 620 households and 6,191 usable household windows.
            Data quality checks are applied before a household window is included in analysis.
          </p>
        </section>

        {/* ========================================================================= */}
        {/* 5. HOW GRIDVISION WORKS                                                   */}
        {/* ========================================================================= */}
        <section id="overview-how-it-works" className="overview-section" aria-label="How GridVision Works">
          <h2 className="overview-section-title">How GridVision Works</h2>

          <p className="overview-prose">
            GridVision processes raw electricity readings through a structured analytical pipeline,
            extracting standardized behavioral features before passing them to specialized analytical models.
          </p>

          {/* Educational Visual Flow */}
          <div className="workflow-pipeline-wrapper">
            <div className="workflow-pipeline-card">
              <div className="workflow-step-box">
                <div className="workflow-step-title">SMART-METER DATA</div>
                <div className="workflow-step-desc">48 half-hour readings per day across participating households</div>
              </div>

              <div className="workflow-arrow-down">&darr;</div>

              <div className="workflow-step-box">
                <div className="workflow-step-title">QUALITY CHECKS &amp; WINDOWING</div>
                <div className="workflow-step-desc">Screening for completeness and partitioning into 56-day observation periods</div>
              </div>

              <div className="workflow-arrow-down">&darr;</div>

              <div className="workflow-step-box">
                <div className="workflow-step-title">BEHAVIORAL FEATURES</div>
                <div className="workflow-step-desc">8 standardized metrics characterizing load volume, timing, and variability</div>
              </div>

              <div className="workflow-arrow-down">&darr;</div>

              <div className="workflow-step-box" style={{ maxWidth: '620px' }}>
                <div className="workflow-step-title" style={{ marginBottom: '0.65rem' }}>ANALYTICAL MODELS</div>
                <div className="workflow-models-grid">
                  <div className="workflow-model-item">
                    <strong>Demand Analysis</strong>
                    Diurnal load curves &amp; weekday contrasts
                  </div>
                  <div className="workflow-model-item">
                    <strong>K-Means Segmentation</strong>
                    Household behavioral archetypes (K = 4)
                  </div>
                  <div className="workflow-model-item">
                    <strong>Demand Forecasting</strong>
                    Global gradient-boosted demand prediction
                  </div>
                  <div className="workflow-model-item">
                    <strong>Isolation Forest</strong>
                    Detection of unusual consumption patterns
                  </div>
                </div>
              </div>

              <div className="workflow-arrow-down">&darr;</div>

              <div className="workflow-step-box" style={{ borderColor: 'var(--accent-emerald, #059669)' }}>
                <div className="workflow-step-title" style={{ color: 'var(--accent-emerald, #059669)' }}>
                  DASHBOARD + AI COPILOT
                </div>
                <div className="workflow-step-desc">
                  Interactive visual workspaces and grounded natural-language exploration
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 6. WHAT YOU CAN EXPLORE                                                   */}
        {/* ========================================================================= */}
        <section id="overview-workspaces" className="overview-section" aria-label="What You Can Explore">
          <h2 className="overview-section-title">What You Can Explore</h2>

          <p className="overview-prose">
            The GridVision dashboard provides interactive workspaces to examine each analytical layer directly.
          </p>

          {/* 1. Demand Analysis */}
          <div className="overview-workspace-item">
            <div className="overview-workspace-header">
              <h3 className="overview-workspace-title">Demand Analysis</h3>
              <button
                type="button"
                className="overview-open-btn"
                onClick={() => handleOpenSection('demand')}
              >
                <span>Open Demand Analysis</span>
                <ArrowRight size={14} />
              </button>
            </div>
            <p className="overview-prose">
              Demand Analysis shows how electricity consumption changes throughout the day, across weekdays
              and weekends, and across the available observation windows.
            </p>
            <div className="overview-feature-pills">
              <span className="overview-pill">48 Half-Hour Slots / Day</span>
              <span className="overview-pill">Diurnal Demand Profiles</span>
              <span className="overview-pill">Weekday vs. Weekend Comparison</span>
              <span className="overview-pill">Longitudinal Window Trends</span>
            </div>
          </div>

          {/* 2. Consumer Intelligence */}
          <div className="overview-workspace-item">
            <div className="overview-workspace-header">
              <h3 className="overview-workspace-title">Consumer Intelligence</h3>
              <button
                type="button"
                className="overview-open-btn"
                onClick={() => handleOpenSection('consumers')}
              >
                <span>Open Consumer Intelligence</span>
                <ArrowRight size={14} />
              </button>
            </div>
            <p className="overview-prose">
              GridVision groups households with similar electricity-consumption behavior using K-Means clustering (K = 4).
              Households are characterized across 8 standardized behavioral dimensions:
            </p>
            <ul className="overview-feature-list" style={{ marginTop: '0.25rem' }}>
              <li>
                <span className="overview-bullet-dot" />
                <span><strong>Mean load &amp; peak load:</strong> Baseline draw and maximum half-hour demand point.</span>
              </li>
              <li>
                <span className="overview-bullet-dot" />
                <span><strong>Peak-to-average ratio &amp; variability:</strong> Volatility and dispersion across observation intervals.</span>
              </li>
              <li>
                <span className="overview-bullet-dot" />
                <span><strong>Ramp-rate &amp; day/night ratio:</strong> Interval rate of change and daytime-to-overnight consumption balance.</span>
              </li>
              <li>
                <span className="overview-bullet-dot" />
                <span><strong>Weekday/weekend contrast &amp; peak timing:</strong> Workday differential and typical time of day for peak usage.</span>
              </li>
            </ul>
            <p className="overview-prose" style={{ marginTop: '0.4rem' }}>
              The workspace includes cluster archetype comparisons, consumer rankings by load factor and peak intensity,
              and individual household profile searches.
            </p>
          </div>

          {/* 3. Anomaly Detection */}
          <div className="overview-workspace-item">
            <div className="overview-workspace-header">
              <h3 className="overview-workspace-title">Anomaly Detection</h3>
              <button
                type="button"
                className="overview-open-btn"
                onClick={() => handleOpenSection('anomalies')}
              >
                <span>Open Anomaly Detection</span>
                <ArrowRight size={14} />
              </button>
            </div>
            <p className="overview-prose">
              GridVision uses Isolation Forest to identify unusual electricity-consumption patterns.
              Across the verified analytical windows, <strong>310 anomalies</strong> were detected.
              Unusual observations are surfaced for further investigation, helping analysts spot unexpected
              demand surges or departures from baseline behavior.
            </p>
          </div>

          {/* 4. Demand Forecasting */}
          <div className="overview-workspace-item">
            <div className="overview-workspace-header">
              <h3 className="overview-workspace-title">Demand Forecasting</h3>
              <button
                type="button"
                className="overview-open-btn"
                onClick={() => handleOpenSection('forecasting')}
              >
                <span>Open Demand Forecasting</span>
                <ArrowRight size={14} />
              </button>
            </div>
            <p className="overview-prose">
              GridVision uses a global gradient-boosted forecasting model to predict future half-hour electricity
              demand from historical consumption patterns, benchmarked against seasonal-naive baselines.
            </p>
            <div className="overview-feature-pills">
              <span className="overview-pill">Forecast MAE: 0.081 kW</span>
              <span className="overview-pill">14,805,504 Half-Hour Predictions Generated</span>
              <span className="overview-pill">Day-Ahead Half-Hourly Dispatch Horizon</span>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 7. AI COPILOT                                                             */}
        {/* ========================================================================= */}
        <section id="overview-copilot" className="overview-section" aria-label="AI Copilot">
          <h2 className="overview-section-title">AI Copilot</h2>

          <p className="overview-prose">
            Ask GridVision questions in natural language. The Copilot combines project knowledge with
            deterministic analytical tools so that numerical answers are grounded in the system&apos;s computed results.
          </p>

          <p className="overview-prose">
            Analysts can query aggregate demand statistics, compare behavioral clusters, check anomaly counts,
            or inspect specific observation windows without writing database queries.
          </p>

          <button
            type="button"
            className="overview-btn-primary"
            onClick={() => handleOpenSection('copilot')}
            style={{ alignSelf: 'flex-start', marginTop: '0.25rem' }}
          >
            <span>Open AI Copilot</span>
            <ArrowRight size={15} />
          </button>
        </section>

        {/* ========================================================================= */}
        {/* 8. OPEN DASHBOARD CALL TO ACTION                                          */}
        {/* ========================================================================= */}
        <section className="overview-bottom-cta">
          <h3 className="overview-bottom-title">Explore the Live Platform</h3>
          <p className="overview-prose">
            Navigate through all workspaces, inspect half-hourly load curves, and interact with the data directly.
          </p>
          <button
            type="button"
            className="overview-btn-primary"
            onClick={onLaunchDashboard}
          >
            <span>Open Dashboard</span>
            <ArrowRight size={16} />
          </button>
        </section>

        {/* Backward-compatibility anchors */}
        <div id="overview-problem" style={{ display: 'none' }} />
        <div id="overview-workflow" style={{ display: 'none' }} />
        <div id="overview-explore" style={{ display: 'none' }} />
        <div id="overview-demand" style={{ display: 'none' }} />
        <div id="overview-consumers" style={{ display: 'none' }} />
        <div id="overview-segmentation" style={{ display: 'none' }} />
        <div id="overview-anomalies" style={{ display: 'none' }} />
        <div id="overview-forecasting" style={{ display: 'none' }} />
        <div id="overview-research" style={{ display: 'none' }} />
      </div>
    </article>
  );
};
