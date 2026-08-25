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
import { FontAwesome } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { AuthScaffold } from '@/features/auth/components/AuthScaffold';
import { useLocationMapPicker } from '@/features/auth/hooks/useLocationMapPicker';
import { resolveCityAndPointFromCoords } from '@/features/auth/utils/geocodedAddressLabel';
import { i18n as appI18n } from '@/i18n';
import { adminApi, type AdminSubzone } from '@/services/api/adminApi';
import { AppText } from '@/shared/components/AppText';
import { Button } from '@/shared/components/Button';
import { usePullToRefresh } from '@/shared/hooks/usePullToRefresh';
import { colors, radius, spacing } from '@/theme';

import { useAdminResource } from '../hooks/useAdminResource';

type FormState = {
  name: string;
  cityLabel: string;
  cityId: string;
  latitude: number | null;
  longitude: number | null;
};

const emptyForm: FormState = {
  name: '',
  cityLabel: '',
  cityId: '',
  latitude: null,
  longitude: null,
};

export function AdminSubzoneScreen(): React.ReactElement {
  const { t } = useTranslation(undefined, { i18n: appI18n });
  const [form, setForm] = React.useState<FormState>(emptyForm);
  const [saving, setSaving] = React.useState(false);
  const [actionErrorKey, setActionErrorKey] = React.useState<string | null>(null);
  const { openMapPickerForSelection, mapPickerSheet } = useLocationMapPicker();

  const { data, loading, errorKey, reload } = useAdminResource({
    load: async () => {
      const result = await adminApi.listSubzones();
      return result.items;
    },
  });

  const subzones = data ?? [];
  const { refreshControlProps } = usePullToRefresh(reload);

  const pickLocation = React.useCallback(() => {
    const initial =
      form.latitude != null && form.longitude != null
        ? {
            label: form.name || form.cityLabel,
            latitude: form.latitude,
            longitude: form.longitude,
          }
        : null;

    openMapPickerForSelection((selection) => {
      void resolveCityAndPointFromCoords(
        selection.latitude,
        selection.longitude,
        selection.label,
      ).then((resolved) => {
        setForm((current) => ({
          ...current,
          cityLabel: resolved.cityLabel,
          cityId: resolved.cityId,
          latitude: selection.latitude,
          longitude: selection.longitude,
        }));
        setActionErrorKey(null);
      });
    }, initial);
  }, [form.cityLabel, form.latitude, form.longitude, form.name, openMapPickerForSelection]);

  const createSubzone = React.useCallback(async () => {
    if (!form.name.trim() || !form.cityLabel.trim() || form.latitude == null || form.longitude == null) {
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
        latitude: form.latitude,
        longitude: form.longitude,
        isActive: true,
      });
      setForm(emptyForm);
      await reload();
    } catch {
      setActionErrorKey('admin.subzone.createFailed');
    } finally {
      setSaving(false);
    }
  }, [form, reload]);

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
          {item.latitude != null && item.longitude != null ? (
            <AppText style={styles.meta}>
              {`${item.latitude.toFixed(5)}, ${item.longitude.toFixed(5)}`}
            </AppText>
          ) : null}
        </View>
        <Button
          label={t('admin.common.delete')}
          onPress={() => void removeSubzone(item.id)}
          variant="secondary"
        />
      </View>
    ),
    [removeSubzone, t],
  );

  const listHeader = (
    <>
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
        <Pressable
          onPress={pickLocation}
          style={({ pressed }) => [styles.mapPickButton, pressed && styles.pressed]}
          accessibilityRole="button"
        >
          <FontAwesome name="map-marker" size={16} color={colors.primary} />
          <View style={styles.mapPickCopy}>
            <AppText weight="semibold" style={styles.mapPickLabel}>
              {form.latitude != null && form.longitude != null
                ? t('admin.subzone.changeLocation')
                : t('admin.subzone.pickOnMap')}
            </AppText>
            {form.cityLabel ? (
              <AppText style={styles.mapPickMeta} numberOfLines={1}>
                {form.cityLabel}
              </AppText>
            ) : (
              <AppText style={styles.mapPickMeta}>{t('admin.subzone.pickOnMapHint')}</AppText>
            )}
            {form.latitude != null && form.longitude != null ? (
              <AppText style={styles.mapPickMeta}>
                {`${form.latitude.toFixed(5)}, ${form.longitude.toFixed(5)}`}
              </AppText>
            ) : null}
          </View>
          <FontAwesome name="chevron-right" size={12} color={colors.text.tertiary} />
        </Pressable>
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
      {subzones.length > 0 ? (
        <AppText weight="bold" style={styles.addedHeader}>
          {t('admin.subzone.addedTitle')}
        </AppText>
      ) : null}
    </>
  );

  const listFooter =
    !loading && subzones.length === 0 ? (
      <View style={styles.emptyFooter}>
        <AppText style={styles.emptyText}>{t('admin.subzone.empty')}</AppText>
      </View>
    ) : null;

  return (
    <>
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
          ListFooterComponent={listFooter}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl {...refreshControlProps} />}
          keyboardShouldPersistTaps="handled"
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={7}
        />
      </AuthScaffold>
      {mapPickerSheet}
    </>
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
  addedHeader: {
    fontSize: 15,
    color: colors.text.primary,
    marginBottom: spacing.xs,
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
  mapPickButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border.default,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.background.subtle,
  },
  mapPickCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  mapPickLabel: {
    fontSize: 14,
    color: colors.text.primary,
  },
  mapPickMeta: {
    fontSize: 12,
    color: colors.text.secondary,
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
  emptyFooter: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: spacing.xxl,
    minHeight: 120,
  },
  emptyText: {
    color: colors.text.secondary,
    fontSize: 14,
    textAlign: 'center',
  },
  error: {
    color: colors.primary,
  },
  pressed: {
    opacity: 0.85,
  },
});
