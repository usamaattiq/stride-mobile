import { Alert } from 'react-native';

import { i18n as appI18n } from '@/i18n';
import { resetToWelcome } from '@/navigation/navigationRef';
import { unregisterPushNotifications } from '@/services/pushNotifications';
import type { ApiErrorCode } from '@/services/api/apiError';
import { authStore } from '@/store/authStore';
import { adminStore } from '@/store/adminStore';
import { profileStore } from '@/store/profileStore';

let handling = false;

function alertCopy(code: ApiErrorCode | undefined): { title: string; message: string } {
  if (code === 'SESSION_REVOKED') {
    return {
      title: appI18n.t('auth.sessionRevoked.title'),
      message: appI18n.t('auth.sessionRevoked.message'),
    };
  }
  return {
    title: appI18n.t('auth.sessionExpired.title'),
    message: appI18n.t('auth.sessionExpired.message'),
  };
}

/**
 * Signs the user out when the access token is no longer valid (revoked session,
 * expiry, invalid JWT, or generic 401). Multiple in-flight requests can fail at
 * once; the guard ensures only one sign-out + one alert happen.
 */
export const sessionRevokedHandler = {
  async handle(code?: ApiErrorCode): Promise<void> {
    if (handling) {
      return;
    }
    handling = true;

    try {
      await unregisterPushNotifications();
      await authStore.signOut();
      profileStore.clearProfile();
      adminStore.clearProfile();
      resetToWelcome();
      const copy = alertCopy(code);
      Alert.alert(copy.title, copy.message);
    } finally {
      handling = false;
    }
  },
};
