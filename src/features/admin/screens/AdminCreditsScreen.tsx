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
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';

import { AuthScaffold } from '@/features/auth/components/AuthScaffold';
import { CreditPurchaseRequestTile } from '@/features/dashboard/components/CreditPurchaseRequestTile';
import { DashboardSearchBar } from '@/features/dashboard/components/DashboardSearchBar';
import { ListingsEmptyState } from '@/features/dashboard/components/ListingsEmptyState';
import { SegmentControl } from '@/features/dashboard/components/SegmentControl';
import { i18n as appI18n } from '@/i18n';
import { useLanguage } from '@/i18n/hooks/useLanguage';
import { adminApi, type AdminCreditPurchaseSummary } from '@/services/api/adminApi';
import { AppText } from '@/shared/components/AppText';
import { usePullToRefresh } from '@/shared/hooks/usePullToRefresh';
import { useDisplayCurrency } from '@/shared/utils/currency';
import { colors, radius, spacing } from '@/theme';
import { getInputFontFamily } from '@/theme/typography';

import { useAdminResource } from '../hooks/useAdminResource';
import type { AdminCreditsStackParamList } from '../navigation/adminNavigationTypes';

type CreditsPageData = {
  items: AdminCreditPurchaseSummary[];
  settings: {
    unitPrice: number;
    tripCreateCredits: number;
    bidOfferCredits: number;
  };
};

