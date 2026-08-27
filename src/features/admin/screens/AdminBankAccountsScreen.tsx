import React from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AuthScaffold } from '@/features/auth/components/AuthScaffold';
import { i18n as appI18n } from '@/i18n';
import { useLanguage } from '@/i18n/hooks/useLanguage';
import { adminApi, type AdminBankAccount } from '@/services/api/adminApi';
import { AppText } from '@/shared/components/AppText';
import { Button } from '@/shared/components/Button';
import { toLatinDigits } from '@/shared/utils/latin-digits';
import { colors, radius, spacing } from '@/theme';
import { cardBackShadow } from '@/theme/cardShadow';
import { getInputFontFamily } from '@/theme/typography';

import { useAdminResource } from '../hooks/useAdminResource';

const EMPTY_ACCOUNT: AdminBankAccount = {
  bankName: '',
  accountTitle: '',
  accountNumber: '',
  iban: '',
};

function isBlank(account: AdminBankAccount): boolean {
  return ![account.bankName, account.accountTitle, account.accountNumber, account.iban].some(
    (value) => value.trim().length > 0,
  );
}

function isComplete(account: AdminBankAccount): boolean {
  return (
    account.bankName.trim().length > 0 &&
    account.accountTitle.trim().length > 0 &&
    /^\d{1,32}$/.test(account.accountNumber) &&
    (account.iban.trim().length === 0 || /^[A-Z0-9]{4,34}$/.test(account.iban))
  );
}

function toPayload(account: AdminBankAccount): AdminBankAccount {
  return {
    bankName: account.bankName.trim(),
    accountTitle: account.accountTitle.trim(),
    accountNumber: account.accountNumber,
    iban: account.iban,
  };
}

