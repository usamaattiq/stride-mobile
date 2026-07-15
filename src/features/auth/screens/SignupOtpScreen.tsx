import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { i18n as appI18n } from '@/i18n';
import { AppText } from '@/shared/components/AppText';
import { Button } from '@/shared/components/Button';
import { colors, spacing } from '@/theme';

import { AuthCard } from '../components/AuthCard';
import { OtpInput } from '../components/OtpInput';

type SignupOtpScreenProps = {
  otp: string;
  onChangeOtp: (otp: string) => void;
  onContinue: () => void;
  onResend?: () => void;
};

export function SignupOtpScreen({
  otp,
  onChangeOtp,
  onContinue,
  onResend,
}: SignupOtpScreenProps): React.ReactElement {
  const { t } = useTranslation(undefined, { i18n: appI18n });
  const canContinue = otp.length === 6;

  return (
    <>
      <AuthCard>
        <OtpInput length={6} value={otp} onChange={onChangeOtp} autoFocus onFilled={onContinue} />
        <Button
          label={t('auth.signup.otp.cta')}
          onPress={onContinue}
          disabled={!canContinue}
        />
        <Pressable onPress={onResend} style={styles.resend}>
          <AppText style={styles.resendText}>{t('auth.signup.otp.resend')}</AppText>
        </Pressable>
      </AuthCard>
      <View style={styles.spacer} />
    </>
  );
}

const styles = StyleSheet.create({
  spacer: { height: spacing.md },
  resend: {
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  resendText: {
    fontSize: 13,
    color: colors.primary,
  },
});
