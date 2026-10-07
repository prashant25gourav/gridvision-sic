import React from 'react';
import {
  ArrowRight,
  Zap,
  Calendar,
  Layers,
  Activity,
  Compass,
  HelpCircle,
  BarChart3,

  Bot,
  CheckCircle2,
} from 'lucide-react';
import { CapstoneVisual } from './CapstoneVisual';
import { ResearchVisual } from './ResearchVisual';
import './OverviewGateway.css';

interface OverviewGatewayProps {
  onExploreCapstone: () => void;
  onExploreResearch: () => void;
}

export const OverviewGateway: React.FC<OverviewGatewayProps> = ({
  onExploreCapstone,
  onExploreResearch,
}) => {
  const walkthroughSteps = [
    {
      icon: Zap,
      label: 'Household Electricity Data',
      desc: 'Raw half-hourly smart-meter telemetry across 620 London residences.',
    },
    {
      icon: Calendar,
      label: '56-Day Observation Windows',
      desc: '14 common-calendar windows eliminate seasonal alignment bias.',
    },
    {
      icon: Activity,
      label: 'Behavioral Features',
      desc: '8 engineered metrics capturing diurnal load profile habits.',
    },
    {
      icon: Layers,
      label: 'K-Means Segmentation',
      desc: 'Calibrated K = 4 archetypes (Evening, Baseload, Daytime, Dual).',
    },
    {
      icon: Compass,
      label: 'Temporal Alignment',
      desc: 'Chained Hungarian matching preserves persistent cluster identities.',
    },
    {
      icon: BarChart3,
      label: 'Forecasting & Anomaly Detection',
      desc: 'Pooled GBDT day-ahead predictions and 5% anomaly tail monitoring.',
    },
    {
      icon: HelpCircle,
      label: 'Research Question',
      desc: 'Does behavioral instability predict tail-event forecast failure?',
    },
    {
      icon: CheckCircle2,
      label: 'Statistical Evaluation',
      desc: 'Cluster-robust logistic regression and out-of-sample holdout test.',
    },
    {
      icon: Bot,
      label: 'AI Copilot',
      desc: 'Grounded natural-language assistant explaining household analytics.',
    },
  ];

  const systemMetrics = [
    { label: 'Study Cohort', value: '620', unit: 'households', desc: 'Stratified residential meters across London' },
    { label: 'Observation Windows', value: '14', unit: 'windows', desc: 'Synchronized 56-day evaluation intervals' },
    { label: 'Daily Resolution', value: '48', unit: 'slots/day', desc: 'Half-hourly readings with zero lookahead' },
    { label: 'Behavioral Features', value: '8', unit: 'metrics', desc: 'Standardized load shape characteristics' },
    { label: 'Cluster Archetypes', value: 'K = 4', unit: 'segments', desc: 'Evening Peaker, Baseload, Daytime, Dual Peak' },
    { label: 'Forecaster Performance', value: '+31.4%', unit: 'gain', desc: 'Error reduction over seasonal-naive baseline' },
    { label: 'Anomaly Threshold', value: '~5%', unit: 'budget', desc: 'Unsupervised detection of unusual usage' },
    { label: 'Research Sample', value: '3,676', unit: 'observations', desc: 'Longitudinal household-window pairs evaluated' },
    { label: 'Holdout ROC-AUC', value: '0.7298', unit: 'AUC', desc: 'Forward-only out-of-sample validation' },
  ];

  return (
    <div className="overview-page-container">
      <div className="overview-inner">
        {/* 1. Header & Project Introduction */}
        <header className="overview-header">
          <div className="overview-category-pill">
            <span>OVERVIEW</span>
          </div>
          <h1 className="overview-main-title">
            Explore GridVision
          </h1>
          <p className="overview-lead-paragraph">
            GridVision analyzes residential electricity consumption to forecast demand, identify behavioral consumption patterns, detect unusual behavior, explore individual households, and investigate whether changing household behavior is related to forecast failure.
          </p>
        </header>

        {/* 2. Approved Two Editorial Panels (Capstone vs Research Study) */}
        <div className="overview-grid" role="region" aria-label="Two sides of GridVision">
          {/* Panel 1: CAPSTONE */}
          <article
            className="overview-panel"
            onClick={onExploreCapstone}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onExploreCapstone();
              }
            }}
            tabIndex={0}
            role="button"
            aria-label="Explore Capstone Smart Energy Analytics"
          >
            <div className="overview-panel-visual">
              <CapstoneVisual />
            </div>

            <div className="overview-panel-body">
              <div className="overview-panel-header">
                <span className="overview-eyebrow">CAPSTONE</span>
                <h2 className="overview-panel-title">
                  Smart Energy Analytics
                </h2>
                <p className="overview-panel-features">
                  Day-Ahead Forecasting • Behavioral Segmentation • Anomaly Detection • AI Copilot
                </p>
              </div>

              <div className="overview-panel-footer">
                <button
                  type="button"
                  className="overview-cta-btn"
                  tabIndex={-1}
                  aria-hidden="true"
                >
                  <span>EXPLORE CAPSTONE</span>
                  <ArrowRight size={17} className="overview-cta-arrow" />
                </button>
              </div>
            </div>
          </article>

          {/* Panel 2: RESEARCH STUDY */}
          <article
            className="overview-panel"
            onClick={onExploreResearch}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onExploreResearch();
              }
            }}
            tabIndex={0}
            role="button"
            aria-label="Explore Research Study on Temporal Cluster Instability"
          >
            <div className="overview-panel-visual">
              <ResearchVisual />
            </div>

            <div className="overview-panel-body">
              <div className="overview-panel-header">
                <span className="overview-eyebrow">RESEARCH STUDY</span>
                <h2 className="overview-panel-title">
                  Temporal Cluster Instability as a Predictor of Extreme Load-Forecast Failure
                </h2>
                <p className="overview-panel-features">
                  Longitudinal behavioral trajectories • Instability scoring • Statistical hypothesis testing
                </p>
              </div>

              <div className="overview-panel-footer">
                <button
                  type="button"
                  className="overview-cta-btn"
                  tabIndex={-1}
                  aria-hidden="true"
                >
                  <span>EXPLORE RESEARCH</span>
                  <ArrowRight size={17} className="overview-cta-arrow" />
                </button>
              </div>
            </div>
          </article>
        </div>

        {/* 3. Headline Research Conclusion Banner */}
        <section className="overview-research-verdict-card" aria-label="Research study conclusion">
          <div className="verdict-card-inner">
            <div className="verdict-badge">
              <span>RESEARCH CONCLUSION</span>
            </div>
            <h3 className="verdict-title">What did the empirical study discover?</h3>
            <p className="verdict-statement">
              &ldquo;We tested whether changes in a household&apos;s behavioral pattern over time help predict unusually poor forecasts. The analysis did not find independent predictive evidence after accounting for the household&apos;s underlying consumption variability.&rdquo;
            </p>
            <p className="verdict-subtext">
              While shifting daily routines indicates meaningful lifestyle changes, machine learning forecasters adapt across behavioral regimes. Unpredictable intra-day volume swings (consumption volatility) remain the dominant driver of forecast errors.
            </p>
          </div>
        </section>

        {/* 4. Visual Project Walkthrough */}
        <section className="overview-walkthrough-section" aria-label="How GridVision works end-to-end">
          <div className="section-header-centered">
            <span className="section-kicker">WORKFLOW ARCHITECTURE</span>
            <h2 className="section-heading">How GridVision Analyzes Household Electricity</h2>
            <p className="section-subheading">
              A continuous analytical pipeline transforming raw smart-meter time series into actionable operational intelligence and statistical insights.
            </p>
          </div>

          <div className="overview-walkthrough-grid">
            {walkthroughSteps.map((step, idx) => {
              const Icon = step.icon;
              return (
                <div key={idx} className="walkthrough-step-card">
                  <div className="step-card-header">
                    <span className="step-number">{String(idx + 1).padStart(2, '0')}</span>
                    <div className="step-icon-box">
                      <Icon size={18} />
                    </div>
                  </div>
                  <h4 className="step-title">{step.label}</h4>
                  <p className="step-desc">{step.desc}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* 5. Authoritative Technical Story in Numbers */}
        <section className="overview-metrics-section" aria-label="System scale and parameters">
          <div className="section-header-centered">
            <span className="section-kicker">AUTHORITATIVE SYSTEM METRICS</span>
            <h2 className="section-heading">GridVision at a Glance</h2>
            <p className="section-subheading">
              Key dimensions and verified benchmark metrics derived from the study dataset and artifacts.
            </p>
          </div>

          <div className="overview-metrics-grid">
            {systemMetrics.map((m, idx) => (
              <div key={idx} className="metric-box">
                <div className="metric-val-row">
                  <span className="metric-val">{m.value}</span>
                  <span className="metric-unit">{m.unit}</span>
                </div>
                <div className="metric-label">{m.label}</div>
                <div className="metric-desc">{m.desc}</div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};
