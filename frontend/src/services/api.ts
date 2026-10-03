/**
 * GridVision API Client (P4).
 *
 * Connects React frontend views to FastAPI endpoints matching Blueprint v2 §F.
 * Includes graceful fallbacks in case the backend server is temporarily starting up.
 */

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

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
