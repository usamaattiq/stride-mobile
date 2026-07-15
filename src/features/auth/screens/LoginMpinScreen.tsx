import React from 'react';
import { FontAwesome } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { i18n as appI18n } from '@/i18n';
import { AppText } from '@/shared/components/AppText';
import { Button } from '@/shared/components/Button';
import { colors, spacing } from '@/theme';

import { AuthCard } from '../components/AuthCard';
import { OtpInput } from '../components/OtpInput';

type LoginMpinScreenProps = {
  mpin: string;
  onChangeMpin: (value: string) => void;
  onContinue: () => void;
  biometricEnabled?: boolean;
};

export function LoginMpinScreen({
  mpin,
  onChangeMpin,
  onContinue,
  biometricEnabled = false,
}: LoginMpinScreenProps): React.ReactElement {
  const { t } = useTranslation(undefined, { i18n: appI18n });
  const canContinue = mpin.length === 4;

  const tryBiometric = async () => {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: t('auth.login.mpin.biometricPrompt'),
      cancelLabel: t('common.cancel'),
    });
    if (result.success) {
      onContinue();
    }
  };

  return (
    <>
      <AuthCard>
        <OtpInput
          length={4}
          value={mpin}
          onChange={onChangeMpin}
          secureTextEntry
          autoFocus
          onFilled={onContinue}
        />
        <Button
          label={t('auth.login.mpin.cta')}
          onPress={onContinue}
          disabled={!canContinue}
        />
        {biometricEnabled ? (
          <Pressable style={styles.biometric} onPress={() => void tryBiometric()}>
            <FontAwesome name="lock" size={18} color={colors.primary} />
            <AppText weight="medium" style={styles.biometricText}>
              {t('auth.login.mpin.useBiometric')}
            </AppText>
          </Pressable>
        ) : null}
      </AuthCard>
      <View style={styles.spacer} />
    </>
  );
}

const styles = StyleSheet.create({
  spacer: { height: spacing.md },
  biometric: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  biometricText: {
    fontSize: 14,
    color: colors.primary,
  },
});
