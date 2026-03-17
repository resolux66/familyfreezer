import { Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { ItemForm } from '@/components/items/ItemForm';
import { useCompartmentItems, useUpdateItem } from '@/hooks/useItems';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { ErrorScreen } from '@/components/ui/ErrorScreen';
import type { ApplianceType, CreateItemInput } from '@/types';

// 📘 React Native Note — Edit screen data loading
// Rather than fetching a single item by ID, we reuse the compartment query
// that's already cached from the drawer screen. useCompartmentItems() is
// likely still warm in the TanStack Query cache, so this renders instantly
// with no extra network request. We then .find() the specific item by ID.
//
// This is the preferred pattern: reuse existing query caches rather than
// adding a new queryFn. The cache is invalidated on update, so both the
// drawer list and this edit screen stay consistent.

export default function EditItemScreen() {
  const router = useRouter();
  const { id, applianceId, compartmentId, applianceType } =
    useLocalSearchParams<{
      id:            string;
      applianceId:   string;
      compartmentId: string;
      applianceType: string;
    }>();

  const { data: items, isLoading, isError, refetch } =
    useCompartmentItems(applianceId ?? '', compartmentId ?? '');

  const updateItem = useUpdateItem(applianceId ?? '', compartmentId ?? '');

  if (isLoading) return <LoadingScreen message="Loading item…" />;
  if (isError)   return <ErrorScreen message="Could not load item." onRetry={refetch} />;

  const item = items?.find((i) => i.$id === id);

  if (!item) {
    // Item not found — it may have been deleted by another household member
    return (
      <ErrorScreen
        message="Item not found. It may have been removed by another household member."
        onRetry={() => router.back()}
      />
    );
  }

  function handleSubmit(input: CreateItemInput) {
    updateItem.mutate(
      { itemId: id ?? '', updates: input },
      {
        onSuccess: () => router.back(),
        onError: (e) =>
          Alert.alert('Error', e instanceof Error ? e.message : 'Could not update item.'),
      },
    );
  }

  return (
    <ItemForm
      applianceType={(applianceType as ApplianceType) ?? 'freezer'}
      initialValues={{
        name:       item.name,
        quantity:   item.quantity ?? '',
        bestBefore: item.bestBefore ?? null,
        useBy:      item.useBy ?? null,
        notes:      item.notes ?? '',
      }}
      submitLabel="Save"
      isSubmitting={updateItem.isPending}
      onSubmit={handleSubmit}
      onCancel={() => router.back()}
    />
  );
}
