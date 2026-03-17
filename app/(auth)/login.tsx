// 📘 React Native Note — KeyboardAvoidingView
// On mobile, tapping a text input opens the software keyboard, which slides
// up and can cover the input the user just tapped — making it impossible to
// see what they're typing. KeyboardAvoidingView detects the keyboard height
// and adjusts its own height/padding so the content always stays visible.
//
// Use behavior='padding' on iOS (adds padding below the content).
// Use behavior='height' on Android (shrinks the view height instead).
// Wrap the WHOLE screen, not just the form, for best results.

// 📘 React Native Note — Inline error messages vs Alert.alert()
// On mobile, Alert.alert() shows a native system dialog that blocks the UI
// and requires a tap to dismiss. This creates friction for a common action
// (correcting a form error). Inline errors — a red Text below the failing
// field — are visible at a glance and don't interrupt the flow. Always
// prefer inline errors for form validation.

import { useState } from 'react';

import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View } from 'react-native';
import { Link } from 'expo-router';

import { useAuthStore } from '@/stores/useAuthStore';

export default function LoginScreen() {
  const { login } = useAuthStore();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);

  async function handleLogin() {
    if (!email || !password) {
      setError('Please enter your email and password.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await login(email, password);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View className="flex-1 justify-center px-6">
        <Text className="text-3xl font-bold text-brand mb-2">FreezerFamily</Text>
        <Text className="text-base text-gray-500 mb-8">Sign in to your account</Text>

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
          placeholder="Password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        {error ? <Text className="text-danger text-sm mb-3">{error}</Text> : null}

        <Pressable
          className="bg-brand rounded-xl py-4 items-center"
          onPress={handleLogin}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text className="text-white font-semibold text-base">Sign In</Text>
          }
        </Pressable>

        <Link href="/(auth)/register" className="mt-6 text-center text-brand-light">
          Don't have an account? Register
        </Link>
      </View>
    </KeyboardAvoidingView>
  );
}
