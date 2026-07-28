import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString?: string | null): string {
  if (!dateString) return '—';

  // Remove duplicate timezone suffixes like +00:00Z or ++
  const cleanedStr = dateString
    .replace(/\+00:00Z?$/, 'Z')
    .replace(/Z+$/, 'Z');

  const date = new Date(cleanedStr);

  if (isNaN(date.getTime())) {
    return '—';
  }

  const months = [
    'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
    'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez',
  ];
  const day = date.getDate();
  const month = months[date.getMonth()] ?? 'Jan';
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${day} ${month}, ${hours}:${minutes}`;
}

export function formatNumber(num: number): string {
  return num.toLocaleString('pt-BR');
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + '...';
}
