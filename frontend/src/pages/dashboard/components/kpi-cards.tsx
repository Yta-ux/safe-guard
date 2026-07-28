import { ClipboardList, AlertOctagon, ShieldCheck, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Tooltip } from '@/components/ui/tooltip';
import { formatNumber } from '@/lib/utils';

interface KpiCardsProps {
  totalReports: number;
  totalReportsTrend: string;
  criticalCount: number;
  criticalTrend: string;
  lowCount: number;
  lowTrend: string;
}

export function KpiCards({
  totalReports,
  totalReportsTrend,
  criticalCount,
  criticalTrend,
  lowCount,
  lowTrend,
}: KpiCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {/* Total Reports Card */}
      <Card className="p-5 transition-all duration-200 border-outline-variant/60 hover:border-primary/40 hover:shadow-md">
        <div className="flex justify-between items-center mb-3">
          <span className="text-xs uppercase tracking-wider font-semibold text-on-surface-variant">
            Total de Relatos
          </span>
          <Tooltip content="Total de acidentes e incidentes registrados no sistema" side="top" align="right">
            <div className="w-8 h-8 rounded-lg bg-surface-container-high flex items-center justify-center text-primary shrink-0 cursor-help border border-outline-variant/40">
              <ClipboardList size={18} />
            </div>
          </Tooltip>
        </div>
        <div className="flex items-baseline justify-between gap-2 mt-2">
          <span className="text-3xl font-extrabold text-on-surface tracking-tight">
            {formatNumber(totalReports)}
          </span>
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
            <TrendingUp size={13} />
            {totalReportsTrend}
          </span>
        </div>
      </Card>

      {/* Critical Risk Card */}
      <Card className="p-5 transition-all duration-200 border-outline-variant/60 hover:border-primary/40 hover:shadow-md">
        <div className="flex justify-between items-center mb-3">
          <span className="text-xs uppercase tracking-wider font-semibold text-on-surface-variant">
            Risco Crítico
          </span>
          <Tooltip content="Total de relatos classificados em nível crítico de severidade" side="top" align="right">
            <div className="w-8 h-8 rounded-lg bg-red-500/10 dark:bg-red-500/20 flex items-center justify-center text-red-500 shrink-0 cursor-help border border-red-500/20">
              <AlertOctagon size={18} />
            </div>
          </Tooltip>
        </div>
        <div className="flex items-baseline justify-between gap-2 mt-2">
          <span className="text-3xl font-extrabold text-on-surface tracking-tight">
            {formatNumber(criticalCount)}
          </span>
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
            <TrendingDown size={13} />
            {criticalTrend}
          </span>
        </div>
      </Card>

      {/* Low Risk Card */}
      <Card className="p-5 transition-all duration-200 border-outline-variant/60 hover:border-primary/40 hover:shadow-md">
        <div className="flex justify-between items-center mb-3">
          <span className="text-xs uppercase tracking-wider font-semibold text-on-surface-variant">
            Risco Baixo
          </span>
          <Tooltip content="Total de relatos classificados em nível baixo de severidade" side="top" align="right">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 dark:bg-emerald-500/20 flex items-center justify-center text-emerald-500 shrink-0 cursor-help border border-emerald-500/20">
              <ShieldCheck size={18} />
            </div>
          </Tooltip>
        </div>
        <div className="flex items-baseline justify-between gap-2 mt-2">
          <span className="text-3xl font-extrabold text-on-surface tracking-tight">
            {formatNumber(lowCount)}
          </span>
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-surface-variant text-on-surface-variant border border-outline-variant/50">
            <Minus size={13} />
            {lowTrend}
          </span>
        </div>
      </Card>
    </div>
  );
}
