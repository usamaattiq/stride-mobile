import React from 'react';
import { StyleSheet, View } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { useTranslation } from 'react-i18next';

import { AuthCard } from '@/features/auth/components/AuthCard';
import { OtpInput } from '@/features/auth/components/OtpInput';
import { i18n as appI18n } from '@/i18n';
import { getErrorMessage } from '@/services/api/errorMessage';
import { AppDialog } from '@/shared/components/AppDialog';
import { AppText } from '@/shared/components/AppText';
import { BiometricToggleRow } from '@/shared/components/BiometricToggleRow';
import { Button } from '@/shared/components/Button';
import {
  biometricCopyMode,
  useDeviceBiometric,
} from '@/shared/hooks/useDeviceBiometric';
import { useDevicePrefsStore } from '@/store/devicePrefsStore';
import { colors, spacing } from '@/theme';

type SecuritySetupBaseProps = {
  biometricEnabled: boolean;
  onChangeBiometric: (enabled: boolean) => void | Promise<void>;
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
        submitting?: boolean;
        errorMessage?: string | null;
      }
    | {
        /** Settings: change existing MPIN + biometric. */
        mode: 'manage';
        onSaveMpin: (currentMpin: string, newMpin: string) => Promise<void>;
        /**
         * Called when enabling biometric so the MPIN can be cached for the next
         * Face ID login. Required when this device has no cached MPIN yet.
         */
        onCacheMpinForBiometric?: (mpin: string) => Promise<void>;
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
  const [savingMpin, setSavingMpin] = React.useState(false);
  const [savedVisible, setSavedVisible] = React.useState(false);
  const [biometricSaveError, setBiometricSaveError] = React.useState<string | null>(null);
  const [confirmingBiometricMpin, setConfirmingBiometricMpin] = React.useState(false);
  const [biometricMpin, setBiometricMpin] = React.useState('');
  const hasCachedMpin = useDevicePrefsStore((state) => state.cachedMpin !== null);

  const setupMismatch =
    props.mode === 'setup' &&
    props.mpinConfirm.length === 4 &&
    props.mpin !== props.mpinConfirm;
  const canFinishSetup =
    props.mode === 'setup' &&
    props.mpin.length === 4 &&
    props.mpinConfirm.length === 4 &&
    !setupMismatch &&
    !props.submitting;

  const resetManageForm = () => {
    setCurrentPin('');
    setNewPin('');
    setConfirmNewPin('');
    setManageError(null);
  };

  const handleSaveMpin = async () => {
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

    setManageError(null);
    setSavingMpin(true);
    try {
      await props.onSaveMpin(currentPin, newPin);
      setEditing(false);
      resetManageForm();
      setSavedVisible(true);
    } catch (error) {
      setManageError(getErrorMessage(error, t('securitySettings.mpin.saveFailed')));
    } finally {
      setSavingMpin(false);
    }
  };

  const enableBiometric = async (mpinToCache?: string) => {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: t(`biometric.${mode}.enablePrompt`),
      cancelLabel: t('common.cancel'),
      disableDeviceFallback: false,
    });

    if (!result.success) {
      return;
    }

    try {
      if (mpinToCache && props.mode === 'manage' && props.onCacheMpinForBiometric) {
        await props.onCacheMpinForBiometric(mpinToCache);
      }
      await props.onChangeBiometric(true);
      setConfirmingBiometricMpin(false);
      setBiometricMpin('');
    } catch (error) {
      setBiometricSaveError(getErrorMessage(error, t(`biometric.${mode}.saveFailed`)));
    }
  };

  const toggleBiometric = async (enabled: boolean) => {
    if (!available) {
      setBiometricDialog(true);
      return;
    }

    if (!enabled) {
      try {
        await props.onChangeBiometric(false);
      } catch (error) {
        setBiometricSaveError(getErrorMessage(error, t(`biometric.${mode}.saveFailed`)));
      }
      return;
    }

    // Settings: if this device has no cached MPIN yet, collect it before Face ID
    // so the next login can unlock with biometrics on the first try.
    if (props.mode === 'manage' && !hasCachedMpin) {
      setConfirmingBiometricMpin(true);
      setBiometricMpin('');
      setBiometricSaveError(null);
      return;
    }

    await enableBiometric();
  };

  const handleConfirmBiometricMpin = async () => {
    if (biometricMpin.length !== 4) {
      setBiometricSaveError(t('securitySettings.mpin.currentRequired'));
      return;
    }
    setBiometricSaveError(null);
    await enableBiometric(biometricMpin);
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
              {props.errorMessage ? (
                <AppText style={styles.error}>{props.errorMessage}</AppText>
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
                    onPress={() => void handleSaveMpin()}
                    loading={savingMpin}
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

        {props.mode === 'manage' && confirmingBiometricMpin ? (
          <View style={styles.form}>
            <AppText weight="semibold" style={styles.sectionTitle}>
              {t('securitySettings.biometric.confirmMpinTitle')}
            </AppText>
            <AppText style={styles.cardBody}>
              {t('securitySettings.biometric.confirmMpinBody')}
            </AppText>
            <OtpInput
              length={4}
              value={biometricMpin}
              onChange={setBiometricMpin}
              secureTextEntry
              autoFocus
            />
            <View style={styles.formActions}>
              <Button
                label={t('common.cancel')}
                variant="secondary"
                onPress={() => {
                  setConfirmingBiometricMpin(false);
                  setBiometricMpin('');
                }}
                style={styles.formButton}
              />
              <Button
                label={t('securitySettings.biometric.confirmMpinCta')}
                onPress={() => void handleConfirmBiometricMpin()}
                disabled={biometricMpin.length !== 4}
                style={styles.formButton}
              />
            </View>
          </View>
        ) : null}

        {props.mode === 'setup' ? (
          <Button
            label={props.submitLabel}
            onPress={props.onSubmit}
            disabled={!canFinishSetup}
            loading={props.submitting}
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
        visible={biometricSaveError !== null}
        icon="exclamation"
        title={t(`biometric.${mode}.unavailableTitle`)}
        message={biometricSaveError ?? ''}
        confirmAction={{
          label: t('common.ok'),
          onPress: () => setBiometricSaveError(null),
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
