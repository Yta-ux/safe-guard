import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardHeader, CardBody } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { FileDropzone } from '@/components/ui/file-dropzone';
import { ErrorMessage } from '@/components/feedback/error-message';
import { MlProcessingLoading } from '@/components/feedback/ml-processing-loading';
import { useClassifyReport } from '@/hooks/api/use-classify-report';
import { MIN_REPORT_CHARS, MAX_REPORT_CHARS } from '@/lib/constants';

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

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      setValidationError(null);

      // Se possui arquivo anexado, envia o arquivo diretamente para a API /reports/classify-document
      if (attachedFile) {
        classifyMutation.mutate(
          { file: attachedFile },
          {
            onSuccess: (data) => {
              toast.success('Documento analisado e classificado com sucesso pelo backend!');
              navigate(`/result/${data.classification.id}`);
            },
          },
        );
        return;
      }

      // Caso contrário, exige o texto digitado
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
            toast.success('Relato analisado e classificado com sucesso pela IA!');
            navigate(`/result/${data.classification.id}`);
          },
        },
      );
    },
    [text, attachedFile, classifyMutation, navigate],
  );

  return (
    <>
      {/* Animated ML Loading Screen */}
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
        className="flex-grow w-full max-w-[1440px] mx-auto px-6 md:px-container-padding py-gutter flex justify-center items-start pt-12 md:pt-20"
      >
        <Card className="w-full max-w-2xl border-outline-variant/60 hover:border-primary/40 hover:shadow-md transition-all duration-200">
          {/* Card Header */}
          <CardHeader>
            <h1 className="text-headline-lg-mobile md:text-headline-lg text-on-surface font-bold">
              Relatar Incidente/Acidente
            </h1>
            <p className="text-body-md text-on-surface-variant">
              Descreva o ocorrido no campo abaixo <strong>OU</strong> faça upload de um arquivo para análise completa pelo backend.
            </p>
          </CardHeader>

          {/* Card Body / Form */}
          <CardBody>
            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              {/* Error from API */}
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

              {/* Textarea Field (Opção 1) */}
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

              {/* Character counter */}
              {text.length > 0 && (
                <div className="flex justify-end -mt-4">
                  <span className="text-label-sm text-secondary font-semibold">
                    {text.length} / {MAX_REPORT_CHARS} caracteres
                  </span>
                </div>
              )}

              {/* File Dropzone Upload (Opção 2) */}
              <FileDropzone
                show={true}
                onFileSelect={handleFileSelect}
                onFileClear={handleFileClear}
                accept="*"
              />

              {/* Attached File Status Badge */}
              {attachedFile && (
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3 flex items-center gap-3 text-emerald-700 dark:text-emerald-400">
                  <FileText size={18} className="shrink-0" />
                  <div className="text-xs font-medium">
                    <span className="font-bold">Arquivo pronto para envio ao backend:</span> {attachedFile.name} ({(attachedFile.size / 1024).toFixed(1)} KB).
                    O backend irá mapear todas as páginas e extrair sinônimos e palavras-chave.
                  </div>
                </div>
              )}

              {/* AI Processing Note */}
              <div className="bg-surface-container-low rounded-lg p-4 flex items-start gap-3 border border-surface-container transition-all hover:bg-surface-container/60">
                <Bot size={20} className="text-primary mt-0.5 shrink-0" />
                <p className="text-label-sm text-on-surface-variant leading-relaxed">
                  <strong>Nota:</strong> O texto fornecido ou o arquivo anexado será analisado pelo modelo
                  de IA para extrair termos-chave, mapear a severidade e classificar o tipo de risco segundo as NRs.
                </p>
              </div>

              {/* Submit Action */}
              <div className="pt-4 flex justify-end">
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
