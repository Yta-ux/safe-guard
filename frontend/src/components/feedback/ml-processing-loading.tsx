import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Brain, Cpu, Search, CheckCircle2, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface MlProcessingLoadingProps {
  title?: string;
  overlay?: boolean;
  steps?: string[];
}

const DEFAULT_STEPS = [
  'Iniciando pré-processamento do relato...',
  'Analisando léxico e contexto do ocorrido...',
  'Processando modelo de IA para extração de evidências (XAI)...',
  'Consultando diretrizes e matrizes de risco em segurança...',
  'Finalizando classificação e gerando pontuação de confiança...',
];

const ICONS = [Bot, Brain, Cpu, Search, CheckCircle2];

export function MlProcessingLoading({
  title = 'Processando Classificação por IA',
  overlay = true,
  steps = DEFAULT_STEPS,
}: MlProcessingLoadingProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  // Cycle through steps smoothly
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStepIndex((prev) => (prev < steps.length - 1 ? prev + 1 : prev));
    }, 1600);
    return () => clearInterval(interval);
  }, [steps.length]);

  const progressPercentage = Math.min(((currentStepIndex + 1) / steps.length) * 100, 100);
  const CurrentIcon = ICONS[currentStepIndex % ICONS.length];

  const content = (
    <Card className="max-w-lg w-full mx-auto p-8 shadow-xl border-primary/30 bg-surface-container-lowest relative overflow-hidden">
      {/* Top Subtle Animated Accent Line */}
      <motion.div
        className="absolute top-0 left-0 h-1 bg-gradient-to-r from-primary via-secondary to-primary"
        initial={{ x: '-100%' }}
        animate={{ x: '100%' }}
        transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
      />

      <div className="flex flex-col items-center text-center gap-6 py-2">
        {/* Mailflow-style Glowing Animated Central Icon Badge */}
        <div className="relative flex items-center justify-center">
          {/* Outer Glowing Ring Pulse */}
          <motion.div
            className="absolute w-24 h-24 rounded-full bg-primary/10 border border-primary/30"
            animate={{ scale: [1, 1.25, 1], opacity: [0.4, 0.8, 0.4] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />

          {/* Secondary Orbit Ring */}
          <motion.div
            className="absolute w-28 h-28 rounded-full border border-dashed border-secondary/40"
            animate={{ rotate: 360 }}
            transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
          />

          {/* Inner Badge */}
          <motion.div
            key={currentStepIndex}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="w-16 h-16 rounded-full bg-gradient-to-tr from-primary to-primary-container flex items-center justify-center shadow-lg z-10 text-on-primary"
          >
            {CurrentIcon && <CurrentIcon size={30} />}
          </motion.div>
        </div>

        {/* Title */}
        <div className="flex flex-col gap-1">
          <h3 className="text-headline-md text-on-surface font-semibold">{title}</h3>
          <p className="text-label-sm text-outline uppercase tracking-wider font-semibold">
            Assistente de Classificação de Risco
          </p>
        </div>

        {/* Animated Dynamic Cycling Step Text */}
        <div className="h-14 flex items-center justify-center px-4 w-full">
          <AnimatePresence mode="wait">
            <motion.p
              key={currentStepIndex}
              initial={{ y: 12, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -12, opacity: 0 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="text-body-md text-primary font-medium flex items-center justify-center gap-2"
            >
              <Loader2 size={18} className="animate-spin text-primary shrink-0" />
              {steps[currentStepIndex]}
            </motion.p>
          </AnimatePresence>
        </div>

        {/* Animated Progress Bar */}
        <div className="w-full bg-surface-container-high h-2 rounded-full overflow-hidden p-0.5 relative">
          <motion.div
            className="bg-gradient-to-r from-primary via-secondary to-primary h-full rounded-full"
            initial={{ width: '5%' }}
            animate={{ width: `${progressPercentage}%` }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
          />
        </div>

        {/* Interactive Step Indicators */}
        <div className="flex items-center justify-center gap-2 w-full pt-1">
          {steps.map((_, index) => {
            const isDone = index < currentStepIndex;
            const isCurrent = index === currentStepIndex;

            return (
              <motion.div
                key={index}
                className={`h-2 rounded-full transition-all duration-300 ${
                  isDone
                    ? 'w-6 bg-primary'
                    : isCurrent
                    ? 'w-8 bg-secondary'
                    : 'w-2 bg-outline-variant/60'
                }`}
                animate={isCurrent ? { scale: [1, 1.15, 1] } : { scale: 1 }}
                transition={isCurrent ? { duration: 1, repeat: Infinity } : {}}
              />
            );
          })}
        </div>
      </div>
    </Card>
  );

  if (overlay) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-background/80 backdrop-blur-md flex items-center justify-center z-50 p-4"
      >
        {content}
      </motion.div>
    );
  }

  return content;
}
