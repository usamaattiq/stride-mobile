import React from 'react';
import {
  FlatList,
  Pressable,
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
import { usePullToRefresh } from '@/shared/hooks/usePullToRefresh';
import { colors, radius, spacing } from '@/theme';
import { cardBackShadow } from '@/theme/cardShadow';

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
    ({ item }) => {
      const saving = savingId === item.id;
      return (
        <View style={styles.shadowGutter}>
          <View style={styles.item}>
            <View style={styles.itemInner}>
              <View style={styles.info}>
                <AppText weight="bold" style={styles.name} numberOfLines={1}>
                  {item.fullName}
                </AppText>
                <AppText style={styles.meta} numberOfLines={1}>
                  {item.phoneE164}
                </AppText>
                <View style={styles.creditsRow}>
                  <AppText weight="semibold" style={styles.creditsLabel}>
                    {t('dashboard.home.credits')}
                  </AppText>
                  <TextInput
                    value={drafts[item.id] ?? '0'}
                    onChangeText={(text) =>
                      setDrafts((current) => ({ ...current, [item.id]: text }))
                    }
                    keyboardType="number-pad"
                    style={styles.input}
                  />
                </View>
              </View>
              <Pressable
                onPress={() => void saveCredits(item.id)}
                disabled={saving}
                style={({ pressed }) => [
                  styles.saveButton,
                  pressed && styles.pressed,
                  saving && styles.saveButtonDisabled,
                ]}
                accessibilityRole="button"
                accessibilityLabel={t('admin.common.save')}
                hitSlop={8}
              >
                <AppText weight="semibold" style={styles.saveLabel}>
                  {saving ? t('admin.common.saving') : t('admin.common.save')}
                </AppText>
              </Pressable>
            </View>
          </View>
        </View>
      );
    },
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
    gap: spacing.md,
  },
  shadowGutter: {
    marginHorizontal: -spacing.md,
    paddingHorizontal: spacing.md,
  },
  item: {
    borderRadius: radius.md,
    backgroundColor: colors.background.subtle,
    ...cardBackShadow,
  },
  itemInner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border.default,
    backgroundColor: colors.background.subtle,
    paddingVertical: spacing.sm,
    paddingLeft: spacing.sm,
    paddingRight: spacing.xs,
  },
  info: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  name: {
    fontSize: 16,
    color: colors.text.primary,
  },
  meta: {
    color: colors.text.secondary,
    fontSize: 13,
  },
  creditsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  creditsLabel: {
    fontSize: 13,
    color: colors.text.primary,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border.strong,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: colors.white,
    fontSize: 15,
    color: colors.text.primary,
  },
  saveButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignSelf: 'flex-start',
  },
  saveButtonDisabled: {
    opacity: 0.55,
  },
  saveLabel: {
    fontSize: 12,
    color: colors.white,
  },
  error: {
    color: colors.primary,
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  muted: {
    color: colors.text.secondary,
    textAlign: 'center',
    paddingVertical: spacing.xl,
  },
  pressed: {
    opacity: 0.85,
  },
});
