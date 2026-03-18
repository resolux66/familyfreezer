import { useEffect, useState } from 'react';

import { ActivityIndicator, Alert, FlatList, Pressable, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Plus, Search } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useCreateHousehold } from '@/hooks/useHousehold';

import { AddApplianceModal } from '@/components/appliance/AddApplianceModal';
import { ApplianceCard } from '@/components/appliance/ApplianceCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorScreen } from '@/components/ui/ErrorScreen';
import { ExpiryBanner } from '@/components/ui/ExpiryBanner';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { useDeleteAppliance, useAppliances } from '@/hooks/useAppliances';
import { useActiveHousehold, useHouseholds } from '@/hooks/useHousehold';
import { useAllHouseholdItems } from '@/hooks/useItems';
import { useAppStore } from '@/stores/useAppStore';
import { useAuthStore } from '@/stores/useAuthStore';
import type { Appliance } from '@/types';

// 📘 React Native Note — FlatList vs ScrollView
// FlatList is a virtualised list: it only renders rows currently visible on
// screen, recycling off-screen rows as you scroll. ScrollView renders ALL
// children at once. For a household with 2–3 appliances the difference is
// negligible, but FlatList is the correct habit for any list of unknown length.
// Rule of thumb: if the list could have >10 items, use FlatList.

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const user = useAuthStore((s) => s.user);
  const { activeHouseholdId, setActiveHousehold, setSearchQuery } = useAppStore();

  const { data: households }  = useHouseholds();
  const activeHousehold       = useActiveHousehold();
  const { data: appliances, isLoading, isError, refetch } = useAppliances();
  const { data: allItems = [] } = useAllHouseholdItems();
  const deleteAppliance         = useDeleteAppliance();

  const [addModalVisible, setAddModalVisible] = useState(false);
  const [householdName, setHouseholdName] = useState('');
  const createHousehold = useCreateHousehold();

  // Auto-select the first household if none is active (e.g. after logout/login)
  useEffect(() => {
    if (!activeHouseholdId && households && households.length > 0) {
      setActiveHousehold(households[0].$id);
    }
  }, [activeHouseholdId, households]);

  function handleCreateHousehold() {
    if (!householdName.trim()) return;
    createHousehold.mutate({ name: householdName.trim(), householdTimezone: 'UTC' });
  }

  const isAdmin = !!user && !!activeHousehold && user.$id === activeHousehold.adminUserId;
  const multipleHouseholds = (households?.length ?? 0) > 1;

  // ── Search bar → navigate to Search tab ──────────────────────────────────
  function handleSearchFocus() {
    router.push('/(tabs)/search');
  }

  // ── Rename appliance via Alert prompt ────────────────────────────────────
  // 📘 React Native Note — Alert.prompt (iOS only)
  // Alert.prompt shows a native text-input dialog on iOS. Android doesn't
  // support this natively, so we use a simple Alert with instructions
  // pointing the user to the appliance detail screen instead.
  function handleRename(id: string, currentName: string) {
    if (Platform.OS === 'ios') {
      Alert.prompt(
        'Rename Appliance',
        'Enter a new name:',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Rename',
            onPress: (_name: string | undefined) => {
              if (_name && _name.trim()) {
                // useUpdateAppliance used from appliance detail — navigate there
                router.push(`/appliance/${id}`);
              }
            },
          },
        ],
        'plain-text',
        currentName,
      );
    } else {
      router.push(`/appliance/${id}`);
    }
  }

  // ── Delete appliance ─────────────────────────────────────────────────────
  function handleDelete(id: string) {
    deleteAppliance.mutate(id, {
      onError: (e) =>
        Alert.alert('Error', e instanceof Error ? e.message : 'Could not delete appliance.'),
    });
  }

  // ── Render states ─────────────────────────────────────────────────────────
  if (isLoading) return <LoadingScreen message="Loading appliances…" />;
  if (isError)   return <ErrorScreen message="Could not load appliances." onRetry={refetch} />;

  // No household yet — show setup prompt
  if (user && households !== undefined && households.length === 0) {
    return (
      <View className="flex-1 bg-surface-alt justify-center px-6" style={{ paddingTop: insets.top }}>
        <Text className="text-3xl font-bold text-brand mb-2">Welcome!</Text>
        <Text className="text-base text-gray-500 mb-8">Create your household to get started.</Text>
        <TextInput
          className="border border-surface-border rounded-xl px-4 py-3 mb-4 text-base bg-white"
          placeholder='e.g. "Smith Family" or "Home"'
          value={householdName}
          onChangeText={setHouseholdName}
        />
        {createHousehold.error ? <Text className="text-danger text-sm mb-3">{createHousehold.error instanceof Error ? createHousehold.error.message : 'Could not create household.'}</Text> : null}
        <Pressable
          className="bg-brand rounded-xl py-4 items-center"
          onPress={handleCreateHousehold}
          disabled={createHousehold.isPending}
        >
          {createHousehold.isPending
            ? <ActivityIndicator color="#fff" />
            : <Text className="text-white font-semibold text-base">Create Household</Text>
          }
        </Pressable>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-surface-alt" style={{ paddingTop: insets.top }}>

      {/* ── Header ── */}
      <View className="px-5 pt-4 pb-2 flex-row items-center justify-between">
        <View className="flex-1">
          <Text className="text-xs text-gray-400 uppercase tracking-wider">Household</Text>
          <Pressable
            className="flex-row items-center"
            onPress={() => {
              if (!multipleHouseholds) return;
              // Show household picker
              Alert.alert(
                'Switch Household',
                'Choose a household to view:',
                (households ?? []).map((h) => ({
                  text: h.name + (h.$id === activeHouseholdId ? ' ✓' : ''),
                  onPress: () => setActiveHousehold(h.$id),
                })).concat([{ text: 'Cancel', style: 'cancel' } as unknown as { text: string; onPress: () => void }]),
              );
            }}
          >
            <Text className="text-xl font-bold text-brand mr-1" numberOfLines={1}>
              {activeHousehold?.name ?? 'My Household'}
            </Text>
            {multipleHouseholds && (
              <Text className="text-brand-light text-xs mt-0.5">▼</Text>
            )}
          </Pressable>
        </View>

        {/* Add appliance button — visible to all, guarded in modal */}
        <Pressable
          className="bg-brand rounded-full w-10 h-10 items-center justify-center"
          onPress={() => {
            if (!isAdmin) {
              Alert.alert('Admin Only', 'Only the household admin can add appliances.');
              return;
            }
            setAddModalVisible(true);
          }}
        >
          <Plus color="white" size={20} />
        </Pressable>
      </View>

      {/* ── Expiry banner (shown when items are expired / expiring soon) ── */}
      <ExpiryBanner />

      {/* ── Search bar (tappable — navigates to Search tab) ── */}
      <View className="px-5 pb-3">
        <Pressable
          className="flex-row items-center bg-white border border-surface-border rounded-xl px-4 py-3"
          onPress={handleSearchFocus}
        >
          <Search color="#94A3B8" size={16} />
          <Text className="ml-2 text-gray-400 text-base">Search items…</Text>
        </Pressable>
      </View>

      {/* ── Appliance list ── */}
      <FlatList<Appliance>
        data={appliances ?? []}
        keyExtractor={(item) => item.$id}
        contentContainerStyle={{ padding: 20, paddingTop: 4 }}
        renderItem={({ item }) => (
          <ApplianceCard
            appliance={item}
            allItems={allItems}
            isAdmin={isAdmin}
            onDelete={handleDelete}
            onRename={handleRename}
          />
        )}
        ListEmptyComponent={
          <EmptyState
            icon={'❄️'}
            title="No appliances yet"
            subtitle={
              isAdmin
                ? "Tap the + button to add your first freezer or fridge."
                : "Your household admin hasn't added any appliances yet."
            }
          />
        }
      />

      {/* ── Add Appliance Modal ── */}
      {activeHousehold && (
        <AddApplianceModal
          visible={addModalVisible}
          teamId={activeHousehold.teamId}
          onClose={() => setAddModalVisible(false)}
        />
      )}
    </View>
  );
}

// Needed for Alert.prompt Platform check
import { Platform } from 'react-native';
