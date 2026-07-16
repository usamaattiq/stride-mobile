import React from 'react';
import * as LocalAuthentication from 'expo-local-authentication';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { i18n as appI18n } from '@/i18n';
import { AppDialog } from '@/shared/components/AppDialog';
import { AppText } from '@/shared/components/AppText';
import { BiometricToggleRow } from '@/shared/components/BiometricToggleRow';
import { Button } from '@/shared/components/Button';
import {
  biometricCopyMode,
  useDeviceBiometric,
} from '@/shared/hooks/useDeviceBiometric';
import { colors, spacing } from '@/theme';

import { AuthCard } from '../components/AuthCard';
import { OtpInput } from '../components/OtpInput';

type SignupSecurityScreenProps = {
  mpin: string;
  mpinConfirm: string;
  biometricEnabled: boolean;
  onChangeMpin: (value: string) => void;
  onChangeMpinConfirm: (value: string) => void;
  onChangeBiometric: (enabled: boolean) => void;
  onContinue: () => void;
};

export function SignupSecurityScreen({
  mpin,
  mpinConfirm,
  biometricEnabled,
  onChangeMpin,
  onChangeMpinConfirm,
  onChangeBiometric,
  onContinue,
}: SignupSecurityScreenProps): React.ReactElement {
  const { t } = useTranslation(undefined, { i18n: appI18n });
  const { available, kind } = useDeviceBiometric();
  const mode = biometricCopyMode(kind);
  const [biometricDialog, setBiometricDialog] = React.useState(false);
  const mismatch = mpinConfirm.length === 4 && mpin !== mpinConfirm;
  const canContinue = mpin.length === 4 && mpinConfirm.length === 4 && !mismatch;

  const enableBiometric = async (enabled: boolean) => {
    if (!available) {
      setBiometricDialog(true);
      return;
    }

    if (!enabled) {
      onChangeBiometric(false);
      return;
    }

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: t(`biometric.${mode}.enablePrompt`),
      cancelLabel: t('common.cancel'),
      disableDeviceFallback: false,
    });

    if (result.success) {
      onChangeBiometric(true);
    }
  };

  return (
    <>
      <AuthCard>
        <View style={styles.section}>
          <AppText weight="semibold" style={styles.sectionTitle}>
            {t('auth.signup.security.createMpin')}
          </AppText>
          <OtpInput length={4} value={mpin} onChange={onChangeMpin} secureTextEntry />
        </View>

        <View style={styles.section}>
          <AppText weight="semibold" style={styles.sectionTitle}>
            {t('auth.signup.security.confirmMpin')}
          </AppText>
          <OtpInput
            length={4}
            value={mpinConfirm}
            onChange={onChangeMpinConfirm}
            secureTextEntry
          />
          {mismatch ? (
            <AppText style={styles.error}>{t('auth.signup.security.mismatch')}</AppText>
          ) : null}
        </View>

        <BiometricToggleRow
          kind={kind}
          enabled={biometricEnabled}
          available={available}
          title={t(`biometric.${mode}.title`)}
          subtitle={
            available
              ? t(`biometric.${mode}.subtitle`)
              : t(`biometric.${mode}.unavailable`)
          }
          onToggle={(value) => void enableBiometric(value)}
        />

        <Button
          label={t('auth.signup.security.cta')}
          onPress={onContinue}
          disabled={!canContinue}
        />
      </AuthCard>
      <View style={styles.spacer} />

      <AppDialog
        visible={biometricDialog}
        icon="exclamation"
        title={t(`biometric.${mode}.unavailableTitle`)}
        message={t(`biometric.${mode}.unavailableBody`)}
        confirmAction={{
          label: t('common.ok'),
          onPress: () => setBiometricDialog(false),
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  spacer: { height: spacing.md },
  section: {
    gap: spacing.sm,
  },
  sectionTitle: {
    fontSize: 14,
    color: colors.text.primary,
  },
  error: {
    fontSize: 12,
    color: colors.primary,
  },
});
