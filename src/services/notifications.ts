import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { ID, Permission, Role } from 'appwrite';

import { databases } from '@/lib/appwrite';
import { DATABASE_ID, USER_PREFS_COL } from '@/lib/appwrite.config';

// 📘 React Native Note — Expo push token vs FCM/APNs token
// There are two kinds of push tokens:
//   • Expo push token (ExponentPushToken[...]) — works on both iOS and Android
//     via Expo's push service, which acts as a proxy to APNs / FCM.
//   • Native token — raw APNs / FCM token; you'd use this if managing your
//     own push infrastructure. We use Expo's service to keep setup minimal.
//
// IMPORTANT: push tokens only work on physical devices. The iOS Simulator
// can't receive push notifications. getExpoPushTokenAsync() will throw on
// a simulator — that's why we guard with Device.isDevice.

// ── Notification behaviour when app is foregrounded ──────────────────────────
// By default, Expo suppresses notifications if the app is open. Setting this
// handler shows a banner even when foregrounded — better UX for a reminder app.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert:  true,
    shouldShowBanner: true,
    shouldShowList:   true,
    shouldPlaySound:  false,
    shouldSetBadge:   true,
  }),
});

export async function registerForPushNotifications(userId: string): Promise<string | null> {
  // Physical device check — simulators/emulators can't get push tokens
  if (!Device.isDevice) {
    if (__DEV__) console.warn('[FreezerFamily] Push notifications require a physical device.');
    return null;
  }

  // ── Android: create a notification channel ──────────────────────────────
  // Android 8+ requires a "channel" before showing any notification.
  // A channel groups notifications and lets the user control them per-group
  // in system settings. Without a channel, notifications are silently dropped.
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('expiry-alerts', {
      name: 'Expiry Alerts',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  // ── Request permission ───────────────────────────────────────────────────
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    if (__DEV__) console.warn('[FreezerFamily] Push notification permission denied.');
    return null;
  }

  // ── Get Expo push token ──────────────────────────────────────────────────
  // projectId tells Expo's servers which app this device belongs to.
  // We read it from app.json's extra.eas.projectId (set by `eas init`).
  // Falls back gracefully if not yet configured.
  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId;

  const tokenData = await Notifications.getExpoPushTokenAsync(
    projectId ? { projectId } : undefined,
  );
  const token = tokenData.data;

  // ── Persist token to Appwrite user_preferences ───────────────────────────
  // We use the userId as the document ID so upserts are easy:
  // try createDocument → if 409 conflict (already exists) → update instead.
  await upsertUserPreferences(userId, { pushToken: token, notificationsEnabled: true });

  return token;
}

export async function getNotificationPrefs(userId: string): Promise<{
  pushToken: string | null;
  notificationsEnabled: boolean;
}> {
  try {
    const doc = await databases.getDocument(DATABASE_ID, USER_PREFS_COL, userId);
    return {
      pushToken:            doc.pushToken             ?? null,
      notificationsEnabled: doc.notificationsEnabled  ?? true,
    };
  } catch {
    return { pushToken: null, notificationsEnabled: true };
  }
}

export async function setNotificationsEnabled(
  userId: string,
  enabled: boolean,
): Promise<void> {
  await upsertUserPreferences(userId, { notificationsEnabled: enabled });
}

// ── Internal helpers ──────────────────────────────────────────────────────────

async function upsertUserPreferences(
  userId: string,
  data: Record<string, unknown>,
): Promise<void> {
  try {
    // Try to update the existing document first
    await databases.updateDocument(DATABASE_ID, USER_PREFS_COL, userId, data);
  } catch (err: unknown) {
    const code = (err as { code?: number })?.code;
    if (code === 404) {
      // Document doesn't exist yet — create it with user-scoped permissions
      await databases.createDocument(
        DATABASE_ID,
        USER_PREFS_COL,
        userId,
        { userId, pushToken: null, notificationsEnabled: true, ...data },
        [
          Permission.read(Role.user(userId)),
          Permission.update(Role.user(userId)),
          Permission.delete(Role.user(userId)),
        ],
      );
    } else {
      throw err;
    }
  }
}
