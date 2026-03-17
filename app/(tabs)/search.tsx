import { useCallback, useMemo, useRef, useState } from 'react';

import { FlatList, Pressable, Text, TextInput, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Search, X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SearchResultRow } from '@/components/items/SearchResultRow';
import { useAppliances } from '@/hooks/useAppliances';
import { useAllHouseholdItems } from '@/hooks/useItems';
import type { Item } from '@/types';

// 📘 React Native Note — useFocusEffect for tab auto-focus
// useFocusEffect runs a callback every time this screen comes into focus
// (e.g. the user taps the Search tab). It's like useEffect but tied to
// navigation focus, not component mount. We use it to auto-focus the
// TextInput whenever the user switches to the Search tab — natural UX
// since they're obviously here to search.
//
// useCallback wrapping is REQUIRED by useFocusEffect — without it, the
// callback reference changes on every render, causing an infinite loop.

// 📘 React Native Note — Client-side search with useMemo
// useAllHouseholdItems() fetches all items once and keeps them in the
// TanStack Query cache (staleTime: 2 min). Filtering happens entirely
// in JS via .filter() + .includes() — no extra Appwrite request per
// keystroke. This is fast enough for typical household inventories
// (< 500 items). useMemo ensures the filtered array is only recomputed
// when the items list or the query string actually changes.

export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [query, setQuery] = useState('');
  const inputRef = useRef<TextInput>(null);

  const { data: items  = [] } = useAllHouseholdItems();
  const { data: appliances = [] } = useAppliances();

  // Auto-focus the search input whenever the tab gains focus
  useFocusEffect(
    useCallback(() => {
      const timer = setTimeout(() => inputRef.current?.focus(), 100);
      return () => clearTimeout(timer);
    }, []),
  );

  // Build a fast lookup: applianceId → Appliance (with compartments)
  const applianceMap = useMemo(() => {
    return new Map(appliances.map((a) => [a.$id, a]));
  }, [appliances]);

  // Filter items client-side — case-insensitive name match
  const results = useMemo<Item[]>(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return items.filter((item) => item.name.toLowerCase().includes(q));
  }, [items, query]);

  function handleResultPress(item: Item) {
    router.push(`/appliance/${item.applianceId}/drawer/${item.compartmentId}`);
  }

  const hasQuery   = query.trim().length > 0;
  const hasResults = results.length > 0;

  return (
    <View className="flex-1 bg-surface-alt" style={{ paddingTop: insets.top }}>

      {/* ── Search bar ── */}
      <View className="px-4 pt-4 pb-3 bg-white border-b border-surface-border">
        <View className="flex-row items-center bg-surface-alt border border-surface-border rounded-xl px-4 h-11">
          <Search color="#94A3B8" size={16} />
          <TextInput
            ref={inputRef}
            className="flex-1 ml-2 text-base text-gray-800"
            placeholder="Search all items…"
            placeholderTextColor="#94A3B8"
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
            autoCapitalize="none"
            autoCorrect={false}
            clearButtonMode="never"  // We render our own clear button below
          />
          {hasQuery && (
            <Pressable onPress={() => setQuery('')} hitSlop={8}>
              <X color="#94A3B8" size={16} />
            </Pressable>
          )}
        </View>
      </View>

      {/* ── Results ── */}
      {!hasQuery ? (
        // Idle state — prompt the user
        <View className="flex-1 items-center justify-center pb-20">
          <Text className="text-4xl mb-3">🔍</Text>
          <Text className="text-base font-semibold text-gray-700">Search your inventory</Text>
          <Text className="text-sm text-gray-400 mt-1 text-center px-8">
            Type an item name to find it across all your appliances.
          </Text>
        </View>
      ) : !hasResults ? (
        // No match state
        <View className="flex-1 items-center justify-center pb-20">
          <Text className="text-4xl mb-3">🤷</Text>
          <Text className="text-base font-semibold text-gray-700">No items found</Text>
          <Text className="text-sm text-gray-400 mt-1 text-center px-8">
            Nothing matches "{query}". Check the spelling or try a shorter term.
          </Text>
        </View>
      ) : (
        <FlatList<Item>
          data={results}
          keyExtractor={(item) => item.$id}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingTop: 12, paddingBottom: insets.bottom + 24 }}
          // 📘 React Native Note — result count header
          // ListHeaderComponent renders once above the list items. Using it
          // instead of a sibling View avoids z-index issues and scrolls away
          // naturally as the user scrolls through many results.
          ListHeaderComponent={
            <Text className="text-xs text-gray-400 uppercase tracking-wider px-4 mb-2">
              {results.length} {results.length === 1 ? 'result' : 'results'}
            </Text>
          }
          renderItem={({ item }) => {
            const appliance   = applianceMap.get(item.applianceId);
            const compartment = appliance?.compartments.find((c) => c.id === item.compartmentId);
            return (
              <SearchResultRow
                item={item}
                applianceName={appliance?.name ?? ''}
                compartmentLabel={compartment?.label ?? ''}
                query={query.trim()}
                onPress={() => handleResultPress(item)}
              />
            );
          }}
        />
      )}
    </View>
  );
}
