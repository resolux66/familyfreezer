import { Pressable, Text, View } from 'react-native';

interface Props {
  icon?: string;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon = '❄️', title, subtitle, actionLabel, onAction }: Props) {
  return (
    <View className="flex-1 items-center justify-center px-8 py-16">
      <Text className="text-6xl mb-4">{icon}</Text>
      <Text className="text-xl font-bold text-brand dark:text-brand-light text-center mb-2">{title}</Text>
      {subtitle ? (
        <Text className="text-gray-500 dark:text-gray-400 text-sm text-center mb-6">{subtitle}</Text>
      ) : null}
      {actionLabel && onAction ? (
        <Pressable
          className="bg-brand px-6 py-3 rounded-xl"
          onPress={onAction}
        >
          <Text className="text-white font-semibold">{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
