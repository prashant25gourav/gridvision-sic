/**
 * GridVision API Client.
 *
 * Connects React frontend views to FastAPI endpoints.
 * Includes graceful fallbacks in case the backend server is temporarily starting up.
 */

const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

export interface OverviewData {
  n_households: number;
  n_active_anomalies: number;
  cluster_distribution: {
    cluster_id: number;
    count: number;
    label: string;
  }[];
  last_pipeline_run: string;
}

export interface HouseholdSummary {
  household_id: string;
  acorn_grouped: string;
  cluster_id: number;
  cluster_label: string;
  instability: number;
  volatility_cv: number;
  reliability_indicator: 'stable' | 'moderate' | 'elevated_risk';
  anomaly_count: number;
}

export interface ForecastPoint {
  slot_index: number;
  timestamp: string;
  actual: number;
  predicted_global: number;
  predicted_percluster: number;
}

export interface ShapFeature {
  feature: string;
  contribution: number;
}

export interface ForecastData {
  household_id: string;
  window_id: string;
  series: ForecastPoint[];
  mae_global: number;
  mae_percluster: number;
  shap_top_features: ShapFeature[];
}

export interface SegmentTrajectoryPoint {
  window_id: string;
  cluster_id: number;
  cluster_label: string;
  window_role: string;
}

export interface SegmentData {
  household_id: string;
  trajectory: SegmentTrajectoryPoint[];
  current_cluster_id: number;
  current_cluster_label: string;
}

export interface InstabilityPoint {
  window_id: string;
  instability: number;
  volatility_cv: number;
  reliability: string;
}

export interface InstabilityData {
  household_id: string;
  series: InstabilityPoint[];
  reliability_indicator: 'stable' | 'moderate' | 'elevated_risk';
}

export interface AnomalyFlag {
  window_id: string;
  is_anomaly: boolean;
  anomaly_score: number;
  triggering_statistic: string;
  value: number;
  baseline_mean: number;
  baseline_std: number;
  z_score: number;
  severity: string;
  explanation: string;
}

export interface AnomalyData {
  household_id: string;
  flags: AnomalyFlag[];
}

export interface ToolCall {
  tool: string;
  args: Record<string, any>;
}

export interface ChatResponse {
  answer: string;
  tool_calls: ToolCall[];
  grounded: boolean;
  debug?: Record<string, any>;
}

/**
 * Fetch portfolio overview.
 */
export async function fetchOverview(): Promise<OverviewData> {
  const res = await fetch(`${API_BASE}/overview`);
  if (!res.ok) {
    throw new Error(`Failed to fetch overview: ${res.statusText}`);
  }
  return res.json();
}

/**
 * Fetch list of all sampled households.
 */
export async function fetchHouseholds(): Promise<HouseholdSummary[]> {
  const res = await fetch(`${API_BASE}/households`);
  if (!res.ok) {
    throw new Error(`Failed to fetch households: ${res.statusText}`);
  }
  return res.json();
}

/**
 * Fetch forecast series and SHAP features for a household.
 */
export async function fetchHouseholdForecast(householdId: string, windowId?: string): Promise<ForecastData> {
  const url = windowId
    ? `${API_BASE}/household/${householdId}/forecast?window_id=${windowId}`
    : `${API_BASE}/household/${householdId}/forecast`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch forecast: ${res.statusText}`);
  }
  return res.json();
}

/**
 * Fetch segment trajectory for a household.
 */
export async function fetchHouseholdSegment(householdId: string): Promise<SegmentData> {
  const res = await fetch(`${API_BASE}/household/${householdId}/segment`);
  if (!res.ok) {
    throw new Error(`Failed to fetch segment: ${res.statusText}`);
  }
  return res.json();
}

/**
 * Fetch instability series for a household.
 */
export async function fetchHouseholdInstability(householdId: string): Promise<InstabilityData> {
  const res = await fetch(`${API_BASE}/household/${householdId}/instability`);
  if (!res.ok) {
    throw new Error(`Failed to fetch instability: ${res.statusText}`);
  }
  return res.json();
}

/**
 * Fetch anomaly flags for a household.
 */
export async function fetchHouseholdAnomaly(householdId: string): Promise<AnomalyData> {
  const res = await fetch(`${API_BASE}/household/${householdId}/anomaly`);
  if (!res.ok) {
    throw new Error(`Failed to fetch anomaly: ${res.statusText}`);
  }
  return res.json();
}

/**
 * Send user query to RAG Copilot endpoint.
 */
export async function sendChatMessage(message: string, householdId?: string): Promise<ChatResponse> {
  const res = await fetch(`${API_BASE}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, household_id: householdId }),
  });
  if (!res.ok) {
    throw new Error(`Chat request failed: ${res.statusText}`);
  }
  return res.json();
}

