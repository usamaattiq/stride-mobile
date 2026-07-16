import React from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  View,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as LocalAuthentication from 'expo-local-authentication';
import { useTranslation } from 'react-i18next';

import { OtpInput } from '@/features/auth/components/OtpInput';
import { i18n as appI18n } from '@/i18n';
import { AppDialog } from '@/shared/components/AppDialog';
import { AppText } from '@/shared/components/AppText';
import { AppTopBar } from '@/shared/components/AppTopBar';
import { Button } from '@/shared/components/Button';
import { FocusAwareStatusBar } from '@/shared/components/FocusAwareStatusBar';
import { colors, radius, spacing } from '@/theme';

import { useDashboardSession } from '../context/DashboardSessionContext';

/**
 * Local-only MPIN + biometric security UI (matches bt-app SecuritySettings shape).
 * Wire to API when auth backend is available.
 */
export function SecuritySettingsScreen(): React.ReactElement {
  const { t } = useTranslation(undefined, { i18n: appI18n });
  const navigation = useNavigation();
  const { user, setBiometricEnabled } = useDashboardSession();

  const [editing, setEditing] = React.useState(false);
  const [currentPin, setCurrentPin] = React.useState('');
  const [pin, setPin] = React.useState('');
  const [confirmPin, setConfirmPin] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const [savedVisible, setSavedVisible] = React.useState(false);
  const [biometricAvailable, setBiometricAvailable] = React.useState(false);
  const [biometricDialog, setBiometricDialog] = React.useState<'unavailable' | null>(
    null,
  );

  React.useEffect(() => {
    let mounted = true;
    void (async () => {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const enrolled = hasHardware
        ? await LocalAuthentication.isEnrolledAsync()
        : false;
      if (mounted) {
        setBiometricAvailable(hasHardware && enrolled);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

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
    if (!biometricAvailable) {
      setBiometricDialog('unavailable');
      return;
    }

    if (!nextEnabled) {
      setBiometricEnabled(false);
      return;
    }

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: t('securitySettings.biometric.enablePrompt'),
      cancelLabel: t('common.cancel'),
      disableDeviceFallback: false,
    });

    if (result.success) {
      setBiometricEnabled(true);
    }
  };

  return (
    <View style={styles.root}>
      <FocusAwareStatusBar style="dark" />
      <AppTopBar
        left="back"
        title={t('securitySettings.title')}
        subtitle={t('securitySettings.subtitle')}
        onBackPress={() => navigation.goBack()}
        style={styles.topBar}
      />

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <AppText weight="bold" style={styles.sectionHeading}>
          {t('securitySettings.mpin.sectionTitle')}
        </AppText>

        <View style={styles.card}>
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
              <AppText weight="medium" style={styles.fieldLabel}>
                {t('securitySettings.mpin.currentLabel')}
              </AppText>
              <OtpInput
                length={4}
                value={currentPin}
                onChange={setCurrentPin}
                secureTextEntry
                autoFocus
              />

              <AppText weight="medium" style={styles.fieldLabel}>
                {t('securitySettings.mpin.newLabel')}
              </AppText>
              <OtpInput length={4} value={pin} onChange={setPin} secureTextEntry />

              <AppText weight="medium" style={styles.fieldLabel}>
                {t('securitySettings.mpin.confirmLabel')}
              </AppText>
              <OtpInput
                length={4}
                value={confirmPin}
                onChange={setConfirmPin}
                secureTextEntry
              />

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
        </View>

        <AppText weight="bold" style={styles.sectionHeading}>
          {t('securitySettings.biometric.sectionTitle')}
        </AppText>

        <Pressable
          style={styles.biometricRow}
          accessibilityRole="switch"
          accessibilityState={{ checked: user.biometricEnabled }}
          onPress={() => void toggleBiometric(!user.biometricEnabled)}
        >
          <View style={styles.biometricIconWrap}>
            <FontAwesome5 name="fingerprint" size={18} color={colors.primary} solid />
          </View>
          <View style={styles.biometricCopy}>
            <AppText weight="semibold" style={styles.biometricTitle}>
              {t('securitySettings.biometric.title')}
            </AppText>
            <AppText style={styles.biometricSubtitle} numberOfLines={2}>
              {biometricAvailable
                ? t('securitySettings.biometric.subtitle')
                : t('securitySettings.biometric.unavailable')}
            </AppText>
          </View>
          <Switch
            value={user.biometricEnabled}
            onValueChange={(value) => void toggleBiometric(value)}
            disabled={!biometricAvailable && !user.biometricEnabled}
            trackColor={{ false: colors.border.default, true: colors.primaryDisabled }}
            thumbColor={user.biometricEnabled ? colors.primary : colors.white}
            style={styles.biometricSwitch}
          />
        </Pressable>
      </ScrollView>

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
        title={t('securitySettings.biometric.unavailableTitle')}
        message={t('securitySettings.biometric.unavailableBody')}
        confirmAction={{
          label: t('common.ok'),
          onPress: () => setBiometricDialog(null),
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background.subtle,
  },
  topBar: {
    backgroundColor: colors.white,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border.default,
  },
  content: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  sectionHeading: {
    fontSize: 14,
    color: colors.text.primary,
    marginTop: spacing.xs,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border.default,
    padding: spacing.md,
    gap: spacing.md,
  },
  cardBody: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.text.secondary,
  },
  form: {
    gap: spacing.sm,
  },
  fieldLabel: {
    fontSize: 13,
    color: colors.text.primary,
    marginTop: spacing.xs,
  },
  error: {
    fontSize: 12,
    color: colors.primary,
  },
  formActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  formButton: {
    flex: 1,
    minHeight: 48,
  },
  biometricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border.default,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  biometricIconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
  },
  biometricCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  biometricTitle: {
    fontSize: 14,
    color: colors.text.primary,
  },
  biometricSubtitle: {
    fontSize: 11,
    color: colors.text.tertiary,
  },
  biometricSwitch: Platform.select({
    ios: { marginTop: -2 },
    default: {},
  }),
});
