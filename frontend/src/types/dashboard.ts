export type DashboardSection =
  | 'overview'
  | 'demand'
  | 'consumers'
  | 'anomalies'
  | 'forecasting'
  | 'copilot'
  | 'households' // legacy alias for consumers
  | 'segmentation'; // legacy alias for demand

export interface SidebarItem {
  id: DashboardSection;
  label: string;
  section: 'SNAPSHOT' | 'ANALYTICS' | 'INTELLIGENCE';
}
