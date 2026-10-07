export type DashboardSection =
  | 'overview'
  | 'demand'
  | 'consumers'
  | 'anomalies'
  | 'forecasting'
  | 'copilot'
  | 'findings'
  | 'methodology'
  | 'households' // legacy alias for consumers
  | 'segmentation'; // legacy alias for consumers/demand

export interface SidebarItem {
  id: DashboardSection;
  label: string;
  section: 'OVERVIEW' | 'ANALYTICS' | 'INTELLIGENCE' | 'RESEARCH';
}
