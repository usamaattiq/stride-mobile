import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { i18n as appI18n } from '@/i18n';
import { Button } from '@/shared/components/Button';
import { spacing } from '@/theme';

import { AuthCard } from '../components/AuthCard';
import { OtpInput } from '../components/OtpInput';

type LoginForgotNewMpinScreenProps = {
  mpin: string;
  onChangeMpin: (value: string) => void;
  onContinue: () => void;
};

export function LoginForgotNewMpinScreen({
  mpin,
  onChangeMpin,
  onContinue,
}: LoginForgotNewMpinScreenProps): React.ReactElement {
  const { t } = useTranslation(undefined, { i18n: appI18n });
  const canContinue = mpin.length === 4;

  return (
    <>
      <AuthCard>
        <OtpInput length={4} value={mpin} onChange={onChangeMpin} secureTextEntry autoFocus />
        <Button label={t('auth.login.forgotMpin.newMpin.cta')} onPress={onContinue} disabled={!canContinue} />
      </AuthCard>
      <View style={styles.spacer} />
    </>
  );
}

const styles = StyleSheet.create({
  spacer: { height: spacing.md },
});
