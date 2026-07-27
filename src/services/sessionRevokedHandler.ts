import { Alert } from 'react-native';

import { i18n as appI18n } from '@/i18n';
import { authStore } from '@/store/authStore';
import { profileStore } from '@/store/profileStore';
import { resetToWelcome } from '@/navigation/navigationRef';

let handling = false;

/**
 * Fires when the server reports SESSION_REVOKED (e.g. the user signed in on another
 * device — Musafir keeps a single active session per user). Multiple in-flight requests
 * can fail with this at once; the guard ensures only one sign-out + one alert happen.
 */
export const sessionRevokedHandler = {
  async handle(): Promise<void> {
    if (handling) {
      return;
    }
    handling = true;

    try {
      await authStore.signOut();
      profileStore.clearProfile();
      resetToWelcome();
      Alert.alert(appI18n.t('auth.sessionRevoked.title'), appI18n.t('auth.sessionRevoked.message'));
    } finally {
      handling = false;
    }
  },
};
