import { cn } from '@/lib/utils';
import { RiskLevel } from '@/@types/enums';
import { RISK_LEVEL_STYLES } from '@/lib/constants';
import type { HTMLAttributes, ReactNode } from 'react';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  riskLevel: RiskLevel;
  icon?: ReactNode;
}

export function Badge({ riskLevel, icon, className, children, ...props }: BadgeProps) {
  const styles = RISK_LEVEL_STYLES[riskLevel];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-label-sm font-bold shadow-xs',
        styles.bg,
        styles.text,
        className,
      )}
      {...props}
    >
      {icon}
      {children}
    </span>
  );
}

export function StatusDot({ riskLevel, className }: { riskLevel: RiskLevel; className?: string }) {
  const styles = RISK_LEVEL_STYLES[riskLevel];
  return <span className={cn('w-3 h-3 rounded-full shrink-0', styles.dot, className)} />;
}
