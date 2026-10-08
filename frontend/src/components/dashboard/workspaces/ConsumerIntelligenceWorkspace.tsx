import React, { useState, useEffect, useMemo } from 'react';
import { X, ArrowRight, Search } from 'lucide-react';
import {
  fetchConsumerRankings,
  fetchConsumerProfile,
  fetchSegmentationOverview,
  type ConsumerRankingsData,
  type ConsumerProfileData,
  type SegmentationOverviewData,
  type ClusterDetail,
} from '../../../services/api';
import './Workspaces.css';

interface ConsumerIntelligenceWorkspaceProps {
  initialTab?: 'rankings' | 'load_factor' | 'p2a' | 'clusters' | 'profiles' | 'explorer';
  onNavigateSection?: (section: any) => void;
  onNavigateOverview?: (anchor?: string) => void;
  onQueryCopilot?: (query: string) => void;
}

type TabType = 'rankings' | 'load_factor' | 'p2a' | 'clusters' | 'profiles';

const AVAILABLE_WINDOWS = [
  { id: 'all', label: 'All Windows' },
  { id: 'W01', label: 'W01' },
  { id: 'W02', label: 'W02' },
  { id: 'W03', label: 'W03' },
  { id: 'W04', label: 'W04' },
  { id: 'W05', label: 'W05' },
  { id: 'W06', label: 'W06' },
  { id: 'W07', label: 'W07' },
  { id: 'W08', label: 'W08' },
  { id: 'W09', label: 'W09' },
  { id: 'W10', label: 'W10' },
  { id: 'W11', label: 'W11' },
  { id: 'W12', label: 'W12' },
  { id: 'W13', label: 'W13' },
  { id: 'W14', label: 'W14' },
];

const CLUSTER_COLORS = [
  '#f59e0b', // Cluster 1: Evening Peaker (amber)
  '#06b6d4', // Cluster 2: Baseload Steady (cyan)
  '#10b981', // Cluster 3: Daytime Active (emerald)
  '#a855f7', // Cluster 4: Dual Peaker (purple)
];

// Formatting helper: "MAC000045" -> "Consumer 045"
function formatConsumerId(rawId: string): string {
  if (!rawId) return '';
  const match = rawId.match(/MAC0*(\d+)/i);
  if (match) {
    return `Consumer ${match[1].padStart(3, '0')}`;
  }
  return `Consumer ${rawId}`;
}

