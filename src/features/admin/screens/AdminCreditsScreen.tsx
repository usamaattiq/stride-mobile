import React from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
  type ListRenderItem,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';

import { FontAwesome } from '@expo/vector-icons';
import { AuthScaffold } from '@/features/auth/components/AuthScaffold';
import { CreditPurchaseRequestTile } from '@/features/dashboard/components/CreditPurchaseRequestTile';
import { ListingsEmptyState } from '@/features/dashboard/components/ListingsEmptyState';
import { i18n as appI18n } from '@/i18n';
import { adminApi, type AdminCreditPurchaseSummary } from '@/services/api/adminApi';
import { AppText } from '@/shared/components/AppText';
import { usePullToRefresh } from '@/shared/hooks/usePullToRefresh';
import { colors, spacing } from '@/theme';

import { useAdminResource } from '../hooks/useAdminResource';
import type { AdminCreditsStackParamList } from '../navigation/adminNavigationTypes';

export function AdminCreditsScreen(): React.ReactElement {
  const { t } = useTranslation(undefined, { i18n: appI18n });
  const navigation =
    useNavigation<NativeStackNavigationProp<AdminCreditsStackParamList>>();

  const { data, loading, errorKey, reload } = useAdminResource({
    reloadOnFocus: true,
    load: async () => {
      const result = await adminApi.listCreditPurchases();
      return result.items;
    },
  });

  const items = data ?? [];
  const { refreshControlProps } = usePullToRefresh(reload);

  const renderItem = React.useCallback<ListRenderItem<AdminCreditPurchaseSummary>>(
    ({ item }) => (
      <View style={styles.shadowGutter}>
        <CreditPurchaseRequestTile
          title={item.user.fullName}
          subtitle={`${t('admin.credits.requestFor', { count: item.credits })} · ${item.user.phoneE164}`}
          credits={item.credits}
          amount={item.amount}
          unitPrice={item.credits > 0 ? item.amount / item.credits : 0}
          status={item.status}
          onPress={() => navigation.navigate('CreditPurchaseDetail', { purchaseId: item.id })}
        />
      </View>
    ),
    [navigation, t],
  );

  return (
    <AuthScaffold
      title={t('admin.credits.title')}
      subtitle={t('admin.credits.requestsSubtitle')}
      compactHeader
      manualTopInset
      scrollable={false}
      showLanguageSwitcher={false}
      showLegalFooter={false}
      titleRight={
        <Pressable
          onPress={() => navigation.navigate('CreditSettings')}
          style={({ pressed }) => [styles.settingsButton, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel={t('admin.credits.settingsA11y')}
          hitSlop={8}
        >
          <FontAwesome name="cog" size={16} color={colors.white} />
        </Pressable>
      }
      contentWrapStyle={styles.contentWrap}
    >
      {errorKey ? <AppText style={styles.error}>{t(errorKey)}</AppText> : null}
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListEmptyComponent={
          loading ? (
            <AppText style={styles.muted}>{t('admin.common.loading')}</AppText>
          ) : (
            <ListingsEmptyState
              title={t('admin.credits.requestsEmpty')}
              subtitle={t('admin.credits.requestsSubtitle')}
              icon="coins"
            />
          )
        }
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl {...refreshControlProps} />}
      />
    </AuthScaffold>
  );
}

const styles = StyleSheet.create({
  contentWrap: {
    flex: 1,
    paddingHorizontal: 0,
    paddingBottom: 0,
  },
  listContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.md,
    paddingTop: 8,
    paddingBottom: spacing.huge,
    gap: spacing.sm,
  },
  shadowGutter: {
    marginHorizontal: -spacing.md,
    paddingHorizontal: spacing.md,
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
  settingsButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
