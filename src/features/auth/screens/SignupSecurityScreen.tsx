import React from 'react';
import { FontAwesome } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import { Platform, Pressable, StyleSheet, Switch, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { i18n as appI18n } from '@/i18n';
import { AppText } from '@/shared/components/AppText';
import { Button } from '@/shared/components/Button';
import { colors, radius, spacing } from '@/theme';

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
  const [biometricAvailable, setBiometricAvailable] = React.useState(false);
  const mismatch = mpinConfirm.length === 4 && mpin !== mpinConfirm;
  const canContinue = mpin.length === 4 && mpinConfirm.length === 4 && !mismatch;

  React.useEffect(() => {
    void LocalAuthentication.hasHardwareAsync().then(async (hasHardware) => {
      const enrolled = hasHardware
        ? await LocalAuthentication.isEnrolledAsync()
        : false;
      setBiometricAvailable(hasHardware && enrolled);
    });
  }, []);

  const enableBiometric = async (enabled: boolean) => {
    if (!enabled) {
      onChangeBiometric(false);
      return;
    }

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: t('auth.signup.security.biometricPrompt'),
      cancelLabel: t('common.cancel'),
    });

    onChangeBiometric(result.success);
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

        {biometricAvailable ? (
          <Pressable
            style={styles.biometricRow}
            onPress={() => void enableBiometric(!biometricEnabled)}
          >
            <View style={styles.biometricCopy}>
              <FontAwesome name="lock" size={16} color={colors.primary} />
              <AppText weight="medium" style={styles.biometricLabel}>
                {t('auth.signup.security.biometric')}
              </AppText>
            </View>
            <Switch
              value={biometricEnabled}
              onValueChange={(value) => void enableBiometric(value)}
              trackColor={{ false: colors.border.default, true: colors.primaryDisabled }}
              thumbColor={biometricEnabled ? colors.primary : colors.white}
              style={styles.biometricSwitch}
            />
          </Pressable>
        ) : null}

        <Button
          label={t('auth.signup.security.cta')}
          onPress={onContinue}
          disabled={!canContinue}
        />
      </AuthCard>
      <View style={styles.spacer} />
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
  biometricRow: {
    minHeight: 52,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border.default,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  biometricCopy: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  biometricLabel: {
    fontSize: 14,
    color: colors.text.primary,
  },
  // iOS reserves extra height below the native switch track, so it renders
  // visibly lower than the label next to it despite `alignItems: 'center'`.
  biometricSwitch: Platform.select({
    ios: { marginTop: -4 },
    default: {},
  }),
});
