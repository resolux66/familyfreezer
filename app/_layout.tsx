import { useEffect } from 'react';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack, useRouter, useSegments } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { WebContainer } from '@/components/layout/WebContainer';
import { useAuthStore } from '@/stores/useAuthStore';

// 📘 React Native Note — global.css import
// NativeWind v4 requires the CSS file to be imported once at the app root.
// This triggers the Tailwind compilation and makes all className styles
// available throughout the entire component tree.
import '../global.css';

// 📘 React Native Note — QueryClient outside the component
// QueryClient holds the entire server-state cache. If we created it INSIDE
// RootLayout, it would be recreated on every re-render, wiping the cache.
// Creating it at module level means it lives for the entire app session.
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // Data stays "fresh" for 5 minutes — no refetch
      retry: 2,                  // Retry failed network requests twice before showing error
    },
  },
});

// 📘 React Native Note — Auth Gate pattern with useSegments
// useSegments() returns the current route as an array, e.g. ['(auth)', 'login']
// or ['(tabs)']. We use it to detect which route group the user is currently on.
//
// The auth gate runs as a useEffect whenever user or isLoading changes.
// This means: if a user logs out from ANY screen, this effect fires and
// immediately redirects them to login — no manual redirect needed per screen.
function AuthGate() {
  const { user, isLoading, checkSession, pendingRegistration } = useAuthStore();
  const segments = useSegments();
  const router   = useRouter();

  // Run once on mount: restore session from Appwrite secure storage
  useEffect(() => {
    checkSession();
  }, []);

  useEffect(() => {
    if (isLoading) return;                      // Still checking — don't redirect yet
    const inAuth = segments[0] === '(auth)';
    if (!user && !inAuth) {
      queryClient.clear();                      // Wipe previous user's cached data
      router.replace('/(auth)/login');          // Logged out → go to login
    }
    if (user && inAuth && !pendingRegistration) router.replace('/(tabs)'); // Logged in → go to home
  }, [user, isLoading, segments, pendingRegistration]);

  return <Stack screenOptions={{ headerShown: false }} />;
}

// 📘 React Native Note — Provider nesting order
// Providers wrap the entire tree so every child can access their context.
// Order matters: outer providers are available to inner ones. Here:
//   ErrorBoundary        → catches any unhandled render crash in the whole tree
//   GestureHandlerRootView → required by react-native-gesture-handler (Swipeable)
//   WebContainer         → max-width centering on desktop web; transparent on native
//   QueryClientProvider  → makes useQuery() available everywhere
//   SafeAreaProvider     → makes useSafeAreaInsets() available everywhere
//   AuthGate/Stack       → the actual screens, rendered inside all providers
export default function RootLayout() {
  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <WebContainer>
          <QueryClientProvider client={queryClient}>
            <SafeAreaProvider>
              <AuthGate />
            </SafeAreaProvider>
          </QueryClientProvider>
        </WebContainer>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}
