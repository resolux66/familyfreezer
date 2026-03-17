// 📘 React Native Note — Pure utility functions
// This file has zero React or Appwrite imports — it only depends on date-fns.
// Because getExpiryStatus() is a pure function (same input → same output, no
// side effects), it\'s trivial to unit-test and reuse anywhere:
//   • Service layer: attach expiryStatus when fetching items
//   • UI components: compute colour from status to render badge colours
//   • Appwrite Function: check expiry before sending push notifications

import { differenceInDays, isValid, parseISO } from 'date-fns';

import type { ExpiryStatus } from '@/types';

export function getExpiryStatus(
  useBy:      string | null | undefined,
  bestBefore: string | null | undefined,
): ExpiryStatus {
  const dateStr = useBy ?? bestBefore;
  if (!dateStr) return 'none';
  const date = parseISO(dateStr);
  if (!isValid(date)) return 'none';
  const days = differenceInDays(date, new Date());
  if (days < 0)  return 'expired';
  if (days <= 1) return 'expiring_soon';
  return 'ok';
}

export const EXPIRY_COLOURS: Record<ExpiryStatus, { dot: string; bg: string; text: string }> = {
  ok:            { dot: 'bg-success',  bg: 'bg-success-pale',  text: 'text-success'  },
  expiring_soon: { dot: 'bg-warn',     bg: 'bg-warn-pale',     text: 'text-warn'     },
  expired:       { dot: 'bg-danger',   bg: 'bg-danger-pale',   text: 'text-danger'   },
  none:          { dot: 'bg-gray-300', bg: 'bg-surface-alt',   text: 'text-gray-400' },
};
