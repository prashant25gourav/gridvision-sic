export type DashboardSection =
  | 'overview'
  | 'forecasting'
  | 'households'
  | 'segmentation'
  | 'anomalies'
  | 'copilot'
  | 'findings'
  | 'methodology';

export interface SidebarItem {
  id: DashboardSection;
  label: string;
  section: 'DASHBOARD' | 'RESEARCH';
}
