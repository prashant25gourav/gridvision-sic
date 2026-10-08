import React, { useEffect } from 'react';
import { ArrowDown, ArrowRight } from 'lucide-react';
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
        {/* 1. EDITORIAL INTRODUCTION                                                 */}
        {/* ========================================================================= */}
        <header className="overview-editorial-hero">
          <div className="editorial-meta-line">
            <span className="editorial-kicker">GRIDVISION &bull; SMART ENERGY ANALYTICS &amp; AI COPILOT</span>
            <span className="editorial-version-tag">VERIFIED COHORT DATA</span>
          </div>

          <h1 className="editorial-headline">GRIDVISION</h1>

          <div className="editorial-strapline">
            &ldquo;From smart-meter data to actionable electricity intelligence.&rdquo;
          </div>

          <p className="editorial-lede">
            GridVision transforms high-frequency electricity consumption data into practical
            analytical insight. It combines behavioral segmentation, demand forecasting, anomaly
            detection and grounded AI assistance to help users understand how electricity
            consumption changes across households and over time.
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
              onClick={() => scrollToSection('overview-problem')}
            >
              <span>Read System Explainer</span>
              <ArrowDown size={14} />
            </button>
          </div>
        </header>

        {/* ========================================================================= */}
        {/* EDITORIAL SECTION INDEX (Minimalist Quick Jump)                           */}
        {/* ========================================================================= */}
        <nav className="editorial-index-bar" aria-label="Overview Section Index">
          <span className="index-bar-label">SECTION INDEX:</span>
          <div className="index-bar-links">
            <button type="button" onClick={() => scrollToSection('overview-problem')}>
              01 Why GridVision
            </button>
            <span className="index-divider">/</span>
            <button type="button" onClick={() => scrollToSection('overview-dataset')}>
              02 Data Explainer
            </button>
            <span className="index-divider">/</span>
            <button type="button" onClick={() => scrollToSection('overview-workflow')}>
              03 How GridVision Works
            </button>
            <span className="index-divider">/</span>
            <button type="button" onClick={() => scrollToSection('overview-explore')}>
              04 Explore the Grid
            </button>
            <span className="index-divider">/</span>
            <button type="button" onClick={() => scrollToSection('overview-research')}>
              05 Behind the Product
            </button>
          </div>
        </nav>

        {/* ========================================================================= */}
        {/* 2. WHY GRIDVISION?                                                        */}
        {/* ========================================================================= */}
        <section id="overview-problem" className="editorial-section" aria-label="Why GridVision">
          <div className="section-number-header">
            <span className="section-index-num">01</span>
            <div className="section-header-text">
              <span className="section-eyebrow">THE OPERATIONAL CHALLENGE</span>
              <h2 className="section-heading">Why GridVision?</h2>
            </div>
          </div>

          <div className="editorial-prose-block">
            <p className="editorial-callout-quote">
              Smart meters produce enormous volumes of consumption measurements.
              The challenge is not simply collecting those readings — it is understanding
              the patterns hidden inside them.
            </p>

            <p className="editorial-body-text">
              Raw half-hourly kilowatt values alone do not inform a grid operator when peak stress will occur,
              which customer cohorts drive ramps, or whether an observed fluctuation represents an equipment defect,
              a lifestyle shift, or benign seasonal variation. GridVision bridges this gap with structured analytical
              methods:
            </p>

            <ul className="editorial-points-list">
              <li>
                <span className="point-bullet" />
                <div className="point-content">
                  <strong>Understand how demand changes throughout the day:</strong> Track half-hourly aggregate load shapes, identify morning ramps, isolate evening peaks, and evaluate weekday versus weekend contrasts.
                </div>
              </li>
              <li>
                <span className="point-bullet" />
                <div className="point-content">
                  <strong>Identify households with similar consumption behavior:</strong> Segment heterogeneous consumer populations into interpretable behavioral archetypes based on recurring load levels, diurnal timing, and variability.
                </div>
              </li>
              <li>
                <span className="point-bullet" />
                <div className="point-content">
                  <strong>Detect unusual consumption patterns:</strong> Screen anomalous household windows with statistical thresholding, isolating erratic spikes and abnormal consumption signatures before they compound.
                </div>
              </li>
              <li>
                <span className="point-bullet" />
                <div className="point-content">
                  <strong>Forecast upcoming electricity demand:</strong> Generate day-ahead demand predictions across 48 discrete dispatch intervals to support reserve planning and system reliability.
                </div>
              </li>
              <li>
                <span className="point-bullet" />
                <div className="point-content">
                  <strong>Ask questions about the data through a grounded AI Copilot:</strong> Query metrics, household profiles, and system runbooks in natural language, backed strictly by verified calculations.
                </div>
              </li>
            </ul>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 3. DATA EXPLAINER                                                         */}
        {/* ========================================================================= */}
        <section id="overview-dataset" className="editorial-section" aria-label="Data Explainer">
          <div className="section-number-header">
            <span className="section-index-num">02</span>
            <div className="section-header-text">
              <span className="section-eyebrow">DATA FOUNDATION</span>
              <h2 className="section-heading">From meter readings to usable signals</h2>
            </div>
          </div>

          <div className="editorial-prose-block">
            <p className="editorial-body-text">
              GridVision works with 48 half-hour readings per day, organized into 56-day analytical
              windows. From the source population of 5,566 households, the final working sample
              contains 620 households and 6,191 usable windows.
            </p>

            {/* Typographic highlights - NOT large cards, but clean inline statistical metrics */}
            <div className="editorial-stats-row">
              <div className="editorial-stat-item">
                <span className="stat-number">5,566</span>
                <span className="stat-label">Source households in metadata</span>
              </div>
              <div className="editorial-stat-divider" />
              <div className="editorial-stat-item">
                <span className="stat-number">4,443</span>
                <span className="stat-label">Flat-rate tariff cohort</span>
              </div>
              <div className="editorial-stat-divider" />
              <div className="editorial-stat-item highlight">
                <span className="stat-number">620</span>
                <span className="stat-label">Quality-filtered working sample</span>
              </div>
              <div className="editorial-stat-divider" />
              <div className="editorial-stat-item highlight">
                <span className="stat-number">6,191</span>
                <span className="stat-label">Usable 56-day analysis windows</span>
              </div>
              <div className="editorial-stat-divider" />
              <div className="editorial-stat-item">
                <span className="stat-number">48</span>
                <span className="stat-label">Half-hour slots per diurnal cycle</span>
              </div>
            </div>

            <p className="editorial-body-footnote">
              To guarantee scientific and operational integrity, all data undergoes rigorous
              completeness filtering and zero-leakage window partitioning. No synthetic readings
              or fabricated profiles are permitted.
            </p>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 4. HOW GRIDVISION WORKS                                                   */}
        {/* ========================================================================= */}
        <section id="overview-workflow" className="editorial-section" aria-label="How GridVision Works">
          <div id="overview-capabilities" />
          <div className="section-number-header">
            <span className="section-index-num">03</span>
            <div className="section-header-text">
              <span className="section-eyebrow">ANALYTICAL WORKFLOW</span>
              <h2 className="section-heading">How GridVision turns readings into intelligence</h2>
            </div>
          </div>

          <p className="editorial-body-text">
            GridVision processes electricity consumption through an ordered seven-stage pipeline.
            Each transformation step preserves methodological traceability and produces reproducible
            analytical artifacts.
          </p>

          {/* Technical Process Diagram */}
          <div className="technical-pipeline-flow">
            {[
              {
                step: '01',
                title: 'SMART-METER READINGS',
                desc: 'Raw half-hourly kilowatt-hour consumption streams recorded across participating households.',
              },
              {
                step: '02',
                title: 'QUALITY CONTROL & WINDOWING',
                desc: 'Screening for missing data, zero-consumption outliers, and slicing into 56-day analytical epochs.',
              },
              {
                step: '03',
                title: 'BEHAVIORAL FEATURES',
                desc: 'Extraction of 8 standardized metrics: mean load, peak load, peak-to-average ratio, variability, ramp behavior, day/night split, weekday contrast, and peak timing.',
              },
              {
                step: '04',
                title: 'HOUSEHOLD SEGMENTATION',
                desc: 'Unsupervised clustering (K = 4) grouping households into stable, interpretable diurnal consumption archetypes.',
              },
              {
                step: '05',
                title: 'DEMAND FORECASTING',
                desc: 'Supervised machine-learning models predicting 24-hour day-ahead demand in 30-minute intervals.',
              },
              {
                step: '06',
                title: 'ANOMALY DETECTION',
                desc: 'Residual and threshold screening isolating statistically extreme consumption events and structural pattern shifts.',
              },
              {
                step: '07',
                title: 'AI COPILOT',
                desc: 'Grounded retrieval-augmented assistant answering operational inquiries directly against verified data and system runbooks.',
              },
            ].map((node, idx, arr) => (
              <React.Fragment key={node.step}>
                <div className="pipeline-node">
                  <div className="pipeline-node-marker">
                    <span className="node-num">{node.step}</span>
                  </div>
                  <div className="pipeline-node-body">
                    <h3 className="pipeline-node-title">{node.title}</h3>
                    <p className="pipeline-node-desc">{node.desc}</p>
                  </div>
                </div>
                {idx < arr.length - 1 && (
                  <div className="pipeline-connector-line">
                    <div className="connector-stem" />
                    <span className="connector-arrow">&darr;</span>
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 5. WHAT THE USER CAN EXPLORE                                              */}
        {/* ========================================================================= */}
        <section id="overview-explore" className="editorial-section" aria-label="Explore the Grid">
          <div className="section-number-header">
            <span className="section-index-num">04</span>
            <div className="section-header-text">
              <span className="section-eyebrow">PLATFORM WORKSPACES</span>
              <h2 className="section-heading">Explore the Grid</h2>
            </div>
          </div>

          <p className="editorial-body-text">
            Each section of GridVision focuses on a specific aspect of electricity operations.
            Navigate directly to any workspace to inspect live data and analysis:
          </p>

          <div className="editorial-explore-list">
            {/* 01 Demand Analysis */}
            <div id="overview-demand" className="editorial-explore-item">
              <div className="explore-item-header">
                <span className="explore-item-num">01</span>
                <div className="explore-item-titles">
                  <h3 className="explore-item-name">Demand Analysis</h3>
                  <p className="explore-item-summary">
                    Understand daily demand curves, weekday/weekend behavior and longer-term patterns.
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="explore-item-action"
                onClick={() => handleOpenSection('demand')}
              >
                <span>Open Demand Analysis</span>
                <ArrowRight size={15} />
              </button>
            </div>

            {/* 02 Consumer Intelligence */}
            <div id="overview-consumers" className="editorial-explore-item">
              <div id="overview-segmentation" />
              <div className="explore-item-header">
                <span className="explore-item-num">02</span>
                <div className="explore-item-titles">
                  <h3 className="explore-item-name">Consumer Intelligence</h3>
                  <p className="explore-item-summary">
                    Explore household profiles, rankings, behavioral segments and consumption characteristics across K = 4 archetypes.
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="explore-item-action"
                onClick={() => handleOpenSection('consumers')}
              >
                <span>Open Consumer Intelligence</span>
                <ArrowRight size={15} />
              </button>
            </div>

            {/* 03 Anomaly Analysis */}
            <div id="overview-anomalies" className="editorial-explore-item">
              <div className="explore-item-header">
                <span className="explore-item-num">03</span>
                <div className="explore-item-titles">
                  <h3 className="explore-item-name">Anomaly Analysis</h3>
                  <p className="explore-item-summary">
                    Investigate unusual consumption patterns, severity scores, and affected consumers requiring operational attention.
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="explore-item-action"
                onClick={() => handleOpenSection('anomalies')}
              >
                <span>Open Anomaly Analysis</span>
                <ArrowRight size={15} />
              </button>
            </div>

            {/* 04 Forecasting */}
            <div id="overview-forecasting" className="editorial-explore-item">
              <div className="explore-item-header">
                <span className="explore-item-num">04</span>
                <div className="explore-item-titles">
                  <h3 className="explore-item-name">Forecasting</h3>
                  <p className="explore-item-summary">
                    Examine expected demand, peak forecasts, error evaluations (MAE / RMSE), and day-ahead load projections.
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="explore-item-action"
                onClick={() => handleOpenSection('forecasting')}
              >
                <span>Open Demand Forecasting</span>
                <ArrowRight size={15} />
              </button>
            </div>

            {/* 05 AI Copilot */}
            <div id="overview-copilot" className="editorial-explore-item">
              <div className="explore-item-header">
                <span className="explore-item-num">05</span>
                <div className="explore-item-titles">
                  <h3 className="explore-item-name">AI Copilot</h3>
                  <p className="explore-item-summary">
                    Ask questions and receive grounded answers using GridVision&apos;s analytical tools, verified metrics, and operational knowledge base.
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="explore-item-action"
                onClick={() => handleOpenSection('copilot')}
              >
                <span>Open AI Copilot</span>
                <ArrowRight size={15} />
              </button>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 6. BEHIND THE PRODUCT (RESEARCH STUDY)                                    */}
        {/* ========================================================================= */}
        <section id="overview-research" className="editorial-section research-subdued" aria-label="Behind the Product Research">
          <div className="section-number-header">
            <span className="section-index-num">05</span>
            <div className="section-header-text">
              <span className="section-eyebrow">RESEARCH STUDY</span>
              <h2 className="section-heading">Behind the Product: Behavioral Mobility &amp; Forecast Errors</h2>
            </div>
          </div>

          <div className="editorial-prose-block">
            <p className="editorial-body-text">
              Beyond real-time grid monitoring, GridVision incorporates an empirical research study
              examining whether household transitions between behavioral consumption archetypes
              correlate with subsequent extreme forecast failures.
            </p>

            <div className="editorial-research-diagram">
              <div className="research-stage">
                <span className="stage-tag">STEP 1</span>
                <strong>Consumption Behavior</strong>
                <span className="stage-note">30-min load curves</span>
              </div>
              <span className="research-stage-arrow">&rarr;</span>
              <div className="research-stage">
                <span className="stage-tag">STEP 2</span>
                <strong>Behavioral Mobility</strong>
                <span className="stage-note">Transitions across 56-day windows</span>
              </div>
              <span className="research-stage-arrow">&rarr;</span>
              <div className="research-stage">
                <span className="stage-tag">STEP 3</span>
                <strong>Forecast Tail Errors</strong>
                <span className="stage-note">95th &amp; 99th percentile errors</span>
              </div>
              <span className="research-stage-arrow">&rarr;</span>
              <div className="research-stage">
                <span className="stage-tag">STEP 4</span>
                <strong>Clustered Logistics</strong>
                <span className="stage-note">Odds ratios &amp; significance</span>
              </div>
            </div>

            <div className="editorial-visual-wrapper">
              <ResearchVisual />
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* BACKWARD COMPATIBILITY ANCHOR TARGETS                                     */}
        {/* ========================================================================= */}
        <div id="overview-product-showcase" style={{ display: 'none' }} />
        <div id="overview-stability" style={{ display: 'none' }} />
        <div id="overview-architecture" style={{ display: 'none' }} />
        <div id="overview-limitations" style={{ display: 'none' }} />
      </div>
    </article>
  );
};
