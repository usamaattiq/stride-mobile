import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { I18nextProvider } from 'react-i18next';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthNavigator } from './src/features/auth/navigation/AuthNavigator';
import { i18n, initializeI18n } from './src/i18n';
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

  const appReady = isI18nReady && (fontsLoaded || Boolean(fontError));

  const onLayoutRootView = useCallback(() => {
    if (!appReady) {
      return;
    }

    SplashScreen.hideAsync().catch(() => {
      // Native splash may already be gone (e.g. Expo Go).
    });
  }, [appReady]);

  if (!appReady) {
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
            <AuthNavigator />
          </View>
        </I18nextProvider>
      </KeyboardProvider>
    </SafeAreaProvider>
  );
}
