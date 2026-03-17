import { useRef, useState } from 'react';

import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';

import { joinHouseholdByCode } from '@/services/households';
import { useAppStore } from '@/stores/useAppStore';
import { useAuthStore } from '@/stores/useAuthStore';

// 📘 React Native Note — useRef for TextInput focus
// useRef gives us a stable reference to a component between renders.
// Here we use it to programmatically focus the code input on mount.
// Unlike useState, changing a ref does NOT trigger a re-render —
// it's perfect for storing DOM/component references.

export default function JoinScreen() {
  const { user } = useAuthStore();
  const { setActiveHousehold } = useAppStore();

  const [code, setCode]       = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const inputRef = useRef<TextInput>(null);

  async function handleJoin() {
    const trimmed = code.trim().toUpperCase();
    if (trimmed.length !== 6) {
      setError('Please enter the full 6-character code.');
      return;
    }
    if (!user) {
      setError('No user session. Please register first.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const household = await joinHouseholdByCode(trimmed, user.$id, user.email, user.name);
      setActiveHousehold(household.$id);
      setSuccess(true);
      // Auth gate in _layout.tsx will redirect to /(tabs) since user is already logged in
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Could not join household. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <View className="flex-1 bg-white justify-center items-center px-6">
        <Text className="text-5xl mb-4">🎉</Text>
        <Text className="text-2xl font-bold text-brand mb-2 text-center">Invitation Sent!</Text>
        <Text className="text-base text-gray-500 text-center">
          Check your email and click the confirmation link to complete joining the household.
          Then open the app again.
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white justify-center px-6">
      <Text className="text-2xl font-bold text-brand mb-2">Join a Household</Text>
      <Text className="text-gray-500 mb-8">
        Enter the 6-character code your family admin shared with you.
      </Text>

      {/* 📘 React Native Note — Controlled TextInput
          Value is stored in state and fed back to the input via the 'value'
          prop. onChangeText fires every keystroke. This is called a "controlled
          component" — React is the single source of truth for the input's value,
          not the native text field. This lets us transform input (toUpperCase)
          and validate on every change. */}
      <TextInput
        ref={inputRef}
        className="border-2 border-surface-border rounded-xl px-4 py-4 mb-4 text-2xl text-center tracking-widest text-brand font-bold"
        placeholder="ABC123"
        placeholderTextColor="#CBD5E1"
        maxLength={6}
        autoCapitalize="characters"
        autoCorrect={false}
        autoFocus
        value={code}
        onChangeText={(t) => setCode(t.toUpperCase())}
        onSubmitEditing={handleJoin}
      />

      {/* Live character count */}
      <Text className="text-center text-gray-400 text-sm mb-6">
        {code.length}/6 characters
      </Text>

      {error ? (
        <View className="bg-danger-pale border border-danger rounded-xl px-4 py-3 mb-4">
          <Text className="text-danger text-sm">{error}</Text>
        </View>
      ) : null}

      <Pressable
        className={`rounded-xl py-4 items-center ${code.length === 6 ? 'bg-brand' : 'bg-gray-200'}`}
        onPress={handleJoin}
        disabled={loading || code.length !== 6}
      >
        {loading
          ? <ActivityIndicator color={code.length === 6 ? '#fff' : '#94A3B8'} />
          : <Text className={`font-semibold text-base ${code.length === 6 ? 'text-white' : 'text-gray-400'}`}>
              Join Household
            </Text>
        }
      </Pressable>
    </View>
  );
}
