import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/feedback/loading-spinner';
import { ErrorMessage } from '@/components/feedback/error-message';
import { useDashboardStats } from '@/hooks/api/use-dashboard-stats';
import { KpiCards } from './components/kpi-cards';
import { DonutChart } from './components/donut-chart';
import { BarChart } from './components/bar-chart';
import { RecentReportsTable } from './components/recent-reports-table';
import { RagInsightsSection } from './components/rag-insights-section';

export default function DashboardPage() {
  const { data: stats, isLoading, isError, error, refetch } = useDashboardStats();

  return (
    <motion.main
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="flex-grow w-full max-w-[1440px] mx-auto px-4 md:px-container-padding py-8 md:py-12"
    >
      {/* Page Title */}
      <div className="mb-8">
        <h1 className="text-headline-lg-mobile md:text-headline-lg text-on-background mb-2 font-bold">
          Visão Geral de Riscos
        </h1>
        <p className="text-body-lg text-on-surface-variant">
          Análise em tempo real dos relatos processados pelo sistema e inteligência regulatória.
        </p>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex justify-center py-24 bg-surface-container-lowest border border-outline-variant/60 rounded-xl shadow-xs">
          <LoadingSpinner size="lg" message="Carregando matrizes de risco e inteligência regulatória..." />
        </div>
      )}

      {/* Error State */}
      {isError && !stats && (
        <div className="flex justify-center py-12">
          <ErrorMessage
            message={
              error instanceof Error
                ? error.message
                : 'Erro ao carregar os dados do dashboard do servidor.'
            }
            onRetry={() => refetch()}
          />
        </div>
      )}

      {/* Dashboard Content */}
      {!isLoading && stats && (
        <motion.div
          initial="hidden"
          animate="show"
          variants={{
            hidden: { opacity: 0 },
            show: {
              opacity: 1,
              transition: {
                staggerChildren: 0.1,
              },
            },
          }}
        >
          {/* KPI Cards */}
          <motion.div
            variants={{
              hidden: { opacity: 0, y: 12 },
              show: { opacity: 1, y: 0 },
            }}
          >
            <KpiCards
              totalReports={stats.totalReports}
              totalReportsTrend={stats.totalReportsTrend}
              criticalCount={stats.criticalCount}
              criticalTrend={stats.criticalTrend}
              lowCount={stats.lowCount}
              lowTrend={stats.lowTrend}
            />
          </motion.div>

          {/* Charts Grid */}
          <motion.div
            variants={{
              hidden: { opacity: 0, y: 12 },
              show: { opacity: 1, y: 0 },
            }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-gutter mb-8"
          >
            {/* Donut Chart Card */}
            <Card className="lg:col-span-1 p-6 hover:border-primary/40 hover:shadow-md transition-all duration-200">
              <h3 className="text-body-lg font-semibold text-on-surface mb-1">Por Categoria de Risco</h3>
              <div className="w-full h-px bg-outline-variant/60 mb-4" />
              <DonutChart
                data={stats.categoryDistribution}
                total={stats.totalReports}
              />
            </Card>

            {/* Bar Chart Card */}
            <Card className="lg:col-span-2 p-6 hover:border-primary/40 hover:shadow-md transition-all duration-200">
              <h3 className="text-body-lg font-semibold text-on-surface mb-1">Incidentes por Setor</h3>
              <div className="w-full h-px bg-outline-variant/60 mb-4" />
              <BarChart data={stats.sectorDistribution} />
            </Card>
          </motion.div>

          {/* RAG Insights */}
          <motion.div
            variants={{
              hidden: { opacity: 0, y: 12 },
              show: { opacity: 1, y: 0 },
            }}
          >
            <RagInsightsSection />
          </motion.div>

          {/* Recent Reports Table — Decoupled independent service component */}
          <motion.div
            variants={{
              hidden: { opacity: 0, y: 12 },
              show: { opacity: 1, y: 0 },
            }}
          >
            <RecentReportsTable />
          </motion.div>
        </motion.div>
      )}
    </motion.main>
  );
}
