import { FileSearch, Info, FileText, LayoutDashboard } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router';

interface EmptyStateProps {
  title: string;
  description: string;
  actionText?: string;
  actionPath?: string;
  secondaryActionText?: string;
  secondaryActionPath?: string;
}

export function EmptyState({
  title,
  description,
  actionText = 'Relatar Incidente',
  actionPath = '/',
  secondaryActionText = 'Ir para Dashboard',
  secondaryActionPath = '/dashboard',
}: EmptyStateProps) {
  const navigate = useNavigate();

  return (
    <Card className="max-w-xl w-full mx-auto animate-fade-in shadow-sm">
      <div className="p-8 md:p-12 flex flex-col items-center text-center gap-6">
        {/* Proportional Icon Badge */}
        <div className="w-16 h-16 bg-surface-container rounded-full flex items-center justify-center border border-outline-variant shadow-inner text-primary shrink-0">
          <FileSearch size={32} />
        </div>

        {/* Text Details */}
        <div className="flex flex-col gap-2 max-w-md">
          <h2 className="text-headline-md text-on-surface font-semibold">{title}</h2>
          <p className="text-body-md text-on-surface-variant leading-relaxed">
            {description}
          </p>
        </div>

        {/* Informative Note Box */}
        <div className="bg-surface-container-low rounded-lg p-4 border border-surface-container text-left w-full">
          <div className="flex items-start gap-3">
            <Info size={20} className="text-secondary shrink-0 mt-0.5" />
            <p className="text-label-sm text-on-surface-variant leading-normal">
              A classificação de risco é gerada automaticamente pelo modelo de IA assim que um relato é submetido.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full pt-2">
          {actionText && (
            <Button
              variant="primary"
              onClick={() => navigate(actionPath)}
              icon={<FileText size={18} />}
              iconPosition="left"
              className="w-full sm:w-auto"
            >
              {actionText}
            </Button>
          )}
          {secondaryActionText && (
            <Button
              variant="secondary"
              onClick={() => navigate(secondaryActionPath)}
              icon={<LayoutDashboard size={18} />}
              iconPosition="left"
              className="w-full sm:w-auto"
            >
              {secondaryActionText}
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
