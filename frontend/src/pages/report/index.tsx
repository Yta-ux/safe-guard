import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, FileText, Zap, ShieldAlert, Flame, Wind, Construction, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardHeader, CardBody } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { FileDropzone } from '@/components/ui/file-dropzone';
import { ErrorMessage } from '@/components/feedback/error-message';
import { MlProcessingLoading } from '@/components/feedback/ml-processing-loading';
import { useClassifyReport } from '@/hooks/api/use-classify-report';
import { MIN_REPORT_CHARS, MAX_REPORT_CHARS } from '@/lib/constants';

const INCIDENT_EXAMPLES = [
  {
    label: 'Elétrico',
    icon: Zap,
    text: 'Fui trocar uma caixa de energia numa subestação e ocorreu uma explosão no local, tornando um ambiente com alta propensão a acidentes elétricos e risco grave de arco elétrico.',
  },
  {
    label: 'Esmagamento',
    icon: ShieldAlert,
    text: 'Durante a operação de limpeza da esteira de roletes na linha de embalagem, o operador teve a mão puxada para o ponto de prensamento por falta de proteção física intertravada e ausência de bloqueio LOTO.',
  },
  {
    label: 'Queda',
    icon: AlertCircle,
    text: 'Trabalhador executando manutenção em telhado industrial a 5 metros de altura escorregou da estrutura. Não havia linha de vida instalada e o cinto paraquedista estava sem ancoragem.',
  },
  {
    label: 'Incêndio / Explosão',
    icon: Flame,
    text: 'Houve vazamento de solvente inflamável próximo à área de soldagem. As faíscas da operação entraram em contato com os vapores do combustível, provocando princípio de incêndio e deflagração.',
  },
  {
    label: 'Asfixia / Intoxicação',
    icon: Wind,
    text: 'Operador entrou em tanque de estocagem de produtos químicos sem medição contínua de gases e sem sistema de exaustão, apresentando tontura e mal-estar por inalação de vapores tóxicos.',
  },
  {
    label: 'Colapso Estrutural',
    icon: Construction,
    text: 'Durante escavação de vala com 3 metros de profundidade para tubulação de esgoto, ocorreu o desmoronamento do talude lateral devido à ausência de escoramento e contenção estrutural.',
  },
];

