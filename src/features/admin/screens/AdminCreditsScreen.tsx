import React from 'react';
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  TextInput,
  View,
  type ListRenderItem,
} from 'react-native';
import { useTranslation } from 'react-i18next';

import { AuthScaffold } from '@/features/auth/components/AuthScaffold';
import { ListingsEmptyState } from '@/features/dashboard/components/ListingsEmptyState';
import { i18n as appI18n } from '@/i18n';
import { adminApi, type AdminCreditUser } from '@/services/api/adminApi';
import { AppText } from '@/shared/components/AppText';
import { Button } from '@/shared/components/Button';
import { usePullToRefresh } from '@/shared/hooks/usePullToRefresh';
import { colors, radius, spacing } from '@/theme';

import { useAdminResource } from '../hooks/useAdminResource';

export function AdminCreditsScreen(): React.ReactElement {
  const { t } = useTranslation(undefined, { i18n: appI18n });
  const [drafts, setDrafts] = React.useState<Record<string, string>>({});
  const [savingId, setSavingId] = React.useState<string | null>(null);
  const [saveErrorKey, setSaveErrorKey] = React.useState<string | null>(null);

  const { data, loading, errorKey, reload } = useAdminResource({
    load: async () => {
      const result = await adminApi.listCredits();
      setDrafts(Object.fromEntries(result.items.map((user) => [user.id, String(user.credits)])));
      return result.items;
    },
  });

  const users = data ?? [];
  const { refreshControlProps } = usePullToRefresh(reload);

  const saveCredits = React.useCallback(
    async (userId: string) => {
      const value = Number(drafts[userId]);
      if (!Number.isInteger(value) || value < 0) {
        setSaveErrorKey('admin.credits.invalid');
        return;
      }

      setSavingId(userId);
      setSaveErrorKey(null);
      try {
        await adminApi.updateCredits(userId, value);
        await reload();
      } catch {
        setSaveErrorKey('admin.credits.saveFailed');
      } finally {
        setSavingId(null);
      }
    },
    [drafts, reload],
  );

  const renderUser = React.useCallback<ListRenderItem<AdminCreditUser>>(
    ({ item }) => (
      <View style={styles.card}>
        <View style={styles.info}>
          <AppText weight="bold">{item.fullName}</AppText>
          <AppText style={styles.meta}>{item.phoneE164}</AppText>
          <AppText style={styles.meta}>
            {item.role === 'driver' ? t('admin.users.drivers') : t('admin.users.passengers')}
          </AppText>
        </View>

        <TextInput
          value={drafts[item.id] ?? '0'}
          onChangeText={(text) => setDrafts((current) => ({ ...current, [item.id]: text }))}
          keyboardType="number-pad"
          style={styles.input}
        />

        <Button
          label={savingId === item.id ? t('admin.common.saving') : t('admin.common.save')}
          onPress={() => void saveCredits(item.id)}
          disabled={savingId === item.id}
          variant="secondary"
        />
      </View>
    ),
    [drafts, saveCredits, savingId, t],
  );

  const listEmpty = loading ? (
    <AppText style={styles.muted}>{t('admin.common.loading')}</AppText>
  ) : (
    <ListingsEmptyState
      title={t('admin.credits.empty')}
      subtitle={t('admin.credits.subtitle')}
      icon="coins"
    />
  );

  return (
    <AuthScaffold
      title={t('admin.credits.title')}
      subtitle={t('admin.credits.subtitle')}
      compactHeader
      manualTopInset
      scrollable={false}
      showLanguageSwitcher={false}
      showLegalFooter={false}
      contentWrapStyle={styles.contentWrap}
    >
      {errorKey || saveErrorKey ? (
        <AppText style={styles.error}>
          {t(errorKey ?? saveErrorKey ?? 'admin.common.loadFailed')}
        </AppText>
      ) : null}

      <FlatList
        data={users}
        keyExtractor={(item) => item.id}
        renderItem={renderUser}
        ListEmptyComponent={listEmpty}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl {...refreshControlProps} />}
        keyboardShouldPersistTaps="handled"
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={7}
      />
    </AuthScaffold>
  );
}

const styles = StyleSheet.create({
  contentWrap: {
    flex: 1,
    paddingTop: spacing.md,
    paddingHorizontal: 0,
    paddingBottom: 0,
  },
  listContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.md,
    paddingTop: 8,
    paddingBottom: spacing.huge + spacing.md,
    gap: spacing.sm,
  },
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border.default,
    borderRadius: radius.md,
    padding: spacing.md,
    backgroundColor: colors.white,
    gap: spacing.sm,
  },
  info: {
    gap: 2,
  },
  meta: {
    color: colors.text.secondary,
    fontSize: 14,
  },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border.default,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.background.subtle,
  },
  error: {
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  muted: {
    color: colors.text.secondary,
    textAlign: 'center',
    paddingVertical: spacing.xl,
  },
});
