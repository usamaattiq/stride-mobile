import React from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/shared/components/AppText';
import { Button } from '@/shared/components/Button';
import { colors, spacing } from '@/theme';

import { useSignupDraft } from '../context/SignupDraftContext';
import { WelcomeScreen } from '../screens/WelcomeScreen';
import type { AuthStackParamList } from './types';

type Nav = NativeStackNavigationProp<AuthStackParamList>;

export function WelcomeRoute(): React.ReactElement {
  const navigation = useNavigation<Nav>();
  const { resetDraft } = useSignupDraft();

  return (
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
