import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';

import { notificationsApi } from '@/services/api/notificationsApi';
import { getDeviceId } from '@/services/deviceId';
import { secureStorage } from '@/services/storage/secureStorage';

const ANDROID_CHANNEL_ID = 'default';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

async function ensureAndroidNotificationChannel(): Promise<void> {
  if (Platform.OS !== 'android') {
    return;
  }
  // Android 8+ drops pushes that have no channel. Create it before requesting a token.
  await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
    name: 'Musafir249',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#B42318',
    sound: 'default',
    enableVibrate: true,
    showBadge: true,
  });
}

function resolveProjectId(): string | undefined {
  const eas = Constants.easConfig?.projectId;
  if (typeof eas === 'string' && eas.length > 0) {
    return eas;
  }
  const extra = Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined;
  return extra?.eas?.projectId;
}

/**
 * Requests permission, obtains an Expo push token, and registers it with stride-api → Ping.
 * Safe to call multiple times; failures are logged and never thrown to callers.
 */
export async function registerForPushNotifications(): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      return;
    }

    await ensureAndroidNotificationChannel();

    const current = await Notifications.getPermissionsAsync();
    let status = current.status;
    if (status !== 'granted') {
      const requested = await Notifications.requestPermissionsAsync();
      status = requested.status;
    }
    if (status !== 'granted') {
      return;
    }

    const projectId = resolveProjectId();
    const tokenResponse = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined,
    );
    const token = tokenResponse.data;
    if (!token) {
      return;
    }

    const deviceId = await getDeviceId();
    await notificationsApi.registerDeviceToken({
      token,
      platform: Platform.OS === 'ios' ? 'ios' : 'android',
      deviceId,
    });
    await secureStorage.setPushToken(token);
  } catch (error) {
    console.warn('[push] Failed to register device token', error);
  }
}

/** Unregisters the last known Expo token from Ping via the BFF (call on logout). */
export async function unregisterPushNotifications(): Promise<void> {
  try {
    const token = await secureStorage.getPushToken();
    if (!token) {
      return;
    }
    await notificationsApi.unregisterDeviceToken(token);
    await secureStorage.clearPushToken();
  } catch (error) {
    console.warn('[push] Failed to unregister device token', error);
  }
}

function asDeepLink(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null;
}

function deepLinkFromRecord(record: Record<string, unknown> | undefined): string | null {
  if (!record) {
    return null;
  }
  return (
    asDeepLink(record.deepLink) ??
    asDeepLink(record.deep_link) ??
    asDeepLink(record.url) ??
    asDeepLink(record.link)
  );
}

/**
 * Ping / Expo / FCM may put the URL at `deepLink`, nest it, or stringify the payload.
 */
export function resolveDeepLinkFromNotificationData(
  data: Record<string, unknown> | undefined,
): string | null {
  const direct = deepLinkFromRecord(data);
  if (direct) {
    return direct;
  }

  const nested = data?.data;
  if (nested && typeof nested === 'object' && !Array.isArray(nested)) {
    const fromNested = deepLinkFromRecord(nested as Record<string, unknown>);
    if (fromNested) {
      return fromNested;
    }
  }

  const body = data?.body;
  if (typeof body === 'string' && body.startsWith('{')) {
    try {
      const parsed = JSON.parse(body) as Record<string, unknown>;
      return deepLinkFromRecord(parsed);
    } catch {
      return null;
    }
  }

  return null;
}
