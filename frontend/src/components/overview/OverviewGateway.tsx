import React, { useEffect } from 'react';
import {
  ArrowDown,
  ArrowRight,
  Zap,
  Bot,
  LineChart,
  ShieldAlert,
  FileCode2,
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

        {/* Quick Jump Bar for Section Navigation */}
        <nav
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.45rem',
            justifyContent: 'center',
            margin: '2.5rem 0 0.5rem 0',
            padding: '0.65rem 1.15rem',
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-full)',
          }}
          aria-label="Quick jump to sections"
        >
          <span style={{ fontSize: '0.74rem', color: 'var(--foreground-subtle)', fontWeight: 700, alignSelf: 'center', marginRight: '0.4rem', letterSpacing: '0.06em' }}>
            SECTIONS:
          </span>
          {[
            { id: 'overview-problem', label: '1. The Problem' },
            { id: 'overview-capabilities', label: '2. What It Does' },
            { id: 'overview-workflow', label: '3. How It Works' },
            { id: 'overview-forecasting', label: '4. Forecasting' },
            { id: 'overview-segmentation', label: '5. Consumer Profiles' },
            { id: 'overview-anomalies', label: '6. Anomaly Screening' },
            { id: 'overview-stability', label: '7. Stability & Reliability' },
            { id: 'overview-copilot', label: '8. AI Copilot' },
            { id: 'overview-architecture', label: '9. Architecture' },
            { id: 'overview-research', label: '10. Related Research' },
            { id: 'overview-limitations', label: '11. Limitations' },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => scrollToSection(item.id)}
              style={{
                fontSize: '0.76rem',
                fontWeight: 600,
                color: 'var(--foreground-muted)',
                background: 'none',
                border: 'none',
                padding: '0.25rem 0.55rem',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                transition: 'all 150ms ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--foreground)';
                e.currentTarget.style.backgroundColor = 'var(--surface-raised)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--foreground-muted)';
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
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
          style={{ width: '100%', scrollMarginTop: '88px' }}
        >
          <div id="overview-demand" />
          <div id="overview-motivation">
            <span className="section-kicker" style={{ color: 'var(--accent-amber)' }}>
              THE PRACTICAL CHALLENGE
            </span>
            <h2 className="section-heading">
              1. Beyond Simple Electricity Totals
            </h2>
            <p className="section-subheading">
              Electricity consumption changes continuously over time and differs substantially between consumers.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
            <div className="workspace-card" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.75rem' }}>
                <Zap size={20} style={{ color: 'var(--accent-amber)' }} />
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 600 }}>The Core Grid Problem</h3>
              </div>
              <p style={{ margin: 0, fontSize: '0.86rem', color: 'var(--foreground-muted)', lineHeight: 1.6 }}>
                Modern residential electricity demand is characterized by rapid, nonlinear fluctuations driven by electric heating, heat pumps, electric vehicles, and varied occupancy routines. Traditional utility metering simply records how much energy was consumed after the fact, leaving grid operators with limited foresight into upcoming peaks or individual load behaviors.
              </p>
            </div>

            <div className="workspace-card" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.75rem' }}>
                <HelpCircle size={20} style={{ color: 'var(--accent-emerald)' }} />
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 600 }}>Questions Operators Must Answer</h3>
              </div>
              <p style={{ margin: 0, fontSize: '0.86rem', color: 'var(--foreground-muted)', lineHeight: 1.6 }}>
                A truly useful system must answer far more than <em>&ldquo;How much electricity is being used?&rdquo;</em> It must help operators answer:
              </p>
              <ul style={{ margin: '0.5rem 0 0 0', paddingLeft: '1.2rem', fontSize: '0.84rem', color: 'var(--foreground-muted)', lineHeight: 1.6 }}>
                <li><strong>What demand is likely next?</strong> (Day-ahead capacity planning &amp; peak timing)</li>
                <li><strong>What type of consumption behavior does a consumer exhibit?</strong> (Evening peaker, steady baseload)</li>
                <li><strong>Is the current behavior unusual?</strong> (Unexplained spikes, meter freezes, or dropouts)</li>
                <li><strong>How reliable is the consumer&apos;s behavior over time?</strong> (Consistent habits vs erratic shifting)</li>
                <li><strong>Can an operator query the system directly?</strong> (Natural-language answers without searching tables)</li>
              </ul>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 3. WHAT GRIDVISION DOES                                                   */}
        {/* ========================================================================= */}
        <section
          id="overview-capabilities"
          className="overview-full-section"
          style={{ width: '100%', scrollMarginTop: '88px' }}
        >
          <div id="capstone-section">
            <span className="section-kicker" style={{ color: 'var(--accent-emerald)' }}>
              CORE CAPABILITIES
            </span>
            <h2 className="section-heading">
              2. What GridVision Does
            </h2>
            <p className="section-subheading">
              Five complementary analytical capabilities designed to provide comprehensive demand intelligence.
            </p>
          </div>

          <div className="capability-grid">
            <div className="capability-card">
              <div className="capability-icon-wrap" style={{ color: 'var(--accent-emerald)' }}>
                <LineChart size={20} />
              </div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 600 }}>Forecast Demand</h3>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--foreground-muted)', lineHeight: 1.55 }}>
                Predict upcoming electricity demand from historical consumption patterns across a 24-hour day-ahead horizon to schedule generation and peak capacity reserves.
              </p>
            </div>

            <div className="capability-card">
              <div className="capability-icon-wrap" style={{ color: 'var(--accent-cyan)' }}>
                <Users size={20} />
              </div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 600 }}>Understand Consumers</h3>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--foreground-muted)', lineHeight: 1.55 }}>
                Group consumers with similar behavioral consumption characteristics into distinct, interpretable load profiles that reveal recurring daily routines.
              </p>
            </div>

            <div className="capability-card">
              <div className="capability-icon-wrap" style={{ color: 'var(--accent-rose)' }}>
                <ShieldAlert size={20} />
              </div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 600 }}>Detect Unusual Behavior</h3>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--foreground-muted)', lineHeight: 1.55 }}>
                Screen observations that differ substantially from normal consumption baselines to quickly highlight unusual consumption events requiring investigation.
              </p>
            </div>

            <div className="capability-card">
              <div className="capability-icon-wrap" style={{ color: 'var(--accent-amber)' }}>
                <Activity size={20} />
              </div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 600 }}>Assess Behavioral Stability</h3>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--foreground-muted)', lineHeight: 1.55 }}>
                Track whether a consumer&apos;s behavioral load archetype remains persistent over time or transitions between different consumption patterns.
              </p>
            </div>

            <div className="capability-card">
              <div className="capability-icon-wrap" style={{ color: 'var(--accent-purple)' }}>
                <Bot size={20} />
              </div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 600 }}>Ask the System</h3>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--foreground-muted)', lineHeight: 1.55 }}>
                Use the AI Copilot to ask questions about forecasts, consumer profiles, anomalies, and operational guidance in conversational natural language.
              </p>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 4. HOW THE SYSTEM WORKS                                                   */}
        {/* ========================================================================= */}
        <section
          id="overview-workflow"
          className="overview-full-section"
          style={{ width: '100%', scrollMarginTop: '88px' }}
        >
          <div>
            <span className="section-kicker" style={{ color: 'var(--accent-cyan)' }}>
              END-TO-END PIPELINE
            </span>
            <h2 className="section-heading">
              3. How the System Works
            </h2>
            <p className="section-subheading">
              From raw smart-meter readings to grounded operational answers through structured, complementary machine learning.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
            <div className="workspace-card" style={{ padding: '1.35rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.65rem' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent-emerald)' }}>STAGE 1</span>
                <h4 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 600 }}>Data Ingestion &amp; Cleaning</h4>
              </div>
              <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--foreground-muted)', lineHeight: 1.6 }}>
                Half-hourly smart meter readings are ingested from historical London trials (UKPN Low Carbon London), validated for data quality (&ge;95% slot completeness), standardized to kilowatts (kW), and organized into synchronized 56-day observation windows.
              </p>
            </div>

            <div className="workspace-card" style={{ padding: '1.35rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.65rem' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>STAGE 2</span>
                <h4 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 600 }}>Feature Engineering</h4>
              </div>
              <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--foreground-muted)', lineHeight: 1.6 }}>
                Time-series lag features (e.g., consumption at the same time yesterday and last week) and 8 behavioral indicators (average load, peak load, ramping rate, day-night ratio, weekday contrast) are constructed without future lookahead bias.
              </p>
            </div>

            <div className="workspace-card" style={{ padding: '1.35rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.65rem' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent-amber)' }}>STAGE 3</span>
                <h4 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 600 }}>Complementary ML Tasks</h4>
              </div>
              <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--foreground-muted)', lineHeight: 1.6 }}>
                Rather than forcing a single model to do everything, specialized models address separate analytical tasks: supervised gradient boosting for forecasting, distance-based clustering for profiling, and isolation trees for anomaly screening.
              </p>
            </div>

            <div className="workspace-card" style={{ padding: '1.35rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.65rem' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent-purple)' }}>STAGE 4</span>
                <h4 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 600 }}>Grounded Orchestration</h4>
              </div>
              <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--foreground-muted)', lineHeight: 1.6 }}>
                The AI Copilot connects these precomputed model outputs with domain knowledge bases using deterministic tool calls and strict numeric verification, giving operators conversational answers that never invent or hallucinate metrics.
              </p>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 5. FORECASTING                                                            */}
        {/* ========================================================================= */}
        <section
          id="overview-forecasting"
          className="overview-full-section"
          style={{ width: '100%', scrollMarginTop: '88px' }}
        >
          <div>
            <span className="section-kicker" style={{ color: 'var(--accent-emerald)' }}>
              SUPERVISED MACHINE LEARNING
            </span>
            <h2 className="section-heading">
              4. Day-Ahead Demand Forecasting
            </h2>
            <p className="section-subheading">
              Estimating 24-hour lookahead electricity demand across half-hourly time intervals using supervised gradient boosting.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
            <div className="workspace-card" style={{ padding: '1.5rem' }}>
              <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.05rem', fontWeight: 600 }}>The Forecasting Purpose</h3>
              <p style={{ margin: 0, fontSize: '0.86rem', color: 'var(--foreground-muted)', lineHeight: 1.6 }}>
                Electricity cannot be stored cost-free on the grid at scale; supply and demand must balance continuously. Day-ahead forecasting provides grid operators and retailers with anticipated demand trajectories 24 hours into the future, enabling cost-effective power scheduling and peak-load mitigation.
              </p>
            </div>

            <div className="workspace-card" style={{ padding: '1.5rem' }}>
              <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.05rem', fontWeight: 600 }}>How GridVision Approaches It</h3>
              <p style={{ margin: 0, fontSize: '0.86rem', color: 'var(--foreground-muted)', lineHeight: 1.6 }}>
                GridVision formulates forecasting as <strong>supervised regression</strong> using historical and calendar-based features, with <strong>LightGBM</strong> providing the nonlinear prediction model.
              </p>
              <p style={{ margin: '0.65rem 0 0 0', fontSize: '0.86rem', color: 'var(--foreground-muted)', lineHeight: 1.6 }}>
                LightGBM is well suited to this setting because electricity demand depends on nonlinear interactions between recent consumption patterns and time-related features, while tree-based predictions remain relatively efficient and explainable.
              </p>
            </div>
          </div>

          <div className="technical-approach-box">
            <div className="technical-approach-title">
              <Cpu size={14} />
              <span>Technical Approach</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', fontSize: '0.82rem', color: 'var(--foreground-muted)', lineHeight: 1.55 }}>
              <div>
                <strong style={{ color: 'var(--foreground)', display: 'block', marginBottom: '0.2rem' }}>Autoregressive Lag Features</strong>
                Historical consumption values at lag t-48 (same half-hour yesterday) and lag t-336 (same half-hour previous week) capture persistent diurnal and weekly rhythms.
              </div>
              <div>
                <strong style={{ color: 'var(--foreground)', display: 'block', marginBottom: '0.2rem' }}>Calendar &amp; Time Indicators</strong>
                Half-hour index (0 to 47), day of week, and weekend indicators provide structural cyclical information without requiring weather data.
              </div>
              <div>
                <strong style={{ color: 'var(--foreground)', display: 'block', marginBottom: '0.2rem' }}>Forward-Only Evaluation</strong>
                Evaluated strictly out-of-sample across calendar windows to prevent lookahead leakage, outperforming standard seasonal-naive baselines.
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 6. CONSUMPTION SEGMENTATION                                               */}
        {/* ========================================================================= */}
        <section
          id="overview-segmentation"
          className="overview-full-section"
          style={{ width: '100%', scrollMarginTop: '88px' }}
        >
          <div id="overview-consumers">
            <span className="section-kicker" style={{ color: 'var(--accent-cyan)' }}>
              UNSUPERVISED MACHINE LEARNING
            </span>
            <h2 className="section-heading">
              5. Consumer Intelligence &amp; Load Profiling
            </h2>
            <p className="section-subheading">
              Grouping consumers with similar behavioral load patterns into interpretable, standardized consumption archetypes.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem', marginBottom: '1.25rem' }}>
            <div className="workspace-card" style={{ padding: '1.5rem' }}>
              <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.05rem', fontWeight: 600 }}>Why Segmentation Matters</h3>
              <p style={{ margin: 0, fontSize: '0.86rem', color: 'var(--foreground-muted)', lineHeight: 1.6 }}>
                Not every consumer behaves the same way. Treating all consumers as identical hides peak timing and demand-response flexibility. By grouping consumers based on how and when they use power, utilities can design targeted tariffs and understand local feeder stress.
              </p>
            </div>

            <div className="workspace-card" style={{ padding: '1.5rem' }}>
              <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.05rem', fontWeight: 600 }}>Behavioral Representation &amp; Clustering</h3>
              <p style={{ margin: 0, fontSize: '0.86rem', color: 'var(--foreground-muted)', lineHeight: 1.6 }}>
                GridVision represents consumption behavior using 8 standardized features per window: average demand, peak demand, consumption variance, peak-to-average ratio, ramping rate, day/night ratio, weekday/weekend contrast, and peak timing.
              </p>
              <p style={{ margin: '0.65rem 0 0 0', fontSize: '0.86rem', color: 'var(--foreground-muted)', lineHeight: 1.6 }}>
                Because these behavioral features have different numerical scales, they are standardized before distance-based clustering. <strong>K-Means</strong> groups consumers into interpretable profiles that capture typical daily routines.
              </p>
            </div>
          </div>

          {/* 4 Archetypes Display */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem', marginBottom: '1.25rem' }}>
            <div className="workspace-card" style={{ padding: '1.25rem', borderLeft: '4px solid var(--accent-amber)' }}>
              <span style={{ fontSize: '0.74rem', color: 'var(--accent-amber)', fontWeight: 700, textTransform: 'uppercase' }}>Archetype 1</span>
              <h4 style={{ margin: '0.35rem 0', fontSize: '1.05rem', fontWeight: 600 }}>Evening Peakers</h4>
              <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--foreground-muted)', lineHeight: 1.5 }}>
                Marked by dinner and entertainment consumption between 17:30 and 21:30. Typical working-household routine with low daytime occupancy.
              </p>
            </div>

            <div className="workspace-card" style={{ padding: '1.25rem', borderLeft: '4px solid var(--accent-emerald)' }}>
              <span style={{ fontSize: '0.74rem', color: 'var(--accent-emerald)', fontWeight: 700, textTransform: 'uppercase' }}>Archetype 2</span>
              <h4 style={{ margin: '0.35rem 0', fontSize: '1.05rem', fontWeight: 600 }}>Baseload Steady</h4>
              <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--foreground-muted)', lineHeight: 1.5 }}>
                Steady, low-variance electricity demand throughout 24 hours with a high load factor and minimal sharp peaks.
              </p>
            </div>

            <div className="workspace-card" style={{ padding: '1.25rem', borderLeft: '4px solid var(--accent-cyan)' }}>
              <span style={{ fontSize: '0.74rem', color: 'var(--accent-cyan)', fontWeight: 700, textTransform: 'uppercase' }}>Archetype 3</span>
              <h4 style={{ margin: '0.35rem 0', fontSize: '1.05rem', fontWeight: 600 }}>Daytime Active</h4>
              <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--foreground-muted)', lineHeight: 1.5 }}>
                Elevated daytime electricity use between 09:00 and 16:00, characteristic of remote workers, retirees, or daytime appliance scheduling.
              </p>
            </div>

            <div className="workspace-card" style={{ padding: '1.25rem', borderLeft: '4px solid var(--accent-purple)' }}>
              <span style={{ fontSize: '0.74rem', color: 'var(--accent-purple)', fontWeight: 700, textTransform: 'uppercase' }}>Archetype 4</span>
              <h4 style={{ margin: '0.35rem 0', fontSize: '1.05rem', fontWeight: 600 }}>Dual Peakers</h4>
              <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--foreground-muted)', lineHeight: 1.5 }}>
                Distinct bimodal peaks occurring during morning preparation (07:30) and evening cooking (19:30) with an afternoon lull.
              </p>
            </div>
          </div>

          <div className="technical-approach-box">
            <div className="technical-approach-title">
              <Workflow size={14} />
              <span>Hungarian Centroid Alignment Protocol</span>
            </div>
            <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--foreground-muted)', lineHeight: 1.6 }}>
              Because K-Means cluster label assignments are permutation-invariant across independent runs, running clustering separately in each time window would arbitrarily scramble cluster numbers. GridVision applies <strong>Kuhn-Munkres Hungarian bipartite matching</strong> to connect cluster centroids between successive observation windows. This ensures that a label like &ldquo;Evening Peakers&rdquo; represents consistent real-world behavior over time.
            </p>
            <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.82rem', color: 'var(--foreground-subtle)' }}>
              *Note: Cluster labels represent behavioral consumption profiles, not demographic categories.
            </p>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 7. ANOMALY DETECTION                                                      */}
        {/* ========================================================================= */}
        <section
          id="overview-anomalies"
          className="overview-full-section"
          style={{ width: '100%', scrollMarginTop: '88px' }}
        >
          <div>
            <span className="section-kicker" style={{ color: 'var(--accent-rose)' }}>
              UNSUPERVISED OUTLIER SCREENING
            </span>
            <h2 className="section-heading">
              6. Consumption Anomaly Detection
            </h2>
            <p className="section-subheading">
              Screening observations that differ substantially from normal consumption baselines to prioritize operational investigation.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem', marginBottom: '1.25rem' }}>
            <div className="workspace-card" style={{ padding: '1.5rem' }}>
              <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.05rem', fontWeight: 600 }}>The Purpose of Anomaly Screening</h3>
              <p style={{ margin: 0, fontSize: '0.86rem', color: 'var(--foreground-muted)', lineHeight: 1.6 }}>
                Not every unusual consumption event is necessarily an error or a hardware fault, but unusual behavior deserves operator attention. Automated anomaly detection flags unusual load signatures without requiring pre-labeled training data.
              </p>
            </div>

            <div className="workspace-card" style={{ padding: '1.5rem' }}>
              <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.05rem', fontWeight: 600 }}>Isolation Forest Formulation</h3>
              <p style={{ margin: 0, fontSize: '0.86rem', color: 'var(--foreground-muted)', lineHeight: 1.6 }}>
                GridVision uses <strong>Isolation Forest</strong> to identify observations that are unusually easy to separate from normal consumption patterns across the 8 behavioral feature dimensions. Anomalous observations require significantly fewer random splits to isolate within decision trees.
              </p>
            </div>
          </div>

          <div className="technical-approach-box" style={{ borderLeft: '4px solid var(--accent-rose)' }}>
            <div className="technical-approach-title" style={{ color: 'var(--accent-rose)' }}>
              <AlertTriangle size={14} />
              <span>Responsible Operational Interpretation</span>
            </div>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--foreground-muted)', lineHeight: 1.6 }}>
              <strong>An anomaly flag indicates unusual behavior; it does not by itself prove that something is wrong.</strong> Unusual usage can stem from valid residential routine changes (e.g., vacations, home remodeling, electric vehicle charging) as well as data dropouts, meter freezes, or unannounced equipment faults. GridVision stratifies alerts by deviation magnitude so operators can verify communication telemetry and feeder alerts before scheduling physical site inspections.
            </p>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 8. BEHAVIORAL STABILITY / RELIABILITY                                     */}
        {/* ========================================================================= */}
        <section
          id="overview-stability"
          className="overview-full-section"
          style={{ width: '100%', scrollMarginTop: '88px' }}
        >
          <div>
            <span className="section-kicker" style={{ color: 'var(--accent-amber)' }}>
              LONGITUDINAL TRACKING
            </span>
            <h2 className="section-heading">
              7. Behavioral Stability &amp; Reliability Tiers
            </h2>
            <p className="section-subheading">
              Tracking how consistently a consumer remains associated with the same load archetype across successive observation periods.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
            <div className="workspace-card" style={{ padding: '1.5rem' }}>
              <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.05rem', fontWeight: 600 }}>What is Behavioral Stability?</h3>
              <p style={{ margin: 0, fontSize: '0.86rem', color: 'var(--foreground-muted)', lineHeight: 1.6 }}>
                A consumer&apos;s load profile can change over time. GridVision tracks how consistently that consumer remains associated with the same behavioral profile across successive periods.
              </p>
              <p style={{ margin: '0.65rem 0 0 0', fontSize: '0.86rem', color: 'var(--foreground-muted)', lineHeight: 1.6 }}>
                Greater instability means the consumer&apos;s observed behavior transitions more frequently between different behavioral profiles (e.g., shifting between Evening Peaker and Daytime Active routines).
              </p>
            </div>

            <div className="workspace-card" style={{ padding: '1.5rem' }}>
              <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.05rem', fontWeight: 600 }}>Why Stability Matters Operationally</h3>
              <p style={{ margin: 0, fontSize: '0.86rem', color: 'var(--foreground-muted)', lineHeight: 1.6 }}>
                Tracking stability provides an additional operational signal for understanding whether a consumer&apos;s historical behavioral profile remains a dependable representation of current demand.
              </p>
              <p style={{ margin: '0.65rem 0 0 0', fontSize: '0.86rem', color: 'var(--foreground-muted)', lineHeight: 1.6 }}>
                GridVision classifies accounts into operational reliability tiers (Stable, Moderate, and Elevated Risk), helping utility planners determine which accounts offer predictable flexibility for demand-response commitments versus those requiring safety margins.
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
          style={{ width: '100%', scrollMarginTop: '88px' }}
        >
          <div>
            <span className="section-kicker" style={{ color: 'var(--accent-purple)' }}>
              GROUNDED NATURAL-LANGUAGE ASSISTANCE
            </span>
            <h2 className="section-heading">
              8. The GridVision AI Copilot
            </h2>
            <p className="section-subheading">
              A natural-language orchestration interface that queries verified analytics tools and domain knowledge without replacing underlying machine-learning models.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem', marginBottom: '1.25rem' }}>
            <div className="workspace-card" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.65rem' }}>
                <Bot size={20} style={{ color: 'var(--accent-purple)' }} />
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 600 }}>An Orchestration Layer, Not an ML Model</h3>
              </div>
              <p style={{ margin: 0, fontSize: '0.86rem', color: 'var(--foreground-muted)', lineHeight: 1.6 }}>
                The AI Copilot provides a natural-language interface to GridVision&apos;s analytics. <strong>The language model explains and orchestrates existing GridVision results; it does not replace the forecasting, clustering, or anomaly-detection models.</strong>
              </p>
              <p style={{ margin: '0.65rem 0 0 0', fontSize: '0.86rem', color: 'var(--foreground-muted)', lineHeight: 1.6 }}>
                When an operator asks a question, the Copilot routes the query to deterministic backend tools to query authentic data rather than relying on language model memory.
              </p>
            </div>

            <div className="workspace-card" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.65rem' }}>
                <CheckCircle2 size={20} style={{ color: 'var(--accent-emerald)' }} />
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 600 }}>Two Complementary Knowledge Sources</h3>
              </div>
              <p style={{ margin: 0, fontSize: '0.86rem', color: 'var(--foreground-muted)', lineHeight: 1.6 }}>
                The Copilot draws upon two clearly separated sources:
              </p>
              <ul style={{ margin: '0.5rem 0 0 0', paddingLeft: '1.2rem', fontSize: '0.84rem', color: 'var(--foreground-muted)', lineHeight: 1.6 }}>
                <li><strong>Analytics Tools:</strong> Deterministic backend functions that retrieve actual precomputed forecasts, cluster histories, anomaly flags, and stability indicators.</li>
                <li><strong>Domain Knowledge (RAG):</strong> Technical operational runbooks, anomaly inspection procedures, and glossary definitions retrieved via local TF-IDF cosine similarity.</li>
              </ul>
            </div>
          </div>

          <div className="technical-approach-box">
            <div className="technical-approach-title">
              <ShieldCheck size={14} />
              <span>Strict Numeric Grounding Enforcement</span>
            </div>
            <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--foreground-muted)', lineHeight: 1.6 }}>
              Every numeric claim in the final Copilot answer is verified against tool outputs or retrieved passages from the current turn. If an ungrounded or fabricated number is introduced, the system flags the response as ungrounded. This ensures operators receive authoritative, traceable facts suitable for utility decision-making.
            </p>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 10. END-TO-END ARCHITECTURE                                               */}
        {/* ========================================================================= */}
        <section
          id="overview-architecture"
          className="overview-full-section"
          style={{ width: '100%', scrollMarginTop: '88px' }}
        >
          <div>
            <span className="section-kicker" style={{ color: 'var(--accent-emerald)' }}>
              SYSTEM ARCHITECTURE
            </span>
            <h2 className="section-heading">
              9. End-to-End System Architecture
            </h2>
            <p className="section-subheading">
              A clean modular design connecting data pipelines, machine-learning analytics, local retrieval, and dashboard presentation.
            </p>
          </div>

          {/* Simple Clean Flow Diagram */}
          <div className="workspace-card" style={{ padding: '1.75rem', marginBottom: '1.5rem', backgroundColor: 'var(--surface-raised)' }}>
            <h4 style={{ margin: '0 0 1rem 0', fontSize: '1rem', fontWeight: 600, color: 'var(--foreground)' }}>
              End-to-End Information Flow
            </h4>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.82rem',
                color: 'var(--foreground-muted)',
                lineHeight: 1.9,
                backgroundColor: 'var(--surface)',
                padding: '1.25rem 1.5rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border)',
                overflowX: 'auto',
              }}
            >
              Smart-Meter Data (30-min readings across 14 observation windows)<br />
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↓<br />
              Data Preparation &amp; Completeness Verification (&ge;95% slot threshold)<br />
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↓<br />
              Feature Engineering (Autoregressive lags &amp; 8 standardized behavioral metrics)<br />
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↓<br />
              ┌────────────────────────┬─────────────────────────┬────────────────────────┐<br />
              │&nbsp;&nbsp;Day-Ahead Forecaster&nbsp;&nbsp;│&nbsp;&nbsp;Behavioral Clustering&nbsp;&nbsp;│&nbsp;&nbsp;&nbsp;Anomaly Detection&nbsp;&nbsp;&nbsp;│<br />
              │&nbsp;&nbsp;&nbsp;&nbsp;(LightGBM GBDT)&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;│&nbsp;(K-Means + Hungarian)&nbsp;&nbsp;│&nbsp;&nbsp;&nbsp;(Isolation Forest)&nbsp;&nbsp;&nbsp;│<br />
              └────────────────────────┴─────────────────────────┴────────────────────────┘<br />
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↓<br />
              Verified GridVision Parquet Artifacts (/data/artifacts/latest/)<br />
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↓<br />
              FastAPI Analytics Service &amp; In-Memory Data Store<br />
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↓<br />
              ┌──────────────────────────────────────────────────────────────────────────┐<br />
              │&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;AI Copilot Orchestrator&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;│<br />
              │&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↙&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↘&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;│<br />
              │&nbsp;Analytics Tools (Tools.py)&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Local RAG (Retriever.py)&nbsp;│<br />
              │&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↘&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↙&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;│<br />
              │&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Strict Grounding Verification&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;│<br />
              └──────────────────────────────────────────────────────────────────────────┘<br />
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↓<br />
              Operational Dashboard UI (React 19 + TypeScript + Vite)
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
            <div className="workspace-card" style={{ padding: '1.35rem' }}>
              <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--accent-emerald)', textTransform: 'uppercase' }}>Frontend Application</span>
              <h4 style={{ margin: '0.35rem 0', fontSize: '1rem', fontWeight: 600 }}>React 19 + TypeScript + Vite</h4>
              <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--foreground-muted)', lineHeight: 1.5 }}>
                Componentized dashboard with persistent navigation, responsive CSS grid layouts, and interactive SVG load profiles built with sub-second bundle performance.
              </p>
            </div>

            <div className="workspace-card" style={{ padding: '1.35rem' }}>
              <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--accent-cyan)', textTransform: 'uppercase' }}>Backend API Service</span>
              <h4 style={{ margin: '0.35rem 0', fontSize: '1rem', fontWeight: 600 }}>FastAPI + PyArrow + Scikit-Learn</h4>
              <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--foreground-muted)', lineHeight: 1.5 }}>
                Asynchronous Python service serving precomputed artifacts from Parquet with sub-millisecond in-memory lookups and local offline TF-IDF RAG retrieval.
              </p>
            </div>

            <div className="workspace-card" style={{ padding: '1.35rem' }}>
              <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--accent-amber)', textTransform: 'uppercase' }}>Containerized Deployment</span>
              <h4 style={{ margin: '0.35rem 0', fontSize: '1rem', fontWeight: 600 }}>Multi-Stage Docker Packaging</h4>
              <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--foreground-muted)', lineHeight: 1.5 }}>
                Unified single-container deployment packaging the compiled frontend bundle and Python backend, requiring zero external database or cloud API dependencies.
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
          style={{ width: '100%', scrollMarginTop: '88px', borderTop: '2px solid var(--border)', paddingTop: '4rem' }}
        >
          <div id="research-section">
            <span className="section-kicker" style={{ color: 'var(--accent-indigo)' }}>
              ACADEMIC EXTENSION
            </span>
            <h2 className="section-heading">
              10. Related Research: Temporal Cluster Instability &amp; Forecast Failure
            </h2>
            <p className="section-subheading">
              A standalone empirical investigation conducted alongside the engineering capstone to test whether behavioral archetype transitions provide early warning of severe forecasting failures.
            </p>
          </div>

          {/* Headline Finding Banner */}
          <div className="overview-research-verdict-card" style={{ marginBottom: '2rem' }}>
            <div className="verdict-card-inner">
              <div className="verdict-badge" style={{ backgroundColor: 'rgba(99, 102, 241, 0.15)', color: 'var(--accent-indigo)' }}>
                <span>CENTRAL RESEARCH QUESTION &amp; VERDICT</span>
              </div>
              <h3 className="verdict-title">
                &ldquo;Does instability in a consumer&apos;s behavioral-cluster assignment help identify periods when the next forecast is more likely to fail badly, after accounting for the consumer&apos;s underlying volatility?&rdquo;
              </h3>
              <p className="verdict-statement">
                &ldquo;After controlling for baseline consumption volatility, temporal cluster instability was not independently associated with extreme load-forecast failure (Odds Ratio = 0.9183, p = 0.7481). The null hypothesis (H0) was supported.&rdquo;
              </p>
              <p className="verdict-subtext">
                The analysis confirmed that while behavioral cluster shifts capture real-world routine adaptations, supervised machine-learning models adapt smoothly across behavioral regimes. High-frequency demand variability (consumption volatility) remains the dominant physical driver of forecast failure (Odds Ratio = 7.4459, p &lt; 0.0001).
              </p>
            </div>
          </div>

          {/* Research Logic Flow */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
            <div className="workspace-card" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.65rem' }}>
                <Scale size={20} style={{ color: 'var(--accent-indigo)' }} />
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 600 }}>The Research Logic Flow</h3>
              </div>
              <p style={{ margin: 0, fontSize: '0.86rem', color: 'var(--foreground-muted)', lineHeight: 1.6 }}>
                The experiment evaluated the sequence:
              </p>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--foreground)', backgroundColor: 'var(--surface-raised)', padding: '0.85rem', borderRadius: 'var(--radius-sm)', margin: '0.65rem 0', lineHeight: 1.6 }}>
                Behavioral history<br />
                &nbsp;&nbsp;↓<br />
                Cluster assignments over time<br />
                &nbsp;&nbsp;↓<br />
                Measure longitudinal instability<br />
                &nbsp;&nbsp;↓<br />
                Examine following forecast period<br />
                &nbsp;&nbsp;↓<br />
                Test association with extreme forecast failure
              </div>
            </div>

            <div className="workspace-card" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.65rem' }}>
                <FileCode2 size={20} style={{ color: 'var(--accent-purple)' }} />
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 600 }}>Prospective Study Protocol</h3>
              </div>
              <p style={{ margin: 0, fontSize: '0.86rem', color: 'var(--foreground-muted)', lineHeight: 1.6 }}>
                To avoid post-hoc threshold manipulation, extreme forecast failure was defined prospectively using the 95th percentile standardized error threshold (2.53438) established during initial calibration windows.
              </p>
              <p style={{ margin: '0.65rem 0 0 0', fontSize: '0.86rem', color: 'var(--foreground-muted)', lineHeight: 1.6 }}>
                Logistic regression models were estimated with <strong>cluster-robust standard errors grouped at the household level</strong> across 3,676 observations, preventing pseudo-replication bias.
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
          style={{ width: '100%', scrollMarginTop: '88px' }}
        >
          <div>
            <span className="section-kicker" style={{ color: 'var(--accent-rose)' }}>
              RESPONSIBLE INTERPRETATION
            </span>
            <h2 className="section-heading">
              11. Methodological Limitations &amp; Scope
            </h2>
            <p className="section-subheading">
              Important boundaries to consider when interpreting GridVision findings and transferring conclusions to other power systems.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
            <div className="workspace-card" style={{ padding: '1.5rem' }}>
              <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.05rem', fontWeight: 600 }}>Observational Design Context</h3>
              <p style={{ margin: 0, fontSize: '0.86rem', color: 'var(--foreground-muted)', lineHeight: 1.6 }}>
                The research analysis is observational and prospective. <strong>Findings demonstrate associations, not causality.</strong> Behavioral cluster instability cannot be assumed to cause or prevent forecast failures.
              </p>
            </div>

            <div className="workspace-card" style={{ padding: '1.5rem' }}>
              <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.05rem', fontWeight: 600 }}>Seasonal Demand Expansion</h3>
              <p style={{ margin: 0, fontSize: '0.86rem', color: 'var(--foreground-muted)', lineHeight: 1.6 }}>
                Winter space-heating demand expansion induces absolute load and residual variance expansion that outpaces scale-invariant coefficient of variation (CV). Consequently, extreme absolute forecast residuals concentrate heavily in winter calendar windows.
              </p>
            </div>

            <div className="workspace-card" style={{ padding: '1.5rem' }}>
              <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.05rem', fontWeight: 600 }}>Cohort &amp; Pricing Environment</h3>
              <p style={{ margin: 0, fontSize: '0.86rem', color: 'var(--foreground-muted)', lineHeight: 1.6 }}>
                The dataset represents 620 flat-rate residential households in Greater London. Findings reflect habitual lifestyle routines rather than automated response to dynamic time-of-use or critical-peak pricing structures.
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
          style={{ width: '100%', scrollMarginTop: '88px', marginBottom: '2rem' }}
        >
          <div
            style={{
              padding: '2.5rem',
              backgroundColor: 'var(--surface-raised)',
              border: '1px solid var(--border-strong)',
              borderRadius: 'var(--radius-lg)',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem',
            }}
          >
            <div>
              <span className="section-kicker" style={{ color: 'var(--accent-emerald)' }}>
                FINAL TAKEAWAY
              </span>
              <h2 style={{ margin: '0.35rem 0 0.75rem 0', fontSize: '1.85rem', fontWeight: 600, color: 'var(--foreground)' }}>
                Operational Energy Intelligence Built on Rigorous Data Science
              </h2>
              <p style={{ margin: 0, fontSize: '0.96rem', color: 'var(--foreground-muted)', lineHeight: 1.65, maxWidth: '880px' }}>
                GridVision proves that modern smart-meter analytics do not need to choose between rigorous data science and intuitive operational utility. By formulating clean complementary tasks—supervised gradient boosting for forecasting, distance clustering for load profiling, isolation trees for anomaly screening, and strictly grounded language orchestration for human interaction—the platform empowers distribution engineers and energy analysts to make confident, data-driven decisions.
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="overview-cta-btn"
                onClick={onLaunchDashboard}
                style={{ padding: '0.75rem 1.6rem', fontSize: '0.88rem' }}
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
