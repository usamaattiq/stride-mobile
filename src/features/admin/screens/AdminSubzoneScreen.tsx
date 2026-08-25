import React from 'react';
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Switch,
  TextInput,
  View,
  type ListRenderItem,
} from 'react-native';
import { useTranslation } from 'react-i18next';

import { AuthScaffold } from '@/features/auth/components/AuthScaffold';
import { ListingsEmptyState } from '@/features/dashboard/components/ListingsEmptyState';
import { i18n as appI18n } from '@/i18n';
import { adminApi, type AdminSubzone } from '@/services/api/adminApi';
import { AppText } from '@/shared/components/AppText';
import { Button } from '@/shared/components/Button';
import { usePullToRefresh } from '@/shared/hooks/usePullToRefresh';
import { colors, radius, spacing } from '@/theme';

import { useAdminResource } from '../hooks/useAdminResource';

const emptyForm = {
  name: '',
  cityLabel: '',
  cityId: '',
  isActive: true,
};

export function AdminSubzoneScreen(): React.ReactElement {
  const { t } = useTranslation(undefined, { i18n: appI18n });
  const [form, setForm] = React.useState(emptyForm);
  const [saving, setSaving] = React.useState(false);
  const [actionErrorKey, setActionErrorKey] = React.useState<string | null>(null);

  const { data, loading, errorKey, reload } = useAdminResource({
    load: async () => {
      const result = await adminApi.listSubzones();
      return result.items;
    },
  });

  const subzones = data ?? [];
  const { refreshControlProps } = usePullToRefresh(reload);

  const createSubzone = React.useCallback(async () => {
    if (!form.name.trim() || !form.cityLabel.trim()) {
      setActionErrorKey('admin.subzone.required');
      return;
    }

    setSaving(true);
    setActionErrorKey(null);
    try {
      await adminApi.createSubzone({
        name: form.name.trim(),
        cityLabel: form.cityLabel.trim(),
        cityId: form.cityId.trim() || null,
        isActive: form.isActive,
      });
      setForm(emptyForm);
      await reload();
    } catch {
      setActionErrorKey('admin.subzone.createFailed');
    } finally {
      setSaving(false);
    }
  }, [form, reload]);

  const toggleActive = React.useCallback(
    async (subzone: AdminSubzone) => {
      setActionErrorKey(null);
      try {
        await adminApi.updateSubzone(subzone.id, { isActive: !subzone.isActive });
        await reload();
      } catch {
        setActionErrorKey('admin.subzone.updateFailed');
      }
    },
    [reload],
  );

  const removeSubzone = React.useCallback(
    async (subzoneId: string) => {
      setActionErrorKey(null);
      try {
        await adminApi.deleteSubzone(subzoneId);
        await reload();
      } catch {
        setActionErrorKey('admin.subzone.deleteFailed');
      }
    },
    [reload],
  );

  const renderSubzone = React.useCallback<ListRenderItem<AdminSubzone>>(
    ({ item }) => (
      <View style={styles.card}>
        <View style={styles.info}>
          <AppText weight="bold">{item.name}</AppText>
          <AppText style={styles.meta}>{item.cityLabel}</AppText>
          <AppText style={styles.meta}>
            {item.isActive ? t('admin.subzone.active') : t('admin.subzone.inactive')}
          </AppText>
        </View>
        <View style={styles.actions}>
          <Button
            label={item.isActive ? t('admin.subzone.deactivate') : t('admin.subzone.activate')}
            onPress={() => void toggleActive(item)}
            variant="secondary"
          />
          <Button
            label={t('admin.common.delete')}
            onPress={() => void removeSubzone(item.id)}
            variant="secondary"
          />
        </View>
      </View>
    ),
    [removeSubzone, t, toggleActive],
  );

  const listHeader = (
    <View style={styles.formCard}>
      <AppText weight="bold" style={styles.sectionTitle}>
        {t('admin.subzone.addTitle')}
      </AppText>
      <TextInput
        placeholder={t('admin.subzone.name')}
        value={form.name}
        onChangeText={(name) => setForm((current) => ({ ...current, name }))}
        style={styles.input}
      />
      <TextInput
        placeholder={t('admin.subzone.cityLabel')}
        value={form.cityLabel}
        onChangeText={(cityLabel) => setForm((current) => ({ ...current, cityLabel }))}
        style={styles.input}
      />
      <TextInput
        placeholder={t('admin.subzone.cityId')}
        value={form.cityId}
        onChangeText={(cityId) => setForm((current) => ({ ...current, cityId }))}
        style={styles.input}
      />
      <View style={styles.switchRow}>
        <AppText>{t('admin.subzone.active')}</AppText>
        <Switch
          value={form.isActive}
          onValueChange={(isActive) => setForm((current) => ({ ...current, isActive }))}
        />
      </View>
      <Button
        label={saving ? t('admin.common.saving') : t('admin.subzone.create')}
        onPress={() => void createSubzone()}
        disabled={saving}
      />
      {errorKey || actionErrorKey ? (
        <AppText style={styles.error}>
          {t(errorKey ?? actionErrorKey ?? 'admin.common.loadFailed')}
        </AppText>
      ) : null}
    </View>
  );

  const listEmpty = loading ? (
    <AppText style={styles.muted}>{t('admin.common.loading')}</AppText>
  ) : (
    <ListingsEmptyState
      title={t('admin.subzone.empty')}
      subtitle={t('admin.subzone.subtitle')}
      icon="map-marker-alt"
    />
  );

  return (
    <AuthScaffold
      title={t('admin.subzone.title')}
      subtitle={t('admin.subzone.subtitle')}
      compactHeader
      manualTopInset
      scrollable={false}
      showLanguageSwitcher={false}
      showLegalFooter={false}
      contentWrapStyle={styles.contentWrap}
    >
      <FlatList
        data={subzones}
        keyExtractor={(item) => item.id}
        renderItem={renderSubzone}
        ListHeaderComponent={listHeader}
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
  formCard: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border.default,
    borderRadius: radius.md,
    padding: spacing.md,
    backgroundColor: colors.white,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  sectionTitle: {
    marginBottom: spacing.xs,
  },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border.default,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.background.subtle,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
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
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  error: {
    color: colors.primary,
  },
  muted: {
    color: colors.text.secondary,
    textAlign: 'center',
    paddingVertical: spacing.xl,
  },
});
