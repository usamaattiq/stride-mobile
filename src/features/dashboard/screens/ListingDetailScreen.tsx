import React from 'react';
import { FontAwesome } from '@expo/vector-icons';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { useResizeMode } from 'react-native-keyboard-controller';

import { AuthScaffold } from '@/features/auth/components/AuthScaffold';
import { i18n as appI18n } from '@/i18n';
import { auctionApi } from '@/services/api/auctionApi';
import { getErrorMessage } from '@/services/api/errorMessage';
import { tripApi } from '@/services/api/tripApi';
import { AppDialog } from '@/shared/components/AppDialog';
import { AppText } from '@/shared/components/AppText';
import { Button } from '@/shared/components/Button';
import { usePullToRefresh } from '@/shared/hooks/usePullToRefresh';
import { cityDisplayName } from '@/shared/utils/city-display-name';
import { colors, radius, spacing } from '@/theme';

import { ListingCard } from '../components/ListingCard';
import { formatTripDateTime } from '../components/trip/dateRangeUtils';
import { TripAuctionBidsPanel } from '../components/trip/TripAuctionBidsPanel';
import { TripBidPanel, type TripBidPanelHandle } from '../components/trip/TripBidPanel';
import { TripDetailsOverview } from '../components/trip/TripDetailsOverview';
import { TripOfferPanel, type TripOfferPanelHandle } from '../components/trip/TripOfferPanel';
import { TripResponsesPanel } from '../components/trip/TripResponsesPanel';
import { SegmentControl } from '../components/SegmentControl';
import { VEHICLE_CLASS_OPTIONS } from '../constants/vehicleClasses';
import { useTrips } from '../context/TripContext';
import type { DashboardRootStackParamList } from '../navigation/dashboardRootTypes';
import type { Trip } from '../types/trip.types';
import { getListingStatusBucket } from '../utils/listingFilters';
import { mapTripDtoToTrip } from '../utils/trip.mapper';

type DetailTab = 'overview' | 'responses';

const INITIAL_PAGE_WIDTH = Dimensions.get('window').width - spacing.md * 2;

