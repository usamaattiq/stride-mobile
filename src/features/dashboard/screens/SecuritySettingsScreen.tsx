import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as LocalAuthentication from 'expo-local-authentication';
import { useTranslation } from 'react-i18next';

import { AuthCard } from '@/features/auth/components/AuthCard';
import { AuthScaffold } from '@/features/auth/components/AuthScaffold';
import { OtpInput } from '@/features/auth/components/OtpInput';
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

import { useDashboardSession } from '../context/DashboardSessionContext';

/**
 * Local-only MPIN + biometric security UI.
 * Same AuthScaffold shell as personal verification / driver license.
 */
export function SecuritySettingsScreen(): React.ReactElement {
  const { t } = useTranslation(undefined, { i18n: appI18n });
  const navigation = useNavigation();
  const { user, setBiometricEnabled } = useDashboardSession();
  const { available, kind } = useDeviceBiometric();
  const mode = biometricCopyMode(kind);

  const [editing, setEditing] = React.useState(false);
  const [currentPin, setCurrentPin] = React.useState('');
  const [pin, setPin] = React.useState('');
  const [confirmPin, setConfirmPin] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const [savedVisible, setSavedVisible] = React.useState(false);
  const [biometricDialog, setBiometricDialog] = React.useState<'unavailable' | null>(
    null,
  );

  const resetForm = () => {
    setCurrentPin('');
    setPin('');
    setConfirmPin('');
    setError(null);
  };

  const handleSave = () => {
    if (currentPin.length !== 4) {
      setError(t('securitySettings.mpin.currentRequired'));
      return;
    }
    if (pin.length !== 4 || confirmPin.length !== 4) {
      setError(t('securitySettings.mpin.required'));
      return;
    }
    if (pin !== confirmPin) {
      setError(t('securitySettings.mpin.mismatch'));
      return;
    }

    setEditing(false);
    resetForm();
    setSavedVisible(true);
  };

  const toggleBiometric = async (nextEnabled: boolean) => {
    if (!available) {
      setBiometricDialog('unavailable');
      return;
    }

    if (!nextEnabled) {
      setBiometricEnabled(false);
      return;
    }

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: t(`biometric.${mode}.enablePrompt`),
      cancelLabel: t('common.cancel'),
      disableDeviceFallback: false,
    });

    if (result.success) {
      setBiometricEnabled(true);
    }
  };

  return (
    <>
      <AuthScaffold
        onBack={() => navigation.goBack()}
        title={t('securitySettings.title')}
        subtitle={t('securitySettings.subtitle')}
        showLegalFooter={false}
      >
        <AuthCard>
          <AppText weight="semibold" style={styles.sectionTitle}>
            {t('securitySettings.mpin.sectionTitle')}
          </AppText>

          {!editing ? (
            <>
              <AppText style={styles.cardBody}>{t('securitySettings.mpin.summary')}</AppText>
              <Button
                label={t('securitySettings.mpin.changeCta')}
                onPress={() => {
                  resetForm();
                  setEditing(true);
                }}
              />
            </>
          ) : (
            <View style={styles.form}>
              <View style={styles.section}>
                <AppText weight="semibold" style={styles.fieldLabel}>
                  {t('securitySettings.mpin.currentLabel')}
                </AppText>
                <OtpInput
                  length={4}
                  value={currentPin}
                  onChange={setCurrentPin}
                  secureTextEntry
                  autoFocus
                />
              </View>

              <View style={styles.section}>
                <AppText weight="semibold" style={styles.fieldLabel}>
                  {t('securitySettings.mpin.newLabel')}
                </AppText>
                <OtpInput length={4} value={pin} onChange={setPin} secureTextEntry />
              </View>

              <View style={styles.section}>
                <AppText weight="semibold" style={styles.fieldLabel}>
                  {t('securitySettings.mpin.confirmLabel')}
                </AppText>
                <OtpInput
                  length={4}
                  value={confirmPin}
                  onChange={setConfirmPin}
                  secureTextEntry
                />
              </View>

              {error ? <AppText style={styles.error}>{error}</AppText> : null}

              <View style={styles.formActions}>
                <Button
                  label={t('common.cancel')}
                  variant="secondary"
                  onPress={() => {
                    setEditing(false);
                    resetForm();
                  }}
                  style={styles.formButton}
                />
                <Button
                  label={t('securitySettings.mpin.saveCta')}
                  onPress={handleSave}
                  style={styles.formButton}
                />
              </View>
            </View>
          )}

          <BiometricToggleRow
            kind={kind}
            enabled={user.biometricEnabled}
            available={available}
            title={t(`biometric.${mode}.title`)}
            subtitle={
              available
                ? t(`biometric.${mode}.subtitle`)
                : t(`biometric.${mode}.unavailable`)
            }
            onToggle={(value) => void toggleBiometric(value)}
          />
        </AuthCard>
        <View style={styles.spacer} />
      </AuthScaffold>

      <AppDialog
        visible={savedVisible}
        icon="check"
        title={t('securitySettings.mpin.savedTitle')}
        message={t('securitySettings.mpin.savedBody')}
        confirmAction={{
          label: t('common.ok'),
          onPress: () => setSavedVisible(false),
        }}
      />

      <AppDialog
        visible={biometricDialog === 'unavailable'}
        icon="exclamation"
        title={t(`biometric.${mode}.unavailableTitle`)}
        message={t(`biometric.${mode}.unavailableBody`)}
        confirmAction={{
          label: t('common.ok'),
          onPress: () => setBiometricDialog(null),
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  spacer: { height: spacing.md },
  sectionTitle: {
    fontSize: 14,
    color: colors.text.primary,
  },
  cardBody: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.text.secondary,
  },
  form: {
    gap: spacing.sm,
  },
  section: {
    gap: spacing.sm,
  },
  fieldLabel: {
    fontSize: 14,
    color: colors.text.primary,
  },
  error: {
    fontSize: 12,
    color: colors.primary,
  },
  formActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  formButton: {
    flex: 1,
    minHeight: 48,
  },
});
