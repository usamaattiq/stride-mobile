import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { i18n as appI18n } from '@/i18n';
import { AppText } from '@/shared/components/AppText';
import { Button } from '@/shared/components/Button';
import { colors, spacing } from '@/theme';

import { AuthCard } from '../components/AuthCard';
import { OtpInput } from '../components/OtpInput';

type LoginForgotConfirmMpinScreenProps = {
  mpinConfirm: string;
  onChangeMpinConfirm: (value: string) => void;
  onContinue: () => void;
  loading?: boolean;
  errorMessage?: string | null;
};

export function LoginForgotConfirmMpinScreen({
  mpinConfirm,
  onChangeMpinConfirm,
  onContinue,
  loading = false,
  errorMessage,
}: LoginForgotConfirmMpinScreenProps): React.ReactElement {
  const { t } = useTranslation(undefined, { i18n: appI18n });
  const canContinue = mpinConfirm.length === 4 && !loading;

  return (
    <>
      <AuthCard>
        <OtpInput
          length={4}
          value={mpinConfirm}
          onChange={onChangeMpinConfirm}
          secureTextEntry
          autoFocus
        />
        {errorMessage ? <AppText style={styles.error}>{errorMessage}</AppText> : null}
        <Button
          label={t('auth.login.forgotMpin.confirmMpin.cta')}
          onPress={onContinue}
          disabled={!canContinue}
          loading={loading}
        />
      </AuthCard>
      <View style={styles.spacer} />
    </>
  );
}

const styles = StyleSheet.create({
  spacer: { height: spacing.md },
  error: {
    fontSize: 12,
    color: colors.primary,
  },
});
