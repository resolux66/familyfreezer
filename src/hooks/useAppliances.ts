import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  createAppliance,
  deleteAppliance,
  fetchAppliance,
  fetchAppliances,
  updateAppliance,
} from '@/services/appliances';
import { useAppStore } from '@/stores/useAppStore';
import type { Compartment, CreateApplianceInput } from '@/types';

// ─── Query key factory ────────────────────────────────────────────────────────
export const applianceKeys = {
  all:  (hId: string) => ['appliances', hId] as const,
  one:  (hId: string, aId: string) => ['appliances', hId, aId] as const,
};

// ─── Queries ──────────────────────────────────────────────────────────────────

export function useAppliances() {
  const householdId = useAppStore((s) => s.activeHouseholdId);
  return useQuery({
    queryKey: applianceKeys.all(householdId ?? ''),
    queryFn:  () => fetchAppliances(householdId!),
    enabled:  !!householdId,
  });
}

export function useAppliance(applianceId: string) {
  const householdId = useAppStore((s) => s.activeHouseholdId);
  return useQuery({
    queryKey: applianceKeys.one(householdId ?? '', applianceId),
    queryFn:  () => fetchAppliance(householdId!, applianceId),
    enabled:  !!householdId && !!applianceId,
  });
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function useCreateAppliance() {
  const queryClient = useQueryClient();
  const householdId = useAppStore((s) => s.activeHouseholdId);

  return useMutation({
    mutationFn: ({ input, teamId }: { input: CreateApplianceInput; teamId: string }) => {
      if (!householdId) throw new Error('No active household.');
      return createAppliance(householdId, teamId, input);
    },
    onSuccess: () => {
      // Invalidate the list so the new appliance appears immediately
      queryClient.invalidateQueries({ queryKey: applianceKeys.all(householdId ?? '') });
    },
  });
}

export function useUpdateAppliance() {
  const queryClient = useQueryClient();
  const householdId = useAppStore((s) => s.activeHouseholdId);

  return useMutation({
    mutationFn: ({
      applianceId,
      updates,
    }: {
      applianceId: string;
      updates: Partial<{ name: string; compartments: Compartment[] }>;
    }) => updateAppliance(applianceId, updates),
    onSuccess: (_, { applianceId }) => {
      queryClient.invalidateQueries({ queryKey: applianceKeys.all(householdId ?? '') });
      queryClient.invalidateQueries({ queryKey: applianceKeys.one(householdId ?? '', applianceId) });
    },
  });
}

export function useDeleteAppliance() {
  const queryClient = useQueryClient();
  const householdId = useAppStore((s) => s.activeHouseholdId);

  return useMutation({
    mutationFn: (applianceId: string) => deleteAppliance(applianceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: applianceKeys.all(householdId ?? '') });
    },
  });
}
