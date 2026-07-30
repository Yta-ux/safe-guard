import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/axios/api-client';
import { toast } from 'sonner';

async function deleteReport(reportId: string): Promise<void> {
  await apiClient.delete(`/reports/${reportId}`);
}


export function useDeleteReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (reportId: string) => deleteReport(reportId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports-list'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-kpis'] });
      toast.success('Análise excluída com sucesso!');
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : 'Erro ao excluir análise.';
      toast.error(msg);
    },
  });
}
