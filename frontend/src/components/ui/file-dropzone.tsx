import { useCallback, useRef, useState, type DragEvent } from 'react';
import { UploadCloud, FileText, CheckCircle2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface FileDropzoneProps {
  show?: boolean;
  onFileSelect?: (file: File) => void;
  onFileClear?: () => void;
  accept?: string;
  maxSizeMB?: number;
  className?: string;
}

export function FileDropzone({
  show = true,
  onFileSelect,
  onFileClear,
  accept = '*',
  maxSizeMB = 15,
  className,
}: FileDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFile = useCallback(
    (file: File) => {
      if (file.size > maxSizeMB * 1024 * 1024) {
        toast.error(`Arquivo muito grande. O tamanho máximo permitido é de ${maxSizeMB}MB.`);
        return;
      }
      setSelectedFile(file);
      onFileSelect?.(file);
    },
    [maxSizeMB, onFileSelect],
  );

  const handleClear = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setSelectedFile(null);
      if (inputRef.current) inputRef.current.value = '';
      onFileClear?.();
      toast.info('Arquivo removido.');
    },
    [onFileClear],
  );

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  if (!show) return null;

  return (
    <div className={cn('flex flex-col gap-2 w-full', className)}>
      {/* Divider */}
      <div className="flex items-center gap-4 py-2">
        <div className="flex-grow h-px bg-outline-variant/60" />
        <span className="text-label-sm text-outline uppercase tracking-widest font-semibold">OU</span>
        <div className="flex-grow h-px bg-outline-variant/60" />
      </div>

      <label className="text-label-md text-on-surface flex items-center gap-2 font-semibold">
        Anexar Relatório em Arquivo (.txt, .pdf, .doc, .png, etc.)
      </label>

      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={cn(
          'mt-1 flex justify-center rounded-xl border-2 border-dashed border-outline-variant/80',
          'px-6 py-6 hover:bg-surface-container-low hover:border-primary/80',
          'transition-all duration-200 cursor-pointer select-none',
          isDragging && 'border-primary bg-primary/10 scale-[1.01]',
          selectedFile && 'border-emerald-500/60 bg-emerald-500/5',
        )}
      >
        <div className="text-center flex flex-col items-center w-full">
          {selectedFile ? (
            <div className="flex items-center justify-between gap-3 w-full bg-surface-container-lowest p-3 rounded-lg border border-emerald-500/30">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                  <FileText size={20} />
                </div>
                <div className="flex flex-col items-start truncate">
                  <span className="text-body-md font-semibold text-on-surface truncate">
                    {selectedFile.name}
                  </span>
                  <span className="text-label-sm text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                    <CheckCircle2 size={12} />
                    {(selectedFile.size / 1024).toFixed(1)} KB — Pronto para extração por IA
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleClear}
                className="p-1.5 rounded-full hover:bg-surface-container text-on-surface-variant hover:text-error transition-colors shrink-0"
                title="Remover arquivo"
              >
                <X size={18} />
              </button>
            </div>
          ) : (
            <>
              <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-3">
                <UploadCloud size={24} />
              </div>
              <div className="flex flex-col items-center gap-1">
                <p className="text-body-md font-semibold text-on-surface">
                  <span className="text-primary underline underline-offset-2">Clique para selecionar</span> ou arraste um arquivo
                </p>
                <p className="text-label-sm text-on-surface-variant">
                  Suporta .TXT, .PDF, .DOC, .DOCX, .JSON, imagens até {maxSizeMB}MB
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          // Reseta o input para permitir selecionar o mesmo arquivo novamente
          e.target.value = '';
        }}
      />
    </div>
  );
}
