import { useState } from 'react';

import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { ChevronDown, ChevronRight } from 'lucide-react-native';

import { createHousehold } from '@/services/households';
import { useAppStore } from '@/stores/useAppStore';
import { useAuthStore } from '@/stores/useAuthStore';

// 📘 React Native Note — Multi-step form with a 'step' state variable
// Instead of navigating to a new screen for each step, we use a single state
// variable to control which "panel" is visible. This keeps the transition
// smooth and keeps all related state (email, userId, etc.) in one place
// without needing to pass them via route params.

type Step = 'account' | 'choose' | 'create-household';

const COMMON_TIMEZONES = [
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Europe/Amsterdam',
  'Europe/Warsaw',
  'Europe/Rome',
  'Europe/Madrid',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Toronto',
  'America/Vancouver',
  'Australia/Sydney',
  'Australia/Melbourne',
  'Asia/Tokyo',
  'Asia/Singapore',
  'Asia/Dubai',
  'UTC',
];

export default function RegisterScreen() {
  const { register, setPendingRegistration } = useAuthStore();
  const { setActiveHousehold } = useAppStore();
  const router = useRouter();

  // Step 1 — Account fields
  const [name, setName]         = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');

  // Step 2 — Household fields
  const [householdName, setHouseholdName]  = useState('');
  const [timezone, setTimezone]            = useState('Europe/London');
  const [tzPickerVisible, setTzPickerVisible] = useState(false);

  const [step, setStep]       = useState<Step>('account');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  // --- Step 1: Create Appwrite account ---
  async function handleAccountCreate() {
    console.log('[Register] Continue pressed', { name, email, passwordLen: password.length });
    if (!name.trim() || !email.trim() || !password.trim()) {
      setError('Please fill in all fields.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setLoading(true);
    setError(null);
    setPendingRegistration(true);
    try {
      await register(email, password, name);
      setStep('choose');
    } catch (e: unknown) {
      setPendingRegistration(false);
      setError(e instanceof Error ? e.message : 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  // --- Step 2b: Create a new household ---
  async function handleCreateHousehold() {
    if (!householdName.trim()) {
      setError('Please enter a household name.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { user } = useAuthStore.getState();
      if (!user) throw new Error('No user session found.');
      const household = await createHousehold(user.$id, householdName.trim(), timezone);
      setActiveHousehold(household.$id);
      setPendingRegistration(false); // Auth gate will now redirect to /(tabs)
    } catch (e: unknown) {
      setPendingRegistration(false);
      setError(e instanceof Error ? e.message : 'Could not create household. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  // ── Step 1: Account creation form ─────────────────────────────────────────
  if (step === 'account') {
    return (
      <KeyboardAvoidingView
        className="flex-1 bg-white"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View className="flex-1 justify-center px-6">
          <Text className="text-3xl font-bold text-brand mb-2">Create Account</Text>
          <Text className="text-base text-gray-500 mb-8">Step 1 of 2 — Your details</Text>

          <TextInput
            className="border border-surface-border rounded-xl px-4 py-3 mb-3 text-base"
            placeholder="Full Name"
            value={name}
            onChangeText={setName}
          />
          <TextInput
            className="border border-surface-border rounded-xl px-4 py-3 mb-3 text-base"
            placeholder="Email"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
          <TextInput
            className="border border-surface-border rounded-xl px-4 py-3 mb-3 text-base"
            placeholder="Password (min 8 characters)"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          {error ? <Text className="text-danger text-sm mb-3">{error}</Text> : null}

          <Pressable
            className="bg-brand rounded-xl py-4 items-center"
            onPress={handleAccountCreate}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text className="text-white font-semibold text-base">Continue</Text>
            }
          </Pressable>

          <Link href="/(auth)/login" className="mt-6 text-center text-brand-light">
            Already have an account? Sign In
          </Link>
        </View>
      </KeyboardAvoidingView>
    );
  }

  // ── Step 2: Choose create or join ─────────────────────────────────────────
  if (step === 'choose') {
    return (
      <View className="flex-1 bg-white justify-center px-6">
        <Text className="text-3xl font-bold text-brand mb-2">Welcome!</Text>
        <Text className="text-base text-gray-500 mb-10">Step 2 of 2 — Your household</Text>

        <Pressable
          className="bg-brand rounded-2xl p-5 mb-4 flex-row items-center justify-between"
          onPress={() => { setError(null); setStep('create-household'); }}
        >
          <View className="flex-1">
            <Text className="text-white font-bold text-lg mb-1">Create a Household</Text>
            <Text className="text-blue-200 text-sm">Set up a new household and invite your family</Text>
          </View>
          <ChevronRight color="white" size={20} />
        </Pressable>

        <Pressable
          className="border-2 border-brand rounded-2xl p-5 flex-row items-center justify-between"
          onPress={() => router.push('/(auth)/join')}
        >
          <View className="flex-1">
            <Text className="text-brand font-bold text-lg mb-1">Join with Invite Code</Text>
            <Text className="text-gray-500 text-sm">Enter a code shared by your family admin</Text>
          </View>
          <ChevronRight color="#1A3A5C" size={20} />
        </Pressable>
      </View>
    );
  }

  // ── Step 2b: Create household form ────────────────────────────────────────
  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="px-6">
        <View className="flex-1 justify-center py-16">
          <Text className="text-3xl font-bold text-brand mb-2">Name Your Household</Text>
          <Text className="text-base text-gray-500 mb-8">
            Choose a name your family will recognise, e.g. "Smith Family" or "Home".
          </Text>

          <TextInput
            className="border border-surface-border rounded-xl px-4 py-3 mb-4 text-base"
            placeholder="e.g. Smith Family"
            value={householdName}
            onChangeText={setHouseholdName}
            autoFocus
          />

          {/* Timezone picker */}
          <Text className="text-sm font-medium text-gray-600 mb-2">Timezone</Text>
          <Pressable
            className="border border-surface-border rounded-xl px-4 py-3 mb-6 flex-row items-center justify-between"
            onPress={() => setTzPickerVisible(true)}
          >
            <Text className="text-base text-gray-800">{timezone}</Text>
            <ChevronDown color="#64748B" size={18} />
          </Pressable>

          {error ? <Text className="text-danger text-sm mb-3">{error}</Text> : null}

          <Pressable
            className="bg-brand rounded-xl py-4 items-center mb-4"
            onPress={handleCreateHousehold}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text className="text-white font-semibold text-base">Create Household</Text>
            }
          </Pressable>

          <Pressable onPress={() => setStep('choose')}>
            <Text className="text-center text-gray-500">Back</Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* 📘 React Native Note — Modal for timezone picker
          Modal renders on top of everything. We use a FlatList inside it
          because the timezone list is long — FlatList only renders visible
          rows, keeping the modal snappy even with 100+ options. */}
      <Modal
        visible={tzPickerVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setTzPickerVisible(false)}
      >
        <View className="flex-1 bg-white pt-6">
          <View className="flex-row items-center justify-between px-6 mb-4">
            <Text className="text-xl font-bold text-brand">Select Timezone</Text>
            <Pressable onPress={() => setTzPickerVisible(false)}>
              <Text className="text-brand-light text-base">Done</Text>
            </Pressable>
          </View>
          <ScrollView>
            {COMMON_TIMEZONES.map((tz) => (
              <Pressable
                key={tz}
                className={`px-6 py-4 border-b border-surface-border flex-row items-center justify-between ${tz === timezone ? 'bg-brand-pale' : ''}`}
                onPress={() => { setTimezone(tz); setTzPickerVisible(false); }}
              >
                <Text className={`text-base ${tz === timezone ? 'text-brand font-semibold' : 'text-gray-800'}`}>
                  {tz}
                </Text>
                {tz === timezone && (
                  <Text className="text-brand font-bold">✓</Text>
                )}
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}
