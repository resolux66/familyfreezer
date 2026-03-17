import { useEffect } from 'react';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  getNotificationPrefs,
  registerForPushNotifications,
  setNotificationsEnabled,
} from '@/services/notifications';
import { useAuthStore } from '@/stores/useAuthStore';

// ─── Query keys ───────────────────────────────────────────────────────────────
const notifKeys = {
  prefs: (userId: string) => ['notification-prefs', userId] as const,
};

// ─── Setup hook ───────────────────────────────────────────────────────────────

/**
 * Call once in the authenticated app shell (e.g. tabs layout).
 * Requests permission, gets the push token, and saves it to Appwrite.
 * Safe to call on every launch — it no-ops if permission is already granted
 * and the token hasn't changed.
 *
 * 📘 React Native Note — useEffect for one-time setup
 * We deliberately use useEffect with [] (run once) rather than a mutation
 * so that token registration fires immediately when the user enters the
 * authenticated tabs — no user interaction required. If we used a mutation,
 * we'd need to call .mutate() somewhere manually.
 */
export function useNotificationSetup() {
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (!user) return;
    registerForPushNotifications(user.$id).catch((err) => {
      // Non-fatal — the app works fine without push notifications
      if (__DEV__) console.warn('[FreezerFamily] Push token registration failed:', err);
    });
  }, [user?.$id]);
}

// ─── Preference query ─────────────────────────────────────────────────────────

/** Returns the user's current notification preference from Appwrite. */
export function useNotificationPrefs() {
  const user = useAuthStore((s) => s.user);

  return useQuery({
    queryKey: notifKeys.prefs(user?.$id ?? ''),
    queryFn:  () => getNotificationPrefs(user!.$id),
    enabled:  !!user,
    staleTime: 1000 * 60 * 10, // preferences rarely change
  });
}

// ─── Toggle mutation ──────────────────────────────────────────────────────────

/** Mutation to toggle push notifications on/off from the Settings screen. */
export function useToggleNotifications() {
  const queryClient = useQueryClient();
  const user        = useAuthStore((s) => s.user);

  return useMutation({
    mutationFn: (enabled: boolean) => {
      if (!user) throw new Error('Not authenticated.');
      return setNotificationsEnabled(user.$id, enabled);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: notifKeys.prefs(user?.$id ?? ''),
      });
    },
  });
}
