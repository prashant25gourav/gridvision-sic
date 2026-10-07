import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Users,
  AlertTriangle,
  Activity,
  ArrowRight,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from 'lucide-react';
import { LoadChart } from '../../charts/LoadChart';
import {
  fetchConsumerRankings,
  fetchConsumerProfile,
  type ConsumerRankingsData,
  type ConsumerProfileData,
} from '../../../services/api';
import type { DemandDataPoint } from '../../../types/energy';
import type { DashboardSection } from '../../../types/dashboard';
import './Workspaces.css';

interface ConsumerIntelligenceWorkspaceProps {
  initialTab?: 'rankings' | 'explorer';
  onNavigateSection?: (section: DashboardSection) => void;
  onQueryCopilot?: (query: string) => void;
}

export const ConsumerIntelligenceWorkspace: React.FC<ConsumerIntelligenceWorkspaceProps> = ({
  initialTab = 'rankings',
  onNavigateSection,
  onQueryCopilot,
}) => {
  const [activeTab, setActiveTab] = useState<'rankings' | 'explorer'>(initialTab);
  const [rankingsData, setRankingsData] = useState<ConsumerRankingsData | null>(null);
  const [rankingCategory, setRankingCategory] = useState<
    'by_consumption' | 'by_peak' | 'by_forecast_error' | 'by_anomalies' | 'by_instability' | 'by_load_factor'
  >('by_consumption');

  // Household Explorer state
  const [selectedId, setSelectedId] = useState<string>('MAC000045');
  const [selectedProfile, setSelectedProfile] = useState<ConsumerProfileData | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Needs Attention' | 'Moderate' | 'Stable'>('all');
  const [archetypeFilter, setArchetypeFilter] = useState<string>('all');

  const [isLoadingRankings, setIsLoadingRankings] = useState<boolean>(true);
  const [isLoadingProfile, setIsLoadingProfile] = useState<boolean>(false);
  const [showTechnicalDetails, setShowTechnicalDetails] = useState<boolean>(false);

  // 1. Fetch rankings on mount
  useEffect(() => {
    let isMounted = true;
    fetchConsumerRankings()
      .then((data) => {
        if (isMounted) {
          setRankingsData(data);
          if (data.all_consumers.length > 0) {
            setSelectedId(data.all_consumers[0].household_id);
          }
          setIsLoadingRankings(false);
        }
      })
      .catch((err) => {
        console.warn('Failed to load consumer rankings:', err);
        if (isMounted) setIsLoadingRankings(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Fetch full profile whenever selectedId changes
  useEffect(() => {
    if (!selectedId) return;
    let isMounted = true;
    setIsLoadingProfile(true);

    fetchConsumerProfile(selectedId)
      .then((prof) => {
        if (isMounted) {
          setSelectedProfile(prof);
          setIsLoadingProfile(false);
        }
      })
      .catch((err) => {
        console.warn(`Failed to load profile for ${selectedId}:`, err);
        if (isMounted) setIsLoadingProfile(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedId]);

  // Filtered consumers for the Explorer directory
  const filteredConsumers = useMemo(() => {
    if (!rankingsData) return [];
    return rankingsData.all_consumers.filter((c) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        c.household_id.toLowerCase().includes(q) ||
        c.acorn_grouped.toLowerCase().includes(q) ||
        c.cluster_label.toLowerCase().includes(q);

      const matchesStatus =
        statusFilter === 'all' || c.attention_status === statusFilter;

      const matchesArchetype =
        archetypeFilter === 'all' ||
        c.cluster_label.toLowerCase().includes(archetypeFilter.toLowerCase());

      return matchesSearch && matchesStatus && matchesArchetype;
    });
  }, [rankingsData, searchQuery, statusFilter, archetypeFilter]);

  // Current ranking items to display
  const currentRankings = useMemo(() => {
    if (!rankingsData) return [];
    return rankingsData.rankings[rankingCategory] || [];
  }, [rankingsData, rankingCategory]);

  // Handle clicking a consumer from rankings or explorer
  const handleSelectConsumer = (id: string) => {
    setSelectedId(id);
    setActiveTab('explorer');
  };

  // Convert profile diurnal_forecast to chart data
  const chartData: DemandDataPoint[] = useMemo(() => {
    if (!selectedProfile || selectedProfile.diurnal_forecast.length === 0) {
      return [];
    }
    return selectedProfile.diurnal_forecast.map((pt) => {
      const hr = Math.floor(pt.slot_index / 2);
      const isEveningPeak = hr >= 18 && hr <= 21;
      return {
        timestamp: pt.timestamp,
        hour: hr,
        label: `${hr.toString().padStart(2, '0')}:${pt.slot_index % 2 === 1 ? '30' : '00'}`,
        actualKw: pt.actual,
        baselineKw: pt.predicted_global,
        isPeak: isEveningPeak,
      };
    });
  }, [selectedProfile]);

  const summary = selectedProfile?.summary;

  return (
    <div className="workspace-container">
      {/* Workspace Header */}
      <header className="workspace-header">
        <div className="workspace-header-title-row">
          <h1 className="workspace-title">Consumer Intelligence</h1>
        </div>
        <p className="workspace-subtitle">
          Operational household intelligence: rank consumers by demand or risk, investigate individual load shapes, and understand why specific households require attention.
        </p>
      </header>

      {/* Cohort Health Summary Strip */}
      <section className="workspace-kpi-grid" aria-label="Consumer Health Breakdown">
        <div className="workspace-kpi-card">
          <div className="workspace-kpi-header">
            <span className="workspace-kpi-label">Monitored Cohort</span>
            <Users size={16} className="workspace-kpi-icon" />
          </div>
          <div className="workspace-kpi-value">
            {rankingsData?.summary.total_consumers ?? 620}
          </div>
          <p className="workspace-kpi-caption">
            Residential smart meters tracked continuously
          </p>
        </div>

        <div className="workspace-kpi-card">
          <div className="workspace-kpi-header">
            <span className="workspace-kpi-label">Needs Attention</span>
            <AlertTriangle size={16} className="workspace-kpi-icon" style={{ color: 'var(--accent-rose)' }} />
          </div>
          <div className="workspace-kpi-value" style={{ color: 'var(--accent-rose)' }}>
            {rankingsData?.summary.needs_attention_count ?? 98}
          </div>
          <p className="workspace-kpi-caption">
            Elevated forecast error, recent anomalies, or high volatility
          </p>
        </div>

        <div className="workspace-kpi-card">
          <div className="workspace-kpi-header">
            <span className="workspace-kpi-label">Moderate Risk</span>
            <Activity size={16} className="workspace-kpi-icon" style={{ color: 'var(--accent-amber)' }} />
          </div>
          <div className="workspace-kpi-value" style={{ color: 'var(--accent-amber)' }}>
            {rankingsData?.summary.moderate_count ?? 333}
          </div>
          <p className="workspace-kpi-caption">
            Standard residential variance within normal tolerance
          </p>
        </div>

        <div className="workspace-kpi-card">
          <div className="workspace-kpi-header">
            <span className="workspace-kpi-label">Stable / High Confidence</span>
            <ShieldCheck size={16} className="workspace-kpi-icon" style={{ color: 'var(--accent-emerald)' }} />
          </div>
          <div className="workspace-kpi-value" style={{ color: 'var(--accent-emerald)' }}>
            {rankingsData?.summary.stable_count ?? 189}
          </div>
          <p className="workspace-kpi-caption">
            Highly predictable load curves with minimal forecast error
          </p>
        </div>
      </section>

      {/* Main Workspace Navigation: Rankings vs Explorer */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem', flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={() => setActiveTab('rankings')}
          style={{
            padding: '0.45rem 1rem',
            fontSize: '0.88rem',
            fontWeight: activeTab === 'rankings' ? 600 : 500,
            borderRadius: 'var(--radius-sm)',
            border: `1px solid ${activeTab === 'rankings' ? 'var(--border-strong)' : 'transparent'}`,
            backgroundColor: activeTab === 'rankings' ? 'var(--surface-raised)' : 'transparent',
            color: activeTab === 'rankings' ? 'var(--foreground)' : 'var(--foreground-muted)',
            cursor: 'pointer',
          }}
        >
          Consumer Rankings Table
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('explorer')}
          style={{
            padding: '0.45rem 1rem',
            fontSize: '0.88rem',
            fontWeight: activeTab === 'explorer' ? 600 : 500,
            borderRadius: 'var(--radius-sm)',
            border: `1px solid ${activeTab === 'explorer' ? 'var(--border-strong)' : 'transparent'}`,
            backgroundColor: activeTab === 'explorer' ? 'var(--surface-raised)' : 'transparent',
            color: activeTab === 'explorer' ? 'var(--foreground)' : 'var(--foreground-muted)',
            cursor: 'pointer',
          }}
        >
          Household Explorer &amp; Detail ({selectedId})
        </button>
      </div>

      {/* TAB 1: CONSUMER RANKINGS */}
      {activeTab === 'rankings' && (
        <section className="workspace-card">
          <div className="workspace-card-header" style={{ flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h2 className="workspace-card-title">Utility Consumer Rankings</h2>
              <p className="workspace-card-subtitle">
                Prioritize households requiring operational attention. Click any row to inspect the household's full profile and 24-hour demand curve.
              </p>
            </div>

            {/* Ranking Criteria Switcher */}
            <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
              {[
                { id: 'by_consumption', label: 'Highest Load' },
                { id: 'by_peak', label: 'Highest Peak' },
                { id: 'by_forecast_error', label: 'Worst Forecast Error' },
                { id: 'by_anomalies', label: 'Most Anomalies' },
                { id: 'by_instability', label: 'Most Unstable' },
                { id: 'by_load_factor', label: 'Best Load Factor' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setRankingCategory(opt.id as any)}
                  style={{
                    padding: '0.35rem 0.65rem',
                    fontSize: '0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border)',
                    backgroundColor: rankingCategory === opt.id ? 'var(--surface-raised)' : 'transparent',
                    color: rankingCategory === opt.id ? 'var(--accent-emerald)' : 'var(--foreground-muted)',
                    cursor: 'pointer',
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ padding: '0 1rem 1rem 1rem', overflowX: 'auto' }}>
            {isLoadingRankings ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--foreground-muted)' }}>
                Loading consumer rankings...
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left', color: 'var(--foreground-subtle)' }}>
                  <th style={{ padding: '0.65rem 0.75rem' }}>Rank</th>
                  <th style={{ padding: '0.65rem 0.75rem' }}>Household ID</th>
                  <th style={{ padding: '0.65rem 0.75rem' }}>Demographic</th>
                  <th style={{ padding: '0.65rem 0.75rem' }}>Archetype</th>
                  <th style={{ padding: '0.65rem 0.75rem' }}>Mean Load</th>
                  <th style={{ padding: '0.65rem 0.75rem' }}>Peak Load</th>
                  <th style={{ padding: '0.65rem 0.75rem' }}>Forecast MAE</th>
                  <th style={{ padding: '0.65rem 0.75rem' }}>Anomalies</th>
                  <th style={{ padding: '0.65rem 0.75rem' }}>Status</th>
                  <th style={{ padding: '0.65rem 0.75rem' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {currentRankings.slice(0, 30).map((c, idx) => {
                  const isAttention = c.attention_status === 'Needs Attention';
                  const badgeColor = isAttention
                    ? 'var(--accent-rose)'
                    : c.attention_status === 'Moderate'
                    ? 'var(--accent-amber)'
                    : 'var(--accent-emerald)';

                  return (
                    <tr
                      key={c.household_id}
                      onClick={() => handleSelectConsumer(c.household_id)}
                      style={{
                        borderBottom: '1px solid var(--border)',
                        cursor: 'pointer',
                        transition: 'background-color 150ms ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--surface-raised)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <td style={{ padding: '0.65rem 0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--foreground-subtle)' }}>
                        #{idx + 1}
                      </td>
                      <td style={{ padding: '0.65rem 0.75rem', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                        {c.household_id}
                      </td>
                      <td style={{ padding: '0.65rem 0.75rem', color: 'var(--foreground-muted)' }}>
                        {c.acorn_grouped}
                      </td>
                      <td style={{ padding: '0.65rem 0.75rem' }}>
                        {c.cluster_label.split('/')[0].trim()}
                      </td>
                      <td style={{ padding: '0.65rem 0.75rem', fontFamily: 'var(--font-mono)' }}>
                        {c.mean_load.toFixed(3)} kW
                      </td>
                      <td style={{ padding: '0.65rem 0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--accent-amber)' }}>
                        {c.peak_load.toFixed(3)} kW
                      </td>
                      <td style={{ padding: '0.65rem 0.75rem', fontFamily: 'var(--font-mono)', color: c.forecast_mae > 0.15 ? 'var(--accent-rose)' : 'var(--foreground)' }}>
                        {c.forecast_mae.toFixed(3)} kW
                      </td>
                      <td style={{ padding: '0.65rem 0.75rem', fontFamily: 'var(--font-mono)' }}>
                        {c.anomaly_count > 0 ? (
                          <span style={{ color: 'var(--accent-rose)', fontWeight: 600 }}>
                            {c.anomaly_count} flags
                          </span>
                        ) : (
                          <span style={{ color: 'var(--foreground-subtle)' }}>0</span>
                        )}
                      </td>
                      <td style={{ padding: '0.65rem 0.75rem' }}>
                        <span
                          style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: '0.68rem',
                            fontWeight: 700,
                            padding: '0.15rem 0.5rem',
                            borderRadius: 'var(--radius-full)',
                            backgroundColor: `color-mix(in srgb, ${badgeColor} 15%, transparent)`,
                            color: badgeColor,
                          }}
                        >
                          {c.attention_status}
                        </span>
                      </td>
                      <td style={{ padding: '0.65rem 0.75rem' }}>
                        <span style={{ fontSize: '0.78rem', color: 'var(--accent-emerald)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          Inspect <ArrowRight size={12} />
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            )}
          </div>
        </section>
      )}

      {/* TAB 2: HOUSEHOLD EXPLORER & DETAIL */}
      {activeTab === 'explorer' && (
        <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '1.5rem', alignItems: 'start' }}>
          {/* Left Column: Search & Meter Directory */}
          <div className="workspace-card" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--foreground)' }}>
                Household Directory
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--accent-emerald)' }}>
                {filteredConsumers.length} Meters
              </span>
            </div>

            {/* Search Input */}
            <div style={{ position: 'relative', marginBottom: '0.85rem' }}>
              <Search size={15} style={{ position: 'absolute', left: '10px', top: '11px', color: 'var(--foreground-subtle)' }} />
              <input
                type="text"
                placeholder="Search meter ID, demographic..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="text-input"
                style={{
                  paddingLeft: '34px',
                  paddingTop: '0.5rem',
                  paddingBottom: '0.5rem',
                  fontSize: '0.82rem',
                }}
              />
            </div>

            {/* Status Filter */}
            <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginBottom: '0.65rem' }}>
              {(['all', 'Needs Attention', 'Moderate', 'Stable'] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  style={{
                    padding: '0.25rem 0.55rem',
                    fontSize: '0.72rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border)',
                    backgroundColor: statusFilter === st ? 'var(--surface-raised)' : 'transparent',
                    color: statusFilter === st ? 'var(--foreground)' : 'var(--foreground-muted)',
                    cursor: 'pointer',
                  }}
                >
                  {st === 'all' ? 'All Status' : st}
                </button>
              ))}
            </div>

            {/* Archetype Filter */}
            <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginBottom: '0.85rem' }}>
              {['all', 'Evening', 'Baseload', 'Daytime', 'Dual'].map((arch) => (
                <button
                  key={arch}
                  type="button"
                  onClick={() => setArchetypeFilter(arch)}
                  style={{
                    padding: '0.2rem 0.5rem',
                    fontSize: '0.7rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border)',
                    backgroundColor: archetypeFilter === arch ? 'var(--surface-raised)' : 'transparent',
                    color: archetypeFilter === arch ? 'var(--accent-emerald)' : 'var(--foreground-subtle)',
                    cursor: 'pointer',
                  }}
                >
                  {arch === 'all' ? 'All Archetypes' : arch}
                </button>
              ))}
            </div>

            {/* Scrollable Directory List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', maxHeight: '560px', overflowY: 'auto' }}>
              {filteredConsumers.slice(0, 80).map((c) => {
                const isSelected = c.household_id === selectedId;
                const isAttn = c.attention_status === 'Needs Attention';
                const bCol = isAttn
                  ? 'var(--accent-rose)'
                  : c.attention_status === 'Moderate'
                  ? 'var(--accent-amber)'
                  : 'var(--accent-emerald)';

                return (
                  <div
                    key={c.household_id}
                    onClick={() => setSelectedId(c.household_id)}
                    style={{
                      padding: '0.7rem 0.85rem',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: isSelected ? 'var(--surface-raised)' : 'transparent',
                      border: `1px solid ${isSelected ? 'var(--border-strong)' : 'transparent'}`,
                      cursor: 'pointer',
                      transition: 'all 150ms ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', fontWeight: 600, color: isSelected ? 'var(--foreground)' : 'var(--foreground-muted)' }}>
                        {c.household_id}
                      </span>
                      <span
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          padding: '0.15rem 0.45rem',
                          borderRadius: 'var(--radius-full)',
                          backgroundColor: `color-mix(in srgb, ${bCol} 15%, transparent)`,
                          color: bCol,
                        }}
                      >
                        {c.attention_status}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--foreground-subtle)' }}>
                      <span>{c.cluster_label.split('/')[0].trim()}</span>
                      <span>{c.mean_load.toFixed(2)} kW avg</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Full Household Profile */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Header & Status Card */}
            <div className="workspace-card" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '0.35rem' }}>
                    <h2 style={{ fontFamily: 'var(--font-mono)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--foreground)', margin: 0 }}>
                      Household {selectedId}
                    </h2>
                    <span
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        padding: '0.2rem 0.65rem',
                        borderRadius: 'var(--radius-full)',
                        backgroundColor:
                          summary?.attention_status === 'Needs Attention'
                            ? 'color-mix(in srgb, var(--accent-rose) 15%, transparent)'
                            : 'color-mix(in srgb, var(--accent-emerald) 15%, transparent)',
                        color:
                          summary?.attention_status === 'Needs Attention'
                            ? 'var(--accent-rose)'
                            : 'var(--accent-emerald)',
                      }}
                    >
                      {summary?.attention_status || 'Normal Pattern'}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.88rem', color: 'var(--foreground-muted)' }}>
                    Demographic Segment: <strong style={{ color: 'var(--foreground)' }}>{selectedProfile?.acorn_grouped || 'Stratified Residential'}</strong> &bull; Archetype: <strong style={{ color: 'var(--accent-emerald)' }}>{summary?.cluster_label || 'Evening Peaker'}</strong>
                  </div>
                </div>

                {/* Copilot Action Button */}
                <button
                  type="button"
                  className="workspace-link-btn"
                  onClick={() => {
                    if (onQueryCopilot) {
                      onQueryCopilot(`Explain household ${selectedId}'s consumption pattern and why it is flagged.`);
                    } else if (onNavigateSection) {
                      onNavigateSection('copilot');
                    }
                  }}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.45rem 0.85rem' }}
                >
                  <Sparkles size={14} />
                  <span>Ask Copilot About This Household</span>
                </button>
              </div>

              {/* Consumption Summary Metrics Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.85rem', padding: '1rem', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--surface-raised)', border: '1px solid var(--border)' }}>
                <div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--foreground-subtle)', textTransform: 'uppercase' }}>
                    Average Load
                  </span>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.15rem', fontWeight: 700, color: 'var(--foreground)', marginTop: '0.15rem' }}>
                    {(summary?.mean_load_kw ?? 0.24).toFixed(3)} kW
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--foreground-subtle)', textTransform: 'uppercase' }}>
                    Peak Load
                  </span>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.15rem', fontWeight: 700, color: 'var(--accent-amber)', marginTop: '0.15rem' }}>
                    {(summary?.peak_load_kw ?? 0.42).toFixed(3)} kW
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--foreground-subtle)', textTransform: 'uppercase' }}>
                    Load Factor
                  </span>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.15rem', fontWeight: 700, color: 'var(--foreground)', marginTop: '0.15rem' }}>
                    {(summary?.load_factor_pct ?? 57.1).toFixed(1)}%
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--foreground-subtle)', textTransform: 'uppercase' }}>
                    Peak-to-Average
                  </span>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.15rem', fontWeight: 700, color: 'var(--foreground)', marginTop: '0.15rem' }}>
                    {(summary?.peak_to_average_ratio ?? 1.75).toFixed(2)}x
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--foreground-subtle)', textTransform: 'uppercase' }}>
                    Forecast MAE
                  </span>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.15rem', fontWeight: 700, color: 'var(--accent-emerald)', marginTop: '0.15rem' }}>
                    {(summary?.forecast_mae_kw ?? 0.081).toFixed(3)} kW
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--foreground-subtle)', textTransform: 'uppercase' }}>
                    Anomalous Periods
                  </span>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.15rem', fontWeight: 700, color: (summary?.anomaly_count ?? 0) > 0 ? 'var(--accent-rose)' : 'var(--foreground)', marginTop: '0.15rem' }}>
                    {summary?.anomaly_count ?? 0}
                  </div>
                </div>
              </div>

              {/* Grounded Operational Explanation Card */}
              <div style={{ marginTop: '1rem', padding: '1rem 1.15rem', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>
                <span style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--foreground-subtle)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Why is this household flagged?
                </span>
                <p style={{ margin: '0.35rem 0 0.5rem 0', fontSize: '0.86rem', color: 'var(--foreground)', lineHeight: 1.5 }}>
                  {selectedProfile?.explanation}
                </p>
                {summary && summary.attention_reasons && summary.attention_reasons.length > 0 && (
                  <ul style={{ margin: '0.35rem 0 0 1.25rem', padding: 0, fontSize: '0.82rem', color: 'var(--foreground-muted)' }}>
                    {summary.attention_reasons.map((r, i) => (
                      <li key={i} style={{ marginBottom: '0.2rem' }}>{r}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* 24-Hour Diurnal Demand Curve & Forecast */}
            <div className="workspace-card">
              <div className="workspace-card-header">
                <div>
                  <h3 className="workspace-card-title">24-Hour Load Curve &amp; Day-Ahead Forecast</h3>
                  <p className="workspace-card-subtitle">
                    Recorded half-hour electricity demand (kW) compared with day-ahead predictions across 48 time intervals.
                  </p>
                </div>
              </div>
              <div className="workspace-chart-wrapper">
                {isLoadingProfile ? (
                  <div style={{ padding: '3.5rem', textAlign: 'center', color: 'var(--foreground-muted)' }}>
                    Loading smart meter telemetry...
                  </div>
                ) : (
                  <LoadChart data={chartData} height={260} />
                )}
              </div>
            </div>

            {/* Behavioral Archetype History across Observation Windows */}
            {selectedProfile && selectedProfile.behavioral_history && selectedProfile.behavioral_history.length > 0 && (
              <div className="workspace-card">
                <div className="workspace-card-header">
                  <div>
                    <h3 className="workspace-card-title">Longitudinal Behavioral Trajectory</h3>
                    <p className="workspace-card-subtitle">
                      Tracking assigned consumption archetypes across consecutive 56-day observation windows.
                    </p>
                  </div>
                  <ShieldCheck size={16} style={{ color: 'var(--accent-emerald)' }} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(selectedProfile.behavioral_history.length, 14)}, 1fr)`, gap: '0.5rem', overflowX: 'auto', padding: '0.5rem 1rem 1rem 1rem' }}>
                  {selectedProfile.behavioral_history.map((t) => {
                    const cColor =
                      t.cluster_id === 0
                        ? 'var(--accent-emerald)'
                        : t.cluster_id === 1
                        ? 'var(--accent-amber)'
                        : t.cluster_id === 2
                        ? 'var(--accent-blue)'
                        : 'var(--accent-rose)';

                    return (
                      <div
                        key={t.window_id}
                        style={{
                          padding: '0.65rem 0.4rem',
                          borderRadius: 'var(--radius-sm)',
                          backgroundColor: 'var(--surface-raised)',
                          border: '1px solid var(--border)',
                          textAlign: 'center',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.35rem',
                        }}
                      >
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--foreground-subtle)' }}>
                          {t.window_id}
                        </span>
                        <div
                          style={{
                            width: '100%',
                            height: '4px',
                            backgroundColor: cColor,
                            borderRadius: '2px',
                          }}
                        />
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.76rem', fontWeight: 700, color: 'var(--foreground)' }}>
                          C{t.cluster_id}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Progressive Disclosure: Technical Details Accordion */}
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
          <span>Technical details (Clustering parameters, Hungarian alignment, instability metrics)</span>
          {showTechnicalDetails ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {showTechnicalDetails && (
          <div style={{ padding: '0 1rem 1.25rem 1rem', borderTop: '1px solid var(--border)', marginTop: '0.5rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', margin: '0.85rem 0 1rem 0' }}>
              <div className="cohort-stat">
                <span className="cohort-stat-label">Longitudinal Instability</span>
                <span className="cohort-stat-val">{(summary?.instability_score ?? 0.15).toFixed(3)}</span>
              </div>
              <div className="cohort-stat">
                <span className="cohort-stat-label">Volatility CV</span>
                <span className="cohort-stat-val">{(summary?.volatility_cv ?? 0.78).toFixed(3)}</span>
              </div>
              <div className="cohort-stat">
                <span className="cohort-stat-label">Clustering Methodology</span>
                <span className="cohort-stat-val">Hungarian Aligned K-Means (K=4)</span>
              </div>
              <div className="cohort-stat">
                <span className="cohort-stat-label">Forecast Engine</span>
                <span className="cohort-stat-val">LightGBM GBDT (Global Model)</span>
              </div>
            </div>
            <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--foreground-muted)', lineHeight: 1.5 }}>
              Household instability measures the fraction of consecutive observation windows where a household switches Hungarian-aligned behavioral clusters.
              Consumption volatility CV measures coefficient of variation across historical baseline windows.
            </p>
          </div>
        )}
      </section>
    </div>
  );
};
