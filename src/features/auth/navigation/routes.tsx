import React from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/shared/components/AppText';
import { colors, radius, spacing } from '@/theme';

import { useDashboardSession } from '@/features/dashboard/context/DashboardSessionContext';
import { useLoginFlowStore } from '@/store/loginFlowStore';
import { useSignupDraftStore } from '@/store/signupDraftStore';
import { SignupSuccessScreen } from '../screens/SignupSuccessScreen';
import { WelcomeScreen } from '../screens/WelcomeScreen';
import type { AuthStackParamList } from './types';

type Nav = NativeStackNavigationProp<AuthStackParamList>;

export function WelcomeRoute(): React.ReactElement {
  const navigation = useNavigation<Nav>();
  const { resetDraft } = useSignupDraftStore();
  const { setRole } = useDashboardSession();
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
          useLoginFlowStore.getState().reset();
          navigation.navigate('LoginFlow');
        }}
        onDashboard={() => {
          navigation.navigate('Dashboard');
        }}
      />

      {__DEV__ ? (
        <View style={[styles.devShortcuts, { top: insets.top + spacing.sm }]}>
          <Pressable
            style={styles.devShortcut}
            onPress={() => navigation.navigate('SignupSuccess')}
            accessibilityRole="button"
            accessibilityLabel="Dev shortcut: jump to signup success screen"
            hitSlop={8}
          >
            <AppText weight="bold" style={styles.devShortcutText}>
              DEV → Success
            </AppText>
          </Pressable>
          <Pressable
            style={styles.devShortcut}
            onPress={() => {
              setRole('driver');
              navigation.navigate('Dashboard');
            }}
            accessibilityRole="button"
            accessibilityLabel="Dev shortcut: open dashboard as driver"
            hitSlop={8}
          >
            <AppText weight="bold" style={styles.devShortcutText}>
              DEV → Driver
            </AppText>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

export function SignupSuccessRoute(): React.ReactElement {
  const navigation = useNavigation<Nav>();
  const { resetDraft } = useSignupDraftStore();

  const goDashboard = () => {
    resetDraft();
    navigation.reset({ index: 0, routes: [{ name: 'Dashboard' }] });
  };

  return (
    <SignupSuccessScreen
      onGoToDashboard={goDashboard}
      onStartExploring={goDashboard}
    />
  );
}

const styles = StyleSheet.create({
  welcomeWrap: {
    flex: 1,
  },
  devShortcuts: {
    position: 'absolute',
    right: spacing.md,
    gap: spacing.xs,
    zIndex: 20,
  },
  devShortcut: {
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
  devShortcutText: {
    color: colors.white,
    fontSize: 11,
  },
});
