import { Pressable, Text, View } from 'react-native';
import { ChevronRight } from 'lucide-react-native';

import { EXPIRY_COLOURS } from '@/utils/expiry';
import { formatDate } from '@/utils/dates';
import type { Item } from '@/types';

// 📘 React Native Note — Text highlight via inline spans
// React Native lets you nest <Text> inside <Text>. Each inner <Text> inherits
// styles from the outer one but can override specific properties. We exploit
// this to implement substring highlighting: split the item name on the match,
// then wrap matching segments in a bold/coloured inner <Text>.
//
// new RegExp(`(${query})`, 'gi') uses a capture group so that .split() keeps
// the matched substring in the resulting array — otherwise splits discard the
// delimiter. The 'gi' flags make it case-insensitive and global (all matches).

interface HighlightProps {
  text:  string;
  query: string;
}

function HighlightedText({ text, query }: HighlightProps) {
  if (!query.trim()) return <Text className="text-base font-medium text-gray-800">{text}</Text>;

  // Escape regex special chars in query to prevent crashes on chars like '('
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts    = text.split(new RegExp(`(${escaped})`, 'gi'));

  return (
    <Text className="text-base font-medium text-gray-800">
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <Text key={i} className="text-brand font-bold bg-brand-pale">{part}</Text>
        ) : (
          <Text key={i}>{part}</Text>
        ),
      )}
    </Text>
  );
}

// ── Expiry badge ──────────────────────────────────────────────────────────────

function ExpiryBadge({ item }: { item: Item }) {
  const status = item.expiryStatus ?? 'none';
  if (status === 'none') return null;

  const colours  = EXPIRY_COLOURS[status];
  const dateStr  = item.useBy ?? item.bestBefore;
  const label    = dateStr ? formatDate(dateStr, 'd MMM') : null;
  const statusLabel =
    status === 'expired'       ? 'Expired'       :
    status === 'expiring_soon' ? 'Expiring soon' : 'OK';

  return (
    <View className={`flex-row items-center rounded-full px-2 py-0.5 ${colours.bg}`}>
      <View className={`w-1.5 h-1.5 rounded-full mr-1 ${colours.dot}`} />
      <Text className={`text-xs font-medium ${colours.text}`}>
        {label ? label : statusLabel}
      </Text>
    </View>
  );
}

// ── SearchResultRow ───────────────────────────────────────────────────────────

interface Props {
  item:             Item;
  applianceName:    string;
  compartmentLabel: string;
  query:            string;
  onPress:          () => void;
}

export function SearchResultRow({
  item,
  applianceName,
  compartmentLabel,
  query,
  onPress,
}: Props) {
  return (
    <Pressable
      className="flex-row items-center bg-white mx-4 mb-2 px-4 py-3 rounded-xl border border-surface-border active:opacity-70"
      onPress={onPress}
    >
      {/* Left: name + breadcrumb */}
      <View className="flex-1 mr-2">
        <HighlightedText text={item.name} query={query} />
        <Text className="text-xs text-gray-400 mt-0.5" numberOfLines={1}>
          {applianceName}
          {compartmentLabel ? ` › ${compartmentLabel}` : ''}
          {item.quantity ? `  ·  ${item.quantity}` : ''}
        </Text>
      </View>

      {/* Right: expiry badge + chevron */}
      <View className="flex-row items-center gap-2">
        <ExpiryBadge item={item} />
        <ChevronRight color="#94A3B8" size={16} />
      </View>
    </Pressable>
  );
}
