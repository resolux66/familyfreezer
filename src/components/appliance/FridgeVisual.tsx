import { Pressable, View, Text } from 'react-native';
import { Defs, LinearGradient, Rect, Stop, Svg, Circle } from 'react-native-svg';
import { ChevronRight } from 'lucide-react-native';

import type { Compartment, ExpiryStatus, Item } from '@/types';
import { getExpiryStatus } from '@/utils/expiry';

const STATUS_COLOUR: Record<ExpiryStatus, string> = {
  ok:            '#16A34A',
  expiring_soon: '#D97706',
  expired:       '#DC2626',
  none:          '#CBD5E1',
};

function compartmentStatus(items: Item[]): ExpiryStatus {
  if (items.some((i) => i.expiryStatus === 'expired'))       return 'expired';
  if (items.some((i) => i.expiryStatus === 'expiring_soon')) return 'expiring_soon';
  if (items.some((i) => i.expiryStatus === 'ok'))            return 'ok';
  return 'none';
}

// Determine if this is the bottom crisper section (last compartment)
function isCrisper(idx: number, total: number) {
  return idx === total - 1 && total > 2;
}

interface Props {
  compartments: Compartment[];
  applianceId:  string;
  allItems:     Item[];
  onPressCompartment: (compartmentId: string) => void;
}

export function FridgeVisual({ compartments, applianceId, allItems, onPressCompartment }: Props) {
  return (
    <View>
      {/* Decorative SVG — fridge top with hinge detail */}
      <Svg width="100%" height={48} style={{ marginBottom: -1 }}>
        <Defs>
          <LinearGradient id="fridgeGrad" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor="#F1F5F9" stopOpacity="1" />
            <Stop offset="1" stopColor="#E2E8F0" stopOpacity="1" />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="8" width="100%" height="40" rx="14" ry="14" fill="url(#fridgeGrad)" />
        {/* Hinge dots */}
        <Circle cx="92%" cy="22" r="4" fill="#CBD5E1" />
        <Circle cx="92%" cy="38" r="4" fill="#CBD5E1" />
        {/* Handle */}
        <Rect x="4%" y="20" width="4" height="18" rx="2" ry="2" fill="#94A3B8" />
      </Svg>

      {/* Shelf rows */}
      <View
        className="rounded-b-2xl overflow-hidden pb-2"
        style={{ backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#E2E8F0', borderTopWidth: 0 }}
      >
        {compartments.map((comp, idx) => {
          const compItems = allItems
            .filter((i) => i.applianceId === applianceId && i.compartmentId === comp.id)
            .map((i) => ({ ...i, expiryStatus: getExpiryStatus(i.useBy, i.bestBefore) }));
          const status      = compartmentStatus(compItems);
          const statusColor = STATUS_COLOUR[status];
          const crisper     = isCrisper(idx, compartments.length);

          return (
            <Pressable
              key={comp.id}
              style={({ pressed }) => ({
                opacity: pressed ? 0.8 : 1,
                borderLeftWidth: 4,
                borderLeftColor: statusColor,
                marginHorizontal: 8,
                marginTop: crisper ? 10 : 6,
                backgroundColor: crisper ? '#E2E8F0' : '#FFFFFF',
                borderRadius: 10,
                borderTopWidth: crisper ? 2 : 0,
                borderTopColor: '#CBD5E1',
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: 12,
                paddingHorizontal: 12,
              })}
              onPress={() => onPressCompartment(comp.id)}
            >
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: '600', fontSize: 14, color: '#1E293B' }} numberOfLines={1}>
                  {comp.label}
                </Text>
                {crisper && (
                  <Text style={{ fontSize: 11, color: '#94A3B8', marginTop: 1 }}>Crisper drawer</Text>
                )}
              </View>
              <Text style={{ color: '#94A3B8', fontSize: 12, marginRight: 6 }}>
                {compItems.length} {compItems.length === 1 ? 'item' : 'items'}
              </Text>
              <ChevronRight color="#CBD5E1" size={16} />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
