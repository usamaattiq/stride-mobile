import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { i18n as appI18n } from '@/i18n';
import { AppText } from '@/shared/components/AppText';
import { Button } from '@/shared/components/Button';
import { colors, spacing } from '@/theme';

import { AuthCard } from '../components/AuthCard';
import { OtpInput } from '../components/OtpInput';

const RESEND_SECONDS = 45;

function formatCountdown(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

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
  const [secondsLeft, setSecondsLeft] = React.useState(RESEND_SECONDS);

  React.useEffect(() => {
    if (secondsLeft <= 0) {
      return undefined;
    }
    const timeout = setTimeout(() => setSecondsLeft((prev) => prev - 1), 1000);
    return () => clearTimeout(timeout);
  }, [secondsLeft]);

  const handleResend = () => {
    onResend?.();
    setSecondsLeft(RESEND_SECONDS);
  };

  return (
    <>
      <AuthCard>
        <OtpInput length={6} value={otp} onChange={onChangeOtp} autoFocus onFilled={onContinue} />
        <Button
          label={t('auth.signup.otp.cta')}
          onPress={onContinue}
          disabled={!canContinue}
        />
        {secondsLeft > 0 ? (
          <View style={styles.resend}>
            <AppText style={styles.countdownText}>
              {t('auth.signup.otp.resendIn', { time: formatCountdown(secondsLeft) })}
            </AppText>
          </View>
        ) : (
          <Pressable onPress={handleResend} style={styles.resend} hitSlop={8}>
            <AppText weight="semibold" style={styles.resendText}>
              {t('auth.signup.otp.resend')}
            </AppText>
          </Pressable>
        )}
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
  countdownText: {
    fontSize: 13,
    color: colors.text.secondary,
  },
});
