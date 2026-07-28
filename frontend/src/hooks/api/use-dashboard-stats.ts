import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/axios/api-client';
import type { DashboardStats } from '@/@types/dashboard.types';

async function fetchDashboardStats(): Promise<DashboardStats> {
  const response = await apiClient.get<DashboardStats>('/dashboard/stats');
  return response.data;
}

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: fetchDashboardStats,
    staleTime: 30_000,
  });
}