export default function ReportPage() {
  const navigate = useNavigate();
  const classifyMutation = useClassifyReport();

  const [text, setText] = useState('');
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleFileSelect = useCallback((file: File) => {
    setAttachedFile(file);
    setValidationError(null);
    toast.success(`Arquivo "${file.name}" anexado! Envie para o backend analisar o documento por completo.`);
  }, []);

  const handleFileClear = useCallback(() => {
    setAttachedFile(null);
    setValidationError(null);
  }, []);

  const handleSelectExample = useCallback((exampleText: string) => {
    setText(exampleText);
    setAttachedFile(null);
    setValidationError(null);
    toast.info('Exemplo de relato carregado no campo de texto.');
  }, []);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      setValidationError(null);

      if (attachedFile) {
        classifyMutation.mutate(
          { file: attachedFile },
          {
            onSuccess: (data) => {
              toast.success('Documento analisado e classificado com sucesso!');
              navigate(`/result/${data.classification.id}`);
            },
          },
        );
        return;
      }

      const trimmedText = text.trim();
      if (!trimmedText || trimmedText.length < MIN_REPORT_CHARS) {
        setValidationError(
          `Por favor, digite um relato (mínimo ${MIN_REPORT_CHARS} caracteres) OU anexe um arquivo para a IA analisar.`
        );
        return;
      }

      classifyMutation.mutate(
        { text: trimmedText.slice(0, MAX_REPORT_CHARS) },
        {
          onSuccess: (data) => {
            toast.success('Relato analisado e classificado com sucesso!');
            navigate(`/result/${data.classification.id}`);
          },
        },
      );
    },
    [text, attachedFile, classifyMutation, navigate],
  );

  return (
    <>
      <AnimatePresence>
        {classifyMutation.isPending && (
          <MlProcessingLoading
            title={attachedFile ? 'Analisando Documento no Backend' : 'Classificando Relato por IA'}
            overlay
            steps={
              attachedFile
                ? [
                    'Enviando arquivo completo para o servidor...',
                    'Extraindo texto de todas as páginas do documento...',
                    'Filtrando palavras-chave e mapeando sinônimos de segurança...',
                    'Executando modelo de Linguagem Natural e ML Pipeline...',
                    'Gerando classificação final com evidências (XAI)...',
                  ]
                : [
                    'Analisando texto/relatório em busca de evidências...',
                    'Filtrando palavras-chave e termos técnicos de segurança...',
                    'Executando modelo de Inteligência Artificial...',
                    'Calculando severidade e probabilidade de risco...',
                    'Finalizando classificação preliminar do incidente...',
                  ]
            }
          />
        )}
      </AnimatePresence>

      <motion.main
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -16 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="flex-grow w-full max-w-[1440px] mx-auto px-6 md:px-container-padding py-gutter flex justify-center items-start pt-8 md:pt-12"
      >
        <Card className="w-full max-w-3xl border-outline-variant/60 hover:border-primary/40 hover:shadow-md transition-all duration-200">
          <CardHeader>
            <h1 className="text-headline-lg-mobile md:text-headline-lg text-on-surface font-bold">
              Relatar Incidente/Acidente
            </h1>
            <p className="text-body-md text-on-surface-variant">
              Descreva o ocorrido no campo abaixo, selecione um exemplo prático <strong>OU</strong> faça upload de um arquivo para análise.
            </p>
          </CardHeader>

          <CardBody>
            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              {classifyMutation.isError && (
                <ErrorMessage
                  message={
                    classifyMutation.error instanceof Error
                      ? classifyMutation.error.message
                      : 'Erro ao classificar o relato. Tente novamente.'
                  }
                  onRetry={() => classifyMutation.reset()}
                />
              )}

              {/* Quick Incident Examples */}
              <div className="flex flex-col gap-2.5">
                <span className="text-label-sm font-semibold text-on-surface uppercase tracking-wider">
                  Testar com Exemplos de Incidentes Mapeados:
                </span>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {INCIDENT_EXAMPLES.map((ex) => {
                    const Icon = ex.icon;
                    return (
                      <button
                        key={ex.label}
                        type="button"
                        onClick={() => handleSelectExample(ex.text)}
                        className="flex items-center gap-2 p-2.5 rounded-lg border border-outline-variant/60 bg-surface-container-low hover:border-primary hover:bg-primary/5 transition-all text-left text-xs font-semibold text-on-surface cursor-pointer"
                      >
                        <Icon size={16} className="text-primary shrink-0" />
                        <span className="truncate">{ex.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <Textarea
                id="relato"
                label="Descrição do Ocorrido (Opção 1)"
                description="Digite um resumo do incidente se não possuir relatório em arquivo."
                placeholder="Ex: Durante a troca de turno às 14h30, na área de expedição, o operador escorregou em uma poça de óleo não sinalizada..."
                rows={4}
                maxLength={MAX_REPORT_CHARS}
                value={text}
                onChange={(e) => {
                  setText(e.target.value);
                  if (validationError) setValidationError(null);
                }}
                error={validationError ?? undefined}
              />

              {text.length > 0 && (
                <div className="flex justify-end -mt-4">
                  <span className="text-label-sm text-secondary font-semibold">
                    {text.length} / {MAX_REPORT_CHARS} caracteres
                  </span>
                </div>
              )}

              <FileDropzone
                show={true}
                onFileSelect={handleFileSelect}
                onFileClear={handleFileClear}
                accept="*"
              />

              {attachedFile && (
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3 flex items-center gap-3 text-emerald-700 dark:text-emerald-400">
                  <FileText size={18} className="shrink-0" />
                  <div className="text-xs font-medium">
                    <span className="font-bold">Arquivo pronto para envio ao backend:</span> {attachedFile.name} ({(attachedFile.size / 1024).toFixed(1)} KB).
                  </div>
                </div>
              )}

              <div className="bg-surface-container-low rounded-lg p-4 flex items-start gap-3 border border-surface-container transition-all hover:bg-surface-container/60">
                <Bot size={20} className="text-primary mt-0.5 shrink-0" />
                <p className="text-label-sm text-on-surface-variant leading-relaxed">
                  <strong>Nota:</strong> O texto fornecido ou o arquivo anexado será analisado pelo modelo
                  de IA para extrair termos-chave, mapear a severidade e classificar o tipo de risco segundo as NRs.
                </p>
              </div>

              <div className="pt-2 flex justify-end">
                <Button
                  type="submit"
                  isLoading={classifyMutation.isPending}
                  icon={<Send size={18} />}
                >
                  Classificar Relato
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>
      </motion.main>
    </>
  );
}