// -------------------------------------------------------------
// Extended Analytics & Research Artifact Contracts
// -------------------------------------------------------------

export interface ResearchFindingsData {
  research_question: string;
  statistical_results: {
    sample: {
      n_observations: number;
      n_households: number;
      n_extreme_failures: number;
      positive_event_rate: number;
      cov_type: string;
      cluster_variable: string;
    };
    hypothesis_h1_result: {
      verdict: string;
      research_question: string;
      instability_odds_ratio: number;
      instability_95_ci: [number, number];
      instability_p_value: number;
      interpretation: string;
    };
    nested_model_comparison_h3: {
      comparison: string;
      lr_statistic: number;
      degrees_of_freedom: number;
      lr_p_value: number;
      delta_roc_auc: number;
      delta_pr_auc: number;
      incremental_information_significant: boolean;
    };
    primary_model: {
      formula: string;
      log_likelihood: number;
      aic: number;
      bic: number;
      roc_auc: number;
      pr_auc: number;
      brier_score: number;
      coefficients: Record<string, number>;
      robust_std_errors: Record<string, number>;
      z_statistics: Record<string, number>;
      p_values: Record<string, number>;
      odds_ratios: Record<string, number>;
      conf_int_95: Record<string, [number, number]>;
    };
    restricted_model: {
      formula: string;
      roc_auc: number;
      pr_auc: number;
      brier_score: number;
      odds_ratios: Record<string, number>;
      p_values: Record<string, number>;
      conf_int_95: Record<string, [number, number]>;
    };
  };
  holdout_results: {
    holdout_protocol: {
      forward_only: boolean;
      refit_performed: boolean;
      gate_g7_guard: string;
    };
    sample: {
      total_sampled_households: number;
      eligible_holdout_evaluated: number;
      ineligible_holdout_predecessor_gap: number;
      holdout_extreme_failures: number;
      holdout_event_rate: number;
    };
    fixed_model_performance: {
      primary_model_roc_auc: number;
      primary_model_pr_auc: number;
      restricted_model_roc_auc: number;
      restricted_model_pr_auc: number;
      delta_roc_auc: number;
      brier_score: number;
      log_loss: number;
    };
  };
  extreme_failure_threshold: {
    threshold_std_error_95th: number;
    fallback_90th: number;
    primary_percentile: number;
    fallback_percentile: number;
    n_calibration_errors: number;
    description: string;
  };
}

export interface ClusterDetail {
  cluster_id: number;
  label: string;
  archetype: string;
  household_count: number;
  percentage: number;
  peak_window: string;
  description: string;
  features: {
    mean_load: number;
    peak_load: number;
    peak_to_average_ratio: number;
    day_night_ratio: number;
    ramp_rate_mean: number;
    std_load: number;
    weekday_weekend_contrast: number;
    peak_timing: number;
  };
  profile?: {
    slot: number;
    time: string;
    actual_kw: number;
  }[];
}

export interface SegmentationOverviewData {
  window_id?: string;
  selected_k: number;
  best_silhouette_score: number;
  silhouette_sweep: Record<string, number>;
  inertia_sweep: Record<string, number>;
  feature_columns: string[];
  clusters: ClusterDetail[];
  daily_profiles?: {
    slot: number;
    half_hour: number;
    time: string;
    cluster_0: number;
    cluster_1: number;
    cluster_2: number;
    cluster_3: number;
  }[];
}

