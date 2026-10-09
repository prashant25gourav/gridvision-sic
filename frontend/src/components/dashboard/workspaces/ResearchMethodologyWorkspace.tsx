import React from 'react';
import { Shield, Activity, CheckCircle2 } from 'lucide-react';
import './Workspaces.css';


export const ResearchMethodologyWorkspace: React.FC = () => {
  const pipelineSteps = [
    {
      num: '01',
      title: 'Raw Data Ingestion & Quality Control',
      detail: 'Ingested raw half-hourly meter telemetry from UKPN Low Carbon London (LCL) dataset. Filtered strictly to flat-rate residential meters across London. Enforced data cleanliness: zero negative readings, max 3-day gap threshold, and >=95% slot completeness.',
      badge: 'QC VERIFIED • 0 NEGATIVES',
    },
    {
      num: '02',
      title: 'Common-Calendar Discretization',
      detail: 'Partitioned data into 14 contiguous 56-day common-calendar windows (W01–W14), exactly 2,688 half-hourly time intervals per window. Synchronized calendar alignment eliminates seasonal and weather mismatch bias across households.',
      badge: '14 WINDOWS • 56 DAYS',
    },
    {
      num: '03',
      title: 'Per-Household Baseline Calibration',
      detail: 'Each household was assigned its own first two qualifying usable windows strictly as baseline calibration windows (Cal-W1 and Cal-W2). Ensures zero future lookahead contamination while accommodating staggered meter enrollment dates.',
      badge: 'FIRST 2 WINDOWS LOCKED',
    },
    {
      num: '04',
      title: 'Behavioral Feature Extraction',
      detail: 'Extracted 8 behavioral feature dimensions across all qualifying windows: mean load, peak load, peak-to-average ratio, load standard deviation, mean ramp rate, day/night ratio, weekday/weekend contrast, and peak timing.',
      badge: '8 DIMENSIONS • 0 NaNs',
    },
    {
      num: '05',
      title: 'Calibration K Selection & K-Means Clustering',
      detail: 'Silhouette coefficient sweep executed strictly on 1,240 calibration feature vectors, selecting optimal K = 4 (silhouette score 0.4021). Fitted per-window K-Means models with locked random seed 42.',
      badge: 'K = 4 (SILHOUETTE 0.4021)',
    },
    {
      num: '06',
      title: 'Chained Hungarian Centroid Alignment',
      detail: 'Applied the Hungarian optimal bipartite matching algorithm sequentially starting from Cal-W1 forward, minimizing standardized Euclidean distances between centroids to prevent label switching across time.',
      badge: 'LABEL PERSISTENCE ENSURED',
    },
    {
      num: '07',
      title: 'Longitudinal Instability & Volatility Metrics',
      detail: 'Calculated longitudinal instability as observed cluster transitions divided by opportunity windows (evaluating transitions starting with window 3). Concurrently computed consumption volatility as coefficient of variation (CV).',
      badge: 'PERSISTENCE METRICS',
    },
    {
      num: '08',
      title: 'Day-Ahead Forecaster & Residual Standardization',
      detail: 'Trained pooled LightGBM forecasters per calendar window using locked lag features derived strictly from w <= target without future lookahead. Standardized out-of-sample forecast errors using calibration median absolute error and MAD floor factor 0.05.',
      badge: 'POOLED GBDT FORECASTER',
    },
    {
      num: '09',
      title: 'Extreme-Failure Threshold Classification',
      detail: 'Fixed the extreme-failure threshold strictly at 2.53438 (95th percentile) from calibration standardized errors. Applied this threshold to classify forecast failures in subsequent out-of-sample evaluation windows.',
      badge: 'THRESHOLD = 2.53438 (95TH PCT)',
    },
    {
      num: '10',
      title: 'Cluster-Robust Logistic Regression (H1 vs H0)',
      detail: 'Fitted cluster-robust logistic regression accounting for household repeated measures across 3,676 observations (620 households): Extreme_Failure ~ Volatility_CV + Instability. Evaluated odds ratios, z-statistics, and nested likelihood ratio tests.',
      badge: 'CLUSTER-ROBUST REGRESSION',
    },
    {
      num: '11',
      title: 'Forward-Only Out-of-Sample Holdout Evaluation',
      detail: 'Final validation executed as a forward-only pass on 612 eligible holdout households in Window W14 with zero model tuning, zero refitting, and locked coefficients. Achieved holdout ROC-AUC = 0.7298 and PR-AUC = 0.5378.',
      badge: 'ROC-AUC = 0.7298 • ZERO REFIT',
    },
  ];

  const lockedSpecs = [
    { label: 'Window Duration', value: '56 Days (2,688 half-hours)' },
    { label: 'Reading Frequency', value: '48 half-hour slots per day' },
    { label: 'Calibration Budget', value: 'Own first 2 usable windows' },
    { label: 'Cluster Count', value: 'K = 4 (Calibration Silhouette = 0.4021)' },
    { label: 'Failure Threshold', value: '95th Percentile = 2.53438' },
    { label: 'Holdout Window', value: 'Window W14 (Forward-only, 0 fit calls)' },
    { label: 'Research Forecaster', value: 'Global pooled GBDT (research outcome)' },
    { label: 'Temporal Successor', value: 'Literal calendar successor (w → w+1)' },
  ];

  return (
    <div className="workspace-container">
      {/* Workspace Header */}
      <header className="workspace-header">
        <div className="workspace-header-title-row">
          <h1 className="workspace-title">Research Methodology &amp; Architecture</h1>
        </div>
        <p className="workspace-subtitle">
          This page documents how GridVision produces the results shown throughout the platform: common-calendar discretization, per-household calibration, Hungarian alignment, standardized error tracking, and cluster-robust statistical design.
        </p>
      </header>

      {/* Evaluator Introduction Banner */}
      <section
        style={{
          padding: '1.25rem 1.5rem',
          borderRadius: 'var(--radius-md)',
          backgroundColor: 'var(--surface)',
          border: '1.5px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CheckCircle2 size={18} style={{ color: 'var(--accent-emerald)' }} />
          <h2 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 600, color: 'var(--foreground)' }}>
            Methodological Transparency
          </h2>
        </div>
        <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--foreground-muted)', lineHeight: 1.6 }}>
          This page documents how GridVision produces the results shown throughout the platform. Every metric, segmentation boundary, and statistical test is strictly derived from pre-registered experimental protocols with complete temporal separation to eliminate data leakage.
        </p>
      </section>

      {/* Core Protocol Invariants Card */}
      <section className="workspace-card">
        <div className="workspace-card-header">
          <div>
            <h2 className="workspace-card-title">Locked Research Protocol Invariants</h2>
            <p className="workspace-card-subtitle">
              Strict methodological boundaries enforced across all pipeline modules and statistical routines
            </p>
          </div>
          <Shield size={18} style={{ color: 'var(--accent-emerald)' }} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem' }}>
          {lockedSpecs.map((s, idx) => (
            <div key={idx} className="cohort-stat">
              <span className="cohort-stat-label">{s.label}</span>
              <span className="cohort-stat-val" style={{ fontSize: '0.85rem' }}>
                {s.value}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Visual Pipeline Flowchart */}
      <section className="workspace-card">
        <div className="workspace-card-header">
          <div>
            <h2 className="workspace-card-title">Longitudinal Execution Pipeline Flow</h2>
            <p className="workspace-card-subtitle">
              Eleven deterministic execution stages from raw LCL meter CSVs to holdout hypothesis evaluation
            </p>
          </div>
          <Activity size={18} style={{ color: 'var(--accent-emerald)' }} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {pipelineSteps.map((step) => (
            <div
              key={step.num}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '1.25rem',
                padding: '1rem 1.25rem',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--surface-raised)',
                border: '1px solid var(--border)',
              }}
            >
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '1rem',
                  fontWeight: 700,
                  color: 'var(--accent-emerald)',
                  minWidth: '28px',
                  paddingTop: '2px',
                }}
              >
                {step.num}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600, color: 'var(--foreground)' }}>
                    {step.title}
                  </h3>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      padding: '0.15rem 0.5rem',
                      borderRadius: 'var(--radius-full)',
                      backgroundColor: 'color-mix(in srgb, var(--accent-emerald) 12%, transparent)',
                      color: 'var(--accent-emerald)',
                      border: '1px solid color-mix(in srgb, var(--accent-emerald) 25%, transparent)',
                    }}
                  >
                    {step.badge}
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--foreground-muted)', lineHeight: 1.55 }}>
                  {step.detail}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
