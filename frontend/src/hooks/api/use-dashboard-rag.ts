import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/axios/api-client';

export interface DashboardRagQueryResult {
  query: string;
  normTitle: string;
  normCode: string;
  summary: string;
  sourceExcerpt: string;
  preventiveAction: string;
  foundInKnowledgeBase: boolean;
  applicableSectors: string[];
}

async function queryDashboardRag(query: string): Promise<DashboardRagQueryResult> {
  const response = await apiClient.post<DashboardRagQueryResult>('/dashboard/rag-query', { query });
  return response.data;
}

export function useDashboardRagQuery() {
  return useMutation({
    mutationFn: queryDashboardRag,
  });
}
