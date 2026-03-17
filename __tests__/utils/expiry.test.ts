/**
 * @jest-environment node
 *
 * Pure utility function — no React Native APIs needed.
 * The node environment starts up ~10x faster than the RN jsdom environment.
 */

import { addDays, subDays, format } from 'date-fns';
import { getExpiryStatus, EXPIRY_COLOURS } from '../../src/utils/expiry';

// Helper: produce ISO date strings relative to today
function iso(offsetDays: number): string {
  return format(addDays(new Date(), offsetDays), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx");
}
function isoSub(offsetDays: number): string {
  return format(subDays(new Date(), offsetDays), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx");
}

describe('getExpiryStatus', () => {
  // ── null / missing dates ─────────────────────────────────────────────────

  it('returns "none" when both dates are null', () => {
    expect(getExpiryStatus(null, null)).toBe('none');
  });

  it('returns "none" when both dates are undefined', () => {
    expect(getExpiryStatus(undefined, undefined)).toBe('none');
  });

  it('returns "none" for an invalid date string', () => {
    expect(getExpiryStatus('not-a-date', null)).toBe('none');
  });

  // ── expired ──────────────────────────────────────────────────────────────

  it('returns "expired" for a useBy date yesterday', () => {
    expect(getExpiryStatus(isoSub(1), null)).toBe('expired');
  });

  it('returns "expired" for a useBy date 30 days ago', () => {
    expect(getExpiryStatus(isoSub(30), null)).toBe('expired');
  });

  it('uses useBy over bestBefore when both are provided', () => {
    // useBy is yesterday (expired), bestBefore is tomorrow (ok)
    expect(getExpiryStatus(isoSub(1), iso(5))).toBe('expired');
  });

  // ── expiring_soon ────────────────────────────────────────────────────────

  it('returns "expiring_soon" for a useBy date today (0 days away)', () => {
    // differenceInDays(today, today) === 0, which is ≤ 1
    expect(getExpiryStatus(iso(0), null)).toBe('expiring_soon');
  });

  it('returns "expiring_soon" for a useBy date 1 day away', () => {
    expect(getExpiryStatus(iso(1), null)).toBe('expiring_soon');
  });

  // ── ok ───────────────────────────────────────────────────────────────────

  it('returns "ok" for a useBy date 4 days away', () => {
    // Note: iso(2) is unreliable — differenceInDays truncates and the
    // sub-second gap between iso() and new Date() inside getExpiryStatus
    // can cause 2d to floor to 1d.  4d is unambiguously above the ≤1 threshold.
    expect(getExpiryStatus(iso(4), null)).toBe('ok');
  });

  it('returns "ok" for a useBy date 30 days away', () => {
    expect(getExpiryStatus(iso(30), null)).toBe('ok');
  });

  it('returns "ok" for a bestBefore date 5 days away (no useBy)', () => {
    expect(getExpiryStatus(null, iso(5))).toBe('ok');
  });

  it('falls back to bestBefore when useBy is null', () => {
    // bestBefore yesterday → expired
    expect(getExpiryStatus(null, isoSub(1))).toBe('expired');
  });
});

// ── EXPIRY_COLOURS ───────────────────────────────────────────────────────────

describe('EXPIRY_COLOURS', () => {
  it('has an entry for every ExpiryStatus value', () => {
    const statuses = ['ok', 'expiring_soon', 'expired', 'none'] as const;
    statuses.forEach((s) => {
      expect(EXPIRY_COLOURS[s]).toBeDefined();
      expect(EXPIRY_COLOURS[s].dot).toBeTruthy();
      expect(EXPIRY_COLOURS[s].bg).toBeTruthy();
      expect(EXPIRY_COLOURS[s].text).toBeTruthy();
    });
  });
});
