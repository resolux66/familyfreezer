import { Alert, FlatList, Pressable, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Plus } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ItemRow } from '@/components/items/ItemRow';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorScreen } from '@/components/ui/ErrorScreen';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { useAppliance } from '@/hooks/useAppliances';
import { useActiveHousehold } from '@/hooks/useHousehold';
import { useCompartmentItems, useDeleteItem } from '@/hooks/useItems';
import type { Item } from '@/types';

// 📘 React Native Note — Floating Action Button (FAB)
// A FAB is just an absolutely-positioned Pressable. 'absolute' takes it out of
// the normal layout flow so it doesn't push content up. It pins relative to
// the nearest ancestor with position !== 'static' — usually the screen root.
// className='absolute bottom-6 right-6 z-50' is the standard FAB recipe.
// Add extra bottom padding matching the FAB height to the FlatList so the last
// item isn't hidden behind the button.

export default function DrawerDetailScreen() {
  const { id: applianceId, cid: compartmentId } =
    useLocalSearchParams<{ id: string; cid: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { data: appliance } = useAppliance(applianceId);
  const activeHousehold = useActiveHousehold();
  const { data: items = [], isLoading, isError, refetch } =
    useCompartmentItems(applianceId, compartmentId);
  const deleteItem = useDeleteItem(applianceId, compartmentId);

  const compartment = appliance?.compartments.find((c) => c.id === compartmentId);
  const applianceName = appliance?.name ?? '';
  const compartmentLabel = compartment?.label ?? 'Drawer';

  function handleDelete(itemId: string) {
    Alert.alert('Delete item?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () =>
          deleteItem.mutate(itemId, {
            onError: (e) =>
              Alert.alert('Error', e instanceof Error ? e.message : 'Could not delete item.'),
          }),
      },
    ]);
  }

  function handleEdit(item: Item) {
    router.push(
      `/item/${item.$id}?applianceId=${applianceId}&compartmentId=${compartmentId}&applianceType=${appliance?.type ?? 'freezer'}`,
    );
  }

  function handleAddItem() {
    const teamId = activeHousehold?.teamId ?? '';
    router.push(
      `/item/add?applianceId=${applianceId}&compartmentId=${compartmentId}&applianceType=${appliance?.type ?? 'freezer'}&teamId=${teamId}`,
    );
  }

  if (isLoading) return <LoadingScreen message="Loading items…" />;
  if (isError)   return <ErrorScreen message="Could not load items." onRetry={refetch} />;

  return (
    <View className="flex-1 bg-surface-alt" style={{ paddingTop: insets.top }}>

      {/* ── Header ── */}
      <View className="flex-row items-center px-4 py-3 bg-white border-b border-surface-border">
        <Pressable className="mr-3 p-2 rounded-full bg-surface-alt" onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')}>
          <ArrowLeft color="#1A3A5C" size={20} />
        </Pressable>
        <View className="flex-1">
          <Text className="text-lg font-bold text-brand" numberOfLines={1}>
            {compartmentLabel}
          </Text>
          <Text className="text-xs text-gray-400">{applianceName}</Text>
        </View>
        <Text className="text-sm text-gray-400">
          {items.length} {items.length === 1 ? 'item' : 'items'}
        </Text>
      </View>

      {/* ── Item list ── */}
      <FlatList<Item>
        data={items}
        keyExtractor={(item) => item.$id}
        contentContainerStyle={{
          paddingBottom: 100 + insets.bottom, // space for FAB
        }}
        renderItem={({ item }) => (
          <ItemRow
            item={item}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        )}
        ListEmptyComponent={
          <EmptyState
            icon={appliance?.type === 'fridge' ? '🥗' : '❄️'}
            title="Nothing here yet"
            subtitle="Tap the + button to add your first item."
          />
        }
      />

      {/* ── FAB ── */}
      <Pressable
        className="absolute right-6 bg-brand rounded-full w-14 h-14 items-center justify-center shadow-lg"
        style={{ bottom: insets.bottom + 24 }}
        onPress={handleAddItem}
      >
        <Plus color="white" size={24} />
      </Pressable>
    </View>
  );
}
