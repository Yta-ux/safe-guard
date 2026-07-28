import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gavel, Search, Send, BookOpen, ShieldCheck, AlertTriangle, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useDashboardRagQuery } from '@/hooks/api/use-dashboard-rag';

const PRESET_QUERIES = [
  { label: '⚡ NR-10: Prevenção de Choque e Bloqueio Elétrico', query: 'Como prevenir acidentes elétricos, choque elétrico e procedimento LOTO de desenergização' },
  { label: '⚙️ NR-12: Proteção de Máquinas e Intertravamento', query: 'Proteções físicas, paradas de emergência e prevenção de esmagamento em máquinas' },
  { label: '🦺 NR-35: Trabalho em Altura e Cinto de Segurança', query: 'Requisitos para trabalho em altura, cinto paraquedista e pontos de ancoragem' },
  { label: '☣️ NR-33: Entrada em Espaço Confinado (PET)', query: 'Medição contínua de gases, PET e presença de vigia em espaço confinado' },
  { label: '🏗️ NR-18: Escavações e Prevenção de Soterramento', query: 'Escoramento de valas, trincheiras e prevenção de desabamentos na construção civil' },
  { label: '🔥 NR-23: Proteção e Sinalização Contra Incêndios', query: 'Medidas de combate a incêndio, extintores e saídas de emergência' },
];

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
    <div className="flex flex-col gap-4 w-full">
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
              <h4 className="text-body-lg font-bold text-primary border-b border-outline-variant/30 pb-2 flex items-center gap-2">
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

export function RagInsightsSection() {
  const [searchQuery, setSearchQuery] = useState('');
  const ragMutation = useDashboardRagQuery();

  const handleSearch = (queryText: string) => {
    const trimmed = queryText.trim();
    if (!trimmed || ragMutation.isPending) return;
    ragMutation.mutate(trimmed);
  };

  return (
    <Card className="w-full p-6 md:p-8 mb-8 border-secondary/30 bg-surface-container-lowest shadow-sm hover:border-secondary/60 hover:shadow-md transition-all duration-200">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-secondary-container/50 flex items-center justify-center text-on-secondary-container shrink-0">
          <Gavel size={22} />
        </div>
        <div>
          <h2 className="text-headline-md text-on-surface font-semibold">Assistente Normativo RAG</h2>
          <p className="text-body-md text-on-surface-variant">
            Consulte diretrizes regulamentadoras brasileiras (NRs) via busca semântica ou selecione consultas prontas.
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex flex-col md:flex-row gap-3 mb-4">
        <div className="relative flex-grow">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-outline" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch(searchQuery)}
            placeholder="Ex: Quais medidas são obrigatórias para prevenir acidentes elétricos?"
            disabled={ragMutation.isPending}
            className="w-full bg-surface-bright border border-outline-variant rounded-lg pl-10 pr-4 py-3 text-body-md text-on-surface placeholder:text-outline focus:border-primary focus:ring-2 focus:ring-primary-container focus:outline-none transition-shadow disabled:opacity-60"
          />
        </div>
        <Button
          variant="primary"
          onClick={() => handleSearch(searchQuery)}
          isLoading={ragMutation.isPending}
          icon={<Send size={18} />}
        >
          Consultar
        </Button>
      </div>

      {/* Quick Preset Chips */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <span className="text-label-sm text-outline uppercase tracking-wider mr-1 font-semibold">Consultas Rápidas Recomendadas:</span>
        {PRESET_QUERIES.map((preset) => (
          <button
            key={preset.label}
            type="button"
            disabled={ragMutation.isPending}
            onClick={() => {
              setSearchQuery(preset.query);
              handleSearch(preset.query);
            }}
            className="px-3.5 py-2 rounded-full text-label-sm bg-surface border border-outline-variant text-on-surface-variant hover:border-primary hover:bg-primary/10 hover:text-primary cursor-pointer transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-2xs"
          >
            {preset.label}
          </button>
        ))}
      </div>

      {/* Loading State */}
      <AnimatePresence mode="wait">
        {ragMutation.isPending && (
          <motion.div
            key="loading"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="mt-6 pt-6 border-t border-outline-variant/60"
          >
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <Loader2 size={32} className="text-secondary animate-spin" />
              <div className="text-center">
                <p className="text-body-lg text-on-surface font-semibold">Buscando Diretrizes na Base RAG</p>
                <p className="text-body-md text-on-surface-variant mt-1">
                  Executando busca por similaridade semântica nas Normas Regulamentadoras...
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Error State */}
        {ragMutation.isError && (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="mt-6 pt-6 border-t border-outline-variant/60"
          >
            <div className="flex items-start gap-3 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
              <AlertTriangle size={20} className="text-red-500 shrink-0 mt-0.5" />
              <div className="flex-grow">
                <p className="text-body-md font-semibold text-red-700 dark:text-red-400">
                  Falha ao consultar assistente regulatório RAG
                </p>
                <p className="text-body-md text-on-surface-variant mt-1">
                  {ragMutation.error instanceof Error ? ragMutation.error.message : 'Tente novamente.'}
                </p>
                <button
                  type="button"
                  onClick={() => handleSearch(searchQuery)}
                  className="mt-3 text-label-sm text-primary font-semibold hover:underline cursor-pointer"
                >
                  Tentar novamente
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Result */}
        {ragMutation.isSuccess && ragMutation.data && !ragMutation.isPending && (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.4 }}
            className="mt-6 pt-6 border-t border-outline-variant/60 flex flex-col gap-4"
          >
            {/* Norm Title */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-secondary font-bold text-headline-md">
                <BookOpen size={20} />
                <h3>{ragMutation.data.normTitle}</h3>
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-label-sm bg-tertiary-fixed text-on-tertiary-fixed border border-tertiary/30">
                <ShieldCheck size={16} />
                Base de Conhecimento Oficial
              </span>
            </div>

            {/* Formatted Markdown Sections */}
            <FormattedMarkdown content={ragMutation.data.summary} />

            {/* Source Excerpt */}
            {ragMutation.data.sourceExcerpt && (
              <div className="bg-surface-container-low rounded-lg p-4 border-l-4 border-secondary border border-surface-container mt-2">
                <p className="text-label-sm text-outline uppercase tracking-wider mb-1 font-semibold">
                  Trecho da Norma (Auditável):
                </p>
                <blockquote className="text-body-md text-on-surface-variant italic leading-relaxed">
                  &quot;{ragMutation.data.sourceExcerpt}&quot;
                </blockquote>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}
