import { useRef } from 'react';

import { Animated, Pressable, Text, View } from 'react-native';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import { Pencil, Trash2 } from 'lucide-react-native';

import type { Item } from '@/types';
import { EXPIRY_COLOURS } from '@/utils/expiry';
import { formatDate } from '@/utils/dates';
import { hapticLight, hapticMedium } from '@/utils/haptics';

// 📘 React Native Note — Swipeable from react-native-gesture-handler
// Swipeable wraps a row and detects horizontal pan gestures. When the user
// swipes far enough, it reveals an "action" View behind the row (renderRightActions
// for swipe-left, renderLeftActions for swipe-right). The row itself stays
// mounted — the Swipeable just translates it with an Animated.Value.
//
// Each row needs its OWN Swipeable instance. We close all other open swipeables
// when one is opened by keeping a ref to the currently open row and calling
// swipeableRef.current?.close() on it.

interface Props {
  item:     Item;
  onEdit:   (item: Item) => void;
  onDelete: (itemId: string) => void;
}

export function ItemRow({ item, onEdit, onDelete }: Props) {
  const swipeRef = useRef<Swipeable>(null);
  const expiryColours = EXPIRY_COLOURS[item.expiryStatus ?? 'none'];

  // ── Right action: Delete ───────────────────────────────────────────────────
  function renderRightActions(progress: Animated.AnimatedInterpolation<number>) {
    const translateX = progress.interpolate({
      inputRange:  [0, 1],
      outputRange: [80, 0],
    });
    return (
      <Animated.View style={{ transform: [{ translateX }] }}>
        <Pressable
          className="bg-danger w-20 items-center justify-center rounded-r-xl"
          onPress={() => {
            swipeRef.current?.close();
            onDelete(item.$id);
          }}
        >
          <Trash2 color="white" size={20} />
          <Text className="text-white text-xs mt-1">Delete</Text>
        </Pressable>
      </Animated.View>
    );
  }

  // ── Left action: Edit ──────────────────────────────────────────────────────
  function renderLeftActions(progress: Animated.AnimatedInterpolation<number>) {
    const translateX = progress.interpolate({
      inputRange:  [0, 1],
      outputRange: [-80, 0],
    });
    return (
      <Animated.View style={{ transform: [{ translateX }] }}>
        <Pressable
          className="bg-brand-light w-20 items-center justify-center rounded-l-xl"
          onPress={() => {
            swipeRef.current?.close();
            onEdit(item);
          }}
        >
          <Pencil color="white" size={20} />
          <Text className="text-white text-xs mt-1">Edit</Text>
        </Pressable>
      </Animated.View>
    );
  }

  return (
    <Swipeable
      ref={swipeRef}
      renderRightActions={renderRightActions}
      renderLeftActions={renderLeftActions}
      friction={2}
      rightThreshold={40}
      leftThreshold={40}
      onSwipeableOpen={(direction) => {
        // Medium haptic when a swipe action is fully revealed
        // 📘 React Native Note — onSwipeableOpen fires when the swipe crosses
        // the threshold and snaps open. This is the moment the user "commits"
        // to the action — the right time for a confirmatory haptic.
        direction === 'right' ? hapticMedium() : hapticLight();
      }}
    >
      <View className="bg-white flex-row items-center px-4 py-3 border-b border-surface-border">
        {/* Status indicator */}
        <View className={`w-2.5 h-2.5 rounded-full mr-3 ${expiryColours.dot}`} />

        {/* Item info */}
        <View className="flex-1">
          <Text className="font-semibold text-base text-gray-900" numberOfLines={1}>
            {item.name}
          </Text>
          {item.quantity ? (
            <Text className="text-sm text-gray-500">{item.quantity}</Text>
          ) : null}
        </View>

        {/* Expiry badge */}
        <View className="items-end ml-3">
          {(item.useBy ?? item.bestBefore) ? (
            <View className={`px-2 py-0.5 rounded-full ${expiryColours.bg}`}>
              <Text className={`text-xs font-medium ${expiryColours.text}`}>
                {item.useBy
                  ? formatDate(item.useBy)
                  : `BB: ${formatDate(item.bestBefore)}`}
              </Text>
            </View>
          ) : (
            <Text className="text-xs text-gray-300">No date</Text>
          )}
          <Text className="text-xs text-gray-400 mt-1">
            Added {formatDate(item.dateAdded, 'd MMM')}
          </Text>
        </View>
      </View>
    </Swipeable>
  );
}
