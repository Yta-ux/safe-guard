import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/axios/api-client';
import type { ClassifyReportResponse } from '@/@types/classification.types';

export interface ClassifyPayload {
  text?: string;
  sector?: string;
  file?: File | null;
}

async function classifyReport(payload: ClassifyPayload): Promise<ClassifyReportResponse> {
  // Case 1: File upload to /reports/classify-document
  if (payload.file) {
    const formData = new FormData();
    formData.append('file', payload.file);

    const response = await apiClient.post<ClassifyReportResponse>('/reports/classify-document', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      transformRequest: [
        (data, headers) => {
          // Delete explicit header so browser automatically sets multipart/form-data with boundary
          if (headers) {
            delete headers['Content-Type'];
          }
          return data;
        },
      ],
    });
    return response.data;
  }

  // Case 2: Text submission to /reports/classify
  const response = await apiClient.post<ClassifyReportResponse>('/reports/classify', {
    text: payload.text || '',
    sector: payload.sector ?? 'Operacional',
  });
  return response.data;
}

export function useClassifyReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: classifyReport,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });
}
