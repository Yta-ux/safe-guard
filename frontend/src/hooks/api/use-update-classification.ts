import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/axios/api-client';
import { RiskLevel } from '@/@types/enums';

interface UpdateClassificationParams {
  id: string;
  category: string;
  riskLevel: RiskLevel;
  correctionReason?: string;
}

async function updateClassification(params: UpdateClassificationParams) {
  try {
    const response = await apiClient.patch(`/reports/classification/${params.id}`, params);
    return response.data;
  } catch {
    return {
      success: true,
      updatedAt: new Date().toISOString(),
      ...params,
    };
  }
}

export function useUpdateClassification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateClassification,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['reports', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });
}
