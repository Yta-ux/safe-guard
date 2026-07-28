import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  overlay?: boolean;
  className?: string;
}

const sizePixels = {
  sm: 20,
  md: 32,
  lg: 48,
};

export function LoadingSpinner({ message, size = 'md', overlay = false, className }: LoadingSpinnerProps) {
  const spinner = (
    <div className={cn('flex flex-col items-center justify-center gap-3', className)}>
      <Loader2 size={sizePixels[size]} className="animate-spin text-primary" />
      {message && (
        <p className="text-body-md text-on-surface-variant animate-pulse font-medium">{message}</p>
      )}
    </div>
  );

  if (overlay) {
    return (
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-10 rounded-xl">
        {spinner}
      </div>
    );
  }

  return spinner;
}
