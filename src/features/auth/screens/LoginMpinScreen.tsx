import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { i18n as appI18n } from '@/i18n';
import { AppText } from '@/shared/components/AppText';
import { Button } from '@/shared/components/Button';
import { colors, spacing } from '@/theme';

import { useDevicePrefsStore } from '@/store/devicePrefsStore';

import { AuthCard } from '../components/AuthCard';
import { OtpInput } from '../components/OtpInput';
import { useBiometricLogin } from '../hooks/useBiometricLogin';

type LoginMpinScreenProps = {
  mpin: string;
  onChangeMpin: (value: string) => void;
  onSubmit: (mpin: string) => void;
  onForgotMpin: () => void;
  loading?: boolean;
  errorMessage?: string | null;
  /** Set only when this device skipped straight to MPIN/biometric (returning device). */
  phoneLabel?: string;
  onUseDifferentAccount?: () => void;
};

export function LoginMpinScreen({
  mpin,
  onChangeMpin,
  onSubmit,
  onForgotMpin,
  loading = false,
  errorMessage,
  phoneLabel,
  onUseDifferentAccount,
}: LoginMpinScreenProps): React.ReactElement {
  const { t } = useTranslation(undefined, { i18n: appI18n });
  const canContinue = mpin.length === 4 && !loading;
  const biometricEnabled = useDevicePrefsStore(
    (state) => state.biometricEnabled && state.cachedMpin !== null,
  );

  useBiometricLogin({
    enabled: !loading,
    onAutoSubmit: (cachedMpin) => {
      onChangeMpin(cachedMpin);
      onSubmit(cachedMpin);
    },
  });

  return (
    <>
      <AuthCard>
        {phoneLabel ? (
          <AppText style={styles.phoneLabel}>
            {t('auth.login.mpin.loggingInAs', { phone: phoneLabel })}
          </AppText>
        ) : null}
        <OtpInput
          length={4}
          value={mpin}
          onChange={onChangeMpin}
          secureTextEntry
          autoFocus
          onFilled={(value) => {
            if (!loading) {
              onSubmit(value);
            }
          }}
        />
        {errorMessage ? <AppText style={styles.error}>{errorMessage}</AppText> : null}
        <Button
          label={t('auth.login.mpin.cta')}
          onPress={() => onSubmit(mpin)}
          disabled={!canContinue}
          loading={loading}
        />
        {biometricEnabled ? (
          <View style={styles.biometricHint}>
            <AppText style={styles.biometricHintText}>{t('auth.login.mpin.useBiometric')}</AppText>
          </View>
        ) : null}
        <Pressable onPress={onForgotMpin} style={styles.forgot} hitSlop={8} disabled={loading}>
          <AppText weight="semibold" style={styles.forgotText}>
            {t('auth.login.mpin.forgotMpin')}
          </AppText>
        </Pressable>
        {onUseDifferentAccount ? (
          <Pressable onPress={onUseDifferentAccount} style={styles.forgot} hitSlop={8} disabled={loading}>
            <AppText style={styles.useDifferentAccountText}>
              {t('auth.login.mpin.useDifferentAccount')}
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
  phoneLabel: {
    textAlign: 'center',
    fontSize: 14,
    color: colors.text.secondary,
  },
  error: {
    fontSize: 12,
    color: colors.primary,
  },
  biometricHint: {
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  biometricHintText: {
    fontSize: 13,
    color: colors.text.secondary,
  },
  forgot: {
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  forgotText: {
    fontSize: 14,
    color: colors.primary,
  },
  useDifferentAccountText: {
    fontSize: 13,
    color: colors.text.secondary,
  },
});
