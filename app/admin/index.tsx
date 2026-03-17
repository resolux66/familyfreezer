import { useEffect } from 'react';
import { useRouter } from 'expo-router';

// Admin functionality was folded into the Settings screen (Phase 10).
// This route redirects there so any stale deep-links still work.
export default function AdminRedirectScreen() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/(tabs)/settings');
  }, []);
  return null;
}
