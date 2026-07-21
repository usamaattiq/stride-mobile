import React from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/shared/components/AppText';
import { colors, radius, spacing } from '@/theme';

import { useLoginFlowStore } from '@/store/loginFlowStore';
import { useSignupDraftStore } from '@/store/signupDraftStore';
import { SignupSuccessScreen } from '../screens/SignupSuccessScreen';
import { WelcomeScreen } from '../screens/WelcomeScreen';
import type { AuthStackParamList } from './types';

type Nav = NativeStackNavigationProp<AuthStackParamList>;

export function WelcomeRoute(): React.ReactElement {
  const navigation = useNavigation<Nav>();
  const { resetDraft } = useSignupDraftStore();
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
});
