import React from 'react';
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  View,
  type ListRenderItem,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';

import { AuthScaffold } from '@/features/auth/components/AuthScaffold';
import { DashboardSearchBar } from '@/features/dashboard/components/DashboardSearchBar';
import { ListingsEmptyState } from '@/features/dashboard/components/ListingsEmptyState';
import { SegmentControl } from '@/features/dashboard/components/SegmentControl';
import { i18n as appI18n } from '@/i18n';
import {
  adminApi,
  type AdminUserFilter,
  type AdminUserSummary,
} from '@/services/api/adminApi';
import { AppText } from '@/shared/components/AppText';
import { FilterChips } from '@/shared/components/FilterChips';
import { usePullToRefresh } from '@/shared/hooks/usePullToRefresh';
import { colors, spacing } from '@/theme';

import { AdminUserCard } from '../components/AdminUserCard';
import { useAdminResource } from '../hooks/useAdminResource';
import type { AdminUsersStackParamList } from '../navigation/adminNavigationTypes';

const FILTER_OPTIONS: { id: AdminUserFilter; labelKey: string }[] = [
  { id: 'all', labelKey: 'admin.users.filters.all' },
  { id: 'verified', labelKey: 'admin.users.filters.verified' },
  { id: 'not_verified', labelKey: 'admin.users.filters.notVerified' },
  { id: 'documents_submitted', labelKey: 'admin.users.filters.documentsSubmitted' },
];

function ListSeparator(): React.ReactElement {
  return <View style={styles.separator} />;
}

export function AdminUsersScreen(): React.ReactElement {
  const { t } = useTranslation(undefined, { i18n: appI18n });
  const navigation = useNavigation<NativeStackNavigationProp<AdminUsersStackParamList>>();
  const [role, setRole] = React.useState<'passenger' | 'driver'>('passenger');
  const [filter, setFilter] = React.useState<AdminUserFilter>('all');
  const [query, setQuery] = React.useState('');
  const [debouncedQuery, setDebouncedQuery] = React.useState('');

  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => clearTimeout(timer);
  }, [query]);

  const { data, loading, errorKey, reload } = useAdminResource({
    deps: [role, filter, debouncedQuery],
    load: async () => {
      const result = await adminApi.listUsers(role, filter, debouncedQuery || undefined);
      return result.items;
    },
  });

  const users = data ?? [];
  const { refreshControlProps } = usePullToRefresh(reload);

  const roleOptions = React.useMemo(
    () => [
      { id: 'passenger' as const, label: t('admin.users.passengers') },
      { id: 'driver' as const, label: t('admin.users.drivers') },
    ],
    [t],
  );

  const filterOptions = React.useMemo(
    () =>
      FILTER_OPTIONS.map((option) => ({
        id: option.id,
        label: t(option.labelKey),
      })),
    [t],
  );

  const renderUser = React.useCallback<ListRenderItem<AdminUserSummary>>(
    ({ item }) => (
      <AdminUserCard
        user={item}
        listRole={role}
        onPress={() =>
          navigation.navigate('UserDetail', { userId: item.id, listRole: role })
        }
      />
    ),
    [navigation, role],
  );

  const listEmpty = loading ? (
    <AppText style={styles.muted}>{t('admin.common.loading')}</AppText>
  ) : (
    <ListingsEmptyState
      title={t('admin.users.empty')}
      subtitle={t('admin.users.subtitle')}
      icon="users"
    />
  );

  return (
    <AuthScaffold
      title={t('admin.users.title')}
      subtitle={t('admin.users.subtitle')}
      compactHeader
      manualTopInset
      scrollable={false}
      showLanguageSwitcher={false}
      showLegalFooter={false}
      contentWrapStyle={styles.contentWrap}
      headerExtra={
        <SegmentControl options={roleOptions} value={role} onChange={setRole} variant="onBrand" />
      }
    >
      <View style={styles.filters}>
        <DashboardSearchBar
          value={query}
          onChangeText={setQuery}
          placeholder={t('admin.users.searchPlaceholder')}
        />
        <FilterChips active={filter} onChange={setFilter} options={filterOptions} />
        {errorKey ? <AppText style={styles.error}>{t(errorKey)}</AppText> : null}
      </View>

      <FlatList
        data={users}
        keyExtractor={(item) => item.id}
        renderItem={renderUser}
        ItemSeparatorComponent={ListSeparator}
        ListEmptyComponent={listEmpty}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl {...refreshControlProps} />}
        keyboardShouldPersistTaps="handled"
        initialNumToRender={8}
        maxToRenderPerBatch={8}
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
  filters: {
    gap: spacing.sm,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  listContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.md,
    paddingTop: 8,
    paddingBottom: spacing.huge + spacing.md,
  },
  separator: {
    height: spacing.sm,
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
