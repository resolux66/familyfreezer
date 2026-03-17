import { Alert, Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Snowflake, Thermometer } from 'lucide-react-native';

import type { Appliance, ExpiryStatus, Item } from '@/types';
import { getExpiryStatus } from '@/utils/expiry';
import { hapticLight, hapticMedium } from '@/utils/haptics';

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Compute the worst expiry status across all items in one compartment.
// Order: expired > expiring_soon > ok > none
function compartmentStatus(items: Item[]): ExpiryStatus {
  if (items.some((i) => i.expiryStatus === 'expired'))       return 'expired';
  if (items.some((i) => i.expiryStatus === 'expiring_soon')) return 'expiring_soon';
  if (items.some((i) => i.expiryStatus === 'ok'))            return 'ok';
  return 'none';
}

const STATUS_DOT_COLOUR: Record<ExpiryStatus, string> = {
  ok:            'bg-success',
  expiring_soon: 'bg-warn',
  expired:       'bg-danger',
  none:          'bg-gray-200',
};

const STATUS_BORDER_COLOUR: Record<ExpiryStatus, string> = {
  ok:            'border-success',
  expiring_soon: 'border-warn',
  expired:       'border-danger',
  none:          'border-surface-border',
};

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  appliance: Appliance;
  allItems:  Item[];          // All household items — filtered client-side
  isAdmin:   boolean;
  onDelete:  (id: string) => void;
  onRename:  (id: string, currentName: string) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

// 📘 React Native Note — Pressable style callback
// Unlike the web, there are no CSS :hover or :active pseudo-classes in
// React Native. Pressable provides a "pressed" state via a style callback:
//   style={({ pressed }) => [pressed && styles.pressed]}
// This gives you visual feedback on tap without any gesture library.
export function ApplianceCard({ appliance, allItems, isAdmin, onDelete, onRename }: Props) {
  const router = useRouter();

  // Pre-filter items that belong to this appliance
  const applianceItems = allItems.filter((i) => i.applianceId === appliance.$id);

  // Build one status dot per compartment (max 5 shown)
  const dotsData = appliance.compartments.slice(0, 5).map((comp) => {
    const compItems = applianceItems
      .filter((i) => i.compartmentId === comp.id)
      .map((i) => ({
        ...i,
        expiryStatus: getExpiryStatus(i.useBy, i.bestBefore),
      }));
    return compartmentStatus(compItems);
  });

  // Determine card border accent: worst status across all compartments
  const worstStatus = compartmentStatus(
    applianceItems.map((i) => ({
      ...i,
      expiryStatus: getExpiryStatus(i.useBy, i.bestBefore),
    })),
  );

  function handleLongPress() {
    hapticMedium(); // Medium pulse confirms the long-press was recognised
    // 📘 React Native Note — Alert.alert for destructive confirmations
    // Alert.alert() shows a native OS dialog. It's appropriate for actions
    // the user might have triggered by accident (long-press). For quick
    // non-destructive actions, inline buttons are better UX.
    const options = [
      { text: 'Rename', onPress: () => onRename(appliance.$id, appliance.name) },
      isAdmin
        ? {
            text: 'Delete',
            style: 'destructive' as const,
            onPress: () => {
              Alert.alert(
                `Delete "${appliance.name}"?`,
                'This will permanently remove all items inside.',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Delete', style: 'destructive', onPress: () => onDelete(appliance.$id) },
                ],
              );
            },
          }
        : null,
      { text: 'Cancel', style: 'cancel' as const },
    ].filter(Boolean) as { text: string; style?: 'cancel' | 'destructive'; onPress?: () => void }[];

    Alert.alert(appliance.name, undefined, options);
  }

  return (
    <Pressable
      className={`bg-white rounded-2xl mb-4 overflow-hidden border-l-4 ${STATUS_BORDER_COLOUR[worstStatus]}`}
      style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
      onPress={() => { hapticLight(); router.push(`/appliance/${appliance.$id}`); }}
      onLongPress={handleLongPress}
      delayLongPress={500}
    >
      <View className="p-4">
        {/* Header row */}
        <View className="flex-row items-center mb-1">
          {appliance.type === 'freezer'
            ? <Snowflake color="#2563EB" size={18} />
            : <Thermometer color="#D97706" size={18} />
          }
          <Text className="font-bold text-base text-gray-900 ml-2 flex-1" numberOfLines={1}>
            {appliance.name}
          </Text>
          <Text className="text-xs text-gray-400">
            {appliance.type === 'freezer' ? 'Freezer' : 'Fridge'}
          </Text>
        </View>

        {/* Compartment count */}
        <Text className="text-sm text-gray-500 mb-3">
          {appliance.compartments.length}{' '}
          {appliance.compartments.length === 1 ? 'compartment' : 'compartments'}
          {' · '}
          {applianceItems.length}{' '}
          {applianceItems.length === 1 ? 'item' : 'items'}
        </Text>

        {/* Expiry status dots — one per compartment, max 5 */}
        {dotsData.length > 0 ? (
          <View className="flex-row gap-2">
            {dotsData.map((status, idx) => (
              <View
                key={idx}
                className={`w-3 h-3 rounded-full ${STATUS_DOT_COLOUR[status]}`}
              />
            ))}
            {appliance.compartments.length > 5 && (
              <Text className="text-xs text-gray-400 self-center">
                +{appliance.compartments.length - 5}
              </Text>
            )}
          </View>
        ) : (
          <Text className="text-xs text-gray-400">No items yet</Text>
        )}
      </View>
    </Pressable>
  );
}
