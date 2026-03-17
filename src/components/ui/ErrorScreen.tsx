import { Pressable, Text, View } from 'react-native';
import { AlertCircle } from 'lucide-react-native';

interface Props {
  message?: string;
  onRetry?: () => void;
}

// 📘 React Native Note — Always handle error state
// TanStack Query gives you isError and refetch from useQuery. Never skip the
// error state — on mobile, networks drop constantly. A Retry button lets users
// recover without leaving the screen.
export function ErrorScreen({ message = 'Something went wrong.', onRetry }: Props) {
  return (
    <View className="flex-1 items-center justify-center bg-surface-alt dark:bg-gray-950 px-8">
      <AlertCircle color="#DC2626" size={40} />
      <Text className="text-danger font-semibold text-base mt-3 text-center">{message}</Text>
      {onRetry ? (
        <Pressable
          className="mt-4 bg-brand px-6 py-3 rounded-xl"
          onPress={onRetry}
        >
          <Text className="text-white font-semibold">Retry</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
