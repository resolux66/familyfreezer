import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { useAuthStore } from '@/stores/useAuthStore';

export const DEMO_EMAIL = 'demo@freezerfamily.app';

export function DemoBanner() {
  const router = useRouter();
  const user   = useAuthStore((s) => s.user);

  if (user?.email !== DEMO_EMAIL) return null;

  return (
    <View className="bg-warn-pale border-b border-warn px-4 py-2 flex-row items-center justify-between">
      <Text className="text-warn text-xs font-medium flex-1">
        Demo mode — data resets daily at midnight
      </Text>
      <Pressable onPress={() => router.push('/(auth)/register')}>
        <Text className="text-warn text-xs font-bold underline ml-3">Create account →</Text>
      </Pressable>
    </View>
  );
}
