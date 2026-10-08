import React, { useEffect } from 'react';
import {
  ArrowDown,
  ArrowRight,
  Bot,
  LineChart,
  ShieldAlert,
  Users,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import type { DashboardSection } from '../../types/dashboard';
import { CapstoneVisual } from './CapstoneVisual';
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
    <div className="overview-page-container">
      <div className="overview-inner">
        {/* ========================================================================= */}
        {/* 1. HERO / INTRODUCTION                                                    */}
        {/* ========================================================================= */}
        <header className="overview-hero-section">
          <div className="overview-hero-badge">
            <span>SMART ELECTRICITY ANALYTICS</span>
          </div>
          
          <h1 className="overview-hero-title">GRIDVISION</h1>

          <p className="overview-hero-statement">
            Smart electricity analytics for understanding demand, consumption behaviour, forecasting and unusual activity.
          </p>

          <p className="overview-hero-subtext">
            GridVision transforms raw half-hourly smart-meter data into clear operational demand intelligence,
            interpretable behavioral archetypes, and grounded natural-language assistance.
          </p>

          <div className="overview-hero-cta-group">
            <button
              type="button"
              className="overview-hero-btn primary"
              onClick={onLaunchDashboard}
            >
              <span>Launch Live Dashboard</span>
              <ArrowRight size={18} />
            </button>
            <button
              type="button"
              className="overview-hero-btn secondary"
              onClick={() => scrollToSection('overview-problem')}
            >
              <span>Explore Platform Tour</span>
              <ArrowDown size={18} />
            </button>
          </div>
        </header>

        {/* Dual Gateway Visual Cards */}
        <div className="overview-gateway-cards" role="region" aria-label="Two sides of GridVision">
          <article
            className="overview-gateway-card"
            onClick={() => scrollToSection('overview-capabilities')}
            tabIndex={0}
            role="button"
            aria-label="Explore Core Capabilities"
          >
            <div className="overview-gateway-card-visual">
              <CapstoneVisual />
            </div>
            <div className="overview-gateway-card-body">
              <span className="overview-gateway-card-eyebrow">OPERATIONAL APPLICATION</span>
              <h2 className="overview-gateway-card-title">Demand Intelligence &amp; AI Copilot</h2>
              <p className="overview-gateway-card-desc">
                Understand grid load, predict upcoming consumption, classify household archetypes, and screen anomalies.
              </p>
              <div className="overview-gateway-card-footer">
                <span className="overview-gateway-card-link">Explore Capabilities <ArrowDown size={14} /></span>
              </div>
            </div>
          </article>

          <article
            className="overview-gateway-card"
            onClick={() => scrollToSection('overview-research')}
            tabIndex={0}
            role="button"
            aria-label="Explore Research Study"
          >
            <div className="overview-gateway-card-visual">
              <ResearchVisual />
            </div>
            <div className="overview-gateway-card-body">
              <span className="overview-gateway-card-eyebrow">RESEARCH STUDY</span>
              <h2 className="overview-gateway-card-title">Behavioral Mobility &amp; Forecast Errors</h2>
              <p className="overview-gateway-card-desc">
                Investigating whether household behavioural pattern transitions correlate with subsequent extreme forecast failures.
              </p>
              <div className="overview-gateway-card-footer">
                <span className="overview-gateway-card-link">Explore Research <ArrowDown size={14} /></span>
              </div>
            </div>
          </article>
        </div>

        {/* ========================================================================= */}
        {/* 2. STICKY QUICK JUMP NAVIGATION BAR                                       */}
        {/* ========================================================================= */}
        <nav className="overview-quick-nav" aria-label="Quick jump to sections">
          <span className="overview-quick-nav-label">JUMP TO:</span>
          {[
            { id: 'overview-problem', label: '1. The Problem' },
            { id: 'overview-capabilities', label: '2. What It Does' },
            { id: 'overview-product-showcase', label: '3. Product Showcase' },
            { id: 'overview-workflow', label: '4. How A User Uses It' },
            { id: 'overview-copilot', label: '5. AI Copilot' },
            { id: 'overview-research', label: '6. Behind the Product' },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              className="overview-quick-nav-btn"
              onClick={() => scrollToSection(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* ========================================================================= */}
        {/* 3. THE PROBLEM                                                            */}
        {/* ========================================================================= */}
        <section id="overview-problem" className="overview-content-section" aria-label="The Problem">
          <span className="overview-section-eyebrow">THE CHALLENGE</span>
          <h2 className="overview-section-title">Smart Meter Data Needs Usable Intelligence</h2>
          <p className="overview-section-lead">
            Smart meters generate massive amounts of half-hourly consumption readings, but raw data alone is hard to interpret.
          </p>

          <div className="overview-problem-flow">
            <div className="overview-problem-step">
              <div className="overview-step-number">01</div>
              <div className="overview-step-content">
                <h3 className="overview-step-title">High-Volume Meter Stream</h3>
                <p className="overview-step-text">
                  Smart meters record electricity readings every 30 minutes, producing thousands of data points per household.
                </p>
              </div>
            </div>

            <div className="overview-flow-connector">
              <ArrowDown size={20} />
            </div>

            <div className="overview-problem-step">
              <div className="overview-step-number">02</div>
              <div className="overview-step-content">
                <h3 className="overview-step-title">Raw Numbers Lack Context</h3>
                <p className="overview-step-text">
                  Isolated kilowatt-hour values don&apos;t reveal when peaks occur, who drives them, or whether demand is unusual.
                </p>
              </div>
            </div>

            <div className="overview-flow-connector">
              <ArrowDown size={20} />
            </div>

            <div className="overview-problem-step">
              <div className="overview-step-number">03</div>
              <div className="overview-step-content">
                <h3 className="overview-step-title">Operational Decision Needs</h3>
                <p className="overview-step-text">
                  Utilities need to anticipate upcoming demand, screen abnormal usage, and understand distinct consumer habits.
                </p>
              </div>
            </div>

            <div className="overview-flow-connector">
              <ArrowDown size={20} />
            </div>

            <div className="overview-problem-step highlight">
              <div className="overview-step-number">04</div>
              <div className="overview-step-content">
                <h3 className="overview-step-title">GridVision Usable Intelligence</h3>
                <p className="overview-step-text">
                  Transforms raw readings into clean demand forecasts, behavioral archetypes, and grounded insights.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 4. WHAT GRIDVISION DOES                                                   */}
        {/* ========================================================================= */}
        <section id="overview-capabilities" className="overview-content-section" aria-label="What GridVision Does">
          <span className="overview-section-eyebrow">CONNECTED PLATFORM</span>
          <h2 className="overview-section-title">What GridVision Does</h2>
          <p className="overview-section-lead">
            Five core capabilities connected into one unified analytical system.
          </p>

          <div className="overview-journey-stack">
            {/* Capability 1 */}
            <div id="overview-demand" className="overview-journey-card">
              <div className="overview-journey-badge">01 &bull; DEMAND</div>
              <div className="overview-journey-icon">
                <LineChart size={24} style={{ color: 'var(--accent-emerald)' }} />
              </div>
              <div className="overview-journey-body">
                <h3 className="overview-journey-title">Understand Demand</h3>
                <p className="overview-journey-desc">
                  See how electricity consumption changes throughout the day, week, and observation period.
                  Track peak timing, morning ramps, and seasonal differences.
                </p>
              </div>
            </div>

            <div className="overview-journey-connector">
              <ArrowDown size={18} />
            </div>

            {/* Capability 2 */}
            <div id="overview-forecasting" className="overview-journey-card">
              <div className="overview-journey-badge">02 &bull; FORECASTING</div>
              <div className="overview-journey-icon">
                <TrendingUp size={24} style={{ color: 'var(--accent-emerald)' }} />
              </div>
              <div className="overview-journey-body">
                <h3 className="overview-journey-title">Forecast Demand</h3>
                <p className="overview-journey-desc">
                  Estimate upcoming demand 24 hours ahead in 30-minute intervals and evaluate forecast reliability to schedule reserves effectively.
                </p>
              </div>
            </div>

            <div className="overview-journey-connector">
              <ArrowDown size={18} />
            </div>

            {/* Capability 3 */}
            <div id="overview-anomalies" className="overview-journey-card">
              <div className="overview-journey-badge">03 &bull; ANOMALIES</div>
              <div className="overview-journey-icon">
                <ShieldAlert size={24} style={{ color: 'var(--accent-rose)' }} />
              </div>
              <div className="overview-journey-body">
                <h3 className="overview-journey-title">Find Unusual Activity</h3>
                <p className="overview-journey-desc">
                  Identify consumption patterns that stand out from expected behaviour, ranked by severity to prioritize inspection and maintenance.
                </p>
              </div>
            </div>

            <div className="overview-journey-connector">
              <ArrowDown size={18} />
            </div>

            {/* Capability 4 */}
            <div id="overview-consumers" className="overview-journey-card">
              <div id="overview-segmentation" />
              <div className="overview-journey-badge">04 &bull; CONSUMERS</div>
              <div className="overview-journey-icon">
                <Users size={24} style={{ color: 'var(--accent-cyan, #06b6d4)' }} />
              </div>
              <div className="overview-journey-body">
                <h3 className="overview-journey-title">Understand Consumers</h3>
                <p className="overview-journey-desc">
                  Explore household consumption behaviour across standardized archetypes and identify consumers requiring attention.
                </p>
              </div>
            </div>

            <div className="overview-journey-connector">
              <ArrowDown size={18} />
            </div>

            {/* Capability 5 */}
            <div className="overview-journey-card">
              <div className="overview-journey-badge">05 &bull; COPILOT</div>
              <div className="overview-journey-icon">
                <Bot size={24} style={{ color: 'var(--accent-amber)' }} />
              </div>
              <div className="overview-journey-body">
                <h3 className="overview-journey-title">Ask Copilot</h3>
                <p className="overview-journey-desc">
                  Ask questions in natural language and receive grounded explanations derived directly from verified data and operational runbooks.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 5. SHOW THE PRODUCT                                                       */}
        {/* ========================================================================= */}
        <section id="overview-product-showcase" className="overview-content-section" aria-label="Show the Product">
          <span className="overview-section-eyebrow">VISUAL SHOWCASE</span>
          <h2 className="overview-section-title">See the Product in Action</h2>
          <p className="overview-section-lead">
            Visual modules from GridVision with real data insights.
          </p>

          <div className="overview-showcase-grid">
            {/* Showcase 1: Demand Trends */}
            <div className="overview-showcase-item">
              <div className="overview-showcase-header">
                <span className="overview-showcase-tag">DEMAND TRENDS</span>
                <h3 className="overview-showcase-heading">Electricity Demand Dynamics</h3>
                <p className="overview-showcase-statement">
                  &ldquo;See when electricity demand rises and when the daily peak occurs.&rdquo;
                </p>
              </div>
              <div className="overview-showcase-preview">
                <div className="overview-mini-chart-box">
                  <div className="overview-mini-stats">
                    <div>
                      <span className="mini-stat-label">Daily Peak Time</span>
                      <strong className="mini-stat-val">19:30 &bull; Evening</strong>
                    </div>
                    <div>
                      <span className="mini-stat-label">Peak to Average</span>
                      <strong className="mini-stat-val">2.31&times;</strong>
                    </div>
                    <div>
                      <span className="mini-stat-label">Ramp Window</span>
                      <strong className="mini-stat-val">16:30 &ndash; 20:30</strong>
                    </div>
                  </div>
                  <div className="overview-mini-curve">
                    <CapstoneVisual />
                  </div>
                </div>
              </div>
              <div className="overview-showcase-action">
                <button
                  type="button"
                  className="overview-showcase-btn"
                  onClick={() => handleOpenSection('demand')}
                >
                  <span>Open Demand Analysis</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>

            {/* Showcase 2: Day-Ahead Forecasting */}
            <div className="overview-showcase-item">
              <div className="overview-showcase-header">
                <span className="overview-showcase-tag">SUPERVISED FORECASTING</span>
                <h3 className="overview-showcase-heading">Day-Ahead Demand Horizon</h3>
                <p className="overview-showcase-statement">
                  &ldquo;See what demand is expected to look like next.&rdquo;
                </p>
              </div>
              <div className="overview-showcase-preview">
                <div className="overview-mini-chart-box">
                  <div className="overview-mini-stats">
                    <div>
                      <span className="mini-stat-label">Horizon</span>
                      <strong className="mini-stat-val">24 Hours (48 slots)</strong>
                    </div>
                    <div>
                      <span className="mini-stat-label">Evaluation MAE</span>
                      <strong className="mini-stat-val">0.027 kW</strong>
                    </div>
                    <div>
                      <span className="mini-stat-label">Forecast Method</span>
                      <strong className="mini-stat-val">Supervised Boosting</strong>
                    </div>
                  </div>
                  <div className="overview-forecast-bars">
                    {[
                      { time: '04:00', actual: 0.19, forecast: 0.20 },
                      { time: '08:00', actual: 0.38, forecast: 0.37 },
                      { time: '12:00', actual: 0.42, forecast: 0.41 },
                      { time: '16:00', actual: 0.51, forecast: 0.49 },
                      { time: '20:00', actual: 0.79, forecast: 0.77 },
                      { time: '23:30', actual: 0.33, forecast: 0.34 },
                    ].map((slot) => (
                      <div key={slot.time} className="overview-slot-row">
                        <span className="overview-slot-time">{slot.time}</span>
                        <div className="overview-slot-bar-track">
                          <div
                            className="overview-slot-bar actual"
                            style={{ width: `${slot.actual * 100}%` }}
                            title={`Observed: ${slot.actual} kW`}
                          />
                          <div
                            className="overview-slot-bar forecast"
                            style={{ width: `${slot.forecast * 100}%` }}
                            title={`Forecast: ${slot.forecast} kW`}
                          />
                        </div>
                        <span className="overview-slot-val">{slot.actual.toFixed(2)} kW</span>
                      </div>
                    ))}
                    <div className="overview-slot-legend">
                      <span><strong style={{ color: 'var(--accent-emerald)' }}>&bull;</strong> Observed</span>
                      <span><strong style={{ color: 'var(--accent-amber)' }}>&bull;</strong> Forecast</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="overview-showcase-action">
                <button
                  type="button"
                  className="overview-showcase-btn"
                  onClick={() => handleOpenSection('forecasting')}
                >
                  <span>Open Demand Forecasting</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>

            {/* Showcase 3: Consumer Intelligence */}
            <div className="overview-showcase-item">
              <div className="overview-showcase-header">
                <span className="overview-showcase-tag">BEHAVIORAL ARCHETYPES</span>
                <h3 className="overview-showcase-heading">Consumer Profiles &amp; Clusters</h3>
                <p className="overview-showcase-statement">
                  &ldquo;Investigate individual consumption behaviour.&rdquo;
                </p>
              </div>
              <div className="overview-showcase-preview">
                <div className="overview-mini-clusters">
                  <div className="overview-cluster-pill" style={{ borderColor: '#f59e0b' }}>
                    <div className="cluster-header">
                      <span className="cluster-badge" style={{ backgroundColor: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}>Cluster 1</span>
                      <span className="cluster-share">38% of consumers</span>
                    </div>
                    <strong className="cluster-name">Evening Peaker</strong>
                    <span className="cluster-desc">Sharp peak around 19:00–21:00 with low daytime load</span>
                  </div>

                  <div className="overview-cluster-pill" style={{ borderColor: '#06b6d4' }}>
                    <div className="cluster-header">
                      <span className="cluster-badge" style={{ backgroundColor: 'rgba(6, 182, 212, 0.15)', color: '#06b6d4' }}>Cluster 2</span>
                      <span className="cluster-share">29% of consumers</span>
                    </div>
                    <strong className="cluster-name">Baseload Steady</strong>
                    <span className="cluster-desc">Flat diurnal consumption profile with constant refrigeration/electronics</span>
                  </div>

                  <div className="overview-cluster-pill" style={{ borderColor: '#10b981' }}>
                    <div className="cluster-header">
                      <span className="cluster-badge" style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>Cluster 3</span>
                      <span className="cluster-share">18% of consumers</span>
                    </div>
                    <strong className="cluster-name">Daytime Active</strong>
                    <span className="cluster-desc">Elevated daytime load from home occupancy or domestic appliances</span>
                  </div>

                  <div className="overview-cluster-pill" style={{ borderColor: '#a855f7' }}>
                    <div className="cluster-header">
                      <span className="cluster-badge" style={{ backgroundColor: 'rgba(168, 85, 247, 0.15)', color: '#a855f7' }}>Cluster 4</span>
                      <span className="cluster-share">15% of consumers</span>
                    </div>
                    <strong className="cluster-name">Dual Peaker</strong>
                    <span className="cluster-desc">Distinct peaks during morning departure and evening return</span>
                  </div>
                </div>
              </div>
              <div className="overview-showcase-action">
                <button
                  type="button"
                  className="overview-showcase-btn"
                  onClick={() => handleOpenSection('consumers')}
                >
                  <span>Open Consumer Intelligence</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>

            {/* Showcase 4: Anomaly Screening */}
            <div className="overview-showcase-item">
              <div className="overview-showcase-header">
                <span className="overview-showcase-tag">OUTLIER SCREENING</span>
                <h3 className="overview-showcase-heading">Abnormal Pattern Detection</h3>
                <p className="overview-showcase-statement">
                  &ldquo;Find unusual consumption patterns.&rdquo;
                </p>
              </div>
              <div className="overview-showcase-preview">
                <div className="overview-mini-anomaly-box">
                  <div className="overview-anomaly-event">
                    <div className="anomaly-event-top">
                      <span className="anomaly-consumer-id">Consumer 045 (MAC000045)</span>
                      <span className="anomaly-severity-badge extreme">EXTREME</span>
                    </div>
                    <div className="anomaly-pattern-title">Unusually sharp demand surge</div>
                    <p className="anomaly-event-note">
                      Peak demand was 3.8&times; above historical household baseline during evening window.
                    </p>
                  </div>

                  <div className="overview-anomaly-event">
                    <div className="anomaly-event-top">
                      <span className="anomaly-consumer-id">Consumer 112 (MAC000112)</span>
                      <span className="anomaly-severity-badge elevated">ELEVATED</span>
                    </div>
                    <div className="anomaly-pattern-title">Weekday vs weekend reversal</div>
                    <p className="anomaly-event-note">
                      Reversal of normal workweek routines with high daytime weekend demand.
                    </p>
                  </div>
                </div>
              </div>
              <div className="overview-showcase-action">
                <button
                  type="button"
                  className="overview-showcase-btn"
                  onClick={() => handleOpenSection('anomalies')}
                >
                  <span>Open Anomaly Analysis</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 6. HOW A USER USES GRIDVISION                                             */}
        {/* ========================================================================= */}
        <section id="overview-workflow" className="overview-content-section" aria-label="How a User Uses GridVision">
          <span className="overview-section-eyebrow">USER JOURNEY</span>
          <h2 className="overview-section-title">How a User Uses GridVision</h2>
          <p className="overview-section-lead">
            A simple, intuitive workflow from high-level grid monitoring to targeted investigation.
          </p>

          <div className="overview-workflow-steps">
            <div className="overview-workflow-card">
              <div className="workflow-step-num">01</div>
              <h3 className="workflow-card-title">Monitor Demand</h3>
              <p className="workflow-card-text">
                Check current grid load, identify morning and evening peaks, and compare against historical averages.
              </p>
            </div>

            <div className="overview-workflow-card">
              <div className="workflow-step-num">02</div>
              <h3 className="workflow-card-title">Understand Patterns</h3>
              <p className="workflow-card-text">
                Compare weekday versus weekend profiles and track seasonal shifts across 14 observation windows.
              </p>
            </div>

            <div className="overview-workflow-card">
              <div className="workflow-step-num">03</div>
              <h3 className="workflow-card-title">Identify Households</h3>
              <p className="workflow-card-text">
                Filter and rank consumers by average demand, peak load, and load factor to pinpoint high-impact accounts.
              </p>
            </div>

            <div className="overview-workflow-card">
              <div className="workflow-step-num">04</div>
              <h3 className="workflow-card-title">Investigate Unusual Activity</h3>
              <p className="workflow-card-text">
                Review flagged anomalies, examine the detected deviation pattern, and inspect the individual 24-hour load curve.
              </p>
            </div>

            <div className="overview-workflow-card">
              <div className="workflow-step-num">05</div>
              <h3 className="workflow-card-title">Check Forecasts</h3>
              <p className="workflow-card-text">
                Evaluate day-ahead 24-hour demand predictions and review model reliability metrics across holdout periods.
              </p>
            </div>

            <div className="overview-workflow-card">
              <div className="workflow-step-num">06</div>
              <h3 className="workflow-card-title">Ask Copilot</h3>
              <p className="workflow-card-text">
                Ask operational questions in plain language to get grounded answers backed directly by real data.
              </p>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 7. AI COPILOT                                                             */}
        {/* ========================================================================= */}
        <section id="overview-copilot" className="overview-content-section" aria-label="AI Copilot">
          <span className="overview-section-eyebrow">GROUNDED ASSISTANCE</span>
          <h2 className="overview-section-title">Ask the AI Copilot</h2>
          <p className="overview-section-lead">
            Ask GridVision questions about demand, households, anomalies and forecasts.
          </p>

          <div className="overview-copilot-container">
            <div className="overview-copilot-info">
              <p className="overview-copilot-desc">
                The Copilot gives operators direct conversational access to all platform metrics,
                cluster definitions, and operational procedures without requiring SQL or complex filters.
                Every response is strictly grounded in real dataset numbers.
              </p>

              <div className="overview-copilot-prompts-label">Realistic questions supported by GridVision:</div>

              <div className="overview-copilot-prompts">
                {[
                  'What is the current demand?',
                  'Which households need attention?',
                  'Why is this household flagged?',
                  'How reliable is the forecast?',
                ].map((query) => (
                  <button
                    key={query}
                    type="button"
                    className="overview-copilot-prompt-pill"
                    onClick={() => handleOpenSection('copilot')}
                  >
                    <Sparkles size={14} style={{ color: 'var(--accent-amber)' }} />
                    <span>&ldquo;{query}&rdquo;</span>
                  </button>
                ))}
              </div>

              <div style={{ marginTop: '1.5rem' }}>
                <button
                  type="button"
                  className="overview-hero-btn primary"
                  onClick={() => handleOpenSection('copilot')}
                >
                  <Bot size={18} />
                  <span>Open AI Copilot</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 8. RESEARCH — BEHIND THE PRODUCT                                          */}
        {/* ========================================================================= */}
        <section id="overview-research" className="overview-content-section research-section" aria-label="Research Study">
          <span className="overview-section-eyebrow" style={{ color: 'var(--foreground-muted)' }}>
            BEHIND THE PRODUCT
          </span>
          <h2 className="overview-section-title">Research: Behavioral Mobility &amp; Forecast Errors</h2>
          <p className="overview-section-lead">
            GridVision also includes a research study examining whether changes in household behavioural patterns
            are associated with subsequent extreme forecast errors.
          </p>

          {/* Simple visual connection flow */}
          <div className="overview-research-flow">
            <div className="research-flow-node">
              <span className="research-flow-label">01</span>
              <strong>Consumption Behaviour</strong>
              <span className="research-flow-sub">Half-hourly smart-meter load</span>
            </div>
            <div className="research-flow-arrow">&rarr;</div>
            <div className="research-flow-node">
              <span className="research-flow-label">02</span>
              <strong>Behavioural Patterns Over Time</strong>
              <span className="research-flow-sub">Cluster mobility across windows</span>
            </div>
            <div className="research-flow-arrow">&rarr;</div>
            <div className="research-flow-node">
              <span className="research-flow-label">03</span>
              <strong>Forecast Performance</strong>
              <span className="research-flow-sub">Tail error occurrences (95th/99th)</span>
            </div>
            <div className="research-flow-arrow">&rarr;</div>
            <div className="research-flow-node">
              <span className="research-flow-label">04</span>
              <strong>Research Analysis</strong>
              <span className="research-flow-sub">Clustered logistic regression</span>
            </div>
          </div>

          <div className="overview-research-visual-box">
            <ResearchVisual />
          </div>

          <div className="overview-research-actions">
            <button
              type="button"
              className="overview-hero-btn secondary"
              onClick={() => handleOpenSection('overview')}
            >
              <span>Explore Research Findings</span>
              <ArrowRight size={16} />
            </button>
            <button
              type="button"
              className="overview-hero-btn secondary"
              onClick={() => handleOpenSection('overview')}
            >
              <span>Explore Methodology</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </section>

        {/* Backward-compatibility Anchor Targets */}
        <div id="overview-stability" style={{ display: 'none' }} />
        <div id="overview-architecture" style={{ display: 'none' }} />
        <div id="overview-limitations" style={{ display: 'none' }} />
      </div>
    </div>
  );
};
