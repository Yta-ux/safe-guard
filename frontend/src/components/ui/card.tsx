import { cn } from '@/lib/utils';
import type { HTMLAttributes, ReactNode } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  accentLine?: boolean;
  children: ReactNode;
}

export function Card({ className, accentLine = false, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'bg-surface-container-lowest border border-outline-variant/60 rounded-xl shadow-xs transition-all duration-200',
        className,
      )}
      {...props}
    >
      {accentLine && <div className="w-full h-1 bg-primary rounded-t-xl" />}
      {children}
    </div>
  );
}

export function CardHeader({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('px-6 py-6 border-b border-surface-container flex flex-col gap-1.5', className)} {...props}>
      {children}
    </div>
  );
}

export function CardBody({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('px-6 py-6', className)} {...props}>
      {children}
    </div>
  );
}
