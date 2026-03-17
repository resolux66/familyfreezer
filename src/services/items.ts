import { ID, Permission, Query, Role } from 'appwrite';

import { databases } from '@/lib/appwrite';
import { DATABASE_ID, ITEMS_COL } from '@/lib/appwrite.config';
import type { CreateItemInput, Item } from '@/types';
import { getExpiryStatus } from '@/utils/expiry';

// 📘 React Native Note — Services layer vs Hooks
// This file knows HOW to talk to Appwrite. The hooks in src/hooks/useItems.ts
// know WHEN to call these functions (on mount, on mutation, etc.) and how to
// cache the results. Keeping these separate means you can call fetchItems from
// a unit test or Appwrite Function without importing any React.

// ─── Helper ──────────────────────────────────────────────────────────────────

function parseItem(doc: Record<string, unknown>): Item {
  const item = doc as unknown as Item;
  return {
    ...item,
    expiryStatus: getExpiryStatus(item.useBy, item.bestBefore),
  };
}

// ─── Reads ────────────────────────────────────────────────────────────────────

export async function fetchItemsByCompartment(
  householdId: string,
  applianceId: string,
  compartmentId: string,
): Promise<Item[]> {
  const res = await databases.listDocuments(DATABASE_ID, ITEMS_COL, [
    Query.equal('householdId', householdId),   // ALWAYS — prevents cross-household reads
    Query.equal('applianceId', applianceId),
    Query.equal('compartmentId', compartmentId),
    Query.limit(200),
  ]);
  const items = res.documents.map((d) => parseItem(d as Record<string, unknown>));
  // Sort: fridge items by soonest useBy first; freezer items by dateAdded
  return items.sort((a, b) => {
    const aDate = a.useBy ?? a.bestBefore ?? a.dateAdded;
    const bDate = b.useBy ?? b.bestBefore ?? b.dateAdded;
    return aDate.localeCompare(bDate);
  });
}

export async function fetchAllItemsForHousehold(householdId: string): Promise<Item[]> {
  // Used by global search (Phase 8). Fetches ALL items for the household
  // in one query — cached by TanStack Query for 2 minutes (set in hook).
  const res = await databases.listDocuments(DATABASE_ID, ITEMS_COL, [
    Query.equal('householdId', householdId),
    Query.limit(500),
  ]);
  return res.documents.map((d) => parseItem(d as Record<string, unknown>));
}

export async function fetchExpiringItems(householdId: string): Promise<Item[]> {
  // Returns fridge items expiring today or already expired — used by ExpiryBanner.
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(23, 59, 59, 999);

  const res = await databases.listDocuments(DATABASE_ID, ITEMS_COL, [
    Query.equal('householdId', householdId),
    Query.isNotNull('useBy'),
    Query.lessThanEqual('useBy', tomorrow.toISOString()),
    Query.limit(50),
  ]);
  return res.documents.map((d) => parseItem(d as Record<string, unknown>));
}

// ─── Writes ───────────────────────────────────────────────────────────────────

export async function createItem(
  householdId: string,
  applianceId: string,
  compartmentId: string,
  input: CreateItemInput,
  userId: string,
  teamId: string,
): Promise<Item> {
  const now = new Date().toISOString();
  const doc = await databases.createDocument(
    DATABASE_ID,
    ITEMS_COL,
    ID.unique(),
    {
      householdId,
      applianceId,
      compartmentId,
      name: input.name,
      quantity: input.quantity ?? '',
      dateAdded: now,
      bestBefore: input.bestBefore ?? null,
      useBy: input.useBy ?? null,
      notes: input.notes ?? null,
      addedByUserId: userId,
      updatedAt: now,
    },
    [
      Permission.read(Role.team(teamId)),
      Permission.update(Role.team(teamId)),
      // Per PRD: any member can delete any item (simplified household UX)
      Permission.delete(Role.team(teamId)),
    ],
  );
  return parseItem(doc as Record<string, unknown>);
}

export async function updateItem(
  itemId: string,
  updates: Partial<CreateItemInput>,
): Promise<Item> {
  const doc = await databases.updateDocument(
    DATABASE_ID,
    ITEMS_COL,
    itemId,
    { ...updates, updatedAt: new Date().toISOString() },
  );
  return parseItem(doc as Record<string, unknown>);
}

export async function deleteItem(itemId: string): Promise<void> {
  await databases.deleteDocument(DATABASE_ID, ITEMS_COL, itemId);
}
