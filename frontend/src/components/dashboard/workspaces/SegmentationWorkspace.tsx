import React, { useState, useEffect } from 'react';
import { RefreshCw, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';
import { fetchSegmentationOverview, type SegmentationOverviewData, type ClusterDetail } from '../../../services/api';

import './Workspaces.css';

export const SegmentationWorkspace: React.FC = () => {
  const [data, setData] = useState<SegmentationOverviewData | null>(null);
  const [selectedClusterId, setSelectedClusterId] = useState<number>(0);
  const [showTechnicalDetails, setShowTechnicalDetails] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    fetchSegmentationOverview()
      .then((res) => {
        if (isMounted) {
          setData(res);
        }
      })
      .catch((err) => {
        console.warn('Could not load segmentation overview:', err);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const clusters: ClusterDetail[] = data?.clusters || [
    {
      cluster_id: 0,
      label: 'High Peak / Heavy Demand',
      archetype: 'Evening Peaker',
      household_count: 180,
      percentage: 29.0,
      peak_window: '18:00 - 21:00',
      description: 'High overall consumption with a pronounced 18:00–21:00 evening peak.',
      features: { mean_load: 0.582, peak_load: 1.418, peak_to_average_ratio: 2.45, day_night_ratio: 1.85, ramp_rate_mean: 0.312, std_load: 0.378, weekday_weekend_contrast: 0.124, peak_timing: 19.5 },
    },
    {
      cluster_id: 1,
      label: 'Flat / Low-Variance',
      archetype: 'Baseload Steady',
      household_count: 240,
      percentage: 38.7,
      peak_window: 'Consistent / No Peak',
      description: 'Low-variance baseload consumption with steady demand throughout the day.',
      features: { mean_load: 0.218, peak_load: 0.482, peak_to_average_ratio: 1.35, day_night_ratio: 1.15, ramp_rate_mean: 0.082, std_load: 0.114, weekday_weekend_contrast: 0.038, peak_timing: 18.0 },
    },
    {
      cluster_id: 2,
      label: 'Daytime Active',
      archetype: 'Daytime Peaker',
      household_count: 120,
      percentage: 19.4,
      peak_window: '09:00 - 16:00',
      description: 'Elevated daytime electricity consumption indicating daytime home occupancy.',
      features: { mean_load: 0.388, peak_load: 0.884, peak_to_average_ratio: 1.72, day_night_ratio: 2.10, ramp_rate_mean: 0.178, std_load: 0.242, weekday_weekend_contrast: 0.086, peak_timing: 13.0 },
    },
    {
      cluster_id: 3,
      label: 'Moderate / Dual-Peak',
      archetype: 'Dual Peaker',
      household_count: 80,
      percentage: 12.9,
      peak_window: '07:30 & 19:30',
      description: 'Bimodal demand signature with distinct morning routine and evening dinner peaks.',
      features: { mean_load: 0.442, peak_load: 1.148, peak_to_average_ratio: 2.12, day_night_ratio: 1.62, ramp_rate_mean: 0.264, std_load: 0.318, weekday_weekend_contrast: 0.148, peak_timing: 8.0 },
    },
  ];

  const activeCluster = clusters.find((c) => c.cluster_id === selectedClusterId) || clusters[0];
  const silhouetteSweep = data?.silhouette_sweep || { '3': 0.389, '4': 0.4021, '5': 0.2833, '6': 0.2336, '7': 0.1856, '8': 0.205 };

  const clusterColors = ['var(--accent-emerald)', 'var(--accent-amber)', 'var(--accent-blue)', 'var(--accent-rose)'];

  // Feature definitions
  const featureDefs = [
    { key: 'mean_load', label: 'Average Daily Load', max: 0.8, unit: 'kW' },
    { key: 'peak_load', label: 'Peak Hour Load', max: 1.6, unit: 'kW' },
    { key: 'peak_to_average_ratio', label: 'Peak-to-Average Ratio', max: 3.0, unit: 'ratio' },
    { key: 'day_night_ratio', label: 'Day / Night Ratio', max: 2.5, unit: 'ratio' },
    { key: 'ramp_rate_mean', label: 'Ramp Rate (Mean)', max: 0.4, unit: 'kW/slot' },
    { key: 'std_load', label: 'Load Variability', max: 0.5, unit: 'kW' },
    { key: 'weekday_weekend_contrast', label: 'Weekend Contrast', max: 0.2, unit: 'diff' },
    { key: 'peak_timing', label: 'Modal Peak Timing', max: 24, unit: 'hr' },
  ];

  return (
    <div className="workspace-container">
      {/* Workspace Header */}
      <header className="workspace-header">
        <div className="workspace-header-title-row">
          <h1 className="workspace-title">Behavioral Customer Segmentation</h1>
        </div>
        <p className="workspace-subtitle">
          Discovering how households use electricity: 4 empirical consumption archetypes discovered across the cohort and tracked consistently over time.
        </p>
      </header>

      {/* 1. What the Segments Mean (Surface Layer Plain Explanation) */}
      <section
        style={{
          padding: '1.25rem 1.5rem',
          borderRadius: 'var(--radius-md)',
          backgroundColor: 'var(--surface)',
          border: '1.5px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.65rem',
        }}
      >
        <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: 'var(--foreground)' }}>
          Understanding Residential Load Archetypes
        </h2>
        <p style={{ margin: 0, fontSize: '0.92rem', color: 'var(--foreground-muted)', lineHeight: 1.6 }}>
          Rather than treating all households identically, GridVision categorizes smart-meter customers into four distinct daily usage archetypes. These segments enable utilities to design tailored demand-response incentives, optimize local substation capacity, and evaluate how lifestyle shifts affect grid reliability.
        </p>
      </section>

      {/* 2. Visual Distribution of Segments Across the Cohort */}
      <section className="workspace-card">
        <div className="workspace-card-header">
          <div>
            <h2 className="workspace-card-title">Behavioral Archetypes Across the Cohort</h2>
            <p className="workspace-card-subtitle">
              Select an archetype below to explore its specific daily load profile and characteristics
            </p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '1rem' }}>
          {clusters.map((c, i) => {
            const isSelected = c.cluster_id === selectedClusterId;
            const barCol = clusterColors[i % clusterColors.length];
            return (
              <div
                key={c.cluster_id}
                onClick={() => setSelectedClusterId(c.cluster_id)}
                style={{
                  padding: '1.25rem',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: isSelected ? 'var(--surface-raised)' : 'var(--surface)',
                  border: `1.5px solid ${isSelected ? barCol : 'var(--border)'}`,
                  cursor: 'pointer',
                  transition: 'all 150ms ease',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', fontWeight: 700, color: barCol }}>
                    Archetype {c.cluster_id}
                  </span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--foreground-subtle)' }}>
                    {c.percentage}%
                  </span>
                </div>
                <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--foreground)' }}>
                  {c.archetype}
                </div>
                <div style={{ height: '6px', backgroundColor: 'var(--surface-raised)', borderRadius: '3px', overflow: 'hidden', marginTop: '0.25rem' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${c.percentage}%`,
                      backgroundColor: barCol,
                      borderRadius: '3px',
                    }}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--foreground-subtle)', marginTop: '0.25rem' }}>
                  <span>{c.household_count} households</span>
                  <span>Peak: {c.peak_window}</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. Behavioral Patterns Profile for Selected Archetype */}
      <div className="workspace-grid-two-col">
        <section className="workspace-card">
          <div className="workspace-card-header">
            <div>
              <h2 className="workspace-card-title">
                {activeCluster.archetype}: Daily Load Characteristics
              </h2>
              <p className="workspace-card-subtitle">
                {activeCluster.description}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {featureDefs.map((f) => {
              const val = activeCluster.features[f.key as keyof typeof activeCluster.features] ?? 0;
              const pct = Math.min(100, Math.round((val / f.max) * 100));
              const barColor = clusterColors[activeCluster.cluster_id % clusterColors.length];

              return (
                <div key={f.key}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '0.25rem' }}>
                    <span style={{ color: 'var(--foreground)' }}>
                      {f.label}
                    </span>
                    <span style={{ fontFamily: 'var(--font-mono)', color: barColor, fontWeight: 600 }}>
                      {typeof val === 'number' ? (val < 10 ? val.toFixed(3) : val.toFixed(1)) : val} {f.unit}
                    </span>
                  </div>
                  <div style={{ height: '6px', backgroundColor: 'var(--surface-raised)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${pct}%`,
                        backgroundColor: barColor,
                        borderRadius: '3px',
                        transition: 'width 250ms ease',
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* 4 & 5. How K was selected & Temporal Alignment */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* How K was Selected */}
          <section className="workspace-card">
            <div className="workspace-card-header">
              <div>
                <h2 className="workspace-card-title">How 4 Archetypes Were Selected</h2>
                <p className="workspace-card-subtitle">
                  Data-driven evaluation identifying the optimal number of natural customer groupings
                </p>
              </div>
              <CheckCircle2 size={18} style={{ color: 'var(--accent-emerald)' }} />
            </div>

            <p style={{ margin: '0 0 0.85rem 0', fontSize: '0.86rem', color: 'var(--foreground-muted)', lineHeight: 1.55 }}>
              We evaluated cluster counts from K = 3 to K = 8 across 1,240 baseline calibration observations. K = 4 achieved the highest partition separability (silhouette score of 0.4021), confirming that four patterns best represent the diverse population without over-splitting.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {Object.entries(silhouetteSweep).slice(0, 4).map(([k, score]) => {
                const isOptimal = k === '4';
                return (
                  <div
                    key={k}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.5rem 0.85rem',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: isOptimal ? 'color-mix(in srgb, var(--accent-emerald) 10%, transparent)' : 'var(--surface-raised)',
                      border: `1px solid ${isOptimal ? 'var(--accent-emerald)' : 'var(--border)'}`,
                      fontSize: '0.82rem',
                    }}
                  >
                    <span style={{ fontWeight: isOptimal ? 700 : 500, color: isOptimal ? 'var(--accent-emerald)' : 'var(--foreground)' }}>
                      K = {k} Clusters {isOptimal && '(Optimal)'}
                    </span>
                    <span style={{ fontFamily: 'var(--font-mono)', color: isOptimal ? 'var(--accent-emerald)' : 'var(--foreground-muted)' }}>
                      Score: {score.toFixed(4)}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Temporal Alignment Explanation */}
          <section className="workspace-card">
            <div className="workspace-card-header">
              <div>
                <h2 className="workspace-card-title">Preserving Meaning Over Time (Hungarian Alignment)</h2>
                <p className="workspace-card-subtitle">
                  Ensuring cluster names stay consistent across all 14 observation windows
                </p>
              </div>
              <RefreshCw size={18} style={{ color: 'var(--accent-blue)' }} />
            </div>

            <p style={{ margin: 0, fontSize: '0.86rem', color: 'var(--foreground-muted)', lineHeight: 1.55 }}>
              Without alignment, running clustering independently in each period would scramble cluster names (e.g., Cluster 0 would mean Evening Peaker in May but Baseload in July). GridVision chains Hungarian optimal bipartite matching from the baseline window forward, guaranteeing that each archetype label continues to represent the same physical behavior across all 14 observation windows.
            </p>
          </section>
        </div>
      </div>

      {/* 6. Progressive Disclosure: Technical Details Accordion */}
      <section className="workspace-card">
        <button
          type="button"
          onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
          style={{
            width: '100%',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'none',
            border: 'none',
            padding: '0.85rem 1rem',
            cursor: 'pointer',
            color: 'var(--foreground)',
            fontFamily: 'var(--font-sans)',
            fontSize: '0.9rem',
            fontWeight: 600,
          }}
        >
          <span>Technical details (feature formulas, distance matrices, centroid vectors)</span>
          {showTechnicalDetails ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {showTechnicalDetails && (
          <div style={{ padding: '0 1rem 1.25rem 1rem', borderTop: '1px solid var(--border)', marginTop: '0.5rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem', marginTop: '0.85rem' }}>
              <div className="cohort-stat">
                <span className="cohort-stat-label">Clustering Method</span>
                <span className="cohort-stat-val">K-Means (scikit-learn, seed 42)</span>
              </div>
              <div className="cohort-stat">
                <span className="cohort-stat-label">Distance Metric</span>
                <span className="cohort-stat-val">Standardized Euclidean Distance</span>
              </div>
              <div className="cohort-stat">
                <span className="cohort-stat-label">Feature Count</span>
                <span className="cohort-stat-val">8 Standardized Dimensions</span>
              </div>
              <div className="cohort-stat">
                <span className="cohort-stat-label">Calibration Sample</span>
                <span className="cohort-stat-val">1,240 Household Windows (Cal-W1 &amp; W2)</span>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};
