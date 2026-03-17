import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  createHousehold,
  fetchHouseholdMembers,
  fetchHouseholdsForUser,
  generateInviteCode,
} from '@/services/households';
import { useAppStore } from '@/stores/useAppStore';
import { useAuthStore } from '@/stores/useAuthStore';
import type { CreateHouseholdInput } from '@/types';

// ─── Query key factory ────────────────────────────────────────────────────────
// All household cache keys are defined here in one place.
// Centralising keys prevents typos and makes invalidation predictable.
export const householdKeys = {
  all:     (userId: string) => ['households', userId] as const,
  one:     (userId: string, id: string) => ['households', userId, id] as const,
  members: (teamId: string) => ['household-members', teamId] as const,
};

// ─── Queries ──────────────────────────────────────────────────────────────────

/** Returns the full Household document for the currently active household. */
export function useActiveHousehold() {
  const { data: households } = useHouseholds();
  const activeId = useAppStore((s) => s.activeHouseholdId);
  return households?.find((h) => h.$id === activeId) ?? null;
}

export function useHouseholds() {
  const user = useAuthStore((s) => s.user);
  return useQuery({
    queryKey: householdKeys.all(user?.$id ?? ''),
    queryFn:  () => fetchHouseholdsForUser(user!.$id),
    // Only run when a user session exists — prevents the query firing before
    // checkSession() completes and returning an empty list prematurely.
    enabled: !!user,
  });
}

export function useHouseholdMembers(teamId: string | undefined) {
  return useQuery({
    queryKey: householdKeys.members(teamId ?? ''),
    queryFn:  () => fetchHouseholdMembers(teamId!),
    enabled:  !!teamId,
    staleTime: 1000 * 60 * 5,
  });
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function useCreateHousehold() {
  const queryClient   = useQueryClient();
  const user          = useAuthStore((s) => s.user);
  const setActiveHousehold = useAppStore((s) => s.setActiveHousehold);

  return useMutation({
    mutationFn: (input: CreateHouseholdInput) => {
      if (!user) throw new Error('Not authenticated.');
      return createHousehold(user.$id, input.name, input.householdTimezone);
    },
    onSuccess: (household) => {
      setActiveHousehold(household.$id);
      // Invalidate so the households list re-fetches and shows the new one
      queryClient.invalidateQueries({ queryKey: householdKeys.all(user!.$id) });
    },
  });
}

export function useGenerateInviteCode(householdId: string) {
  const queryClient = useQueryClient();
  const user        = useAuthStore((s) => s.user);

  return useMutation({
    mutationFn: ({ multiUse }: { multiUse: boolean }) =>
      generateInviteCode(householdId, multiUse),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: householdKeys.all(user?.$id ?? '') });
    },
  });
}
