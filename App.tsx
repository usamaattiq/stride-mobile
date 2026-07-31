import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, View } from 'react-native';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { I18nextProvider } from 'react-i18next';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthNavigator } from './src/features/auth/navigation/AuthNavigator';
import type { AuthStackParamList } from './src/features/auth/navigation/types';
import { i18n, initializeI18n } from './src/i18n';
import { authApi } from './src/services/api/authApi';
import { isSessionRevokedError } from './src/services/api/apiError';
import { authStore } from './src/store/authStore';
import { devicePrefsStore } from './src/store/devicePrefsStore';
import { profileStore } from './src/store/profileStore';
import { appFontAssets, colors } from './src/theme';

SplashScreen.preventAutoHideAsync().catch(() => {
  // Already hidden on some Expo Go reloads.
});

SplashScreen.setOptions({
  duration: 500,
  fade: true,
});

export default function App() {
  const [isI18nReady, setIsI18nReady] = useState(false);
  const [fontsLoaded, fontError] = useFonts(appFontAssets);
  const [initialRouteName, setInitialRouteName] = useState<keyof AuthStackParamList | null>(null);

  useEffect(() => {
    let mounted = true;

    initializeI18n()
      .then(() => {
        if (mounted) {
          setIsI18nReady(true);
        }
      })
      .catch((error) => {
        console.warn('[i18n] Failed to initialize', error);
        if (mounted) {
          setIsI18nReady(true);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (fontError && __DEV__) {
      console.warn('[fonts] Failed to load custom fonts', fontError);
    }
  }, [fontError]);

  // Cold-start session bootstrap: a stored token is treated as sufficient proof of
  // identity — a valid token skips straight to the dashboard, no MPIN/biometric
  // re-prompt. Runs once i18n is ready so any session-revoked alert has copy to show.
  useEffect(() => {
    if (!isI18nReady) {
      return;
    }

    let mounted = true;

    void (async () => {
      await devicePrefsStore.hydrate();
      const token = await authStore.hydrate();

      if (!token) {
        if (mounted) {
          setInitialRouteName('Welcome');
        }
        return;
      }

      try {
        const profile = await authApi.getMe();
        profileStore.setProfile(profile);
        if (mounted) {
          setInitialRouteName('Dashboard');
        }
      } catch (error) {
        await authStore.signOut();
        profileStore.clearProfile();
        if (isSessionRevokedError(error)) {
          Alert.alert(i18n.t('auth.sessionRevoked.title'), i18n.t('auth.sessionRevoked.message'));
        }
        if (mounted) {
          setInitialRouteName('Welcome');
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, [isI18nReady]);

  const appReady = isI18nReady && (fontsLoaded || Boolean(fontError)) && initialRouteName !== null;

  const onLayoutRootView = useCallback(() => {
    if (!appReady) {
      return;
    }

    SplashScreen.hideAsync().catch(() => {
      // Native splash may already be gone (e.g. Expo Go).
    });
  }, [appReady]);

  if (!appReady || !initialRouteName) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.white,
        }}
      >
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <KeyboardProvider>
        <I18nextProvider i18n={i18n}>
          <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
            <AuthNavigator initialRouteName={initialRouteName} />
          </View>
        </I18nextProvider>
      </KeyboardProvider>
    </SafeAreaProvider>
  );
}