export function AdminBankAccountsScreen(): React.ReactElement {
  const { t } = useTranslation(undefined, { i18n: appI18n });
  const { currentLanguage } = useLanguage();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [saved, setSaved] = React.useState<AdminBankAccount>({ ...EMPTY_ACCOUNT });
  const [draft, setDraft] = React.useState<AdminBankAccount>({ ...EMPTY_ACCOUNT });
  const [editing, setEditing] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [saveErrorKey, setSaveErrorKey] = React.useState<string | null>(null);

  const { loading, errorKey } = useAdminResource({
    load: async () => {
      const result = await adminApi.getBankAccounts();
      const account = result.accounts[0] ? { ...result.accounts[0] } : { ...EMPTY_ACCOUNT };
      setSaved(account);
      setDraft(account);
      setEditing(false);
      return result;
    },
  });

  const startEdit = () => {
    setDraft({ ...saved });
    setSaveErrorKey(null);
    setEditing(true);
  };

  const cancel = () => {
    setDraft({ ...saved });
    setSaveErrorKey(null);
    setEditing(false);
  };

  const save = async () => {
    if (!isBlank(draft) && !isComplete(draft)) {
      setSaveErrorKey('admin.settings.bankAccounts.invalid');
      return;
    }
    setSaving(true);
    setSaveErrorKey(null);
    try {
      const result = await adminApi.updateBankAccounts(isComplete(draft) ? [toPayload(draft)] : []);
      const account = result.accounts[0] ? { ...result.accounts[0] } : { ...EMPTY_ACCOUNT };
      setSaved(account);
      setDraft(account);
      setEditing(false);
    } catch {
      setSaveErrorKey('admin.settings.bankAccounts.saveFailed');
    } finally {
      setSaving(false);
    }
  };

  const textInputStyle = [styles.input, { fontFamily: getInputFontFamily(currentLanguage) }];
  const numberInputStyle = [
    styles.input,
    { fontFamily: getInputFontFamily(currentLanguage, 'number-pad') },
  ];
  const display = editing ? draft : saved;

  return (
    <AuthScaffold
      onBack={() => navigation.goBack()}
      title={t('admin.settings.bankAccounts.title')}
      subtitle={t('admin.settings.bankAccounts.subtitle')}
      compactHeader
      manualTopInset
      scrollable={false}
      showLanguageSwitcher={false}
      showLegalFooter={false}
      contentWrapStyle={styles.contentWrap}
      titleRight={
        editing ? undefined : (
          <Pressable
            onPress={startEdit}
            disabled={loading}
            style={({ pressed }) => [styles.editChip, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel={t('admin.common.edit')}
          >
            <AppText weight="semibold" style={styles.editChipLabel}>
              {t('admin.common.edit')}
            </AppText>
          </Pressable>
        )
      }
    >
      {errorKey || saveErrorKey ? (
        <AppText style={styles.error}>
          {t(errorKey ?? saveErrorKey ?? 'admin.common.loadFailed')}
        </AppText>
      ) : null}
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <Field
            label={t('admin.settings.bankAccounts.bankName')}
            value={display.bankName}
            editable={editing}
            onChangeText={(text) => setDraft((current) => ({ ...current, bankName: text }))}
            inputStyle={textInputStyle}
          />
          <Field
            label={t('admin.settings.bankAccounts.accountTitle')}
            value={display.accountTitle}
            editable={editing}
            onChangeText={(text) => setDraft((current) => ({ ...current, accountTitle: text }))}
            inputStyle={textInputStyle}
          />
          <Field
            label={t('admin.settings.bankAccounts.accountNumber')}
            value={display.accountNumber}
            editable={editing}
            onChangeText={(text) =>
              setDraft((current) => ({
                ...current,
                accountNumber: toLatinDigits(text).replace(/[^\d]/g, '').slice(0, 32),
              }))
            }
            inputStyle={numberInputStyle}
            keyboardType="number-pad"
          />
          <Field
            label={t('admin.settings.bankAccounts.iban')}
            value={display.iban}
            editable={editing}
            onChangeText={(text) =>
              setDraft((current) => ({
                ...current,
                iban: toLatinDigits(text)
                  .replace(/[^a-zA-Z0-9]/g, '')
                  .toUpperCase()
                  .slice(0, 34),
              }))
            }
            inputStyle={textInputStyle}
            autoCapitalize="characters"
          />
        </View>
      </ScrollView>
      {editing ? (
        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
          <Button
            label={t('common.cancel')}
            variant="secondary"
            onPress={cancel}
            disabled={saving}
            style={styles.footerBtn}
          />
          <Button
            label={saving ? t('admin.common.saving') : t('admin.common.save')}
            onPress={() => void save()}
            disabled={saving || loading}
            loading={saving}
            style={styles.footerBtn}
          />
        </View>
      ) : null}
    </AuthScaffold>
  );
}

function Field({
  label,
  value,
  editable,
  onChangeText,
  inputStyle,
  keyboardType,
  autoCapitalize,
}: {
  label: string;
  value: string;
  editable: boolean;
  onChangeText: (text: string) => void;
  inputStyle: object[];
  keyboardType?: 'number-pad' | 'default';
  autoCapitalize?: 'characters' | 'none';
}): React.ReactElement {
  return (
    <View style={styles.field}>
      <AppText weight="semibold" style={styles.label}>
        {label}
      </AppText>
      {editable ? (
        <TextInput
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={false}
          style={inputStyle}
        />
      ) : (
        <AppText style={styles.value}>{value.trim() || '—'}</AppText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  contentWrap: {
    flex: 1,
    paddingHorizontal: 0,
    paddingBottom: 0,
  },
  editChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  editChipLabel: {
    fontSize: 13,
    color: colors.white,
  },
  pressed: {
    opacity: 0.85,
  },
  scroll: {
    paddingHorizontal: spacing.md,
    paddingTop: 8,
    paddingBottom: spacing.huge,
    gap: spacing.md,
  },
  card: {
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border.default,
    backgroundColor: colors.white,
    padding: spacing.md,
    gap: spacing.md,
    ...cardBackShadow,
  },
  field: {
    gap: spacing.xs,
  },
  label: {
    fontSize: 15,
    color: colors.text.primary,
  },
  value: {
    fontSize: 16,
    color: colors.text.primary,
    paddingVertical: 2,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border.strong,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    backgroundColor: colors.background.subtle,
    fontSize: 16,
    color: colors.text.primary,
  },
  footer: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border.default,
    backgroundColor: colors.white,
  },
  footerBtn: {
    flex: 1,
  },
  error: {
    color: colors.primary,
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
});
