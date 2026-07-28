import { RiskLevel, Sector } from '@/@types/enums';

export const SECTORS = Object.values(Sector);

export const RISK_LEVELS = Object.values(RiskLevel);

export const RISK_LEVEL_STYLES: Record<RiskLevel, { bg: string; text: string; dot: string }> = {
  [RiskLevel.CRITICO]: {
    bg: 'bg-red-500/10 dark:bg-red-500/20 border border-red-500/25',
    text: 'text-red-700 dark:text-red-400',
    dot: 'bg-red-500',
  },
  [RiskLevel.MEDIO]: {
    bg: 'bg-amber-500/10 dark:bg-amber-500/20 border border-amber-500/25',
    text: 'text-amber-700 dark:text-amber-400',
    dot: 'bg-amber-500',
  },
  [RiskLevel.BAIXO]: {
    bg: 'bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/25',
    text: 'text-emerald-700 dark:text-emerald-400',
    dot: 'bg-emerald-500',
  },
};

export const CATEGORY_CHART_COLORS: Record<string, string> = {
  [RiskLevel.BAIXO]: '#10b981',    // Emerald Green
  [RiskLevel.MEDIO]: '#f59e0b',    // Amber Yellow
  [RiskLevel.CRITICO]: '#ef4444',  // Coral Red
};

export const CATEGORY_CHART_COLORS_DARK: Record<string, string> = {
  [RiskLevel.BAIXO]: '#34d399',    // Soft Emerald Green
  [RiskLevel.MEDIO]: '#fbbf24',    // Bright Amber Yellow
  [RiskLevel.CRITICO]: '#f87171',  // Soft Coral Red
};

export const SECTOR_CHART_COLOR = '#b45309';
export const SECTOR_CHART_COLOR_DARK = '#fbbf24';

export const MIN_REPORT_CHARS = 10;
export const MAX_REPORT_CHARS = 500;
