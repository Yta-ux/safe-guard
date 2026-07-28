import { useState, useCallback } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip } from '@/components/ui/tooltip';

export interface ServerSortEvent {
  column: string;
  direction: 'asc' | 'desc';
}

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  pageSize?: number;
  emptyText?: string;
  /** When provided, sorting is delegated to the server. The callback fires on header click. */
  onServerSort?: (sort: ServerSortEvent) => void;
  /** Current server sort state (for visual indicators). */
  serverSort?: ServerSortEvent | null;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  pageSize = 5,
  emptyText = 'Nenhum registro encontrado.',
  onServerSort,
  serverSort,
}: DataTableProps<TData, TValue>) {
  const [clientSorting, setClientSorting] = useState<SortingState>([]);
  const isServerSorted = Boolean(onServerSort);

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting: isServerSorted ? [] : clientSorting,
    },
    onSortingChange: isServerSorted ? undefined : setClientSorting,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: isServerSorted ? undefined : getSortedRowModel(),
    manualSorting: isServerSorted,
    initialState: {
      pagination: {
        pageSize,
      },
    },
  });

  const handleHeaderClick = useCallback(
    (columnId: string) => {
      if (!onServerSort) return;

      const nextDir =
        serverSort?.column === columnId && serverSort.direction === 'desc'
          ? 'asc'
          : 'desc';

      onServerSort({ column: columnId, direction: nextDir });
    },
    [onServerSort, serverSort],
  );

  return (
    <div className="w-full flex flex-col gap-4">
      {/* Table Canvas */}
      <div className="overflow-x-auto border border-outline-variant/60 rounded-lg bg-surface-container-lowest shadow-xs">
        <table className="w-full text-left text-sm">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="border-b border-outline-variant/60 bg-surface-container-low/50">
                {headerGroup.headers.map((header) => {
                  const canSort = isServerSorted
                    ? header.column.id !== 'actions'
                    : header.column.getCanSort();

                  // Server sort visual state
                  const isThisColumnSorted = isServerSorted
                    ? serverSort?.column === header.column.id
                    : header.column.getIsSorted();

                  const sortDirection = isServerSorted
                    ? (serverSort?.column === header.column.id ? serverSort.direction : false)
                    : header.column.getIsSorted();

                  return (
                    <th
                      key={header.id}
                      className="py-3 px-4 text-xs font-semibold uppercase tracking-wider text-on-surface-variant select-none"
                    >
                      {header.isPlaceholder ? null : (
                        <div
                          className={
                            canSort
                              ? 'group flex items-center gap-1.5 cursor-pointer hover:text-primary transition-colors'
                              : ''
                          }
                          onClick={
                            isServerSorted
                              ? () => handleHeaderClick(header.column.id)
                              : header.column.getToggleSortingHandler()
                          }
                        >
                          <span className={isThisColumnSorted ? 'text-primary font-bold' : ''}>
                            {flexRender(header.column.columnDef.header, header.getContext())}
                          </span>
                          {canSort && (
                            <span className="shrink-0">
                              {sortDirection === 'asc' && (
                                <ArrowUp size={14} className="text-primary font-bold animate-in fade-in" />
                              )}
                              {sortDirection === 'desc' && (
                                <ArrowDown size={14} className="text-primary font-bold animate-in fade-in" />
                              )}
                              {!sortDirection && (
                                <ArrowUpDown size={13} className="text-outline/40 group-hover:text-primary/70 transition-colors" />
                              )}
                            </span>
                          )}
                        </div>
                      )}
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-surface-container/60">
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                className="hover:bg-surface-container-low/60 transition-colors"
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="py-3 px-4 text-xs md:text-sm text-on-surface">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}

            {table.getRowModel().rows.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="py-8 text-center text-sm text-on-surface-variant">
                  {emptyText}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* DataTable Pagination Footer */}
      {table.getPageCount() > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-1 py-1">
          <div className="text-xs text-on-surface-variant font-medium">
            Página <span className="font-semibold text-on-surface">{table.getState().pagination.pageIndex + 1}</span> de{' '}
            <span className="font-semibold text-on-surface">{table.getPageCount()}</span> ({data.length} relatos totais)
          </div>

          <div className="flex items-center gap-1">
            <Tooltip content="Primeira Página">
              <Button
                variant="secondary"
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
                className="p-1.5 h-8 w-8"
              >
                <ChevronsLeft size={16} />
              </Button>
            </Tooltip>
            <Tooltip content="Página Anterior">
              <Button
                variant="secondary"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                className="p-1.5 h-8 w-8"
              >
                <ChevronLeft size={16} />
              </Button>
            </Tooltip>
            <Tooltip content="Próxima Página">
              <Button
                variant="secondary"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                className="p-1.5 h-8 w-8"
              >
                <ChevronRight size={16} />
              </Button>
            </Tooltip>
            <Tooltip content="Última Página">
              <Button
                variant="secondary"
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
                className="p-1.5 h-8 w-8"
              >
                <ChevronsRight size={16} />
              </Button>
            </Tooltip>
          </div>
        </div>
      )}
    </div>
  );
}