export function ListingDetailScreen(): React.ReactElement {
  const { t, i18n } = useTranslation(undefined, { i18n: appI18n });
  const navigation =
    useNavigation<NativeStackNavigationProp<DashboardRootStackParamList, 'ListingDetail'>>();
  const route = useRoute<RouteProp<DashboardRootStackParamList, 'ListingDetail'>>();
  const { getTripById, removeTrip, refreshTrips } = useTrips();

  const cached = getTripById(route.params.tripId);
  const [trip, setTrip] = React.useState<Trip | null>(cached ?? null);
  const [loading, setLoading] = React.useState(!cached);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [tab, setTab] = React.useState<DetailTab>('overview');
  const [pageWidth, setPageWidth] = React.useState(INITIAL_PAGE_WIDTH);
  const pagerRef = React.useRef<ScrollView>(null);
  const scrollX = React.useRef(new Animated.Value(0)).current;
  const [confirmRemove, setConfirmRemove] = React.useState(false);
  const [removing, setRemoving] = React.useState(false);
  const [removeError, setRemoveError] = React.useState<string | null>(null);
  const [confirmCloseAuction, setConfirmCloseAuction] = React.useState(false);
  const [closingAuction, setClosingAuction] = React.useState(false);
  const [closeAuctionError, setCloseAuctionError] = React.useState<string | null>(null);
  const [canCloseAuction, setCanCloseAuction] = React.useState(false);
  const [auctionPanelKey, setAuctionPanelKey] = React.useState(0);
  const [responsesCount, setResponsesCount] = React.useState(0);
  const [canWithdrawOffer, setCanWithdrawOffer] = React.useState(false);
  const offerPanelRef = React.useRef<TripOfferPanelHandle>(null);
  const bidPanelRef = React.useRef<TripBidPanelHandle>(null);

  /** Owned listings come from the user's My Listings cache; discovery items do not.
   * Messages can pass viewerIsOwner so owner UI works even before the cache is warm. */
  const isOwnListing =
    route.params.viewerIsOwner === true || Boolean(getTripById(route.params.tripId));
  // Offer form needs adjustResize so the price field can scroll above the keyboard
  // (app default is Android pan, which leaves the focused field covered).
  useResizeMode();

  const selectTab = React.useCallback(
    (next: DetailTab, animated = true) => {
      setTab(next);
      if (pageWidth <= 0) {
        return;
      }
      const index = next === 'overview' ? 0 : 1;
      pagerRef.current?.scrollTo({ x: index * pageWidth, animated });
      if (!animated) {
        scrollX.setValue(index * pageWidth);
      }
    },
    [pageWidth, scrollX],
  );

  const animatedTabIndex = React.useMemo(() => {
    if (pageWidth <= 0) {
      return undefined;
    }
    return scrollX.interpolate({
      inputRange: [0, pageWidth],
      outputRange: [0, 1],
      extrapolate: 'clamp',
    });
  }, [pageWidth, scrollX]);

  const syncTabFromOffset = React.useCallback(
    (offsetX: number) => {
      if (pageWidth <= 0) {
        return;
      }
      const index = Math.round(offsetX / pageWidth);
      const nextTab: DetailTab = index === 0 ? 'overview' : 'responses';
      setTab((current) => (current === nextTab ? current : nextTab));
    },
    [pageWidth],
  );

  const onPagerScrollEnd = React.useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      syncTabFromOffset(event.nativeEvent.contentOffset.x);
    },
    [syncTabFromOffset],
  );

  const onPagerLayout = React.useCallback(
    (event: LayoutChangeEvent) => {
      const width = event.nativeEvent.layout.width;
      if (width <= 0 || width === pageWidth) {
        return;
      }
      setPageWidth(width);
      const index = tab === 'overview' ? 0 : 1;
      scrollX.setValue(index * width);
      requestAnimationFrame(() => {
        pagerRef.current?.scrollTo({ x: index * width, animated: false });
      });
    },
    [pageWidth, scrollX, tab],
  );

  React.useEffect(() => {
    if (cached) {
      setTrip(cached);
      setLoading(false);
      return;
    }

    setLoading(true);
    setLoadError(null);
    void tripApi
      .getById(route.params.tripId)
      .then((dto) => setTrip(mapTripDtoToTrip(dto)))
      .catch((error) => {
        setLoadError(getErrorMessage(error, t('dashboard.listings.detail.loadFailed')));
      })
      .finally(() => setLoading(false));
  }, [cached, route.params.tripId, t]);

  const reloadTrip = React.useCallback(async () => {
    setLoadError(null);
    const dto = await tripApi.getById(route.params.tripId);
    setTrip(mapTripDtoToTrip(dto));
    if (isOwnListing) {
      await refreshTrips().catch(() => undefined);
    }
  }, [isOwnListing, refreshTrips, route.params.tripId]);

  const { refreshControlProps } = usePullToRefresh(reloadTrip);

  React.useEffect(() => {
    if (!isOwnListing || !trip || trip.listingType !== 'auction') {
      setCanCloseAuction(false);
      return;
    }
    let cancelled = false;
    void auctionApi
      .getSnapshot(trip.id)
      .then((result) => {
        if (cancelled) {
          return;
        }
        setCanCloseAuction(result.role === 'owner' && result.actions.canClose);
      })
      .catch(() => {
        if (!cancelled) {
          setCanCloseAuction(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [isOwnListing, trip?.id, trip?.listingType, trip?.auctionStatus]);

  const handleRemove = () => {
    if (!trip || removing) {
      return;
    }
    setRemoving(true);
    setRemoveError(null);
    void removeTrip(trip.id)
      .then(async () => {
        setConfirmRemove(false);
        await refreshTrips().catch(() => undefined);
        navigation.goBack();
      })
      .catch((error) => {
        setRemoveError(getErrorMessage(error, t('dashboard.listings.remove.failed')));
      })
      .finally(() => setRemoving(false));
  };

  const handleCloseAuction = () => {
    if (!trip || closingAuction) {
      return;
    }
    setClosingAuction(true);
    setCloseAuctionError(null);
    void auctionApi
      .close(trip.id)
      .then(async () => {
        setConfirmCloseAuction(false);
        setCanCloseAuction(false);
        setAuctionPanelKey((key) => key + 1);
        await reloadTrip().catch(() => undefined);
      })
      .catch((error) => {
        setCloseAuctionError(
          getErrorMessage(error, t('dashboard.listings.detail.auctionBids.actionFailed')),
        );
      })
      .finally(() => setClosingAuction(false));
  };

  const goBack = () => navigation.goBack();

  const handleOfferChange = React.useCallback(
    (update: {
      rfqStatus: Trip['rfqStatus'];
      myOfferStatus: Trip['myOfferStatus'];
      myOfferPrice: Trip['myOfferPrice'];
      counterpartyName: Trip['counterpartyName'];
      counterpartyPhone: Trip['counterpartyPhone'];
    }) => {
      setTrip((current) =>
        current
          ? {
              ...current,
              rfqStatus: update.rfqStatus,
              myOfferStatus: update.myOfferStatus,
              myOfferPrice: update.myOfferPrice,
              counterpartyName: update.counterpartyName,
              counterpartyPhone: update.counterpartyPhone,
            }
          : current,
      );
    },
    [],
  );

  const handleBidChange = React.useCallback(
    (update: {
      auctionStatus: Trip['auctionStatus'];
      auctionStatusLabel: Trip['auctionStatusLabel'];
      auctionStatusVariant: Trip['auctionStatusVariant'];
      myBidStatus: Trip['myBidStatus'];
      myBidAmount: Trip['myBidAmount'];
      counterpartyName: Trip['counterpartyName'];
      counterpartyPhone: Trip['counterpartyPhone'];
    }) => {
      setTrip((current) =>
        current
          ? {
              ...current,
              auctionStatus: update.auctionStatus,
              auctionStatusLabel: update.auctionStatusLabel,
              auctionStatusVariant: update.auctionStatusVariant,
              myBidStatus: update.myBidStatus,
              myBidAmount: update.myBidAmount,
              counterpartyName: update.counterpartyName,
              counterpartyPhone: update.counterpartyPhone,
            }
          : current,
      );
    },
    [],
  );

  if (loading) {
    return (
      <AuthScaffold
        onBack={goBack}
        title={t('dashboard.listings.detail.title')}
        showLegalFooter={false}
        showLanguageSwitcher={false}
        compactHeader
      >
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} />
        </View>
      </AuthScaffold>
    );
  }

  if (!trip || loadError) {
    return (
      <AuthScaffold
        onBack={goBack}
        title={t('dashboard.listings.detail.title')}
        showLegalFooter={false}
        showLanguageSwitcher={false}
        compactHeader
      >
        <View style={styles.centered}>
          <AppText style={styles.errorText}>
            {loadError ?? t('dashboard.listings.detail.notFound')}
          </AppText>
          <Button label={t('common.ok')} onPress={goBack} />
        </View>
      </AuthScaffold>
    );
  }

  const fromCity = cityDisplayName(trip.departureCity.label);
  const toCity = trip.arrivalCity
    ? cityDisplayName(trip.arrivalCity.label)
    : '—';
  const classLabel = trip.vehicleClass
    ? t(
        VEHICLE_CLASS_OPTIONS.find((item) => item.id === trip.vehicleClass)?.labelKey ??
          'vehicles.classPlaceholder',
      )
    : t('trips.create.previewVehicle');
  const modeLabel =
    trip.vehicleMode === 'fullPrivate'
      ? t('trips.create.vehicleModeFullPrivate')
      : t('trips.create.vehicleModeShared');
  const locale = i18n.language;
  const departureWhen = trip.departureOpen
    ? t('dashboard.listings.card.open')
    : formatTripDateTime(trip.departureAt, locale);
  const arrivalWhen = trip.departureOpen
    ? undefined
    : formatTripDateTime(trip.arrivalAt, locale);
  const vehicleTitle = trip.vehicleTitle ?? classLabel;
  const description =
    trip.description?.trim() ||
    t('dashboard.listings.detail.descriptionBody', {
      from: fromCity,
      to: toCity,
      vehicle: vehicleTitle,
      mode: modeLabel,
    });

  const tabs: Array<{ id: DetailTab; label: string }> = [
    { id: 'overview', label: t('dashboard.listings.detail.tabs.overview') },
    {
      id: 'responses',
      label: t('dashboard.listings.detail.tabs.responses', { count: responsesCount }),
    },
  ];

  const openRemove = () => {
    setRemoveError(null);
    setConfirmRemove(true);
  };

  // Hide delete once the listing is past / completed / closed / expired / ended.
  const canRemoveListing =
    isOwnListing && trip != null && getListingStatusBucket(trip) === 'live';
  const showHeaderActions = canCloseAuction || canRemoveListing || canWithdrawOffer;

  return (
    <AuthScaffold
      onBack={goBack}
      title={t('dashboard.listings.detail.title')}
      showLegalFooter={false}
      showLanguageSwitcher={false}
      compactHeader
      // Clearance above the keyboard for the focused price field + submit button.
      // Only affects keyboard-open scroll — no permanent empty gap at the bottom.
      scrollBottomOffset={isOwnListing ? undefined : spacing.huge + spacing.sm}
      refreshControlProps={refreshControlProps}
      headerRight={
        showHeaderActions ? (
          <View style={styles.headerActions}>
            {canWithdrawOffer ? (
              <Pressable
                onPress={() => {
                  offerPanelRef.current?.openWithdrawConfirm();
                  bidPanelRef.current?.openWithdrawConfirm();
                }}
                style={styles.headerActionButton}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel={
                  trip.listingType === 'auction'
                    ? t('dashboard.listings.detail.bid.withdraw')
                    : t('dashboard.listings.detail.offer.withdraw')
                }
              >
                <FontAwesome name="undo" size={13} color={colors.white} />
                <AppText weight="semibold" style={styles.headerActionLabel}>
                  {t('dashboard.listings.detail.offer.withdrawConfirmAction')}
                </AppText>
              </Pressable>
            ) : null}
            {canCloseAuction ? (
              <Pressable
                onPress={() => {
                  setCloseAuctionError(null);
                  setConfirmCloseAuction(true);
                }}
                style={styles.headerActionButton}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel={t('dashboard.listings.detail.auctionBids.close')}
              >
                <FontAwesome name="stop-circle" size={14} color={colors.white} />
                <AppText weight="semibold" style={styles.headerActionLabel}>
                  {t('common.close')}
                </AppText>
              </Pressable>
            ) : null}
            {canRemoveListing ? (
              <Pressable
                onPress={openRemove}
                style={styles.headerActionButton}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel={t('dashboard.listings.remove.a11y')}
              >
                <FontAwesome name="trash-o" size={16} color={colors.white} />
              </Pressable>
            ) : null}
          </View>
        ) : undefined
      }
    >
      <View style={styles.content}>
        <ListingCard trip={trip} showPhotoCount />

        {!isOwnListing ? (
          <>
            <TripDetailsOverview
              description={description}
              fromCity={fromCity}
              toCity={toCity}
              departureWhen={departureWhen}
              arrivalWhen={arrivalWhen}
              departurePoint={trip.departurePoint}
              arrivalPoint={trip.arrivalPoint}
            />
            {trip.listingType === 'auction' ? (
              <TripBidPanel
                ref={bidPanelRef}
                tripId={trip.id}
                isPassengerRequest={trip.vehicleId == null}
                requiresVehicle={trip.vehicleId == null}
                initialVehicleId={route.params.selectVehicleId ?? null}
                onBidChange={handleBidChange}
                onCanWithdrawChange={setCanWithdrawOffer}
              />
            ) : (
              <TripOfferPanel
                ref={offerPanelRef}
                tripId={trip.id}
                vehicleMode={trip.vehicleMode}
                vehicleTotalSeats={trip.vehicleTotalSeats}
                requiresVehicle={trip.vehicleId == null}
                initialVehicleId={route.params.selectVehicleId ?? null}
                onOfferChange={handleOfferChange}
                onCanWithdrawChange={setCanWithdrawOffer}
              />
            )}
          </>
        ) : (
          <>
            <SegmentControl
              options={tabs}
              value={tab}
              onChange={selectTab}
              animatedIndex={animatedTabIndex}
            />

            <View style={styles.pager} onLayout={onPagerLayout}>
              <Animated.ScrollView
                ref={pagerRef}
                horizontal
                pagingEnabled
                bounces={false}
                decelerationRate="fast"
                showsHorizontalScrollIndicator={false}
                nestedScrollEnabled
                keyboardShouldPersistTaps="handled"
                onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
                  useNativeDriver: true,
                })}
                onScrollEndDrag={onPagerScrollEnd}
                onMomentumScrollEnd={onPagerScrollEnd}
                scrollEventThrottle={16}
              >
                <View style={[styles.page, { width: pageWidth }]}>
                  <TripDetailsOverview
                    description={description}
                    fromCity={fromCity}
                    toCity={toCity}
                    departureWhen={departureWhen}
                    arrivalWhen={arrivalWhen}
                    departurePoint={trip.departurePoint}
                    arrivalPoint={trip.arrivalPoint}
                  />
                </View>

                <View style={[styles.page, { width: pageWidth }]}>
                  {trip.listingType === 'auction' ? (
                    <TripAuctionBidsPanel
                      key={auctionPanelKey}
                      tripId={trip.id}
                      isPassengerRequest={trip.vehicleId == null}
                      onCountChange={setResponsesCount}
                    />
                  ) : (
                    <TripResponsesPanel
                      tripId={trip.id}
                      vehicleMode={trip.vehicleMode}
                      vehicleTotalSeats={trip.vehicleTotalSeats}
                      isPassengerRequest={trip.vehicleId == null}
                      onCountChange={setResponsesCount}
                    />
                  )}
                </View>
              </Animated.ScrollView>
            </View>
          </>
        )}
      </View>

      <AppDialog
        visible={confirmCloseAuction}
        icon="stop-circle"
        title={t('dashboard.listings.detail.auctionBids.closeConfirmTitle')}
        message={
          closeAuctionError ?? t('dashboard.listings.detail.auctionBids.closeConfirmBody')
        }
        cancelAction={{
          label: t('common.cancel'),
          onPress: () => {
            if (closingAuction) {
              return;
            }
            setConfirmCloseAuction(false);
            setCloseAuctionError(null);
          },
        }}
        confirmAction={{
          label: t('dashboard.listings.detail.auctionBids.close'),
          onPress: handleCloseAuction,
        }}
      />

      <AppDialog
        visible={confirmRemove}
        icon="trash"
        title={t('dashboard.listings.remove.title')}
        message={
          removeError ??
          t('dashboard.listings.remove.confirm', {
            from: fromCity,
            to: toCity,
          })
        }
        cancelAction={{
          label: t('common.cancel'),
          onPress: () => {
            if (removing) {
              return;
            }
            setConfirmRemove(false);
            setRemoveError(null);
          },
        }}
        confirmAction={{
          label: t('dashboard.listings.remove.confirmAction'),
          onPress: handleRemove,
        }}
      />
    </AuthScaffold>
  );
}

const styles = StyleSheet.create({
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xl,
  },
  errorText: {
    fontSize: 13,
    color: colors.primary,
    textAlign: 'center',
  },
  content: {
    gap: spacing.xs,
  },
  pager: {
    overflow: 'hidden',
  },
  page: {
    gap: spacing.xs,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  headerActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 34,
    paddingHorizontal: spacing.sm,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  headerActionLabel: {
    color: colors.white,
    fontSize: 12,
    lineHeight: 16,
  },
});