export interface AnomalyOverviewData {
  real_anomalies: {
    total_observations: number;
    flagged_count: number;
    contamination_rate: number;
    model: string;
    window_breakdown: Record<string, number>;
    recent_flagged: {
      household_id: string;
      window_id: string;
      triggering_statistic: string;
      z_score: number;
      severity: string;
      explanation: string;
      why_it_matters?: string;
    }[];
  };

  synthetic_benchmark: {
    total_samples: number;
    normal_samples: number;
    synthetic_anomalies: number;
    anomaly_ratio: number;
    precision: number;
    recall: number;
    f1_score: number;
    roc_auc: number;
    confusion_matrix: {
      tn: number;
      fp: number;
      fn: number;
      tp: number;
    };
    recall_by_anomaly_type: Record<string, number>;
  };
}

export interface ForecastSummaryData {
  mae_global: number;
  mae_seasonal_naive: number;
  error_reduction_pct: number;
  forecast_horizon: string;
  model_architecture: string;
  representative_series: {
    slot_index: number;
    hour: number;
    label: string;
    actualKw: number;
    baselineKw: number;
    seasonalNaiveKw: number;
    isPeak: boolean;
  }[];
}

/**
 * Fetch research statistical model and holdout validation findings.
 */
export async function fetchResearchFindings(): Promise<ResearchFindingsData> {
  const res = await fetch(`${API_BASE}/research/findings`);
  if (!res.ok) {
    throw new Error(`Failed to fetch research findings: ${res.statusText}`);
  }
  return res.json();
}

/**
 * Fetch behavioral segmentation overview, silhouette sweep, and cluster feature profiles.
 */
