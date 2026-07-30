import { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router';
import type { ColumnDef } from '@tanstack/react-table';
import { Eye, Trash2 } from 'lucide-react';
import { DataTable, type ServerSortEvent } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/feedback/loading-spinner';
import { ErrorMessage } from '@/components/feedback/error-message';
import { useReports, type ReportSortParams } from '@/hooks/api/use-reports';
import { useDeleteReport } from '@/hooks/api/use-delete-report';
import { RiskLevel } from '@/@types/enums';
import { formatDate, truncateText } from '@/lib/utils';
import type { ReportWithClassification } from '@/@types/classification.types';

export function RecentReportsTable() {
  const navigate = useNavigate();
  const deleteMutation = useDeleteReport();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [sortState, setSortState] = useState<ReportSortParams>({
    orderColumn: 'created_at',
    orderDir: 'desc',
  });

  const { data: reports, isLoading, isError, error, refetch } = useReports(sortState);

  const handleSort = useCallback((sort: ServerSortEvent) => {
    setSortState({
      orderColumn: sort.column,
      orderDir: sort.direction,
    });
  }, []);

  const handleDelete = useCallback(
    (id: string) => {
      if (window.confirm('Tem certeza de que deseja excluir esta análise de incidente?')) {
        setDeletingId(id);
        deleteMutation.mutate(id, {
          onSettled: () => setDeletingId(null),
        });
      }
    },
    [deleteMutation],
  );

  const columns = useMemo<ColumnDef<ReportWithClassification>[]>(
    () => [
      {
        id: 'id',
        accessorKey: 'id',
        header: 'ID',
        enableSorting: false,
        cell: ({ row }) => (
          <span className="font-mono text-xs font-semibold text-primary">
            #{row.original.id.slice(0, 7)}
          </span>
        ),
      },
      {
        id: 'created_at',
        accessorKey: 'createdAt',
        header: 'Data / Hora',
        cell: ({ row }) => (
          <span className="text-xs text-on-surface-variant font-medium whitespace-nowrap">
            {formatDate(row.original.createdAt)}
          </span>
        ),
      },
      {
        id: 'sector',
        accessorKey: 'sector',
        header: 'Setor',
        cell: ({ row }) => (
          <span className="text-xs font-semibold text-on-surface">
            {row.original.sector ?? '—'}
          </span>
        ),
      },
      {
        id: 'text',
        accessorKey: 'text',
        header: 'Descrição do Incidente',
        enableSorting: false,
        cell: ({ row }) => (
          <p className="text-xs md:text-sm text-on-surface-variant line-clamp-2 max-w-[340px]">
            {truncateText(row.original.text, 65)}
          </p>
        ),
      },
      {
        id: 'risk_level',
        accessorFn: (row) => row.classification.riskLevel,
        header: 'Classificação de Risco',
        cell: ({ row }) => {
          const { riskLevel, category, isManualOverride } = row.original.classification;

          const levelStyles: Record<string, { bg: string; dot: string }> = {
            [RiskLevel.CRITICO]: {
              bg: 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20',
              dot: 'bg-red-500',
            },
            [RiskLevel.MEDIO]: {
              bg: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20',
              dot: 'bg-amber-500',
            },
            [RiskLevel.BAIXO]: {
              bg: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
              dot: 'bg-emerald-500',
            },
          };

          const style = levelStyles[riskLevel] ?? levelStyles[RiskLevel.BAIXO];

          return (
            <div className="flex flex-col items-start gap-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${style?.bg}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${style?.dot}`} />
                  {riskLevel}
                </span>
                {isManualOverride && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                    Ajuste Manual
                  </span>
                )}
              </div>
              <span className="text-[11px] text-outline font-medium max-w-[180px] truncate">
                {category}
              </span>
            </div>
          );
        },
      },
      {
        id: 'actions',
        header: 'Ações',
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate(`/result/${row.original.id}`)}
              icon={<Eye size={14} />}
              iconPosition="left"
            >
              Ver
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => handleDelete(row.original.id)}
              isLoading={deletingId === row.original.id}
              icon={<Trash2 size={14} />}
              iconPosition="left"
            >
              Deletar
            </Button>
          </div>
        ),
      },
    ],
    [navigate, handleDelete, deletingId],
  );

  return (
    <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-xl p-5 shadow-xs hover:border-primary/40 hover:shadow-md transition-all duration-200">
      <div className="mb-4">
        <h2 className="text-headline-md text-on-surface font-semibold">Últimos Relatos Classificados</h2>
        <p className="text-xs text-on-surface-variant">
          Listagem detalhada das ocorrências registradas e avaliadas pelo modelo de IA.
        </p>
      </div>

      {isLoading && (
        <div className="py-12 flex justify-center">
          <LoadingSpinner size="md" message="Carregando relatos..." />
        </div>
      )}

      {isError && (
        <div className="py-6">
          <ErrorMessage
            title="Erro ao carregar relatos"
            message={error instanceof Error ? error.message : 'Falha ao carregar relatos.'}
            onRetry={() => refetch()}
          />
        </div>
      )}

      {!isLoading && !isError && (
        <DataTable
          columns={columns}
          data={reports ?? []}
          pageSize={5}
          onServerSort={handleSort}
          serverSort={
            sortState.orderColumn
              ? { column: sortState.orderColumn, direction: sortState.orderDir ?? 'desc' }
              : null
          }
        />
      )}
    </div>
  );
}

