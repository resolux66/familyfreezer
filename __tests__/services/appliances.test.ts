/** @jest-environment node */

// 📘 Jest Note — isolating service tests
// We mock @/lib/appwrite so no real Appwrite SDK or network calls happen.
// The tests verify the service's logic (parseAppliance, householdId guard)
// without needing a live Appwrite project.

jest.mock('../../src/lib/appwrite', () => ({
  databases: {
    listDocuments: jest.fn(),
    getDocument:   jest.fn(),
    createDocument: jest.fn(),
    updateDocument: jest.fn(),
    deleteDocument: jest.fn(),
  },
}));

// Mock appwrite config values (they read from process.env which is empty in Jest)
jest.mock('../../src/lib/appwrite.config', () => ({
  DATABASE_ID:    'test-db',
  APPLIANCES_COL: 'appliances',
}));

import { databases } from '../../src/lib/appwrite';
import { fetchAppliances, fetchAppliance } from '../../src/services/appliances';
import type { Compartment } from '../../src/types';

const mockDatabases = databases as jest.Mocked<typeof databases>;

// ── fetchAppliances ───────────────────────────────────────────────────────────

describe('fetchAppliances', () => {
  it('returns parsed appliances with compartments as array', async () => {
    const compartments: Compartment[] = [
      { id: 'c1', label: 'Top shelf', order: 0 },
      { id: 'c2', label: 'Bottom shelf', order: 1 },
    ];

    mockDatabases.listDocuments.mockResolvedValueOnce({
      documents: [
        {
          $id:          'a1',
          householdId:  'h1',
          name:         'Kitchen Freezer',
          type:         'freezer',
          compartments: JSON.stringify(compartments), // stored as string in Appwrite
          createdAt:    '2026-01-01T00:00:00.000Z',
        },
      ],
      total: 1,
    } as never);

    const result = await fetchAppliances('h1');

    expect(result).toHaveLength(1);
    expect(result[0].compartments).toEqual(compartments); // parsed back to array
    expect(result[0].name).toBe('Kitchen Freezer');
    expect(result[0].type).toBe('freezer');
  });

  it('handles appliances that already have compartments as an array', async () => {
    const compartments: Compartment[] = [{ id: 'c1', label: 'Shelf', order: 0 }];

    mockDatabases.listDocuments.mockResolvedValueOnce({
      documents: [
        {
          $id: 'a2', householdId: 'h1', name: 'Fridge', type: 'fridge',
          compartments, // already an array (edge case)
          createdAt: '2026-01-01T00:00:00.000Z',
        },
      ],
      total: 1,
    } as never);

    const result = await fetchAppliances('h1');
    expect(result[0].compartments).toEqual(compartments);
  });
});

// ── fetchAppliance (single) ───────────────────────────────────────────────────

describe('fetchAppliance', () => {
  it('returns the appliance when householdId matches', async () => {
    mockDatabases.getDocument.mockResolvedValueOnce({
      $id: 'a1', householdId: 'h1', name: 'Chest Freezer',
      type: 'freezer', compartments: '[]', createdAt: '2026-01-01T00:00:00.000Z',
    } as never);

    const result = await fetchAppliance('h1', 'a1');
    expect(result.name).toBe('Chest Freezer');
  });

  it('throws when the appliance belongs to a different household', async () => {
    mockDatabases.getDocument.mockResolvedValueOnce({
      $id: 'a1', householdId: 'h2', // DIFFERENT household
      name: 'Someone Else Freezer', type: 'freezer',
      compartments: '[]', createdAt: '2026-01-01T00:00:00.000Z',
    } as never);

    await expect(fetchAppliance('h1', 'a1')).rejects.toThrow(
      'Appliance does not belong to this household.',
    );
  });
});
