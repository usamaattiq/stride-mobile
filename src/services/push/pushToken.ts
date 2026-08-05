import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { notificationsApi } from '@/services/api/notificationsApi';
import { getDeviceId } from '@/services/deviceId';

// Physical device required — simulators/emulators without Play Services can't get a real push token.
export async function registerForPushNotificationsAsync(): Promise<void> {
  if (!Device.isDevice) {
    return;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    return;
  }

  const projectId = Constants.expoConfig?.extra?.eas?.projectId as string | undefined;
  if (!projectId) {
    if (__DEV__) {
      console.warn('[push] Missing EAS projectId; cannot fetch Expo push token.');
    }
    return;
  }

  try {
    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
    const deviceId = await getDeviceId();
    await notificationsApi.registerDeviceToken({
      token,
      platform: Platform.OS === 'ios' ? 'ios' : 'android',
      deviceId,
    });
  } catch (error) {
    if (__DEV__) {
      console.warn('[push] Failed to register device for push notifications', error);
    }
  }
}