export async function fetchSegmentationOverview(windowId?: string): Promise<SegmentationOverviewData> {
  const url = windowId ? `${API_BASE}/segmentation/overview?window_id=${windowId}` : `${API_BASE}/segmentation/overview`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch segmentation overview: ${res.statusText}`);
  }
  return res.json();
}

/**
 * Fetch anomaly overview including real household anomalies and synthetic injection benchmarks.
 */
export async function fetchAnomalyOverview(): Promise<AnomalyOverviewData> {
  const res = await fetch(`${API_BASE}/anomalies/overview`);
  if (!res.ok) {
    throw new Error(`Failed to fetch anomaly overview: ${res.statusText}`);
  }
  return res.json();
}

/**
 * Fetch forecast summary metrics and representative cohort profile.
 */
export async function fetchForecastSummary(): Promise<ForecastSummaryData> {
  const res = await fetch(`${API_BASE}/forecast/summary`);
  if (!res.ok) {
    throw new Error(`Failed to fetch forecast summary: ${res.statusText}`);
  }
  return res.json();
}

export interface WindowDemandData {
  window_id: string;
  window_name: string;
  start_date: string;
  end_date: string;
  date_range: string;
  n_households: number;
  total_consumption_mwh: number;
  avg_demand_kw: number;
  total_avg_demand_kw: number;
  total_avg_demand_mw: number;
  peak_demand_kw: number;
  total_peak_demand_kw: number;
  total_peak_demand_mw: number;
  peak_time: string;
  peak_timestamp: string;
  latest_demand_kw: number;
  total_latest_demand_kw: number;
  total_latest_demand_mw: number;
  latest_timestamp: string;
  diurnal_profile: {
    slot: number;
    time: string;
    actual_kw: number;
    predicted_kw: number | null;
    baseline_kw: number | null;
    is_peak: boolean;
  }[];
  weekday_vs_weekend: {
    slot: number;
    time: string;
    weekday_kw: number;
    weekend_kw: number;
    difference_pct: number;
  }[];
  load_curve?: {
    slot: number;
    day: string;
    half_hour: number;
    time: string;
    label: string;
    actual_kw: number;
    predicted_kw: number | null;
    is_peak: boolean;
  }[];
}

export interface GridOverviewData {
  window_id?: string;
  window_name?: string;
  window_dates?: string;
  window_start_date?: string;
  window_end_date?: string;
  window_duration_days?: number;
  total_consumption_mwh: number;
  avg_demand_kw: number;
  total_avg_demand_kw: number;
  total_avg_demand_mw: number;
  peak_demand_kw: number;
  total_peak_demand_kw: number;
  total_peak_demand_mw: number;
  peak_timestamp: string;
  latest_demand_kw: number;
  total_latest_demand_kw: number;
  total_latest_demand_mw?: number;
  latest_timestamp?: string;
  households_monitored: number;
  households_needing_attention: number;
  demand_change: {
    vs_previous_period_pct: number;
    weekday_vs_weekend_pct: number;
  };
  alerts: {
    id: string;
    severity: 'warning' | 'info' | 'notice';
    title: string;
    message: string;
    target: string;
  }[];
  diurnal_profile: {
    slot: number;
    time: string;
    actual_kw: number;
    predicted_kw: number | null;
    baseline_kw: number | null;
    is_peak: boolean;
  }[];
  weekday_vs_weekend?: {
    slot: number;
    time: string;
    weekday_kw: number;
    weekend_kw: number;
    difference_pct: number;
  }[];
  windows?: Record<string, WindowDemandData>;
}

export interface DemandAnalysisData {
  diurnal_profile: {
    slot: number;
    time: string;
    actual_kw: number;
    predicted_kw: number | null;
    baseline_kw: number | null;
    is_peak: boolean;
  }[];
  weekday_vs_weekend: {
    slot: number;
    time: string;
    weekday_kw: number;
    weekend_kw: number;
    difference_pct: number;
  }[];
  load_curve?: {
    slot: number;
    day: string;
    half_hour: number;
    time: string;
    label: string;
    actual_kw: number;
    predicted_kw: number | null;
    is_peak: boolean;
  }[];
  window_trend: {
    window_id: string;
    start_date?: string;
    end_date?: string;
    date_range?: string;
    mean_load_kw: number;
    peak_load_kw: number;
    p2a_ratio: number;
    day_night_ratio: number;
    flagged_anomalies: number;
    n_households: number;
    season: string;
  }[];
  seasonal_comparison: {
    season: string;
    mean_load_kw: number;
    peak_load_kw: number;
    p2a_ratio: number;
    window_count: number;
  }[];
  peak_summary: {
    peak_time: string;
    peak_slot: number;
    peak_load_kw: number;
    cohort_peak_kw: number;
    cohort_peak_mw: number;
    baseload_time: string;
    baseload_slot: number;
    baseload_kw: number;
    cohort_baseload_kw: number;
    cohort_baseload_mw: number;
    peak_to_average_ratio: number;
    peak_window_description: string;
  };
  windows?: Record<string, WindowDemandData>;
}

export interface ConsumerRankingItem {
  household_id: string;
  acorn_grouped: string;
  cluster_id: number;
  cluster_label: string;
  mean_load: number;
  peak_load: number;
  load_factor: number;
  peak_to_average_ratio: number;
  forecast_mae: number;
  forecast_reliability: string;
  instability: number;
  volatility_cv: number;
  anomaly_count: number;
  has_recent_anomaly: boolean;
  attention_status: 'Needs Attention' | 'Moderate' | 'Stable';
  attention_reasons: string[];
}

export interface ConsumerRankingsData {
  window_id?: string;
  summary: {
    total_consumers: number;
    needs_attention_count: number;
    moderate_count: number;
    stable_count: number;
  };
  rankings: {
    by_consumption: ConsumerRankingItem[];
    by_peak: ConsumerRankingItem[];
    by_forecast_error: ConsumerRankingItem[];
    by_anomalies: ConsumerRankingItem[];
    by_instability: ConsumerRankingItem[];
    by_load_factor: ConsumerRankingItem[];
    by_p2a?: ConsumerRankingItem[];
  };
  all_consumers: ConsumerRankingItem[];
}

export interface ConsumerProfileData {
  household_id: string;
  acorn_grouped: string;
  window_id?: string;
  summary: {
    mean_load_kw: number;
    peak_load_kw: number;
    load_factor_pct: number;
    peak_to_average_ratio: number;
    recent_demand_kw?: number;
    forecast_mae_kw?: number;
    forecast_reliability?: string;
    cluster_id: number;
    cluster_label: string;
    instability_score?: number;
    volatility_cv?: number;
    anomaly_count?: number;
    attention_status?: 'Needs Attention' | 'Moderate' | 'Stable';
    attention_reasons?: string[];
  };
  diurnal_profile?: {
    slot: number;
    half_hour: number;
    time: string;
    actual_kw: number;
    predicted_kw: number | null;
    is_peak?: boolean;
  }[];
  diurnal_forecast: ForecastPoint[];
  behavioral_history: SegmentTrajectoryPoint[];
  anomaly_history: AnomalyFlag[];
  explanation: string;
}

export interface AnomaliesAnalysisData {
  total_observations: number;
  total_anomalies: number;
  active_latest_window: number;
  contamination_budget: string;
  timeline: {
    window_id: string;
    flagged_count: number;
  }[];
  severity_breakdown: {
    mild: number;
    elevated: number;
    extreme: number;
  };
  affected_consumers: {
    household_id: string;
    window_id: string;
    severity: string;
    triggering_statistic: string;
    z_score: number;
    anomaly_score?: number | null;
    value?: number | null;
    baseline_mean?: number | null;
    baseline_std?: number | null;
    observed_pattern: string;
    explanation: string;
    action: string;
  }[];
}

export interface ForecastPortalData {
  forecast_horizon: string;
  expected_demand_avg_kw: number;
  expected_peak_kw: number;
  expected_peak_time: string;
  cohort_peak_mw: number;
  mae_global_kw: number;
  mae_seasonal_naive_kw: number;
  error_reduction_pct: number;
  reliability_distribution: {
    high_confidence_pct: number;
    medium_confidence_pct: number;
    needs_attention_pct: number;
  };
  diurnal_series: {
    slot: number;
    time: string;
    actual_kw: number;
    predicted_kw: number;
    baseline_kw: number;
    is_peak: boolean;
  }[];
  performance_by_archetype: {
    archetype: string;
    mae_kw: number;
    share_pct: number;
  }[];
}

export async function fetchGridOverview(windowId?: string): Promise<GridOverviewData> {
  const url = windowId ? `${API_BASE}/overview/grid?window_id=${encodeURIComponent(windowId)}` : `${API_BASE}/overview/grid`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch grid overview: ${res.statusText}`);
  }
  return res.json();
}

