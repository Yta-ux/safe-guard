import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/axios/api-client';
import type { ReportWithClassification } from '@/@types/classification.types';

export interface ReportSortParams {
  orderColumn?: string;
  orderDir?: 'asc' | 'desc';
}

async function fetchReport(id: string): Promise<ReportWithClassification> {
  const response = await apiClient.get<ReportWithClassification>(`/reports/${id}`);
  return response.data;
}

async function fetchReports(sort?: ReportSortParams): Promise<ReportWithClassification[]> {
  const params: Record<string, string> = {};
  if (sort?.orderColumn) {
    params.order_column = sort.orderColumn;
  }
  if (sort?.orderDir) {
    params.order_dir = sort.orderDir;
  }

  const response = await apiClient.get<ReportWithClassification[]>('/reports', { params });
  return response.data;
}

export function useReport(id: string) {
  return useQuery({
    queryKey: ['reports', id],
    queryFn: () => fetchReport(id),
    enabled: Boolean(id),
  });
}

export function useReports(sort?: ReportSortParams) {
  const col = sort?.orderColumn ?? 'created_at';
  const dir = sort?.orderDir ?? 'desc';

  return useQuery({
    queryKey: ['reports-list', col, dir],
    queryFn: () => fetchReports(sort),
    staleTime: 5_000,
  });
}
