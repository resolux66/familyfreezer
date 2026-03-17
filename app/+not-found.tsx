import { Link, Stack } from 'expo-router';
import { Text, View } from 'react-native';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Not Found' }} />
      <View className="flex-1 items-center justify-center bg-white">
        <Text className="text-xl font-bold text-brand mb-4">Page not found</Text>
        <Link href="/(tabs)" className="text-brand-light">Go Home</Link>
      </View>
    </>
  );
}
