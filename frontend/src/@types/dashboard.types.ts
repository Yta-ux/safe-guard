export interface CategoryDistribution {
  category: string;
  count: number;
  percentage: number;
}

export interface SectorDistribution {
  sector: string;
  count: number;
}

export interface DashboardStats {
  totalReports: number;
  totalReportsTrend: string;
  criticalCount: number;
  criticalTrend: string;
  lowCount: number;
  lowTrend: string;
  categoryDistribution: CategoryDistribution[];
  sectorDistribution: SectorDistribution[];
}
