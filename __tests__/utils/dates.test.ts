/** @jest-environment node */

import { formatDate, toISOString } from '../../src/utils/dates';

describe('formatDate', () => {
  it('returns "—" for null', () => {
    expect(formatDate(null)).toBe('—');
  });

  it('returns "—" for undefined', () => {
    expect(formatDate(undefined)).toBe('—');
  });

  it('returns "—" for an invalid ISO string', () => {
    expect(formatDate('not-a-date')).toBe('—');
  });

  it('formats a date with the default pattern (dd MMM yyyy)', () => {
    expect(formatDate('2026-06-15T00:00:00.000Z')).toBe('15 Jun 2026');
  });

  it('formats a date with a custom pattern', () => {
    expect(formatDate('2026-06-15T00:00:00.000Z', 'd MMM')).toBe('15 Jun');
  });

  it('handles a date string with only YYYY-MM-DD', () => {
    // parseISO handles partial ISO strings
    const result = formatDate('2026-01-01');
    expect(result).not.toBe('—');
    expect(result).toContain('Jan');
  });
});

describe('toISOString', () => {
  it('returns an ISO string for a given Date', () => {
    const d = new Date('2026-03-15T10:00:00Z');
    const result = toISOString(d);
    expect(result).toBe(d.toISOString());
  });
});
