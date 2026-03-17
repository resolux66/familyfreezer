import { Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { ItemForm } from '@/components/items/ItemForm';
import { useAddItem } from '@/hooks/useItems';
import type { ApplianceType, CreateItemInput } from '@/types';

// 📘 React Native Note — Route params via useLocalSearchParams
// Expo Router passes dynamic segment values AND query-string params through
// useLocalSearchParams(). The drawer screen navigated here with:
//   router.push(`/item/add?applianceId=${aId}&compartmentId=${cId}&applianceType=${t}&teamId=${tid}`)
// All values arrive as strings — cast ApplianceType after reading.

export default function AddItemScreen() {
  const router = useRouter();
  const { applianceId, compartmentId, applianceType, teamId } =
    useLocalSearchParams<{
      applianceId:   string;
      compartmentId: string;
      applianceType: string;
      teamId:        string;
    }>();

  const addItem = useAddItem(applianceId ?? '', compartmentId ?? '');

  function handleSubmit(input: CreateItemInput) {
    if (!teamId) {
      Alert.alert('Error', 'Missing team information. Please go back and try again.');
      return;
    }
    addItem.mutate(
      { input, teamId },
      {
        onSuccess: () => router.canGoBack() ? router.back() : router.replace('/(tabs)'),
        onError: (e) =>
          Alert.alert('Error', e instanceof Error ? e.message : 'Could not save item.'),
      },
    );
  }

  return (
    <ItemForm
      applianceType={(applianceType as ApplianceType) ?? 'freezer'}
      submitLabel="Add"
      isSubmitting={addItem.isPending}
      onSubmit={handleSubmit}
      onCancel={() => router.back()}
    />
  );
}
