import { useCallback, useEffect, useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { I18nextProvider } from 'react-i18next';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider, initialWindowMetrics } from 'react-native-safe-area-context';

import { AuthNavigator } from './src/features/auth/navigation/AuthNavigator';
import type { AuthStackParamList } from './src/features/auth/navigation/types';
import { i18n, initializeI18n } from './src/i18n';
import { authApi } from './src/services/api/authApi';
import { adminApi } from './src/services/api/adminApi';
import { usePingNotificationRouting } from './src/services/pingDeepLinkRouting';
import {
  attachPushTokenListener,
  registerForPushNotifications,
  unregisterPushNotifications,
} from './src/services/pushNotifications';
import { authStore } from './src/store/authStore';
import { adminStore } from './src/store/adminStore';
import { devicePrefsStore } from './src/store/devicePrefsStore';
import { profileStore } from './src/store/profileStore';
import { appFontAssets, colors } from './src/theme';

const SPLASH_LOGO = require('./assets/splash-logo.png');

SplashScreen.preventAutoHideAsync().catch(() => {
  // Already hidden on some Expo Go reloads.
});

SplashScreen.setOptions({
  duration: 500,
  fade: true,
});

function AppSplash() {
  return (
    <View style={styles.splash}>
      <Image
        source={SPLASH_LOGO}
        style={styles.splashLogo}
        resizeMode="contain"
        accessibilityIgnoresInvertColors
      />
    </View>
  );
}

export default function App() {
  const [isI18nReady, setIsI18nReady] = useState(false);
  const [fontsLoaded, fontError] = useFonts(appFontAssets);
  const [initialRouteName, setInitialRouteName] = useState<keyof AuthStackParamList | null>(null);

  usePingNotificationRouting();

  useEffect(() => {
    return attachPushTokenListener();
  }, []);

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
      const { token, sessionKind } = await authStore.hydrate();

      if (!token) {
        if (mounted) {
          setInitialRouteName('Welcome');
        }
        return;
      }

      try {
        if (sessionKind === 'admin') {
          const profile = await adminApi.getMe();
          adminStore.setProfile(profile);
          void unregisterPushNotifications();
          if (mounted) {
            setInitialRouteName('Admin');
          }
          return;
        }

        const profile = await authApi.getMe();
        profileStore.setProfile(profile);
        void registerForPushNotifications();
        if (mounted) {
          setInitialRouteName('Dashboard');
        }
      } catch {
        await authStore.signOut();
        profileStore.clearProfile();
        adminStore.clearProfile();
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
    return <AppSplash />;
  }

  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
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

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  splashLogo: {
    width: 280,
    height: 280,
  },
});
