import React from 'react';
import { StyleSheet, View } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { useTranslation } from 'react-i18next';

import { AuthCard } from '@/features/auth/components/AuthCard';
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

type SecuritySetupBaseProps = {
  biometricEnabled: boolean;
  onChangeBiometric: (enabled: boolean) => void;
};

export type SecuritySetupFormProps = SecuritySetupBaseProps &
  (
    | {
        /** Signup: create MPIN + confirm + finish CTA. */
        mode: 'setup';
        mpin: string;
        mpinConfirm: string;
        onChangeMpin: (value: string) => void;
        onChangeMpinConfirm: (value: string) => void;
        onSubmit: () => void;
        submitLabel: string;
      }
    | {
        /** Settings: change existing MPIN + biometric. */
        mode: 'manage';
        onMpinSaved?: () => void;
      }
  );

/**
 * Shared MPIN + biometric UI for signup security and Settings security.
 * Parents own AuthScaffold headings; only `mode` / CTA differ.
 */
export function SecuritySetupForm(props: SecuritySetupFormProps): React.ReactElement {
  const { t } = useTranslation(undefined, { i18n: appI18n });
  const { available, kind } = useDeviceBiometric();
  const mode = biometricCopyMode(kind);
  const [biometricDialog, setBiometricDialog] = React.useState(false);

  const [editing, setEditing] = React.useState(false);
  const [currentPin, setCurrentPin] = React.useState('');
  const [newPin, setNewPin] = React.useState('');
  const [confirmNewPin, setConfirmNewPin] = React.useState('');
  const [manageError, setManageError] = React.useState<string | null>(null);
  const [savedVisible, setSavedVisible] = React.useState(false);

  const setupMismatch =
    props.mode === 'setup' &&
    props.mpinConfirm.length === 4 &&
    props.mpin !== props.mpinConfirm;
  const canFinishSetup =
    props.mode === 'setup' &&
    props.mpin.length === 4 &&
    props.mpinConfirm.length === 4 &&
    !setupMismatch;

  const resetManageForm = () => {
    setCurrentPin('');
    setNewPin('');
    setConfirmNewPin('');
    setManageError(null);
  };

  const handleSaveMpin = () => {
    if (props.mode !== 'manage') {
      return;
    }
    if (currentPin.length !== 4) {
      setManageError(t('securitySettings.mpin.currentRequired'));
      return;
    }
    if (newPin.length !== 4 || confirmNewPin.length !== 4) {
      setManageError(t('securitySettings.mpin.required'));
      return;
    }
    if (newPin !== confirmNewPin) {
      setManageError(t('securitySettings.mpin.mismatch'));
      return;
    }

    setEditing(false);
    resetManageForm();
    setSavedVisible(true);
    props.onMpinSaved?.();
  };

  const toggleBiometric = async (enabled: boolean) => {
    if (!available) {
      setBiometricDialog(true);
      return;
    }

    if (!enabled) {
      props.onChangeBiometric(false);
      return;
    }

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: t(`biometric.${mode}.enablePrompt`),
      cancelLabel: t('common.cancel'),
      disableDeviceFallback: false,
    });

    if (result.success) {
      props.onChangeBiometric(true);
    }
  };

  return (
    <>
      <AuthCard>
        {props.mode === 'setup' ? (
          <>
            <View style={styles.section}>
              <AppText weight="semibold" style={styles.sectionTitle}>
                {t('auth.signup.security.createMpin')}
              </AppText>
              <OtpInput
                length={4}
                value={props.mpin}
                onChange={props.onChangeMpin}
                secureTextEntry
              />
            </View>

            <View style={styles.section}>
              <AppText weight="semibold" style={styles.sectionTitle}>
                {t('auth.signup.security.confirmMpin')}
              </AppText>
              <OtpInput
                length={4}
                value={props.mpinConfirm}
                onChange={props.onChangeMpinConfirm}
                secureTextEntry
              />
              {setupMismatch ? (
                <AppText style={styles.error}>
                  {t('auth.signup.security.mismatch')}
                </AppText>
              ) : null}
            </View>
          </>
        ) : (
          <>
            <AppText weight="semibold" style={styles.sectionTitle}>
              {t('securitySettings.mpin.sectionTitle')}
            </AppText>

            {!editing ? (
              <>
                <AppText style={styles.cardBody}>
                  {t('securitySettings.mpin.summary')}
                </AppText>
                <Button
                  label={t('securitySettings.mpin.changeCta')}
                  onPress={() => {
                    resetManageForm();
                    setEditing(true);
                  }}
                />
              </>
            ) : (
              <View style={styles.form}>
                <View style={styles.section}>
                  <AppText weight="semibold" style={styles.sectionTitle}>
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
                  <AppText weight="semibold" style={styles.sectionTitle}>
                    {t('securitySettings.mpin.newLabel')}
                  </AppText>
                  <OtpInput
                    length={4}
                    value={newPin}
                    onChange={setNewPin}
                    secureTextEntry
                  />
                </View>

                <View style={styles.section}>
                  <AppText weight="semibold" style={styles.sectionTitle}>
                    {t('securitySettings.mpin.confirmLabel')}
                  </AppText>
                  <OtpInput
                    length={4}
                    value={confirmNewPin}
                    onChange={setConfirmNewPin}
                    secureTextEntry
                  />
                </View>

                {manageError ? (
                  <AppText style={styles.error}>{manageError}</AppText>
                ) : null}

                <View style={styles.formActions}>
                  <Button
                    label={t('common.cancel')}
                    variant="secondary"
                    onPress={() => {
                      setEditing(false);
                      resetManageForm();
                    }}
                    style={styles.formButton}
                  />
                  <Button
                    label={t('securitySettings.mpin.saveCta')}
                    onPress={handleSaveMpin}
                    style={styles.formButton}
                  />
                </View>
              </View>
            )}
          </>
        )}

        <BiometricToggleRow
          kind={kind}
          enabled={props.biometricEnabled}
          available={available}
          title={t(`biometric.${mode}.title`)}
          subtitle={
            available
              ? t(`biometric.${mode}.subtitle`)
              : t(`biometric.${mode}.unavailable`)
          }
          onToggle={(value) => void toggleBiometric(value)}
        />

        {props.mode === 'setup' ? (
          <Button
            label={props.submitLabel}
            onPress={props.onSubmit}
            disabled={!canFinishSetup}
          />
        ) : null}
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
  cardBody: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.text.secondary,
  },
  form: {
    gap: spacing.sm,
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
