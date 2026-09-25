export type NavTab = 'overview' | 'households' | 'trajectories' | 'copilot';

export interface MetricItem {
  id: string;
  title: string;
  value: string;
  unit?: string;
  change: string;
  changeType: 'positive' | 'negative' | 'neutral';
  caption: string;
  badge?: string;
  icon: 'demand' | 'meters' | 'peak' | 'stability';
}

export interface DemandDataPoint {
  timestamp: string;
  hour: number;
  label: string;
  actualKw: number;
  baselineKw: number;
  isPeak: boolean;
}

export interface ClusterProfile {
  id: number;
  name: string;
  code: string;
  description: string;
  householdCount: number;
  percentage: number;
  avgDailyKwh: number;
  peakHourWindow: string;
  color: string;
}

export interface HouseholdProfile {
  id: string;
  acornGroup: string;
  tariff: 'Standard Flat' | 'Time of Use (Dynamic)' | 'Economy 7';
  currentCluster: number;
  clusterName: string;
  avgDailyKwh: number;
  peakHour: string;
  stabilityScore: number; // 0 to 1
  status: 'normal' | 'volatile' | 'alert';
  hourlyConsumption: { hour: number; kw: number; baselineKw: number }[];
}

export interface BehavioralTransition {
  householdId: string;
  periodFrom: string;
  periodTo: string;
  fromCluster: number;
  toCluster: number;
  fromClusterName: string;
  toClusterName: string;
  stabilityScore: number;
  isShiftFlagged: boolean;
  notes: string;
}

export interface GridAlert {
  id: string;
  timestamp: string;
  severity: 'low' | 'medium' | 'high';
  category: 'Demand Spike' | 'Cluster Drift' | 'Telemetry Anomaly';
  message: string;
  affectedClusterOrMeter: string;
}

export interface CopilotMessage {
  id: string;
  sender: 'user' | 'assistant';
  timestamp: string;
  content: string;
  suggestions?: string[];
  metricsContext?: {
    label: string;
    value: string;
  }[];
}
