import { Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import * as Notifications from 'expo-notifications';

import { notificationsApi } from '@/services/api/notificationsApi';
import { getDeviceId } from '@/services/deviceId';
import { secureStorage } from '@/services/storage/secureStorage';
import { authStore } from '@/store/authStore';
import { profileStore } from '@/store/profileStore';

/** Android channel sound/vibration is immutable after creation — bump this ID whenever NOTIFICATION_SOUND changes. */
const ANDROID_CHANNEL_ID = 'default-v2';
const NOTIFICATION_SOUND = 'notification_tone.wav';

/** Expo Go ships truncated notification native code (SDK 53+); skip push APIs there. */
const isExpoGo =
  Constants.appOwnership === 'expo' ||
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

function audienceRoleFromData(data: Record<string, unknown> | undefined): string | null {
  const value = data?.audienceRole;
  return typeof value === 'string' && value.length > 0 ? value : null;
}

function isAdminSession(): boolean {
  return authStore.getSessionKind() === 'admin';
}

if (!isExpoGo) {
  Notifications.setNotificationHandler({
    handleNotification: async (notification) => {
      if (isAdminSession()) {
        return {
          shouldShowAlert: false,
          shouldPlaySound: false,
          shouldSetBadge: false,
          shouldShowBanner: false,
          shouldShowList: false,
        };
      }

      const audienceRole = audienceRoleFromData(
        notification.request.content.data as Record<string, unknown> | undefined,
      );
      const currentRole = profileStore.getProfile()?.role;
      const show = !audienceRole || !currentRole || audienceRole === currentRole;

      return {
        shouldShowAlert: show,
        shouldPlaySound: show,
        shouldSetBadge: show,
        shouldShowBanner: show,
        shouldShowList: show,
      };
    },
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

async function ensureAndroidNotificationChannel(): Promise<void> {
  if (Platform.OS !== 'android') {
    return;
  }
  // Android 8+ drops pushes that have no channel. Create it before requesting a token.
  await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
    name: 'Mazad Al Safar',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#B42318',
    sound: NOTIFICATION_SOUND,
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    enableVibrate: true,
    showBadge: true,
  });
}

/** Avoid PUT spam → Ping rate limits when bootstrap / login fire together. */
const PUSH_SYNC_TTL_MS = 10 * 60 * 1000;
let pushSyncInFlight: Promise<void> | null = null;
let lastSyncedExpoToken: string | null = null;
let lastSyncedAtMs = 0;

function clearPushSyncCache(): void {
  lastSyncedExpoToken = null;
  lastSyncedAtMs = 0;
}

/**
 * Requests permission, obtains an Expo push token, and registers it with stride-api → Ping.
 * Safe to call multiple times; failures are logged and never thrown to callers.
 */
export async function registerForPushNotifications(): Promise<void> {
  if (pushSyncInFlight) {
    await pushSyncInFlight;
    return;
  }

  pushSyncInFlight = (async () => {
    try {
      if (Platform.OS === 'web' || isExpoGo || isAdminSession()) {
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
      if (!projectId) {
        console.warn('[push] Missing EAS projectId — cannot fetch Expo push token');
        return;
      }

      const tokenResponse = await Notifications.getExpoPushTokenAsync({ projectId });
      const token = tokenResponse.data;
      if (!token) {
        return;
      }

      const now = Date.now();
      if (token === lastSyncedExpoToken && now - lastSyncedAtMs < PUSH_SYNC_TTL_MS) {
        return;
      }

      const deviceId = await getDeviceId();
      await notificationsApi.registerDeviceToken({
        token,
        platform: Platform.OS === 'ios' ? 'ios' : 'android',
        deviceId,
      });
      await secureStorage.setPushToken(token);
      lastSyncedExpoToken = token;
      lastSyncedAtMs = Date.now();
    } catch (error) {
      console.warn('[push] Failed to register device token', error);
    }
  })().finally(() => {
    pushSyncInFlight = null;
  });

  await pushSyncInFlight;
}

/** Unregisters the last known Expo token from Ping via the BFF (call on logout). */
export async function unregisterPushNotifications(): Promise<void> {
  clearPushSyncCache();
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

/** Re-register only when Expo rotates the native/Expo push token. */
export function attachPushTokenListener(): () => void {
  if (isExpoGo) {
    return () => undefined;
  }
  const subscription = Notifications.addPushTokenListener((token) => {
    if (isAdminSession()) {
      return;
    }
    const next =
      token && typeof token === 'object' && 'data' in token && typeof token.data === 'string'
        ? token.data
        : null;
    if (next && next === lastSyncedExpoToken) {
      return;
    }
    if (next) {
      clearPushSyncCache();
    }
    void registerForPushNotifications();
  });
  return () => {
    subscription.remove();
  };
}
