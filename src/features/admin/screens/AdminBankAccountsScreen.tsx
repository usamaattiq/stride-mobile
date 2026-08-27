import React from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

import { AuthScaffold } from '@/features/auth/components/AuthScaffold';
import { i18n as appI18n } from '@/i18n';
import { useLanguage } from '@/i18n/hooks/useLanguage';
import { adminApi, type AdminBankAccount } from '@/services/api/adminApi';
import { AppText } from '@/shared/components/AppText';
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
    /^[A-Z0-9]{4,34}$/.test(account.iban)
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
  const [saved, setSaved] = React.useState<AdminBankAccount[]>([]);
  const [draft, setDraft] = React.useState<AdminBankAccount | null>({ ...EMPTY_ACCOUNT });
  const [saving, setSaving] = React.useState(false);
  const [saveErrorKey, setSaveErrorKey] = React.useState<string | null>(null);

  const { loading, errorKey } = useAdminResource({
    load: async () => {
      const result = await adminApi.getBankAccounts();
      setSaved(result.accounts);
      setDraft(result.accounts.length === 0 ? { ...EMPTY_ACCOUNT } : null);
      return result;
    },
  });

  const persist = async (accounts: AdminBankAccount[]) => {
    const result = await adminApi.updateBankAccounts(accounts.map(toPayload));
    setSaved(result.accounts);
    setDraft(null);
  };

  const save = async () => {
    if (draft && !isBlank(draft) && !isComplete(draft)) {
      setSaveErrorKey('admin.settings.bankAccounts.invalid');
      return;
    }
    setSaving(true);
    setSaveErrorKey(null);
    try {
      const next = draft && isComplete(draft) ? [...saved, toPayload(draft)] : saved;
      await persist(next);
    } catch {
      setSaveErrorKey('admin.settings.bankAccounts.saveFailed');
    } finally {
      setSaving(false);
    }
  };

  const addAccount = () => {
    if (draft && !isBlank(draft) && !isComplete(draft)) {
      setSaveErrorKey('admin.settings.bankAccounts.invalid');
      return;
    }
    if (draft && isComplete(draft)) {
      setSaved((current) => [...current, toPayload(draft)]);
    }
    setSaveErrorKey(null);
    setDraft({ ...EMPTY_ACCOUNT });
  };

  const removeSaved = (index: number) => {
    setSaved((current) => current.filter((_, currentIndex) => currentIndex !== index));
  };

  const textInputStyle = [styles.input, { fontFamily: getInputFontFamily(currentLanguage) }];
  const numberInputStyle = [
    styles.input,
    { fontFamily: getInputFontFamily(currentLanguage, 'number-pad') },
  ];

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
      headerRight={
        <Pressable
          onPress={() => void save()}
          disabled={saving || loading}
          style={({ pressed }) => [
            styles.headerSave,
            (saving || loading) && styles.headerSaveDisabled,
            pressed && !saving && !loading && styles.pressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel={t('admin.common.save')}
        >
          <AppText weight="semibold" style={styles.headerSaveLabel}>
            {saving || loading ? t('admin.common.saving') : t('admin.common.save')}
          </AppText>
        </Pressable>
      }
      titleRight={
        <Pressable
          onPress={addAccount}
          disabled={saved.length + (draft && !isBlank(draft) ? 1 : 0) >= 20}
          style={({ pressed }) => [styles.addChip, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel={t('admin.settings.bankAccounts.add')}
        >
          <AppText weight="semibold" style={styles.addChipLabel}>
            {t('admin.settings.bankAccounts.add')}
          </AppText>
        </Pressable>
      }
    >
      {errorKey || saveErrorKey ? (
        <AppText style={styles.error}>
          {t(errorKey ?? saveErrorKey ?? 'admin.common.loadFailed')}
        </AppText>
      ) : null}
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {saved.map((account, index) => (
          <View key={`${account.accountNumber}-${index}`} style={styles.savedCard}>
            <View style={styles.savedCopy}>
              <AppText weight="bold" style={styles.savedTitle}>
                {account.bankName}
              </AppText>
              <AppText style={styles.savedMeta}>{account.accountTitle}</AppText>
              <AppText style={styles.savedMeta}>{account.accountNumber}</AppText>
              <AppText style={styles.savedMeta}>{account.iban}</AppText>
            </View>
            <Pressable onPress={() => removeSaved(index)} hitSlop={8}>
              <AppText weight="semibold" style={styles.remove}>
                {t('common.remove')}
              </AppText>
            </Pressable>
          </View>
        ))}

        {draft ? (
          <View style={styles.card}>
            <Field
              label={t('admin.settings.bankAccounts.bankName')}
              value={draft.bankName}
              onChangeText={(text) => setDraft((current) => ({ ...(current ?? EMPTY_ACCOUNT), bankName: text }))}
              inputStyle={textInputStyle}
            />
            <Field
              label={t('admin.settings.bankAccounts.accountTitle')}
              value={draft.accountTitle}
              onChangeText={(text) =>
                setDraft((current) => ({ ...(current ?? EMPTY_ACCOUNT), accountTitle: text }))
              }
              inputStyle={textInputStyle}
            />
            <Field
              label={t('admin.settings.bankAccounts.accountNumber')}
              value={draft.accountNumber}
              onChangeText={(text) =>
                setDraft((current) => ({
                  ...(current ?? EMPTY_ACCOUNT),
                  accountNumber: toLatinDigits(text).replace(/[^\d]/g, '').slice(0, 32),
                }))
              }
              inputStyle={numberInputStyle}
              keyboardType="number-pad"
            />
            <Field
              label={t('admin.settings.bankAccounts.iban')}
              value={draft.iban}
              onChangeText={(text) =>
                setDraft((current) => ({
                  ...(current ?? EMPTY_ACCOUNT),
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
        ) : null}
      </ScrollView>
    </AuthScaffold>
  );
}

function Field({
  label,
  value,
  onChangeText,
  inputStyle,
  keyboardType,
  autoCapitalize,
}: {
  label: string;
  value: string;
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
      <TextInput
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        autoCorrect={false}
        style={inputStyle}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  contentWrap: {
    flex: 1,
    paddingHorizontal: 0,
    paddingBottom: 0,
  },
  headerSave: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  headerSaveDisabled: {
    opacity: 0.55,
  },
  headerSaveLabel: {
    fontSize: 13,
    color: colors.white,
  },
  addChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  addChipLabel: {
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
  savedCard: {
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border.default,
    backgroundColor: colors.white,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
    ...cardBackShadow,
  },
  savedCopy: {
    flex: 1,
    gap: 2,
  },
  savedTitle: {
    fontSize: 15,
    color: colors.text.primary,
  },
  savedMeta: {
    fontSize: 13,
    color: colors.text.secondary,
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
  remove: {
    color: colors.primary,
    fontSize: 14,
  },
  field: {
    gap: spacing.xs,
  },
  label: {
    fontSize: 15,
    color: colors.text.primary,
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
  error: {
    color: colors.primary,
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
});
