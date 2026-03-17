import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

// 📘 React Native Note — Why wrap expo-haptics?
// expo-haptics only works on physical iOS and Android devices.
// Calling it on web or in a simulator throws a "not implemented" error.
// Rather than sprinkling Platform.OS checks everywhere, we centralise the
// guard here so call sites are one-liners:  hapticLight()
//
// We also .catch(() => {}) every call — haptic failure should NEVER crash
// the app or interrupt user flow. If the device doesn't support haptics
// (some Android models), the call silently no-ops.
//
// Three common levels:
//   Light   — navigation, icon tap, list item tap (gentle acknowledgement)
//   Medium  — swipe-to-delete reveal, long press (heavier confirmation)
//   Success — form submit, item saved (positive reward)
//   Error   — validation failure, save error (negative warning)

export function hapticLight(): void {
  if (Platform.OS === 'web') return;
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
}

export function hapticMedium(): void {
  if (Platform.OS === 'web') return;
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
}

export function hapticSuccess(): void {
  if (Platform.OS === 'web') return;
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
}

export function hapticError(): void {
  if (Platform.OS === 'web') return;
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
}
