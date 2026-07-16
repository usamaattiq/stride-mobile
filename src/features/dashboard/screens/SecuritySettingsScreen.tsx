import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { OtpInput } from '@/features/auth/components/OtpInput';
import { i18n as appI18n } from '@/i18n';
import { AppDialog } from '@/shared/components/AppDialog';
import { AppText } from '@/shared/components/AppText';
import { Button } from '@/shared/components/Button';
import { colors, radius, spacing } from '@/theme';

/**
 * Local-only MPIN change UI (matches bt-app SecuritySettings shape).
 * Wire to API when auth backend is available.
 */
export function SecuritySettingsScreen(): React.ReactElement {
  const { t } = useTranslation(undefined, { i18n: appI18n });
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const [editing, setEditing] = React.useState(false);
  const [currentPin, setCurrentPin] = React.useState('');
  const [pin, setPin] = React.useState('');
  const [confirmPin, setConfirmPin] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const [savedVisible, setSavedVisible] = React.useState(false);

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

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />
      <View style={styles.topBar}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('common.cancel')}
          onPress={() => navigation.goBack()}
          hitSlop={12}
          style={styles.backButton}
        >
          <FontAwesome name="chevron-left" size={14} color={colors.text.primary} />
        </Pressable>
        <View style={styles.topCopy}>
          <AppText weight="bold" style={styles.title}>
            {t('securitySettings.title')}
          </AppText>
          <AppText style={styles.subtitle}>{t('securitySettings.subtitle')}</AppText>
        </View>
      </View>

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
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background.subtle,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border.default,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background.subtle,
    marginTop: 2,
  },
  topCopy: {
    flex: 1,
    gap: 2,
    paddingTop: 4,
  },
  title: {
    fontSize: 20,
    color: colors.text.primary,
  },
  subtitle: {
    fontSize: 13,
    color: colors.text.secondary,
  },
  content: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  sectionHeading: {
    fontSize: 14,
    color: colors.text.primary,
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
});