export function AdminCreditsScreen(): React.ReactElement {
  const { t } = useTranslation(undefined, { i18n: appI18n });
  const { currentLanguage } = useLanguage();
  const currency = useDisplayCurrency();
  const navigation =
    useNavigation<NativeStackNavigationProp<AdminCreditsStackParamList>>();
  const [unitPrice, setUnitPrice] = React.useState('');
  const [tripCreate, setTripCreate] = React.useState('');
  const [bidOffer, setBidOffer] = React.useState('');
  const [savedSettings, setSavedSettings] = React.useState({
    unitPrice: '',
    tripCreate: '',
    bidOffer: '',
  });
  const [savingSettings, setSavingSettings] = React.useState(false);
  const [settingsErrorKey, setSettingsErrorKey] = React.useState<string | null>(null);
  const [listView, setListView] = React.useState<'pending' | 'history'>('pending');
  const [query, setQuery] = React.useState('');

  const { data, loading, errorKey, reload } = useAdminResource<CreditsPageData>({
    reloadOnFocus: true,
    deps: [listView],
    load: async () => {
      const [result, settings] = await Promise.all([
        adminApi.listCreditPurchases(listView),
        adminApi.getCreditSettings(),
      ]);
      return { items: result.items, settings };
    },
  });

  React.useEffect(() => {
    if (!data) {
      return;
    }
    const next = {
      unitPrice: String(data.settings.unitPrice),
      tripCreate: String(data.settings.tripCreateCredits),
      bidOffer: String(data.settings.bidOfferCredits),
    };
    setUnitPrice(next.unitPrice);
    setTripCreate(next.tripCreate);
    setBidOffer(next.bidOffer);
    setSavedSettings(next);
  }, [data]);

  const items = data?.items ?? [];
  const settingsStamp = data
    ? `${data.settings.unitPrice}-${data.settings.tripCreateCredits}-${data.settings.bidOfferCredits}`
    : '0';
  const visibleItems = React.useMemo(() => {
    const search = query.trim().toLowerCase();
    if (!search) {
      return items;
    }
    const digits = search.replace(/[\s-+]/g, '');
    return items.filter((item) => {
      const nameMatch = item.user.fullName.toLowerCase().includes(search);
      const phoneMatch = item.user.phoneE164.toLowerCase().includes(search);
      const phoneDigits = item.user.phoneE164.replace(/[\s-+]/g, '');
      return nameMatch || phoneMatch || (digits.length > 0 && phoneDigits.includes(digits));
    });
  }, [items, query]);
  const { refreshControlProps } = usePullToRefresh(reload);
  const inputFont = { fontFamily: getInputFontFamily(currentLanguage, 'number-pad') };
  const settingsDirty =
    unitPrice !== savedSettings.unitPrice ||
    tripCreate !== savedSettings.tripCreate ||
    bidOffer !== savedSettings.bidOffer;

  const saveSettings = async () => {
    const nextPrice = Number(unitPrice);
    const nextTrip = Number(tripCreate);
    const nextBid = Number(bidOffer);
    if (![nextPrice, nextTrip, nextBid].every((value) => Number.isInteger(value) && value >= 0)) {
      setSettingsErrorKey('admin.credits.settingsInvalid');
      return;
    }
    setSavingSettings(true);
    setSettingsErrorKey(null);
    try {
      await adminApi.updateCreditSettings({
        unitPrice: nextPrice,
        tripCreateCredits: nextTrip,
        bidOfferCredits: nextBid,
      });
      setSavedSettings({
        unitPrice: String(nextPrice),
        tripCreate: String(nextTrip),
        bidOffer: String(nextBid),
      });
      await reload();
    } catch {
      setSettingsErrorKey('admin.credits.settingsSaveFailed');
    } finally {
      setSavingSettings(false);
    }
  };

  const viewOptions = React.useMemo(
    () => [
      { id: 'pending' as const, label: t('admin.credits.pendingApproval') },
      { id: 'history' as const, label: t('admin.credits.history') },
    ],
    [t],
  );

  const renderItem = React.useCallback<ListRenderItem<AdminCreditPurchaseSummary>>(
    ({ item }) => (
      <View style={styles.shadowGutter}>
        <CreditPurchaseRequestTile
          title={item.user.fullName}
          subtitle={t('admin.credits.requestFor', { count: item.credits })}
          phone={item.user.phoneE164}
          credits={item.credits}
          amount={item.amount}
          unitPrice={item.credits > 0 ? item.amount / item.credits : 0}
          status={item.status}
          createdAt={item.createdAt}
          avatarUrl={item.user.avatarViewUrl}
          showAvatar
          onPress={() => navigation.navigate('CreditPurchaseDetail', { purchaseId: item.id })}
        />
      </View>
    ),
    [navigation, t],
  );

  return (
    <AuthScaffold
      title={t('admin.credits.title')}
      compactHeader
      manualTopInset
      scrollable={false}
      showLanguageSwitcher={false}
      showLegalFooter={false}
      headerExtra={
        <View style={styles.headerExtra}>
          <View style={styles.settingsCard}>
            <View style={styles.settingsLine}>
              <AppText weight="semibold" style={styles.settingsLabel} numberOfLines={1}>
                {t('admin.credits.unitPriceLabel')}
              </AppText>
              <View style={styles.priceInputWrap}>
                <AppText weight="semibold" style={styles.currencyLabel}>
                  {currency}
                </AppText>
                <TextInput
                  key={`unit-${settingsStamp}`}
                  value={unitPrice}
                  onChangeText={setUnitPrice}
                  keyboardType="number-pad"
                  style={[styles.settingsInput, inputFont]}
                />
              </View>
            </View>
            <View style={styles.settingsLine}>
              <AppText weight="semibold" style={styles.settingsLabel} numberOfLines={1}>
                {t('admin.credits.tripCreateLabel')}
              </AppText>
              <TextInput
                key={`trip-${settingsStamp}`}
                value={tripCreate}
                onChangeText={setTripCreate}
                keyboardType="number-pad"
                style={[styles.settingsInput, inputFont]}
              />
            </View>
            <View style={styles.settingsLine}>
              <AppText weight="semibold" style={styles.settingsLabel} numberOfLines={1}>
                {t('admin.credits.bidOfferLabel')}
              </AppText>
              <TextInput
                key={`bid-${settingsStamp}`}
                value={bidOffer}
                onChangeText={setBidOffer}
                keyboardType="number-pad"
                style={[styles.settingsInput, inputFont]}
              />
            </View>
            <Pressable
              onPress={() => void saveSettings()}
              disabled={!settingsDirty || savingSettings}
              style={({ pressed }) => [
                styles.settingsSave,
                settingsDirty && styles.settingsSaveActive,
                pressed && settingsDirty && styles.pressed,
                (!settingsDirty || savingSettings) && styles.settingsSaveDisabled,
              ]}
              accessibilityRole="button"
              accessibilityLabel={t('admin.common.save')}
              accessibilityState={{ disabled: !settingsDirty || savingSettings }}
            >
              <AppText weight="semibold" style={styles.settingsSaveLabel}>
                {savingSettings ? t('admin.common.saving') : t('admin.common.save')}
              </AppText>
            </Pressable>
          </View>
          <SegmentControl
            options={viewOptions}
            value={listView}
            onChange={setListView}
            variant="onBrand"
          />
        </View>
      }
      contentWrapStyle={styles.contentWrap}
    >
      {errorKey || settingsErrorKey ? (
        <AppText style={styles.error}>
          {t(errorKey ?? settingsErrorKey ?? 'admin.common.loadFailed')}
        </AppText>
      ) : null}
      <View style={styles.searchWrap}>
        <DashboardSearchBar
          value={query}
          onChangeText={setQuery}
          placeholder={t('admin.credits.searchPlaceholder')}
        />
      </View>
      <FlatList
        data={visibleItems}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListEmptyComponent={
          loading ? (
            <AppText style={styles.muted}>{t('admin.common.loading')}</AppText>
          ) : (
            <ListingsEmptyState
              title={
                listView === 'history'
                  ? t('admin.credits.historyEmpty')
                  : t('admin.credits.requestsEmpty')
              }
              subtitle={
                listView === 'history'
                  ? t('admin.credits.historySubtitle')
                  : t('admin.credits.requestsSubtitle')
              }
              icon="coins"
            />
          )
        }
        contentContainerStyle={styles.listContent}
        extraData={settingsStamp}
        refreshControl={<RefreshControl {...refreshControlProps} />}
        keyboardShouldPersistTaps="handled"
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
  searchWrap: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
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
  headerExtra: {
    gap: spacing.sm,
  },
  settingsCard: {
    borderRadius: radius.md,
    backgroundColor: colors.primaryPressed,
    padding: spacing.md,
    gap: spacing.sm,
  },
  settingsLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  settingsLabel: {
    flex: 1,
    minWidth: 0,
    fontSize: 13,
    color: colors.white,
  },
  settingsInput: {
    width: 64,
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: colors.white,
    paddingHorizontal: 8,
    paddingVertical: 0,
    fontSize: 14,
    color: colors.text.primary,
    textAlign: 'center',
  },
  priceInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  currencyLabel: {
    fontSize: 13,
    color: colors.white,
  },
  settingsSave: {
    alignSelf: 'flex-end',
    height: 32,
    paddingHorizontal: 12,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsSaveActive: {
    backgroundColor: colors.primary,
  },
  settingsSaveDisabled: {
    opacity: 0.55,
  },
  settingsSaveLabel: {
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