export async function fetchDemandAnalysis(windowId?: string): Promise<DemandAnalysisData> {
  const url = windowId ? `${API_BASE}/demand/analysis?window_id=${encodeURIComponent(windowId)}` : `${API_BASE}/demand/analysis`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch demand analysis: ${res.statusText}`);
  }
  return res.json();
}

export async function fetchConsumerRankings(windowId?: string): Promise<ConsumerRankingsData> {
  const url = windowId ? `${API_BASE}/consumers/rankings?window_id=${windowId}` : `${API_BASE}/consumers/rankings`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch consumer rankings: ${res.statusText}`);
  }
  return res.json();
}

export async function fetchConsumerProfile(householdId: string, windowId?: string): Promise<ConsumerProfileData> {
  const url = windowId
    ? `${API_BASE}/consumers/${householdId}/profile?window_id=${windowId}`
    : `${API_BASE}/consumers/${householdId}/profile`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch consumer profile: ${res.statusText}`);
  }
  return res.json();
}

export async function fetchAnomaliesAnalysis(): Promise<AnomaliesAnalysisData> {
  const res = await fetch(`${API_BASE}/anomalies/analysis`);
  if (!res.ok) {
    throw new Error(`Failed to fetch anomalies analysis: ${res.statusText}`);
  }
  return res.json();
}

export async function fetchForecastPortal(): Promise<ForecastPortalData> {
  const res = await fetch(`${API_BASE}/forecast/portal`);
  if (!res.ok) {
    throw new Error(`Failed to fetch forecast portal: ${res.statusText}`);
  }
  return res.json();
}


