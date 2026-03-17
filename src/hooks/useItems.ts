import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  createItem,
  deleteItem,
  fetchAllItemsForHousehold,
  fetchExpiringItems,
  fetchItemsByCompartment,
  updateItem,
} from '@/services/items';
import { useAppStore } from '@/stores/useAppStore';
import { useAuthStore } from '@/stores/useAuthStore';
import type { CreateItemInput } from '@/types';

// 📘 React Native Note — Query key factory
// The queryKey is TanStack Query's cache address. Think of it as a key in a
// dictionary: the same key always points to the same cached data.
//
// Using a factory function like itemKeys.byCompartment(hId, aId, cId) instead
// of hand-writing ['items', hId, aId, cId] everywhere has two benefits:
//   1. No typos — one source of truth for all cache keys
//   2. Easy partial invalidation: invalidateQueries({ queryKey: itemKeys.all(hId) })
//      invalidates ALL item queries for a household at once (because all keys
//      start with ['items', hId], so the prefix matches)

export const itemKeys = {
  all:           (hId: string) =>
    ['items', hId] as const,
  byCompartment: (hId: string, aId: string, cId: string) =>
    ['items', hId, aId, cId] as const,
  search:        (hId: string) =>
    ['items', hId, 'all'] as const,
  expiring:      (hId: string) =>
    ['items', hId, 'expiring'] as const,
};

// ─── Queries ──────────────────────────────────────────────────────────────────

export function useCompartmentItems(applianceId: string, compartmentId: string) {
  const householdId = useAppStore((s) => s.activeHouseholdId);

  // 📘 React Native Note — enabled flag
  // The 'enabled' option prevents the query from running until its data
  // dependencies exist. Without it, the query fires immediately with null
  // householdId and either crashes or returns wrong data.
  return useQuery({
    queryKey: itemKeys.byCompartment(householdId ?? '', applianceId, compartmentId),
    queryFn:  () =>
      fetchItemsByCompartment(householdId!, applianceId, compartmentId),
    enabled: !!householdId && !!applianceId && !!compartmentId,
  });
}

export function useAllHouseholdItems() {
  const householdId = useAppStore((s) => s.activeHouseholdId);
  return useQuery({
    queryKey:  itemKeys.search(householdId ?? ''),
    queryFn:   () => fetchAllItemsForHousehold(householdId!),
    enabled:   !!householdId,
    staleTime: 1000 * 60 * 2, // 2 min — search data can be slightly stale
  });
}

export function useExpiringItems() {
  const householdId = useAppStore((s) => s.activeHouseholdId);
  return useQuery({
    queryKey:  itemKeys.expiring(householdId ?? ''),
    queryFn:   () => fetchExpiringItems(householdId!),
    enabled:   !!householdId,
    staleTime: 1000 * 60 * 10, // 10 min — banner doesn't need to be live
  });
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function useAddItem(applianceId: string, compartmentId: string) {
  const queryClient = useQueryClient();
  const householdId = useAppStore((s) => s.activeHouseholdId);
  const user        = useAuthStore((s) => s.user);

  // 📘 React Native Note — onSuccess cache invalidation
  // After a successful mutation, we call queryClient.invalidateQueries().
  // This marks the matching cached data as "stale", which triggers an
  // automatic background refetch — the UI updates without any manual refresh.
  //
  // We invalidate TWO keys here:
  //   1. The specific compartment — updates the item list the user is looking at
  //   2. The household-wide search cache — keeps search results fresh
  return useMutation({
    mutationFn: ({ input, teamId }: { input: CreateItemInput; teamId: string }) => {
      if (!householdId || !user) throw new Error('No session.');
      return createItem(householdId, applianceId, compartmentId, input, user.$id, teamId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: itemKeys.byCompartment(householdId ?? '', applianceId, compartmentId),
      });
      queryClient.invalidateQueries({ queryKey: itemKeys.search(householdId ?? '') });
      queryClient.invalidateQueries({ queryKey: itemKeys.expiring(householdId ?? '') });
    },
  });
}

export function useUpdateItem(applianceId: string, compartmentId: string) {
  const queryClient = useQueryClient();
  const householdId = useAppStore((s) => s.activeHouseholdId);

  return useMutation({
    mutationFn: ({ itemId, updates }: { itemId: string; updates: Partial<CreateItemInput> }) =>
      updateItem(itemId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: itemKeys.byCompartment(householdId ?? '', applianceId, compartmentId),
      });
      queryClient.invalidateQueries({ queryKey: itemKeys.search(householdId ?? '') });
      queryClient.invalidateQueries({ queryKey: itemKeys.expiring(householdId ?? '') });
    },
  });
}

export function useDeleteItem(applianceId: string, compartmentId: string) {
  const queryClient = useQueryClient();
  const householdId = useAppStore((s) => s.activeHouseholdId);

  return useMutation({
    mutationFn: (itemId: string) => deleteItem(itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: itemKeys.byCompartment(householdId ?? '', applianceId, compartmentId),
      });
      queryClient.invalidateQueries({ queryKey: itemKeys.search(householdId ?? '') });
      queryClient.invalidateQueries({ queryKey: itemKeys.expiring(householdId ?? '') });
    },
  });
}
