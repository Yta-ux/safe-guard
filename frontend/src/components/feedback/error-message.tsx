import { AlertTriangle, RotateCcw } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface ErrorMessageProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export function ErrorMessage({ title = 'Erro no processamento', message, onRetry }: ErrorMessageProps) {
  return (
    <Card className="border-error/30 max-w-md mx-auto">
      <div className="p-6 flex flex-col items-center text-center gap-4">
        <div className="w-12 h-12 bg-error-container rounded-full flex items-center justify-center text-on-error-container shrink-0">
          <AlertTriangle size={24} />
        </div>
        <h3 className="text-headline-md text-on-surface font-semibold">{title}</h3>
        <p className="text-body-md text-on-surface-variant leading-relaxed">{message}</p>
        {onRetry && (
          <Button variant="secondary" onClick={onRetry} icon={<RotateCcw size={16} />} iconPosition="left">
            Tentar novamente
          </Button>
        )}
      </div>
    </Card>
  );
}
