import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { AlertTriangle, X } from 'lucide-react-native';

import { useExpiringItems } from '@/hooks/useItems';
import { useAppStore } from '@/stores/useAppStore';

// 📘 React Native Note — Dismissible banner pattern
// The banner should disappear for the rest of the day once dismissed — the
// user doesn't want to see it again every time they scroll up. We persist the
// dismiss date (as a plain date string) in Zustand and compare it to today.
//
// new Date().toDateString() returns e.g. "Sun Mar 15 2026".
// Comparing two .toDateString() results is a simple "same calendar day" check
// that's immune to timezone offsets in timestamps.
//
// We deliberately do NOT persist the dismiss state across days (partialize in
// useAppStore excludes bannerDismissedDate). Fresh day → fresh warning.

export function ExpiryBanner() {
  const router = useRouter();

  const { data: expiringItems = [] } = useExpiringItems();
  const { bannerDismissedDate, dismissBanner } = useAppStore();

  // ── Visibility checks ─────────────────────────────────────────────────────
  const isDismissedToday = bannerDismissedDate === new Date().toDateString();
  if (isDismissedToday) return null;

  const expiredCount      = expiringItems.filter((i) => i.expiryStatus === 'expired').length;
  const expiringSoonCount = expiringItems.filter((i) => i.expiryStatus === 'expiring_soon').length;
  const totalCount        = expiredCount + expiringSoonCount;

  if (totalCount === 0) return null;

  // ── Severity determines banner colour ────────────────────────────────────
  // Red if anything is actually expired; amber if only expiring soon.
  const isRed = expiredCount > 0;

  // ── Human-readable summary ────────────────────────────────────────────────
  function buildMessage(): string {
    const parts: string[] = [];
    if (expiredCount > 0) {
      parts.push(`${expiredCount} expired ${expiredCount === 1 ? 'item' : 'items'}`);
    }
    if (expiringSoonCount > 0) {
      parts.push(`${expiringSoonCount} expiring soon`);
    }
    return parts.join(' · ');
  }

  function handleViewPress() {
    dismissBanner();
    router.push('/(tabs)/search');
  }

  return (
    <View
      className={`mx-4 mb-3 rounded-xl px-4 py-3 flex-row items-center ${
        isRed ? 'bg-danger-pale border border-danger' : 'bg-warn-pale border border-warn'
      }`}
    >
      {/* Icon */}
      <AlertTriangle
        color={isRed ? '#DC2626' : '#D97706'}
        size={18}
        style={{ marginRight: 8, flexShrink: 0 }}
      />

      {/* Message + CTA */}
      <View className="flex-1">
        <Text className={`text-sm font-semibold ${isRed ? 'text-danger' : 'text-warn'}`}>
          {buildMessage()}
        </Text>
        <Pressable onPress={handleViewPress}>
          <Text className={`text-xs mt-0.5 underline ${isRed ? 'text-danger' : 'text-warn'}`}>
            View in search →
          </Text>
        </Pressable>
      </View>

      {/* Dismiss button */}
      <Pressable
        onPress={dismissBanner}
        hitSlop={8}
        className="ml-2 p-1"
        accessibilityLabel="Dismiss expiry banner"
      >
        <X color={isRed ? '#DC2626' : '#D97706'} size={16} />
      </Pressable>
    </View>
  );
}
