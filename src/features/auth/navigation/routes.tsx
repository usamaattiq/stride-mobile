import React from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/shared/components/AppText';
import { Button } from '@/shared/components/Button';
import { colors, radius, spacing } from '@/theme';

import { useSignupDraft } from '../context/SignupDraftContext';
import { SignupSuccessScreen } from '../screens/SignupSuccessScreen';
import { WelcomeScreen } from '../screens/WelcomeScreen';
import type { AuthStackParamList } from './types';

type Nav = NativeStackNavigationProp<AuthStackParamList>;

export function WelcomeRoute(): React.ReactElement {
  const navigation = useNavigation<Nav>();
  const { resetDraft } = useSignupDraft();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.welcomeWrap}>
      <WelcomeScreen
        onSignUp={() => {
          resetDraft();
          navigation.navigate('SignupFlow');
        }}
        onLogIn={() => {
          resetDraft();
          navigation.navigate('LoginFlow');
        }}
      />

      {__DEV__ ? (
        <Pressable
          style={[styles.devShortcut, { top: insets.top + spacing.sm }]}
          onPress={() => navigation.navigate('SignupSuccess')}
          accessibilityRole="button"
          accessibilityLabel="Dev shortcut: jump to signup success screen"
          hitSlop={8}
        >
          <AppText weight="bold" style={styles.devShortcutText}>
            DEV → Success
          </AppText>
        </Pressable>
      ) : null}
    </View>
  );
}

export function SignupSuccessRoute(): React.ReactElement {
  const navigation = useNavigation<Nav>();
  const { resetDraft } = useSignupDraft();

  const goHome = () => {
    resetDraft();
    navigation.reset({ index: 0, routes: [{ name: 'HomePlaceholder' }] });
  };

  return (
    <SignupSuccessScreen onGoToDashboard={goHome} onStartExploring={goHome} />
  );
}

export function HomePlaceholderRoute(): React.ReactElement {
  const navigation = useNavigation<Nav>();
  const { resetDraft } = useSignupDraft();

  return (
    <View style={styles.home}>
      <AppText weight="bold" style={styles.homeTitle}>
        You are in
      </AppText>
      <AppText style={styles.homeBody}>
        Auth flow complete. Wire this to your app home when ready.
      </AppText>
      <Button
        label="Back to welcome"
        onPress={() => {
          resetDraft();
          navigation.reset({ index: 0, routes: [{ name: 'Welcome' }] });
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  welcomeWrap: {
    flex: 1,
  },
  devShortcut: {
    position: 'absolute',
    right: spacing.md,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    zIndex: 20,
  },
  devShortcutText: {
    color: colors.white,
    fontSize: 11,
  },
  home: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    backgroundColor: colors.white,
    gap: spacing.md,
  },
  homeTitle: {
    fontSize: 28,
    color: colors.text.primary,
  },
  homeBody: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
});
