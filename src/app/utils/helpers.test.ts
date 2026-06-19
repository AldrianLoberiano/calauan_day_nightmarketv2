import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  formatPeso,
  getStallColorClass,
  getStatusTextClass,
  getStatusLabel,
  formatDate,
  getDaysRemaining,
  isExpired,
  capitalize,
  getDisplayStallId,
  getDisplaySectionById,
  getCornerDisplayStallId,
  getDisplayCategoryById,
  getDisplaySectionByCategory,
} from './helpers';

describe('formatPeso', () => {
  it('returns placeholder text', () => {
    expect(formatPeso(100)).toBe('To be discussed');
    expect(formatPeso(0)).toBe('To be discussed');
  });
});

describe('getStallColorClass', () => {
  it('returns green classes for available', () => {
    const result = getStallColorClass('available');
    expect(result).toContain('bg-green-500');
    expect(result).toContain('hover:bg-green-600');
  });

  it('returns yellow classes for pending', () => {
    const result = getStallColorClass('pending');
    expect(result).toContain('bg-yellow-400');
  });

  it('returns red classes for reserved', () => {
    const result = getStallColorClass('reserved');
    expect(result).toContain('bg-red-500');
  });

  it('returns gray classes for occupied', () => {
    const result = getStallColorClass('occupied');
    expect(result).toContain('bg-gray-500');
  });

  it('returns default gray for unknown status', () => {
    const result = getStallColorClass('unknown' as any);
    expect(result).toContain('bg-gray-300');
  });
});

describe('getStatusTextClass', () => {
  it('returns green for available', () => {
    expect(getStatusTextClass('available')).toContain('text-green-700');
  });

  it('returns yellow for pending', () => {
    expect(getStatusTextClass('pending')).toContain('text-yellow-700');
  });

  it('returns blue for reserved', () => {
    expect(getStatusTextClass('reserved')).toContain('text-blue-700');
  });

  it('returns blue for approved', () => {
    expect(getStatusTextClass('approved')).toContain('text-blue-700');
  });

  it('returns gray for occupied', () => {
    expect(getStatusTextClass('occupied')).toContain('text-gray-700');
  });

  it('returns red for rejected', () => {
    expect(getStatusTextClass('rejected')).toContain('text-red-700');
  });
});

describe('getStatusLabel', () => {
  it('capitalizes known statuses', () => {
    expect(getStatusLabel('available')).toBe('Available');
    expect(getStatusLabel('pending')).toBe('Pending');
    expect(getStatusLabel('reserved')).toBe('Reserved');
    expect(getStatusLabel('occupied')).toBe('Occupied');
    expect(getStatusLabel('approved')).toBe('Approved');
    expect(getStatusLabel('rejected')).toBe('Rejected');
  });

  it('returns raw string for unknown status', () => {
    expect(getStatusLabel('custom' as any)).toBe('custom');
  });
});

describe('formatDate', () => {
  it('formats an ISO date string', () => {
    const result = formatDate('2025-06-15T10:30:00Z');
    expect(result).toContain('2025');
    expect(result).toContain('June');
    expect(result).toContain('15');
  });
});

describe('getDaysRemaining', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns positive days for future date', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-06-15T00:00:00Z'));
    const future = '2025-06-20T00:00:00Z';
    expect(getDaysRemaining(future)).toBe(5);
  });

  it('returns negative days for past date', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-06-25T00:00:00Z'));
    const past = '2025-06-20T00:00:00Z';
    expect(getDaysRemaining(past)).toBe(-5);
  });

  it('returns 0 for same day', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-06-15T12:00:00Z'));
    expect(getDaysRemaining('2025-06-15T00:00:00Z')).toBe(-0);
  });
});

describe('isExpired', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns true for past date', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-06-20T00:00:00Z'));
    expect(isExpired('2025-06-15T00:00:00Z')).toBe(true);
  });

  it('returns false for future date', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-06-10T00:00:00Z'));
    expect(isExpired('2025-06-15T00:00:00Z')).toBe(false);
  });
});

describe('capitalize', () => {
  it('capitalizes first letter', () => {
    expect(capitalize('hello')).toBe('Hello');
  });

  it('returns empty string for empty input', () => {
    expect(capitalize('')).toBe('');
  });

  it('handles single character', () => {
    expect(capitalize('a')).toBe('A');
  });

  it('handles already capitalized', () => {
    expect(capitalize('Hello')).toBe('Hello');
  });
});

