import { useState, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle,
  BrainCircuit,
  Gavel,
  BookOpen,
  ShieldCheck,
  Sliders,
  Check,
  LayoutDashboard,
  Plus,
  Info,
  ChevronDown,
  Loader2,
  FileText,
} from 'lucide-react';
import { toast } from 'sonner';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/feedback/loading-spinner';
import { EmptyState } from '@/components/feedback/empty-state';
import { ErrorMessage } from '@/components/feedback/error-message';
import { useReport } from '@/hooks/api/use-reports';
import { useQueryNorm } from '@/hooks/api/use-query-norm';
import { useUpdateClassification } from '@/hooks/api/use-update-classification';
import { RiskLevel } from '@/@types/enums';
import { RISK_LEVELS } from '@/lib/constants';

function RenderBoldText({ text }: { text: string }) {
  if (!text) return null;
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return (
    <>
      {parts.map((part, pIdx) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return (
            <strong key={pIdx} className="font-bold text-on-surface">
              {part.slice(2, -2)}
            </strong>
          );
        }
        return part;
      })}
    </>
  );
}

function FormattedMarkdown({ content }: { content: string }) {
  if (!content) return null;

  const sections = content.split(/(?=###|\n###)/g).filter((s) => s.trim().length > 0);

  return (
    <div className="flex flex-col gap-5 w-full">
      {sections.map((sec, idx) => {
        const lines = sec.trim().split('\n').map((l) => l.trim()).filter(Boolean);
        if (lines.length === 0) return null;

        let title = '';
        let bodyLines = lines;
        const firstLine = lines[0];
        if (firstLine && firstLine.startsWith('###')) {
          title = firstLine.replace(/^###\s*/, '');
          bodyLines = lines.slice(1);
        }

        return (
          <div
            key={idx}
            className="bg-surface-container-low/80 border border-outline-variant/50 rounded-xl p-5 shadow-xs flex flex-col gap-3 transition-all hover:border-primary/30"
          >
            {title && (
              <h4 className="text-body-lg font-bold text-primary border-b border-outline-variant/30 pb-2.5 flex items-center gap-2">
                {title}
              </h4>
            )}

            <div className="flex flex-col gap-2.5">
              {bodyLines.map((line, lIdx) => {
                const numMatch = line.match(/^(\d+)\.\s*(.*)/);
                if (numMatch) {
                  return (
                    <div key={lIdx} className="flex items-start gap-3 text-body-md text-on-surface">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary font-bold text-xs shrink-0 mt-0.5 border border-primary/20">
                        {numMatch[1]}
                      </span>
                      <div className="leading-relaxed pt-0.5">
                        <RenderBoldText text={numMatch[2] || ''} />
                      </div>
                    </div>
                  );
                }

                if (line.startsWith('- [ ]') || line.startsWith('-') || line.startsWith('•')) {
                  const cleanItem = line.replace(/^(?:-\s*\[\s*\]|-\s*|•\s*)/, '');
                  return (
                    <div key={lIdx} className="flex items-start gap-3 text-body-md text-on-surface">
                      <span className="w-2 h-2 rounded-full bg-primary shrink-0 mt-2.5" />
                      <div className="leading-relaxed">
                        <RenderBoldText text={cleanItem} />
                      </div>
                    </div>
                  );
                }

                return (
                  <p key={lIdx} className="text-body-md text-on-surface leading-relaxed">
                    <RenderBoldText text={line} />
                  </p>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

interface ResultRagSectionProps {
  reportId: string;
}

function ResultRagSection({ reportId }: ResultRagSectionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const normMutation = useQueryNorm();

  const handleToggle = useCallback(() => {
    const nextState = !isOpen;
    setIsOpen(nextState);
    if (nextState && normMutation.isIdle) {
      normMutation.mutate(reportId);
    }
  }, [isOpen, normMutation, reportId]);

  return (
    <div className="w-full mb-8">
      <button
        type="button"
        onClick={handleToggle}
        className={`w-full bg-primary text-on-primary py-4 px-6 flex items-center justify-between font-semibold transition-all duration-300 hover:bg-surface-tint focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer ${
          isOpen ? 'rounded-t-xl' : 'rounded-xl shadow-sm hover:shadow-md'
        }`}
        aria-expanded={isOpen}
      >
        <span className="flex items-center gap-3 text-headline-md">
          <Gavel size={22} />
          Diretrizes Normativas (NR)
        </span>
        <ChevronDown
          size={22}
          className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: 'easeInOut' }}
            className="overflow-hidden bg-surface-container-lowest border border-t-0 border-outline-variant/70 rounded-b-xl shadow-xs"
          >
            <div className="p-6 md:p-8 flex flex-col gap-4">
              {normMutation.isPending && (
                <div className="flex flex-col items-center justify-center py-10 gap-3 text-center">
                  <Loader2 size={32} className="text-primary animate-spin" />
                  <p className="text-body-md font-semibold text-on-surface">
                    Consultando inteligência regulatória RAG...
                  </p>
                  <p className="text-label-sm text-on-surface-variant">
                    Buscando trechos normativos oficiais e ações recomendadas nas NRs.
                  </p>
                  <div className="w-full max-w-md space-y-2 mt-2">
                    <div className="h-3 bg-surface-container-high rounded animate-pulse" />
                    <div className="h-3 bg-surface-container-high rounded animate-pulse w-5/6 mx-auto" />
                  </div>
                </div>
              )}

              {normMutation.isError && (
                <div className="flex items-start gap-3 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                  <AlertTriangle size={20} className="text-red-500 shrink-0 mt-0.5" />
                  <div className="flex-grow">
                    <p className="text-body-md font-semibold text-red-700 dark:text-red-400">
                      Falha ao consultar diretrizes normativas
                    </p>
                    <p className="text-body-md text-on-surface-variant mt-1">
                      {normMutation.error instanceof Error
                        ? normMutation.error.message
                        : 'Não foi possível recuperar a norma regulamentadora.'}
                    </p>
                    <button
                      type="button"
                      onClick={() => normMutation.mutate(reportId)}
                      className="mt-3 text-label-sm text-primary font-semibold hover:underline cursor-pointer"
                    >
                      Tentar novamente
                    </button>
                  </div>
                </div>
              )}

              {normMutation.isSuccess && normMutation.data && (
                <>
                  {!normMutation.data.foundInKnowledgeBase && (
                    <div className="bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 rounded-lg p-4 flex items-start gap-2">
                      <Info size={18} className="shrink-0 mt-0.5" />
                      <p className="text-label-sm">
                        <strong>Nota:</strong> Informação regulatória sintetizada via IA complementar.
                      </p>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <h3 className="text-headline-md text-secondary flex items-center gap-2 font-bold">
                      <BookOpen size={20} />
                      {normMutation.data.normTitle}
                    </h3>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-label-sm bg-tertiary-fixed text-on-tertiary-fixed border border-tertiary/30 shrink-0">
                      <ShieldCheck size={16} />
                      Base de Conhecimento Oficial
                    </span>
                  </div>

                  <div className="bg-surface-container-low/60 p-6 rounded-xl border border-outline-variant/40 shadow-xs">
                    <FormattedMarkdown content={normMutation.data.normResponse} />
                  </div>

                  {normMutation.data.sourceExcerpt && (
                    <div className="bg-surface-container-low rounded-lg p-4 border-l-4 border-secondary border border-surface-container">
                      <p className="text-label-sm text-outline uppercase tracking-wider mb-1 font-semibold">
                        Trecho Auditável da Norma:
                      </p>
                      <blockquote className="text-body-md text-on-surface-variant italic leading-relaxed">
                        &quot;{normMutation.data.sourceExcerpt}&quot;
                      </blockquote>
                    </div>
                  )}

                  <div className="bg-primary/5 rounded-lg p-4 border border-primary/20">
                    <p className="text-body-md text-on-surface">
                      <strong className="text-primary">Ação Corretiva Recomendada: </strong>
                      {normMutation.data.correctiveAction}
                    </p>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function ResultPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: report, isLoading, isError, error, refetch } = useReport(id ?? '');
  const updateMutation = useUpdateClassification();

  const [isCorrectionMode, setIsCorrectionMode] = useState(false);
  const [editedCategory, setEditedCategory] = useState<string | null>(null);
  const [editedRiskLevel, setEditedRiskLevel] = useState<RiskLevel | null>(null);
  const [correctionReason, setCorrectionReason] = useState('');
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (report?.classification?.isManualOverride) {
      setIsCorrectionMode(true);
    }
  }, [report?.classification?.isManualOverride]);


  const handleSaveCorrection = useCallback(() => {
    if (!id || !report) return;

    const newRiskLevel = editedRiskLevel ?? (report.classification.riskLevel as RiskLevel);
    const newCategory = editedCategory ?? report.classification.category;

    updateMutation.mutate(
      {
        id,
        category: newCategory,
        riskLevel: newRiskLevel,
        correctionReason,
      },
      {
        onSuccess: () => {
          toast.success('Ajuste técnico salvo com sucesso!');
          setIsSaved(true);
          setIsCorrectionMode(false);
        },
      },
    );
  }, [id, report, editedRiskLevel, editedCategory, correctionReason, updateMutation]);

  // 1. Empty State
  if (!id) {
    return (
      <main className="flex-grow w-full max-w-[1440px] mx-auto px-6 md:px-container-padding py-gutter flex justify-center items-center">
        <EmptyState
          title="Nenhuma Análise Realizada"
          description="Você ainda não enviou um relato nesta sessão ou não selecionou uma classificação específica para consulta."
          actionText="Relatar Incidente"
          actionPath="/"
          secondaryActionText="Ver Dashboard de Riscos"
          secondaryActionPath="/dashboard"
        />
      </main>
    );
  }

  // 2. Loading State
  if (isLoading) {
    return (
      <main className="flex-grow flex items-center justify-center py-24">
        <LoadingSpinner size="lg" message="Carregando resultado da análise..." />
      </main>
    );
  }

  // 3. Error State / Report Not Found
  if (isError || !report) {
    return (
      <main className="flex-grow flex items-center justify-center py-24 px-6">
        <ErrorMessage
          title="Classificação não encontrada"
          message={
            error instanceof Error
              ? error.message
              : 'Não foi possível carregar os detalhes da classificação solicitada.'
          }
          onRetry={() => refetch()}
        />
      </main>
    );
  }

  const { classification } = report;
  const currentRiskLevel = editedRiskLevel ?? (classification.riskLevel as RiskLevel);
  const currentCategory = editedCategory ?? classification.category;

  return (
    <motion.main
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="flex-grow w-full max-w-[1440px] mx-auto px-6 md:px-container-padding py-gutter"
    >
      <div className="max-w-3xl w-full mx-auto flex flex-col items-center">
        {/* Header with Warning Icon */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-6 text-center flex flex-col items-center"
        >
          <div className="w-16 h-16 rounded-full bg-secondary-container/40 flex items-center justify-center text-secondary mb-4 shadow-sm">
            <AlertTriangle size={36} />
          </div>
          <h1 className="text-headline-lg-mobile md:text-headline-lg text-on-surface mb-4 font-bold">
            Resultado da Análise
          </h1>

          <div className="flex flex-col items-center gap-3">
            <Badge riskLevel={currentRiskLevel} className="px-4 py-2 text-label-md">
              {currentCategory} - {currentRiskLevel}
            </Badge>

            {/* Manual Correction Indicator Badge */}
            {(isSaved || classification.isManualOverride) && (
              <motion.span
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-label-sm bg-secondary-container/40 text-on-secondary-container border border-secondary/40 font-medium"
              >
                <ShieldCheck size={16} />
                Ajustado Manualmente pelo Técnico
              </motion.span>
            )}
          </div>
        </motion.div>

        {/* Incident Description / Source File Card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="w-full mb-6"
        >
          <Card className="w-full bg-surface-container-lowest border-outline-variant/60">
            <div className="p-5 md:p-6 flex flex-col gap-3">
              <div className="flex items-center justify-between border-b border-outline-variant/40 pb-3">
                <div className="flex items-center gap-2 text-primary font-bold text-headline-md">
                  <FileText size={20} />
                  <h2>Relato do Incidente Analisado</h2>
                </div>
                {report.text.startsWith('[Arquivo Anexado:') ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                    Documento Anexado
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                    Relato em Texto
                  </span>
                )}
              </div>

              <div className="bg-surface-container-low/70 p-4 rounded-lg border border-outline-variant/30 text-body-md text-on-surface leading-relaxed whitespace-pre-wrap max-h-60 overflow-y-auto">
                {report.text}
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Minimalist Professional Correction Toggle Switch */}
        <div className="w-full flex justify-end mb-4">

          <label className="inline-flex items-center gap-2 cursor-pointer select-none text-label-sm text-on-surface-variant hover:text-primary transition-colors font-medium">
            <Sliders size={18} />
            <span>Ajuste Técnico Manual</span>
            <input
              type="checkbox"
              checked={isCorrectionMode}
              onChange={(e) => {
                setIsCorrectionMode(e.target.checked);
                if (e.target.checked && !editedRiskLevel) {
                  setEditedRiskLevel(currentRiskLevel);
                  setEditedCategory(currentCategory);
                }
              }}
              className="sr-only peer"
            />
            <div className="relative w-9 h-5 bg-surface-container-high peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-on-surface-variant peer-checked:after:bg-on-primary after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary" />
          </label>
        </div>

        {/* Minimalist Professional Adjustment Panel */}
        <AnimatePresence>
          {isCorrectionMode && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="w-full overflow-hidden mb-8"
            >
              <Card className="w-full border-primary/40 bg-surface-container-low">
                <div className="p-6 flex flex-col gap-5">
                  <div className="flex items-center justify-between border-b border-outline-variant pb-3">
                    <div className="flex items-center gap-2 text-primary font-semibold text-label-md">
                      <Sliders size={18} />
                      <span>Correção Técnica por Profissional de SST</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsCorrectionMode(false)}
                      className="text-on-surface-variant hover:text-primary text-label-sm cursor-pointer font-medium"
                    >
                      Cancelar
                    </button>
                  </div>

                  {/* Select Risk Level Chips */}
                  <div className="flex flex-col gap-2">
                    <label className="text-label-sm text-on-surface font-semibold">Alterar Nível de Risco:</label>
                    <div className="flex flex-wrap gap-2">
                      {RISK_LEVELS.map((level) => {
                        const isSelected = (editedRiskLevel ?? currentRiskLevel) === level;
                        return (
                          <button
                            key={level}
                            type="button"
                            onClick={() => setEditedRiskLevel(level)}
                            className={`px-4 py-2 rounded-full text-label-sm font-semibold cursor-pointer transition-all ${
                              isSelected
                                ? 'bg-primary text-on-primary shadow-sm'
                                : 'bg-surface border border-outline-variant text-on-surface-variant hover:border-primary'
                            }`}
                          >
                            {level}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Select Category */}
                  <div className="flex flex-col gap-2">
                    <label className="text-label-sm text-on-surface font-semibold" htmlFor="categoryInput">
                      Categoria Ajustada:
                    </label>
                    <input
                      id="categoryInput"
                      type="text"
                      value={editedCategory ?? currentCategory}
                      onChange={(e) => setEditedCategory(e.target.value)}
                      placeholder="Ex: Risco Químico, Risco Ergonômico..."
                      className="bg-surface-bright border border-outline-variant rounded-lg p-3 text-body-md text-on-surface focus:border-primary focus:outline-none"
                    />
                  </div>

                  {/* Justification / Reason */}
                  <div className="flex flex-col gap-2">
                    <label className="text-label-sm text-on-surface font-semibold" htmlFor="reasonInput">
                      Motivo da Alteração (Opcional):
                    </label>
                    <input
                      id="reasonInput"
                      type="text"
                      value={correctionReason}
                      onChange={(e) => setCorrectionReason(e.target.value)}
                      placeholder="Ex: Reavaliação técnica presencial identificou agravante..."
                      className="bg-surface-bright border border-outline-variant rounded-lg p-3 text-body-md text-on-surface focus:border-primary focus:outline-none"
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end gap-3 pt-2">
                    <Button
                      variant="primary"
                      isLoading={updateMutation.isPending}
                      onClick={handleSaveCorrection}
                      icon={<Check size={18} />}
                    >
                      Salvar Ajuste Técnico
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* XAI Evidence Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="w-full mb-8"
        >
          <Card className="w-full">
            <div className="p-6 md:p-8">
              <h2 className="text-headline-md text-primary flex items-center gap-2 mb-4 font-semibold">
                <BrainCircuit size={22} />
                Análise Técnica de Evidências
              </h2>

              <p className="text-body-lg text-on-surface-variant mb-4">
                A determinação do nível de{' '}
                <strong className="text-on-surface">
                  {currentCategory} - {currentRiskLevel}
                </strong>{' '}
                baseia-se na identificação técnica dos seguintes parâmetros no relato
                do incidente:
              </p>

              {/* Evidence Chips */}
              <div className="flex flex-wrap gap-2 mb-4">
                {classification.xaiHighlightedTerms.map((term, i) => (
                  <motion.span
                    key={term}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: 0.3 + i * 0.05 }}
                    className="bg-surface-variant text-on-surface-variant px-3 py-1 rounded-md text-label-sm border border-outline-variant font-medium"
                  >
                    &quot;{term}&quot;
                  </motion.span>
                ))}
              </div>

              {/* Technical Justification */}
              <p className="text-body-md text-outline italic mt-4">
                {classification.xaiJustification}
              </p>

              {/* Professional Note if edited */}
              {(correctionReason || classification.correctionReason) && (
                <div className="mt-4 p-4 bg-secondary-container/20 border border-secondary/30 rounded-lg">
                  <p className="text-body-md text-on-surface">
                    <strong className="text-secondary font-bold">Observação do Técnico: </strong>
                    {correctionReason || classification.correctionReason}
                  </p>
                </div>
              )}
            </div>
          </Card>
        </motion.div>

        {/* Unified RAG Accordion Section — Single Component */}
        <ResultRagSection reportId={id} />

        {/* Divider */}
        <div className="w-full h-px bg-outline-variant mb-8" />

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4 pb-8">
          <Button
            variant="primary"
            onClick={() => navigate('/dashboard')}
            icon={<LayoutDashboard size={18} />}
            iconPosition="left"
          >
            Ir para Dashboard
          </Button>
          <Button
            variant="secondary"
            onClick={() => navigate('/')}
            icon={<Plus size={18} />}
            iconPosition="left"
          >
            Nova Análise
          </Button>
        </div>
      </div>
    </motion.main>
  );
}
