import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Edit3 } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FreezerVisual } from '@/components/appliance/FreezerVisual';
import { FridgeVisual } from '@/components/appliance/FridgeVisual';
import { ErrorScreen } from '@/components/ui/ErrorScreen';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { useAppliance } from '@/hooks/useAppliances';
import { useAllHouseholdItems } from '@/hooks/useItems';
import { useActiveHousehold } from '@/hooks/useHousehold';
import { useAuthStore } from '@/stores/useAuthStore';

// 📘 React Native Note — useLocalSearchParams
// Expo Router passes route parameters as strings via useLocalSearchParams().
// For /appliance/[id], the hook returns { id: string }.
// Always destructure with a type parameter: useLocalSearchParams<{ id: string }>()
// so TypeScript knows the shape. Validate the value before using it — URL params
// are untrusted input, just like query strings on the web.

export default function ApplianceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router  = useRouter();
  const insets  = useSafeAreaInsets();

  const user             = useAuthStore((s) => s.user);
  const activeHousehold  = useActiveHousehold();
  const isAdmin          = !!user && !!activeHousehold && user.$id === activeHousehold.adminUserId;

  const { data: appliance, isLoading, isError, refetch } = useAppliance(id);
  const { data: allItems = [] } = useAllHouseholdItems();

  function handleCompartmentPress(compartmentId: string) {
    router.push(`/appliance/${id}/drawer/${compartmentId}`);
  }

  if (isLoading) return <LoadingScreen message="Loading appliance…" />;
  if (isError || !appliance) {
    return <ErrorScreen message="Could not load appliance." onRetry={refetch} />;
  }

  const isFreezer = appliance.type === 'freezer';

  return (
    <View className="flex-1 bg-surface-alt" style={{ paddingTop: insets.top }}>

      {/* ── Header ── */}
      <View className="flex-row items-center px-4 py-3">
        <Pressable
          className="mr-3 p-2 rounded-full bg-white"
          onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')}
        >
          <ArrowLeft color="#1A3A5C" size={20} />
        </Pressable>

        <View className="flex-1">
          <Text className="text-xl font-bold text-brand" numberOfLines={1}>
            {appliance.name}
          </Text>
          <Text className="text-xs text-gray-400 capitalize">{appliance.type}</Text>
        </View>

        {isAdmin && (
          <Pressable
            className="p-2 rounded-full bg-white"
            onPress={() =>
              Alert.alert(
                appliance.name,
                'Manage this appliance:',
                [
                  {
                    text: 'Rename',
                    onPress: () =>
                      Alert.prompt
                        ? Alert.prompt('Rename', '', (name) => {
                            if (name?.trim()) { /* handled by useUpdateAppliance in Phase 10 */ }
                          }, 'plain-text', appliance.name)
                        : Alert.alert('Rename', 'Use the Admin Panel to rename appliances.'),
                  },
                  { text: 'Cancel', style: 'cancel' },
                ],
              )
            }
          >
            <Edit3 color="#64748B" size={18} />
          </Pressable>
        )}
      </View>

      <ScrollView
        className="flex-1 px-4"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        {/* ── Visual illustration ── */}
        <View className="mb-6">
          {isFreezer ? (
            <FreezerVisual
              compartments={appliance.compartments}
              applianceId={appliance.$id}
              allItems={allItems}
              onPressCompartment={handleCompartmentPress}
            />
          ) : (
            <FridgeVisual
              compartments={appliance.compartments}
              applianceId={appliance.$id}
              allItems={allItems}
              onPressCompartment={handleCompartmentPress}
            />
          )}
        </View>

        {/* ── Legend ── */}
        <View className="flex-row items-center gap-4 px-1 mb-2">
          <Text className="text-xs text-gray-400 mr-2">Status:</Text>
          {[
            { color: '#16A34A', label: 'All good' },
            { color: '#D97706', label: 'Expiring soon' },
            { color: '#DC2626', label: 'Expired' },
            { color: '#CBD5E1', label: 'No dates' },
          ].map(({ color, label }) => (
            <View key={label} className="flex-row items-center">
              <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: color, marginRight: 4 }} />
              <Text className="text-xs text-gray-500">{label}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