describe('getDisplayStallId', () => {
  it('returns empty string for empty input', () => {
    expect(getDisplayStallId('')).toBe('');
  });

  it('maps corner A1-A5 to G5-G1', () => {
    expect(getDisplayStallId('A1')).toBe('G5');
    expect(getDisplayStallId('A2')).toBe('G4');
    expect(getDisplayStallId('A3')).toBe('G3');
    expect(getDisplayStallId('A4')).toBe('G2');
    expect(getDisplayStallId('A5')).toBe('G1');
  });

  it('maps corner C1-C4 to BB31-BB34', () => {
    expect(getDisplayStallId('C1')).toBe('BB31');
    expect(getDisplayStallId('C2')).toBe('BB32');
    expect(getDisplayStallId('C3')).toBe('BB33');
    expect(getDisplayStallId('C4')).toBe('BB34');
  });

  it('maps numeric IDs 1-47 to A prefix', () => {
    expect(getDisplayStallId('1')).toBe('A1');
    expect(getDisplayStallId('47')).toBe('A47');
  });

  it('maps numeric IDs 48-91 to B prefix', () => {
    expect(getDisplayStallId('48')).toBe('B1');
    expect(getDisplayStallId('91')).toBe('B44');
  });

  it('maps numeric IDs 92-133 to AA prefix', () => {
    expect(getDisplayStallId('92')).toBe('AA1');
    expect(getDisplayStallId('133')).toBe('AA42');
  });

  it('maps numeric IDs 134-167 to BB prefix', () => {
    expect(getDisplayStallId('134')).toBe('BB1');
    expect(getDisplayStallId('167')).toBe('BB34');
  });

  it('maps numeric IDs 168-204 to C prefix', () => {
    expect(getDisplayStallId('168')).toBe('C1');
    expect(getDisplayStallId('204')).toBe('C37');
  });

  it('maps numeric IDs 205-243 to D prefix', () => {
    expect(getDisplayStallId('205')).toBe('D1');
    expect(getDisplayStallId('243')).toBe('D39');
  });

  it('maps numeric IDs 244-300 to R prefix', () => {
    expect(getDisplayStallId('244')).toBe('R1');
    expect(getDisplayStallId('300')).toBe('R57');
  });

  it('returns non-numeric IDs as-is', () => {
    expect(getDisplayStallId('D36')).toBe('D36');
    expect(getDisplayStallId('XYZ')).toBe('XYZ');
  });
});

describe('getDisplaySectionById', () => {
  it('returns fallback for empty stall ID', () => {
    expect(getDisplaySectionById('', 'X')).toBe('X');
  });

  it('returns fallback for non-numeric ID', () => {
    expect(getDisplaySectionById('A1', 'X')).toBe('X');
  });

  it('returns A for IDs 1-47', () => {
    expect(getDisplaySectionById('1', 'X')).toBe('A');
    expect(getDisplaySectionById('47', 'X')).toBe('A');
  });

  it('returns B for IDs 48-91', () => {
    expect(getDisplaySectionById('48', 'X')).toBe('B');
    expect(getDisplaySectionById('91', 'X')).toBe('B');
  });

  it('returns AA for IDs 92-133', () => {
    expect(getDisplaySectionById('92', 'X')).toBe('AA');
    expect(getDisplaySectionById('133', 'X')).toBe('AA');
  });

  it('returns BB for IDs 134-167', () => {
    expect(getDisplaySectionById('134', 'X')).toBe('BB');
  });

  it('returns C for IDs 168-204', () => {
    expect(getDisplaySectionById('168', 'X')).toBe('C');
  });

  it('returns D for IDs 205-243', () => {
    expect(getDisplaySectionById('205', 'X')).toBe('D');
  });

  it('returns R for IDs 244-300', () => {
    expect(getDisplaySectionById('244', 'X')).toBe('R');
  });

  it('returns fallback for out-of-range numeric ID', () => {
    expect(getDisplaySectionById('301', 'X')).toBe('X');
  });
});

describe('getCornerDisplayStallId', () => {
  it('delegates to getDisplayStallId', () => {
    expect(getCornerDisplayStallId('A1')).toBe('G5');
    expect(getCornerDisplayStallId('1')).toBe('A1');
  });
});

describe('getDisplayCategoryById', () => {
  it('returns fallback for empty stall ID', () => {
    expect(getDisplayCategoryById('', 'Food')).toBe('Food');
  });

  it('returns Non-Food for corner A1-A5', () => {
    expect(getDisplayCategoryById('A1', 'Food')).toBe('Non-Food');
    expect(getDisplayCategoryById('A2', 'Food')).toBe('Non-Food');
    expect(getDisplayCategoryById('A3', 'Food')).toBe('Non-Food');
    expect(getDisplayCategoryById('A4', 'Food')).toBe('Non-Food');
    expect(getDisplayCategoryById('A5', 'Food')).toBe('Non-Food');
  });

  it('returns original category for non-corner stalls', () => {
    expect(getDisplayCategoryById('1', 'Food')).toBe('Food');
    expect(getDisplayCategoryById('B1', 'General Merchandise')).toBe('General Merchandise');
  });
});

describe('getDisplaySectionByCategory', () => {
  it('returns G for Non-Food corners', () => {
    expect(getDisplaySectionByCategory('A1', 'X', 'Food')).toBe('G');
  });

  it('delegates to getDisplaySectionById for regular stalls', () => {
    expect(getDisplaySectionByCategory('1', 'Section A', 'Food')).toBe('A');
    expect(getDisplaySectionByCategory('48', 'Section B', 'Food')).toBe('B');
  });
});
