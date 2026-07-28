import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/axios/api-client';
import type { NormQueryResult } from '@/@types/classification.types';

async function queryNorm(reportId: string): Promise<NormQueryResult> {
  const response = await apiClient.post<NormQueryResult>(`/reports/${reportId}/query-norm`);
  return response.data;
}

export function useQueryNorm() {
  return useMutation({
    mutationFn: queryNorm,
  });
}
