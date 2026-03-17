import { ActivityIndicator, Text, View } from 'react-native';

interface Props {
  message?: string;
}

export function LoadingScreen({ message }: Props) {
  return (
    <View className="flex-1 items-center justify-center bg-surface-alt dark:bg-gray-950">
      <ActivityIndicator size="large" color="#1A3A5C" />
      {message ? (
        <Text className="mt-3 text-gray-500 dark:text-gray-400 text-sm">{message}</Text>
      ) : null}
    </View>
  );
}
