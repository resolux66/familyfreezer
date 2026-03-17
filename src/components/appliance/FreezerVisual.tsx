import { Pressable, ScrollView, Text, View } from 'react-native';
import { Defs, LinearGradient, Rect, Stop, Svg } from 'react-native-svg';
import { ChevronRight } from 'lucide-react-native';

import type { Compartment, ExpiryStatus, Item } from '@/types';
import { getExpiryStatus } from '@/utils/expiry';

// 📘 React Native Note — react-native-svg
// The web <svg> tag becomes <Svg>, <rect> → <Rect>, <text> → <SvgText>
// (renamed to avoid conflict with React Native's <Text>).
// SVG elements use numeric width/height (not strings like "100%") unless
// wrapped in a viewBox — for layout-responsive sizes, calculate from
// useWindowDimensions() and pass as numbers.

const BORDER_COLOUR: Record<ExpiryStatus, string> = {
  ok:            '#16A34A',
  expiring_soon: '#D97706',
  expired:       '#DC2626',
  none:          '#E2E8F0',
};

function compartmentStatus(items: Item[]): ExpiryStatus {
  if (items.some((i) => i.expiryStatus === 'expired'))       return 'expired';
  if (items.some((i) => i.expiryStatus === 'expiring_soon')) return 'expiring_soon';
  if (items.some((i) => i.expiryStatus === 'ok'))            return 'ok';
  return 'none';
}

interface Props {
  compartments: Compartment[];
  applianceId:  string;
  allItems:     Item[];
  onPressCompartment: (compartmentId: string) => void;
}

export function FreezerVisual({ compartments, applianceId, allItems, onPressCompartment }: Props) {
  return (
    <View>
      {/* Decorative SVG header — freezer lid / top section */}
      <Svg width="100%" height={56} style={{ marginBottom: -1 }}>
        <Defs>
          <LinearGradient id="freezerGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#1E3A5F" stopOpacity="1" />
            <Stop offset="1" stopColor="#1A3A5C" stopOpacity="1" />
          </LinearGradient>
        </Defs>
        {/* Body top */}
        <Rect x="0" y="8" width="100%" height="48" rx="16" ry="16" fill="url(#freezerGrad)" />
        {/* Handle bar */}
        <Rect x="35%" y="20" width="30%" height="6" rx="3" ry="3" fill="#2563EB" opacity="0.6" />
      </Svg>

      {/* Drawer slots */}
      <View className="bg-brand rounded-b-2xl overflow-hidden pb-3 px-3">
        {compartments.map((comp, idx) => {
          const compItems = allItems
            .filter((i) => i.applianceId === applianceId && i.compartmentId === comp.id)
            .map((i) => ({ ...i, expiryStatus: getExpiryStatus(i.useBy, i.bestBefore) }));
          const status     = compartmentStatus(compItems);
          const borderColor = BORDER_COLOUR[status];

          return (
            <Pressable
              key={comp.id}
              style={({ pressed }) => ({
                opacity: pressed ? 0.8 : 1,
                borderLeftWidth: 4,
                borderLeftColor: borderColor,
                marginTop: idx === 0 ? 4 : 6,
                backgroundColor: 'rgba(255,255,255,0.10)',
                borderRadius: 10,
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: 12,
                paddingHorizontal: 12,
              })}
              onPress={() => onPressCompartment(comp.id)}
            >
              <Text style={{ color: '#fff', fontWeight: '600', flex: 1, fontSize: 14 }} numberOfLines={1}>
                {comp.label}
              </Text>
              <Text style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12, marginRight: 6 }}>
                {compItems.length} {compItems.length === 1 ? 'item' : 'items'}
              </Text>
              <ChevronRight color="rgba(255,255,255,0.4)" size={16} />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
