import { format, isValid, parseISO } from 'date-fns';

export function formatDate(iso: string | null | undefined, pattern = 'dd MMM yyyy'): string {
  if (!iso) return '—';
  const d = parseISO(iso);
  return isValid(d) ? format(d, pattern) : '—';
}

export function toISOString(date: Date): string {
  return date.toISOString();
}