export const ConsumerIntelligenceWorkspace: React.FC<ConsumerIntelligenceWorkspaceProps> = ({
  initialTab = 'rankings',
  onNavigateOverview,
}) => {
  const [selectedWindow, setSelectedWindow] = useState<string>('W14');
  const [activeTab, setActiveTab] = useState<TabType>(
    initialTab === 'explorer' ? 'rankings' : (initialTab as TabType)
  );

  // Data states
  const [rankingsData, setRankingsData] = useState<ConsumerRankingsData | null>(null);
  const [segmentationData, setSegmentationData] = useState<SegmentationOverviewData | null>(null);
  const [isLoadingRankings, setIsLoadingRankings] = useState<boolean>(true);
  const [isLoadingSegmentation, setIsLoadingSegmentation] = useState<boolean>(true);

  // Sorting / display states
  const [rankingSortMode, setRankingSortMode] = useState<'avg_demand' | 'peak_demand'>('avg_demand');
  const [loadFactorSortMode, setLoadFactorSortMode] = useState<'highest' | 'lowest'>('highest');
  const [visibleCount, setVisibleCount] = useState<number>(30);

  // Individual Consumer Detail Modal / Drawer state
  const [detailConsumerId, setDetailConsumerId] = useState<string | null>(null);
  const [detailProfile, setDetailProfile] = useState<ConsumerProfileData | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState<boolean>(false);

  // Cluster chart active filter (null = all clusters)
  const [activeClusterFilter, setActiveClusterFilter] = useState<number | null>(null);

  // 1. Fetch rankings and segmentation data whenever selectedWindow changes
  useEffect(() => {
    let isMounted = true;
    setIsLoadingRankings(true);
    setIsLoadingSegmentation(true);

    fetchConsumerRankings(selectedWindow)
      .then((res) => {
        if (!isMounted) return;
        setRankingsData(res);
        setIsLoadingRankings(false);
      })
      .catch((err) => {
        console.warn('Failed to load consumer rankings:', err);
        if (isMounted) setIsLoadingRankings(false);
      });

    fetchSegmentationOverview(selectedWindow)
      .then((res) => {
        if (!isMounted) return;
        setSegmentationData(res);
        setIsLoadingSegmentation(false);
      })
      .catch((err) => {
        console.warn('Failed to load segmentation overview:', err);
        if (isMounted) setIsLoadingSegmentation(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedWindow]);

  // 2. Fetch consumer profile when detailConsumerId or selectedWindow changes
  useEffect(() => {
    if (!detailConsumerId) {
      setDetailProfile(null);
      return;
    }
    let isMounted = true;
    setIsLoadingDetail(true);

    fetchConsumerProfile(detailConsumerId, selectedWindow)
      .then((res) => {
        if (!isMounted) return;
        setDetailProfile(res);
        setIsLoadingDetail(false);
      })
      .catch((err) => {
        console.warn(`Failed to load profile for ${detailConsumerId}:`, err);
        if (isMounted) setIsLoadingDetail(false);
      });

    return () => {
      isMounted = false;
    };
  }, [detailConsumerId, selectedWindow]);

  // Reset pagination limit when tab or window changes
  useEffect(() => {
    setVisibleCount(30);
  }, [activeTab, selectedWindow]);

  // Tab 1: Consumer Ranking list
  const consumerRankingList = useMemo(() => {
    if (!rankingsData) return [];
    const list = [...rankingsData.all_consumers];
    if (rankingSortMode === 'peak_demand') {
      return list.sort((a, b) => b.peak_load - a.peak_load);
    }
    return list.sort((a, b) => b.mean_load - a.mean_load);
  }, [rankingsData, rankingSortMode]);

  // Tab 2: Load Factor list
  const loadFactorList = useMemo(() => {
    if (!rankingsData) return [];
    const list = [...rankingsData.all_consumers];
    if (loadFactorSortMode === 'lowest') {
      return list.sort((a, b) => a.load_factor - b.load_factor);
    }
    return list.sort((a, b) => b.load_factor - a.load_factor);
  }, [rankingsData, loadFactorSortMode]);

  // Tab 3: Peak-to-Average list
  const p2aList = useMemo(() => {
    if (!rankingsData) return [];
    const list = [...rankingsData.all_consumers];
    return list.sort((a, b) => b.peak_to_average_ratio - a.peak_to_average_ratio);
  }, [rankingsData]);

  // Top items for Peak-to-Average distribution bar chart
  const topP2AItems = useMemo(() => {
    return p2aList.slice(0, 8);
  }, [p2aList]);

  // Max P2A for chart scale
  const maxP2A = useMemo(() => {
    if (topP2AItems.length === 0) return 10;
    return Math.max(...topP2AItems.map((c) => c.peak_to_average_ratio)) * 1.05;
  }, [topP2AItems]);

  // Clusters list
  const clustersList: ClusterDetail[] = useMemo(() => {
    return segmentationData?.clusters || [];
  }, [segmentationData]);

  // Cluster Daily Profiles
  const clusterDailyProfiles = useMemo(() => {
    return segmentationData?.daily_profiles || [];
  }, [segmentationData]);

  // Tab 5: Consumer Profiles directory (all consumers ordered by meter ID ascending)
  const consumerProfilesList = useMemo(() => {
    if (!rankingsData) return [];
    return [...rankingsData.all_consumers].sort((a, b) =>
      a.household_id.localeCompare(b.household_id, undefined, { numeric: true, sensitivity: 'base' })
    );
  }, [rankingsData]);

  // Consumer Profiles search state
  const [consumerSearchTerm, setConsumerSearchTerm] = useState<string>('');

  // Filtered Consumer Profiles based on search term
  const filteredConsumerProfiles = useMemo(() => {
    if (!consumerSearchTerm.trim()) return consumerProfilesList;
    const term = consumerSearchTerm.trim().toLowerCase();
    return consumerProfilesList.filter((item) => {
      const idMatch = item.household_id.toLowerCase().includes(term);
      const formattedMatch = formatConsumerId(item.household_id).toLowerCase().includes(term);
      return idMatch || formattedMatch;
    });
  }, [consumerProfilesList, consumerSearchTerm]);

  return (
    <div className="workspace-container">
      {/* Workspace Header */}
      <header className="workspace-header">
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div>
            <div className="workspace-header-title-row">
              <h1 className="workspace-title">Consumer Intelligence</h1>
            </div>
            <p className="workspace-subtitle">
              Compare consumer demand and load profiles.
            </p>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              flexWrap: 'wrap',
            }}
          >
            {/* Observation Window Selector */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                paddingRight: '0.25rem',
              }}
            >
              <label
                htmlFor="consumer-intel-window-selector"
                style={{
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: 'var(--foreground-muted)',
                  letterSpacing: '0.02em',
                  whiteSpace: 'nowrap',
                }}
              >
                Observation Window
              </label>
              <select
                id="consumer-intel-window-selector"
                value={selectedWindow}
                onChange={(e) => setSelectedWindow(e.target.value)}
                style={{
                  backgroundColor: 'var(--surface-raised)',
                  color: 'var(--foreground)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.38rem 0.85rem',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  outline: 'none',
                  minWidth: '145px',
                }}
              >
                {AVAILABLE_WINDOWS.map((win) => (
                  <option key={win.id} value={win.id}>
                    {win.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Consistent top-right Overview link matching AI Copilot / Forecast */}
            {onNavigateOverview && (
              <button
                type="button"
                className="workspace-link-btn"
                onClick={() => onNavigateOverview('overview-segmentation')}
                style={{ fontSize: '0.82rem', padding: '0.35rem 0.65rem' }}
                title="Learn how consumer intelligence and segmentation work on the Overview page"
              >
                <span>Learn about consumer intelligence</span>
                <ArrowRight size={14} />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Primary Tab Navigation */}
      <div
        role="tablist"
        aria-label="Consumer Intelligence Views"
        style={{
          display: 'flex',
          gap: '0.5rem',
          borderBottom: '1px solid var(--border)',
          paddingBottom: '0.85rem',
          flexWrap: 'wrap',
          marginTop: '0.25rem',
        }}
      >
        {[
          { id: 'rankings', label: 'Consumer Ranking' },
          { id: 'load_factor', label: 'Load Factor' },
          { id: 'p2a', label: 'Peak-to-Average' },
          { id: 'clusters', label: 'Consumer Clusters' },
          { id: 'profiles', label: 'Consumer Profiles' },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              type="button"
              onClick={() => setActiveTab(tab.id as TabType)}
              style={{
                padding: '0.5rem 1rem',
                fontSize: '0.82rem',
                fontWeight: isActive ? 700 : 500,
                borderRadius: 'var(--radius-sm)',
                border: isActive
                  ? '1px solid var(--accent-emerald)'
                  : '1px solid var(--border)',
                backgroundColor: isActive
                  ? 'color-mix(in srgb, var(--accent-emerald) 18%, var(--surface))'
                  : 'var(--surface)',
                color: isActive ? 'var(--foreground)' : 'var(--foreground-muted)',
                cursor: 'pointer',
                transition: 'all 150ms ease',
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: CONSUMER RANKING */}
      {activeTab === 'rankings' && (
        <section className="workspace-card" aria-label="Consumer Ranking by Consumption">
          <div
            className="workspace-card-header"
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '0.75rem',
            }}
          >
            <div>
              <h2 className="workspace-card-title">Consumer Ranking by Consumption</h2>
              <p className="workspace-card-subtitle">Consumers ranked by average demand.</p>
            </div>

            {/* Ranking Mode Switcher */}
            <div
              style={{
                display: 'flex',
                gap: '0.35rem',
                backgroundColor: 'var(--surface-raised)',
                padding: '0.2rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border)',
              }}
            >
              <button
                type="button"
                onClick={() => setRankingSortMode('avg_demand')}
                style={{
                  padding: '0.35rem 0.75rem',
                  fontSize: '0.78rem',
                  fontWeight: rankingSortMode === 'avg_demand' ? 700 : 500,
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  backgroundColor:
                    rankingSortMode === 'avg_demand' ? 'var(--surface)' : 'transparent',
                  color:
                    rankingSortMode === 'avg_demand'
                      ? 'var(--accent-emerald)'
                      : 'var(--foreground-muted)',
                  cursor: 'pointer',
                }}
              >
                Highest Average Demand
              </button>
              <button
                type="button"
                onClick={() => setRankingSortMode('peak_demand')}
                style={{
                  padding: '0.35rem 0.75rem',
                  fontSize: '0.78rem',
                  fontWeight: rankingSortMode === 'peak_demand' ? 700 : 500,
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  backgroundColor:
                    rankingSortMode === 'peak_demand' ? 'var(--surface)' : 'transparent',
                  color:
                    rankingSortMode === 'peak_demand'
                      ? 'var(--accent-amber)'
                      : 'var(--foreground-muted)',
                  cursor: 'pointer',
                }}
              >
                Highest Peak Demand
              </button>
            </div>
          </div>

          {/* Ranking Table */}
          {isLoadingRankings ? (
            <div style={{ padding: '3.5rem', textAlign: 'center', color: 'var(--foreground-muted)' }}>
              Loading consumer rankings...
            </div>
          ) : consumerRankingList.length === 0 ? (
            <div style={{ padding: '3.5rem', textAlign: 'center', color: 'var(--foreground-muted)' }}>
              No consumer observations available for {selectedWindow}.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontSize: '0.84rem',
                  textAlign: 'left',
                }}
              >
                <thead>
                  <tr
                    style={{
                      borderBottom: '1px solid var(--border)',
                      color: 'var(--foreground-subtle)',
                      fontSize: '0.75rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}
                  >
                    <th style={{ padding: '0.75rem 1rem', width: '80px' }}>Rank</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Consumer</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Average Demand</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Peak Demand</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Cluster</th>
                  </tr>
                </thead>
                <tbody>
                  {consumerRankingList.slice(0, visibleCount).map((item, idx) => (
                    <tr
                      key={item.household_id}
                      onClick={() => setDetailConsumerId(item.household_id)}
                      style={{
                        borderBottom: '1px solid var(--border-subtle, rgba(255,255,255,0.04))',
                        cursor: 'pointer',
                        transition: 'background-color 120ms ease',
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.backgroundColor = 'var(--surface-raised)')
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.backgroundColor = 'transparent')
                      }
                      title={`Click to inspect 24-hour profile for ${formatConsumerId(item.household_id)}`}
                    >
                      <td
                        style={{
                          padding: '0.75rem 1rem',
                          fontFamily: 'var(--font-mono)',
                          color: 'var(--foreground-subtle)',
                          fontWeight: 600,
                        }}
                      >
                        #{idx + 1}
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <div style={{ fontWeight: 600, color: 'var(--foreground)' }}>
                          {formatConsumerId(item.household_id)}
                        </div>
                        <span
                          style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: '0.7rem',
                            color: 'var(--foreground-subtle)',
                          }}
                        >
                          {item.household_id}
                        </span>
                      </td>
                      <td
                        style={{
                          padding: '0.75rem 1rem',
                          textAlign: 'right',
                          fontFamily: 'var(--font-mono)',
                          fontWeight: 600,
                          color: 'var(--foreground)',
                        }}
                      >
                        {item.mean_load.toFixed(3)} kW
                      </td>
                      <td
                        style={{
                          padding: '0.75rem 1rem',
                          textAlign: 'right',
                          fontFamily: 'var(--font-mono)',
                          fontWeight: 600,
                          color: 'var(--accent-amber)',
                        }}
                      >
                        {item.peak_load.toFixed(3)} kW
                      </td>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                        <span
                          style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: '0.74rem',
                            padding: '0.2rem 0.55rem',
                            borderRadius: 'var(--radius-sm)',
                            backgroundColor: 'var(--surface-raised)',
                            border: '1px solid var(--border)',
                            color: CLUSTER_COLORS[item.cluster_id % 4],
                            fontWeight: 600,
                          }}
                        >
                          Cluster {item.cluster_id + 1}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Show More Pagination */}
              {consumerRankingList.length > visibleCount && (
                <div style={{ padding: '1rem', textAlign: 'center', borderTop: '1px solid var(--border)' }}>
                  <button
                    type="button"
                    onClick={() => setVisibleCount((c) => c + 30)}
                    style={{
                      padding: '0.45rem 1.25rem',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      backgroundColor: 'var(--surface-raised)',
                      color: 'var(--foreground)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer',
                    }}
                  >
                    Show More ({visibleCount} of {consumerRankingList.length} shown)
                  </button>
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {/* TAB 2: LOAD FACTOR */}
      {activeTab === 'load_factor' && (
        <section className="workspace-card" aria-label="Load Factor">
          <div
            className="workspace-card-header"
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '0.75rem',
            }}
          >
            <div>
              <h2 className="workspace-card-title">Load Factor</h2>
              <p className="workspace-card-subtitle">Average demand relative to peak demand.</p>
            </div>

            {/* Sort Switcher */}
            <div
              style={{
                display: 'flex',
                gap: '0.35rem',
                backgroundColor: 'var(--surface-raised)',
                padding: '0.2rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border)',
              }}
            >
              <button
                type="button"
                onClick={() => setLoadFactorSortMode('highest')}
                style={{
                  padding: '0.35rem 0.75rem',
                  fontSize: '0.78rem',
                  fontWeight: loadFactorSortMode === 'highest' ? 700 : 500,
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  backgroundColor:
                    loadFactorSortMode === 'highest' ? 'var(--surface)' : 'transparent',
                  color:
                    loadFactorSortMode === 'highest'
                      ? 'var(--accent-emerald)'
                      : 'var(--foreground-muted)',
                  cursor: 'pointer',
                }}
              >
                Highest Load Factor
              </button>
              <button
                type="button"
                onClick={() => setLoadFactorSortMode('lowest')}
                style={{
                  padding: '0.35rem 0.75rem',
                  fontSize: '0.78rem',
                  fontWeight: loadFactorSortMode === 'lowest' ? 700 : 500,
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  backgroundColor:
                    loadFactorSortMode === 'lowest' ? 'var(--surface)' : 'transparent',
                  color:
                    loadFactorSortMode === 'lowest'
                      ? 'var(--accent-amber)'
                      : 'var(--foreground-muted)',
                  cursor: 'pointer',
                }}
              >
                Lowest Load Factor
              </button>
            </div>
          </div>

          {/* Load Factor Table */}
          {isLoadingRankings ? (
            <div style={{ padding: '3.5rem', textAlign: 'center', color: 'var(--foreground-muted)' }}>
              Loading load factor values...
            </div>
          ) : loadFactorList.length === 0 ? (
            <div style={{ padding: '3.5rem', textAlign: 'center', color: 'var(--foreground-muted)' }}>
              No load factor observations available for {selectedWindow}.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontSize: '0.84rem',
                  textAlign: 'left',
                }}
              >
                <thead>
                  <tr
                    style={{
                      borderBottom: '1px solid var(--border)',
                      color: 'var(--foreground-subtle)',
                      fontSize: '0.75rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}
                  >
                    <th style={{ padding: '0.75rem 1rem', width: '80px' }}>Rank</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Consumer</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Average Demand</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Peak Demand</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Load Factor</th>
                  </tr>
                </thead>
                <tbody>
                  {loadFactorList.slice(0, visibleCount).map((item, idx) => (
                    <tr
                      key={item.household_id}
                      onClick={() => setDetailConsumerId(item.household_id)}
                      style={{
                        borderBottom: '1px solid var(--border-subtle, rgba(255,255,255,0.04))',
                        cursor: 'pointer',
                        transition: 'background-color 120ms ease',
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.backgroundColor = 'var(--surface-raised)')
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.backgroundColor = 'transparent')
                      }
                      title={`Click to inspect profile for ${formatConsumerId(item.household_id)}`}
                    >
                      <td
                        style={{
                          padding: '0.75rem 1rem',
                          fontFamily: 'var(--font-mono)',
                          color: 'var(--foreground-subtle)',
                          fontWeight: 600,
                        }}
                      >
                        #{idx + 1}
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <div style={{ fontWeight: 600, color: 'var(--foreground)' }}>
                          {formatConsumerId(item.household_id)}
                        </div>
                        <span
                          style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: '0.7rem',
                            color: 'var(--foreground-subtle)',
                          }}
                        >
                          {item.household_id}
                        </span>
                      </td>
                      <td
                        style={{
                          padding: '0.75rem 1rem',
                          textAlign: 'right',
                          fontFamily: 'var(--font-mono)',
                          color: 'var(--foreground)',
                          fontWeight: 600,
                        }}
                      >
                        {item.mean_load.toFixed(3)} kW
                      </td>
                      <td
                        style={{
                          padding: '0.75rem 1rem',
                          textAlign: 'right',
                          fontFamily: 'var(--font-mono)',
                          color: 'var(--accent-amber)',
                          fontWeight: 600,
                        }}
                      >
                        {item.peak_load.toFixed(3)} kW
                      </td>
                      <td
                        style={{
                          padding: '0.75rem 1rem',
                          textAlign: 'right',
                          fontFamily: 'var(--font-mono)',
                          fontWeight: 700,
                          color: 'var(--accent-emerald)',
                        }}
                      >
                        {item.load_factor.toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Show More Pagination */}
              {loadFactorList.length > visibleCount && (
                <div style={{ padding: '1rem', textAlign: 'center', borderTop: '1px solid var(--border)' }}>
                  <button
                    type="button"
                    onClick={() => setVisibleCount((c) => c + 30)}
                    style={{
                      padding: '0.45rem 1.25rem',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      backgroundColor: 'var(--surface-raised)',
                      color: 'var(--foreground)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer',
                    }}
                  >
                    Show More ({visibleCount} of {loadFactorList.length} shown)
                  </button>
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {/* TAB 3: PEAK-TO-AVERAGE */}
      {activeTab === 'p2a' && (
        <section className="workspace-card" aria-label="Peak-to-Average Ratio">
          <div className="workspace-card-header">
            <div>
              <h2 className="workspace-card-title">Peak-to-Average Ratio</h2>
              <p className="workspace-card-subtitle">Compare peak demand with average demand.</p>
            </div>
          </div>

          {/* Compact Top Distribution Horizontal Bar Visualization */}
          {topP2AItems.length > 0 && (
            <div
              style={{
                backgroundColor: 'var(--surface-raised)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                padding: '1.25rem',
              }}
            >
              <div
                style={{
                  fontSize: '0.76rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  color: 'var(--foreground-subtle)',
                  letterSpacing: '0.05em',
                  marginBottom: '1rem',
                }}
              >
                Highest Peak-to-Average Multipliers in {selectedWindow}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
                {topP2AItems.map((item, i) => {
                  const widthPct = Math.min(100, Math.max(8, (item.peak_to_average_ratio / maxP2A) * 100));
                  return (
                    <div
                      key={item.household_id}
                      onClick={() => setDetailConsumerId(item.household_id)}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '130px 1fr 75px',
                        alignItems: 'center',
                        gap: '0.85rem',
                        cursor: 'pointer',
                      }}
                      title={`Click to view ${formatConsumerId(item.household_id)}`}
                    >
                      <span
                        style={{
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          color: 'var(--foreground)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {formatConsumerId(item.household_id)}
                      </span>
                      <div
                        style={{
                          height: '14px',
                          backgroundColor: 'var(--surface)',
                          borderRadius: 'var(--radius-sm)',
                          overflow: 'hidden',
                          border: '1px solid var(--border)',
                        }}
                      >
                        <div
                          style={{
                            height: '100%',
                            width: `${widthPct}%`,
                            backgroundColor: i === 0 ? 'var(--accent-amber)' : 'var(--accent-emerald)',
                            borderRadius: 'var(--radius-sm)',
                            transition: 'width 300ms ease',
                          }}
                        />
                      </div>
                      <span
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '0.84rem',
                          fontWeight: 700,
                          color: i === 0 ? 'var(--accent-amber)' : 'var(--foreground)',
                          textAlign: 'right',
                        }}
                      >
                        {item.peak_to_average_ratio.toFixed(2)}×
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Ranking Table */}
          {isLoadingRankings ? (
            <div style={{ padding: '3.5rem', textAlign: 'center', color: 'var(--foreground-muted)' }}>
              Loading peak-to-average values...
            </div>
          ) : p2aList.length === 0 ? (
            <div style={{ padding: '3.5rem', textAlign: 'center', color: 'var(--foreground-muted)' }}>
              No observations available for {selectedWindow}.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontSize: '0.84rem',
                  textAlign: 'left',
                }}
              >
                <thead>
                  <tr
                    style={{
                      borderBottom: '1px solid var(--border)',
                      color: 'var(--foreground-subtle)',
                      fontSize: '0.75rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}
                  >
                    <th style={{ padding: '0.75rem 1rem', width: '80px' }}>Rank</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Consumer</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Average Demand</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Peak Demand</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Peak-to-Average</th>
                  </tr>
                </thead>
                <tbody>
                  {p2aList.slice(0, visibleCount).map((item, idx) => (
                    <tr
                      key={item.household_id}
                      onClick={() => setDetailConsumerId(item.household_id)}
                      style={{
                        borderBottom: '1px solid var(--border-subtle, rgba(255,255,255,0.04))',
                        cursor: 'pointer',
                        transition: 'background-color 120ms ease',
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.backgroundColor = 'var(--surface-raised)')
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.backgroundColor = 'transparent')
                      }
                      title={`Click to view ${formatConsumerId(item.household_id)}`}
                    >
                      <td
                        style={{
                          padding: '0.75rem 1rem',
                          fontFamily: 'var(--font-mono)',
                          color: 'var(--foreground-subtle)',
                          fontWeight: 600,
                        }}
                      >
                        #{idx + 1}
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <div style={{ fontWeight: 600, color: 'var(--foreground)' }}>
                          {formatConsumerId(item.household_id)}
                        </div>
                        <span
                          style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: '0.7rem',
                            color: 'var(--foreground-subtle)',
                          }}
                        >
                          {item.household_id}
                        </span>
                      </td>
                      <td
                        style={{
                          padding: '0.75rem 1rem',
                          textAlign: 'right',
                          fontFamily: 'var(--font-mono)',
                          color: 'var(--foreground)',
                          fontWeight: 600,
                        }}
                      >
                        {item.mean_load.toFixed(3)} kW
                      </td>
                      <td
                        style={{
                          padding: '0.75rem 1rem',
                          textAlign: 'right',
                          fontFamily: 'var(--font-mono)',
                          color: 'var(--accent-amber)',
                          fontWeight: 600,
                        }}
                      >
                        {item.peak_load.toFixed(3)} kW
                      </td>
                      <td
                        style={{
                          padding: '0.75rem 1rem',
                          textAlign: 'right',
                          fontFamily: 'var(--font-mono)',
                          fontWeight: 700,
                          color: 'var(--accent-amber)',
                        }}
                      >
                        {item.peak_to_average_ratio.toFixed(2)}×
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Show More Pagination */}
              {p2aList.length > visibleCount && (
                <div style={{ padding: '1rem', textAlign: 'center', borderTop: '1px solid var(--border)' }}>
                  <button
                    type="button"
                    onClick={() => setVisibleCount((c) => c + 30)}
                    style={{
                      padding: '0.45rem 1.25rem',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      backgroundColor: 'var(--surface-raised)',
                      color: 'var(--foreground)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer',
                    }}
                  >
                    Show More ({visibleCount} of {p2aList.length} shown)
                  </button>
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {/* TAB 4: CONSUMER CLUSTERS */}
      {activeTab === 'clusters' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Cluster Overview Grid */}
          <section className="workspace-card" aria-label="Consumer Clusters Overview">
            <div className="workspace-card-header">
              <div>
                <h2 className="workspace-card-title">Consumer Clusters</h2>
                <p className="workspace-card-subtitle">Consumers grouped by similar load behaviour.</p>
              </div>
            </div>

            {isLoadingSegmentation ? (
              <div style={{ padding: '3.5rem', textAlign: 'center', color: 'var(--foreground-muted)' }}>
                Loading cluster segmentation...
              </div>
            ) : clustersList.length === 0 ? (
              <div style={{ padding: '3.5rem', textAlign: 'center', color: 'var(--foreground-muted)' }}>
                No cluster data available for {selectedWindow}.
              </div>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                  gap: '1rem',
                }}
              >
                {clustersList.map((c) => {
                  const color = CLUSTER_COLORS[c.cluster_id % 4];
                  return (
                    <div
                      key={c.cluster_id}
                      style={{
                        padding: '1.25rem',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: 'var(--surface-raised)',
                        border: '1px solid var(--border)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: '1rem',
                      }}
                    >
                      <div>
                        {/* Title & Archetype */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                          <div
                            style={{
                              width: '9px',
                              height: '9px',
                              borderRadius: '50%',
                              backgroundColor: color,
                              flexShrink: 0,
                            }}
                          />
                          <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--foreground)' }}>
                            Cluster {c.cluster_id + 1}
                          </h3>
                        </div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--foreground)', marginBottom: '0.35rem' }}>
                          {c.archetype}
                        </div>

                        {/* Cohort size */}
                        <div
                          style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: '0.76rem',
                            color: color,
                            fontWeight: 600,
                            marginBottom: '0.75rem',
                          }}
                        >
                          {c.household_count} consumers · {c.percentage}% of cohort
                        </div>

                        {/* Short behavioral description */}
                        <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--foreground-muted)', lineHeight: 1.45 }}>
                          {c.description}
                        </p>
                      </div>

                      {/* Summary metrics */}
                      <div
                        style={{
                          padding: '0.75rem',
                          borderRadius: 'var(--radius-sm)',
                          backgroundColor: 'var(--surface)',
                          border: '1px solid var(--border)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.6rem',
                          fontSize: '0.76rem',
                        }}
                      >
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                          <div>
                            <span style={{ color: 'var(--foreground-subtle)' }}>Mean Demand</span>
                            <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--foreground)', marginTop: '0.15rem' }}>
                              {c.features.mean_load.toFixed(3)} kW
                            </div>
                          </div>
                          <div>
                            <span style={{ color: 'var(--foreground-subtle)' }}>Peak Demand</span>
                            <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--accent-amber)', marginTop: '0.15rem' }}>
                              {c.features.peak_load.toFixed(3)} kW
                            </div>
                          </div>
                        </div>
                        <div>
                          <span style={{ color: 'var(--foreground-subtle)' }}>Peak Window</span>
                          <div style={{ fontWeight: 600, color: 'var(--foreground)', marginTop: '0.15rem' }}>
                            {c.peak_window}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Cluster Daily Load-Profile Multi-Line Visualization */}
          <section className="workspace-card" aria-label="Cluster Typical Daily Load Profile">
            <div
              className="workspace-card-header"
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '0.75rem',
              }}
            >
              <div>
                <h3 className="workspace-card-title">Typical Daily Load Profiles</h3>
                <p className="workspace-card-subtitle">
                  Average demand curve across 48 half-hour intervals (00:00 → 23:30) in kW / consumer.
                </p>
              </div>

              {/* Filter Toggles */}
              <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => setActiveClusterFilter(null)}
                  style={{
                    padding: '0.3rem 0.65rem',
                    fontSize: '0.75rem',
                    fontWeight: activeClusterFilter === null ? 700 : 500,
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border)',
                    backgroundColor: activeClusterFilter === null ? 'var(--surface-raised)' : 'transparent',
                    color: activeClusterFilter === null ? 'var(--foreground)' : 'var(--foreground-muted)',
                    cursor: 'pointer',
                  }}
                >
                  All Clusters
                </button>
                {clustersList.map((c) => {
                  const isSelected = activeClusterFilter === c.cluster_id;
                  const color = CLUSTER_COLORS[c.cluster_id % 4];
                  return (
                    <button
                      key={c.cluster_id}
                      type="button"
                      onClick={() => setActiveClusterFilter(isSelected ? null : c.cluster_id)}
                      style={{
                        padding: '0.3rem 0.65rem',
                        fontSize: '0.75rem',
                        fontWeight: isSelected ? 700 : 500,
                        borderRadius: 'var(--radius-sm)',
                        border: `1px solid ${isSelected ? color : 'var(--border)'}`,
                        backgroundColor: isSelected ? `color-mix(in srgb, ${color} 15%, transparent)` : 'transparent',
                        color: isSelected ? color : 'var(--foreground-muted)',
                        cursor: 'pointer',
                      }}
                    >
                      Cluster {c.cluster_id + 1}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Multi-Line SVG Chart */}
            {clusterDailyProfiles.length > 0 ? (
              <ClusterDailyProfilesSvg
                data={clusterDailyProfiles}
                activeClusterFilter={activeClusterFilter}
              />
            ) : (
              <div style={{ padding: '3.5rem', textAlign: 'center', color: 'var(--foreground-muted)' }}>
                No load profiles recorded for this observation window.
              </div>
            )}
          </section>
        </div>
      )}

      {/* TAB 5: CONSUMER PROFILES (ALL CONSUMERS DIRECTORY ORDERED BY METER ID) */}
      {activeTab === 'profiles' && (
        <section className="workspace-card" aria-label="Consumer Profiles Directory">
          <div className="workspace-card-header" style={{ flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
            <div style={{ flex: 1, minWidth: '240px' }}>
              <h2 className="workspace-card-title">Consumer Profiles</h2>
              <p className="workspace-card-subtitle">
                Browse all consumers by meter ID or search for a specific household.
              </p>
            </div>

            {/* Consumer Search Input */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <div
                style={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  minWidth: '280px',
                  maxWidth: '380px',
                }}
              >
                <Search
                  size={16}
                  style={{
                    position: 'absolute',
                    left: '0.85rem',
                    color: 'var(--foreground-muted)',
                    pointerEvents: 'none',
                  }}
                />
                <input
                  type="text"
                  value={consumerSearchTerm}
                  onChange={(e) => setConsumerSearchTerm(e.target.value)}
                  placeholder="Search consumers by Meter ID..."
                  aria-label="Search consumers by Meter ID"
                  style={{
                    width: '100%',
                    padding: '0.55rem 2.2rem 0.55rem 2.4rem',
                    fontSize: '0.84rem',
                    backgroundColor: 'var(--surface-raised)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--foreground)',
                    outline: 'none',
                    transition: 'border-color 150ms ease',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = 'var(--accent-emerald)')}
                  onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
                />
                {consumerSearchTerm && (
                  <button
                    type="button"
                    onClick={() => setConsumerSearchTerm('')}
                    style={{
                      position: 'absolute',
                      right: '0.65rem',
                      background: 'none',
                      border: 'none',
                      color: 'var(--foreground-muted)',
                      cursor: 'pointer',
                      padding: '0.2rem',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                    title="Clear search"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
              <span
                style={{
                  fontSize: '0.78rem',
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--foreground-subtle)',
                  whiteSpace: 'nowrap',
                }}
              >
                {filteredConsumerProfiles.length} of {consumerProfilesList.length}
              </span>
            </div>
          </div>

          {isLoadingRankings ? (
            <div style={{ padding: '3.5rem', textAlign: 'center', color: 'var(--foreground-muted)' }}>
              Loading consumer profiles...
            </div>
          ) : consumerProfilesList.length === 0 ? (
            <div style={{ padding: '3.5rem', textAlign: 'center', color: 'var(--foreground-muted)' }}>
              No consumer profiles available for {selectedWindow}.
            </div>
          ) : filteredConsumerProfiles.length === 0 ? (
            <div style={{ padding: '3.5rem', textAlign: 'center', color: 'var(--foreground-muted)' }}>
              No consumers matching &ldquo;{consumerSearchTerm}&rdquo; found. Try another meter ID.
            </div>
          ) : (
            <div style={{ padding: '0 1.25rem 1.25rem 1.25rem', overflowX: 'auto' }}>
              <table
                style={{
                  width: '100%',
                  minWidth: '920px',
                  borderCollapse: 'collapse',
                  fontSize: '0.90rem',
                  textAlign: 'left',
                }}
              >
                <thead>
                  <tr
                    style={{
                      borderBottom: '1px solid var(--border)',
                      color: 'var(--foreground-subtle)',
                      fontSize: '0.78rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}
                  >
                    <th style={{ padding: '0.90rem 1.25rem', width: '22%' }}>Meter ID</th>
                    <th style={{ padding: '0.90rem 1.25rem', width: '22%' }}>Consumer</th>
                    <th style={{ padding: '0.90rem 1.25rem', textAlign: 'right', width: '14%' }}>Avg Demand</th>
                    <th style={{ padding: '0.90rem 1.25rem', textAlign: 'right', width: '14%' }}>Peak Demand</th>
                    <th style={{ padding: '0.90rem 1.25rem', textAlign: 'right', width: '14%' }}>Load Factor</th>
                    <th style={{ padding: '0.90rem 1.25rem', textAlign: 'right', width: '14%' }}>Cluster</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredConsumerProfiles.map((item) => (
                    <tr
                      key={item.household_id}
                      onClick={() => setDetailConsumerId(item.household_id)}
                      style={{
                        borderBottom: '1px solid var(--border-subtle, rgba(255,255,255,0.04))',
                        cursor: 'pointer',
                        transition: 'background-color 120ms ease',
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.backgroundColor = 'var(--surface-raised)')
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.backgroundColor = 'transparent')
                      }
                      title={`Click to inspect 24-hour profile for ${formatConsumerId(item.household_id)}`}
                    >
                      <td
                        style={{
                          padding: '0.95rem 1.25rem',
                          fontFamily: 'var(--font-mono)',
                          fontWeight: 600,
                          color: 'var(--foreground)',
                        }}
                      >
                        {item.household_id}
                      </td>
                      <td style={{ padding: '0.95rem 1.25rem' }}>
                        <div style={{ fontWeight: 600, color: 'var(--foreground)' }}>
                          {formatConsumerId(item.household_id)}
                        </div>
                      </td>
                      <td
                        style={{
                          padding: '0.95rem 1.25rem',
                          textAlign: 'right',
                          fontFamily: 'var(--font-mono)',
                          fontWeight: 600,
                          color: 'var(--foreground)',
                        }}
                      >
                        {item.mean_load.toFixed(3)} kW
                      </td>
                      <td
                        style={{
                          padding: '0.95rem 1.25rem',
                          textAlign: 'right',
                          fontFamily: 'var(--font-mono)',
                          fontWeight: 600,
                          color: 'var(--accent-amber)',
                        }}
                      >
                        {item.peak_load.toFixed(3)} kW
                      </td>
                      <td
                        style={{
                          padding: '0.95rem 1.25rem',
                          textAlign: 'right',
                          fontFamily: 'var(--font-mono)',
                          fontWeight: 600,
                          color: 'var(--accent-emerald)',
                        }}
                      >
                        {item.load_factor.toFixed(1)}%
                      </td>
                      <td style={{ padding: '0.95rem 1.25rem', textAlign: 'right' }}>
                        <span
                          style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: '0.76rem',
                            padding: '0.22rem 0.6rem',
                            borderRadius: 'var(--radius-sm)',
                            backgroundColor: 'var(--surface-raised)',
                            border: '1px solid var(--border)',
                            color: CLUSTER_COLORS[item.cluster_id % 4],
                            fontWeight: 600,
                          }}
                        >
                          Cluster {item.cluster_id + 1}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* INDIVIDUAL CONSUMER DETAIL MODAL / DRAWER */}
      {detailConsumerId && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.72)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1.5rem',
          }}
          onClick={() => setDetailConsumerId(null)}
        >
          <div
            style={{
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              width: '100%',
              maxWidth: '780px',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 20px 45px rgba(0,0,0,0.45)',
              padding: '1.75rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                borderBottom: '1px solid var(--border)',
                paddingBottom: '1rem',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 700, color: 'var(--foreground)' }}>
                    {formatConsumerId(detailConsumerId)}
                  </h2>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.72rem',
                      padding: '0.2rem 0.55rem',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: 'var(--surface-raised)',
                      border: '1px solid var(--border)',
                      color: 'var(--foreground-subtle)',
                    }}
                  >
                    {detailConsumerId}
                  </span>
                </div>
                <div style={{ fontSize: '0.84rem', color: 'var(--foreground-muted)', marginTop: '0.25rem' }}>
                  {detailProfile?.summary.cluster_label ? `Assigned to ${detailProfile.summary.cluster_label}` : 'Consumer Load Profile'}
                  {' '}&bull; Window {selectedWindow}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setDetailConsumerId(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--foreground-muted)',
                  cursor: 'pointer',
                  padding: '0.35rem',
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                title="Close consumer detail"
              >
                <X size={20} />
              </button>
            </div>

            {isLoadingDetail ? (
              <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--foreground-muted)' }}>
                Loading consumer telemetry...
              </div>
            ) : detailProfile ? (
              <>
                {/* 4 Metric Cards Strip */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: '0.85rem',
                  }}
                >
                  <div
                    style={{
                      padding: '0.85rem',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: 'var(--surface-raised)',
                      border: '1px solid var(--border)',
                    }}
                  >
                    <span style={{ fontSize: '0.72rem', color: 'var(--foreground-subtle)', textTransform: 'uppercase' }}>
                      Average Demand
                    </span>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.15rem', fontWeight: 700, color: 'var(--foreground)', marginTop: '0.2rem' }}>
                      {detailProfile.summary.mean_load_kw.toFixed(3)} kW
                    </div>
                  </div>

                  <div
                    style={{
                      padding: '0.85rem',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: 'var(--surface-raised)',
                      border: '1px solid var(--border)',
                    }}
                  >
                    <span style={{ fontSize: '0.72rem', color: 'var(--foreground-subtle)', textTransform: 'uppercase' }}>
                      Peak Demand
                    </span>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.15rem', fontWeight: 700, color: 'var(--accent-amber)', marginTop: '0.2rem' }}>
                      {detailProfile.summary.peak_load_kw.toFixed(3)} kW
                    </div>
                  </div>

                  <div
                    style={{
                      padding: '0.85rem',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: 'var(--surface-raised)',
                      border: '1px solid var(--border)',
                    }}
                  >
                    <span style={{ fontSize: '0.72rem', color: 'var(--foreground-subtle)', textTransform: 'uppercase' }}>
                      Load Factor
                    </span>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.15rem', fontWeight: 700, color: 'var(--foreground)', marginTop: '0.2rem' }}>
                      {detailProfile.summary.load_factor_pct.toFixed(1)}%
                    </div>
                  </div>

                  <div
                    style={{
                      padding: '0.85rem',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: 'var(--surface-raised)',
                      border: '1px solid var(--border)',
                    }}
                  >
                    <span style={{ fontSize: '0.72rem', color: 'var(--foreground-subtle)', textTransform: 'uppercase' }}>
                      Peak-to-Average
                    </span>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.15rem', fontWeight: 700, color: 'var(--foreground)', marginTop: '0.2rem' }}>
                      {detailProfile.summary.peak_to_average_ratio.toFixed(2)}×
                    </div>
                  </div>
                </div>

                {/* 24-Hour Load Profile Chart */}
                <div>
                  <div style={{ marginBottom: '0.75rem' }}>
                    <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 600, color: 'var(--foreground)' }}>
                      24-Hour Load Profile
                    </h3>
                    <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: 'var(--foreground-muted)' }}>
                      Half-hourly electricity demand (kW) across 48 observation intervals.
                    </p>
                  </div>

                  {detailProfile.diurnal_profile && detailProfile.diurnal_profile.length > 0 ? (
                    <ConsumerDiurnalChart data={detailProfile.diurnal_profile} />
                  ) : (
                    <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--foreground-muted)' }}>
                      No load profile recorded for this consumer in {selectedWindow}.
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--foreground-muted)' }}>
                Consumer profile unavailable.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Clean SVG component for 4-cluster diurnal profiles comparison chart
 */
const ClusterDailyProfilesSvg: React.FC<{
  data: {
    slot: number;
    half_hour: number;
    time: string;
    cluster_0: number;
    cluster_1: number;
    cluster_2: number;
    cluster_3: number;
  }[];
  activeClusterFilter: number | null;
}> = ({ data, activeClusterFilter }) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (!data || data.length === 0) return null;

  const width = 800;
  const height = 280;
  const padding = { top: 25, right: 35, bottom: 42, left: 65 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  // Compute maximum across clusters
  const rawMax = Math.max(
    ...data.flatMap((d) => [d.cluster_0, d.cluster_1, d.cluster_2, d.cluster_3]),
    0.3
  );
  const maxVal = Math.ceil(rawMax * 1.2 * 10) / 10;
  const minVal = 0;

  const getX = (idx: number) => padding.left + (idx / Math.max(data.length - 1, 1)) * chartW;
  const getY = (val: number) =>
    padding.top + chartH - ((Math.max(val, minVal) - minVal) / (maxVal - minVal)) * chartH;

  // Build SVG path strings
  const pathC0 = `M ${data.map((d, i) => `${getX(i)},${getY(d.cluster_0)}`).join(' L ')}`;
  const pathC1 = `M ${data.map((d, i) => `${getX(i)},${getY(d.cluster_1)}`).join(' L ')}`;
  const pathC2 = `M ${data.map((d, i) => `${getX(i)},${getY(d.cluster_2)}`).join(' L ')}`;
  const pathC3 = `M ${data.map((d, i) => `${getX(i)},${getY(d.cluster_3)}`).join(' L ')}`;

  const lines = [
    { id: 0, label: 'Cluster 1 (Evening)', path: pathC0, color: CLUSTER_COLORS[0], valKey: 'cluster_0' as const },
    { id: 1, label: 'Cluster 2 (Baseload)', path: pathC1, color: CLUSTER_COLORS[1], valKey: 'cluster_1' as const },
    { id: 2, label: 'Cluster 3 (Daytime)', path: pathC2, color: CLUSTER_COLORS[2], valKey: 'cluster_2' as const },
    { id: 3, label: 'Cluster 4 (Dual-Peak)', path: pathC3, color: CLUSTER_COLORS[3], valKey: 'cluster_3' as const },
  ];

  const yTicks = [0, maxVal * 0.25, maxVal * 0.5, maxVal * 0.75, maxVal];
  const hoveredItem = hoveredIndex !== null ? data[hoveredIndex] : null;

  return (
    <div style={{ width: '100%', position: 'relative' }}>
      {/* Legend Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '0.65rem',
          flexWrap: 'wrap',
          gap: '0.75rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.78rem' }}>
          {lines.map((l) => {
            const isDimmed = activeClusterFilter !== null && activeClusterFilter !== l.id;
            return (
              <div
                key={l.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  opacity: isDimmed ? 0.35 : 1,
                  transition: 'opacity 150ms ease',
                }}
              >
                <div style={{ width: '14px', height: '3px', backgroundColor: l.color, borderRadius: '2px' }} />
                <span style={{ color: 'var(--foreground)', fontWeight: 600 }}>{l.label}</span>
              </div>
            );
          })}
        </div>
        <span style={{ fontSize: '0.84rem', fontFamily: 'var(--font-mono)', color: 'var(--foreground-subtle)' }}>
          Unit: kW / consumer
        </span>
      </div>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        style={{ width: '100%', height: 'auto', overflow: 'visible', display: 'block' }}
        onMouseLeave={() => setHoveredIndex(null)}
      >
        {/* Horizontal grid lines */}
        {yTicks.map((tick, i) => {
          const y = getY(tick);
          return (
            <g key={i}>
              <line
                x1={padding.left}
                y1={y}
                x2={padding.left + chartW}
                y2={y}
                stroke="var(--border)"
                strokeDasharray="3 3"
                strokeWidth={1}
                opacity={0.55}
              />
              <text
                x={padding.left - 10}
                y={y + 4}
                textAnchor="end"
                fontSize={12}
                fontFamily="var(--font-mono)"
                fill="var(--foreground-subtle)"
              >
                {tick.toFixed(2)}
              </text>
            </g>
          );
        })}

        {/* X Axis Time Labels */}
        {[0, 8, 16, 24, 32, 40, 47].map((idx) => {
          if (!data[idx]) return null;
          const x = getX(idx);
          return (
            <text
              key={idx}
              x={x}
              y={padding.top + chartH + 20}
              textAnchor="middle"
              fontSize={12}
              fontFamily="var(--font-mono)"
              fill="var(--foreground-subtle)"
            >
              {data[idx].time}
            </text>
          );
        })}

        {/* Cluster Paths */}
        {lines.map((l) => {
          const isDimmed = activeClusterFilter !== null && activeClusterFilter !== l.id;
          return (
            <path
              key={l.id}
              d={l.path}
              fill="none"
              stroke={l.color}
              strokeWidth={isDimmed ? 1.2 : activeClusterFilter === l.id ? 2.6 : 1.9}
              opacity={isDimmed ? 0.2 : 1}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          );
        })}

        {/* Hover Crosshair & Points */}
        {hoveredIndex !== null && hoveredItem && (
          <g>
            <line
              x1={getX(hoveredIndex)}
              y1={padding.top}
              x2={getX(hoveredIndex)}
              y2={padding.top + chartH}
              stroke="var(--foreground-muted)"
              strokeDasharray="2 2"
              strokeWidth={1}
            />
            {lines.map((l) => {
              if (activeClusterFilter !== null && activeClusterFilter !== l.id) return null;
              const val = hoveredItem[l.valKey];
              return (
                <circle
                  key={l.id}
                  cx={getX(hoveredIndex)}
                  cy={getY(val)}
                  r={4.5}
                  fill={l.color}
                  stroke="var(--surface)"
                  strokeWidth={2}
                />
              );
            })}
          </g>
        )}

        {/* Transparent Interactive Hover Slices */}
        {data.map((_, i) => {
          const sliceW = chartW / data.length;
          const x = getX(i) - sliceW / 2;
          return (
            <rect
              key={i}
              x={Math.max(x, padding.left)}
              y={padding.top}
              width={sliceW}
              height={chartH}
              fill="transparent"
              style={{ cursor: 'crosshair' }}
              onMouseEnter={() => setHoveredIndex(i)}
            />
          );
        })}
      </svg>

      {/* Floating Tooltip */}
      {hoveredIndex !== null && hoveredItem && (
        <div
          style={{
            position: 'absolute',
            top: '36px',
            left: `${(getX(hoveredIndex) / width) * 100}%`,
            transform: hoveredIndex > 32 ? 'translateX(-105%)' : 'translateX(10px)',
            backgroundColor: 'var(--surface-raised)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)',
            padding: '0.65rem 0.85rem',
            boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
            pointerEvents: 'none',
            fontSize: '0.78rem',
            zIndex: 10,
            whiteSpace: 'nowrap',
          }}
        >
          <div style={{ fontWeight: 700, color: 'var(--foreground)', marginBottom: '0.35rem', fontFamily: 'var(--font-mono)' }}>
            {hoveredItem.time}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
            {lines.map((l) => (
              <div key={l.id} style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
                <span style={{ color: l.color, fontWeight: 600 }}>{l.label}:</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--foreground)' }}>
                  {hoveredItem[l.valKey].toFixed(3)} kW
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Clean SVG component for 24-hour individual consumer load profile (48 points)
 */
const ConsumerDiurnalChart: React.FC<{
  data: {
    slot: number;
    half_hour: number;
    time: string;
    actual_kw: number;
    predicted_kw: number | null;
    is_peak?: boolean;
  }[];
}> = ({ data }) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (!data || data.length === 0) return null;

  const width = 720;
  const height = 240;
  const padding = { top: 20, right: 25, bottom: 38, left: 55 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const rawMax = Math.max(
    ...data.flatMap((d) => [d.actual_kw, d.predicted_kw ?? 0]),
    0.1
  );
  const maxVal = Math.ceil(rawMax * 1.15 * 10) / 10;
  const minVal = 0;

  const getX = (idx: number) => padding.left + (idx / Math.max(data.length - 1, 1)) * chartW;
  const getY = (val: number) =>
    padding.top + chartH - ((Math.max(val, minVal) - minVal) / (maxVal - minVal)) * chartH;

  const actualPath = `M ${data.map((d, i) => `${getX(i)},${getY(d.actual_kw)}`).join(' L ')}`;
  const areaPath = `${actualPath} L ${getX(data.length - 1)},${padding.top + chartH} L ${getX(0)},${padding.top + chartH} Z`;

  const hasForecast = data.some((d) => d.predicted_kw !== null && d.predicted_kw !== undefined && d.predicted_kw > 0);
  const forecastPath = hasForecast
    ? `M ${data.map((d, i) => `${getX(i)},${getY(d.predicted_kw ?? 0)}`).join(' L ')}`
    : '';

  const yTicks = [0, maxVal * 0.33, maxVal * 0.66, maxVal];
  const hoveredItem = hoveredIndex !== null ? data[hoveredIndex] : null;

  return (
    <div style={{ width: '100%', position: 'relative' }}>
      {/* Legend */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '0.5rem',
          fontSize: '0.78rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <div style={{ width: '12px', height: '3px', backgroundColor: 'var(--accent-emerald)', borderRadius: '2px' }} />
            <span style={{ color: 'var(--foreground)', fontWeight: 600 }}>Observed Demand</span>
          </div>
          {hasForecast && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <div
                style={{
                  width: '12px',
                  height: '2px',
                  borderTop: '2px dashed var(--accent-cyan)',
                }}
              />
              <span style={{ color: 'var(--foreground-muted)' }}>Day-Ahead Forecast</span>
            </div>
          )}
        </div>
        <span style={{ fontSize: '0.84rem', fontFamily: 'var(--font-mono)', color: 'var(--foreground-subtle)' }}>
          Unit: kW
        </span>
      </div>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        style={{ width: '100%', height: 'auto', overflow: 'visible', display: 'block' }}
        onMouseLeave={() => setHoveredIndex(null)}
      >
        <defs>
          <linearGradient id="consumerAreaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent-emerald)" stopOpacity={0.08} />
            <stop offset="100%" stopColor="var(--accent-emerald)" stopOpacity={0.0} />
          </linearGradient>
        </defs>

        {/* Y Axis Grid Lines */}
        {yTicks.map((tick, i) => {
          const y = getY(tick);
          return (
            <g key={i}>
              <line
                x1={padding.left}
                y1={y}
                x2={padding.left + chartW}
                y2={y}
                stroke="var(--border)"
                strokeDasharray="3 3"
                strokeWidth={1}
                opacity={0.55}
              />
              <text
                x={padding.left - 8}
                y={y + 4}
                textAnchor="end"
                fontSize={12}
                fontFamily="var(--font-mono)"
                fill="var(--foreground-subtle)"
              >
                {tick.toFixed(2)}
              </text>
            </g>
          );
        })}

        {/* X Axis Time Labels */}
        {[0, 8, 16, 24, 32, 40, 47].map((idx) => {
          if (!data[idx]) return null;
          const x = getX(idx);
          return (
            <text
              key={idx}
              x={x}
              y={padding.top + chartH + 20}
              textAnchor="middle"
              fontSize={12}
              fontFamily="var(--font-mono)"
              fill="var(--foreground-subtle)"
            >
              {data[idx].time}
            </text>
          );
        })}

        {/* Shaded Area */}
        <path d={areaPath} fill="url(#consumerAreaGradient)" />

        {/* Observed Actual Line */}
        <path
          d={actualPath}
          fill="none"
          stroke="var(--accent-emerald)"
          strokeWidth={1.9}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Forecast Line */}
        {hasForecast && (
          <path
            d={forecastPath}
            fill="none"
            stroke="var(--accent-cyan)"
            strokeWidth={1.75}
            strokeDasharray="4 3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* Hover Crosshair & Point */}
        {hoveredIndex !== null && hoveredItem && (
          <g>
            <line
              x1={getX(hoveredIndex)}
              y1={padding.top}
              x2={getX(hoveredIndex)}
              y2={padding.top + chartH}
              stroke="var(--foreground-muted)"
              strokeDasharray="2 2"
              strokeWidth={1}
            />
            <circle
              cx={getX(hoveredIndex)}
              cy={getY(hoveredItem.actual_kw)}
              r={4.5}
              fill="var(--accent-emerald)"
              stroke="var(--surface)"
              strokeWidth={2}
            />
            {hasForecast && hoveredItem.predicted_kw !== null && (
              <circle
                cx={getX(hoveredIndex)}
                cy={getY(hoveredItem.predicted_kw)}
                r={4}
                fill="var(--accent-cyan)"
                stroke="var(--surface)"
                strokeWidth={2}
              />
            )}
          </g>
        )}

        {/* Transparent Interactive Hover Slices */}
        {data.map((_, i) => {
          const sliceW = chartW / data.length;
          const x = getX(i) - sliceW / 2;
          return (
            <rect
              key={i}
              x={Math.max(x, padding.left)}
              y={padding.top}
              width={sliceW}
              height={chartH}
              fill="transparent"
              style={{ cursor: 'crosshair' }}
              onMouseEnter={() => setHoveredIndex(i)}
            />
          );
        })}
      </svg>

      {/* Floating Tooltip */}
      {hoveredIndex !== null && hoveredItem && (
        <div
          style={{
            position: 'absolute',
            top: '30px',
            left: `${(getX(hoveredIndex) / width) * 100}%`,
            transform: hoveredIndex > 32 ? 'translateX(-105%)' : 'translateX(10px)',
            backgroundColor: 'var(--surface-raised)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)',
            padding: '0.55rem 0.75rem',
            boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
            pointerEvents: 'none',
            fontSize: '0.78rem',
            zIndex: 10,
            whiteSpace: 'nowrap',
          }}
        >
          <div style={{ fontWeight: 700, color: 'var(--foreground)', marginBottom: '0.25rem', fontFamily: 'var(--font-mono)' }}>
            {hoveredItem.time}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem' }}>
              <span style={{ color: 'var(--accent-emerald)', fontWeight: 600 }}>Observed:</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--foreground)' }}>
                {hoveredItem.actual_kw.toFixed(3)} kW
              </span>
            </div>
            {hoveredItem.predicted_kw !== null && (
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem' }}>
                <span style={{ color: 'var(--accent-cyan)' }}>Forecast:</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--foreground)' }}>
                  {hoveredItem.predicted_kw.toFixed(3)} kW
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
