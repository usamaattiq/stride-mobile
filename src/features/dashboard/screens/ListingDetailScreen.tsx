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
import { TripBidPanel } from '../components/trip/TripBidPanel';
import { TripDetailsOverview } from '../components/trip/TripDetailsOverview';
import { TripOfferPanel } from '../components/trip/TripOfferPanel';
import { TripResponsesPanel } from '../components/trip/TripResponsesPanel';
import { SegmentControl } from '../components/SegmentControl';
import { VEHICLE_CLASS_OPTIONS } from '../constants/vehicleClasses';
import { useTrips } from '../context/TripContext';
import type { DashboardRootStackParamList } from '../navigation/dashboardRootTypes';
import type { Trip } from '../types/trip.types';
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
  const [responsesCount, setResponsesCount] = React.useState(0);

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
        isOwnListing ? (
          <Pressable
            onPress={openRemove}
            style={styles.headerRemoveButton}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={t('dashboard.listings.remove.a11y')}
          >
            <FontAwesome name="trash-o" size={16} color={colors.white} />
          </Pressable>
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
              departureWhen={formatTripDateTime(trip.departureAt, locale)}
              arrivalWhen={formatTripDateTime(trip.arrivalAt, locale)}
              departurePoint={trip.departurePoint}
              arrivalPoint={trip.arrivalPoint}
            />
            {trip.listingType === 'auction' ? (
              <TripBidPanel
                tripId={trip.id}
                isPassengerRequest={trip.vehicleId == null}
                requiresVehicle={trip.vehicleId == null}
                initialVehicleId={route.params.selectVehicleId ?? null}
                onBidChange={handleBidChange}
              />
            ) : (
              <TripOfferPanel
                tripId={trip.id}
                vehicleMode={trip.vehicleMode}
                vehicleTotalSeats={trip.vehicleTotalSeats}
                requiresVehicle={trip.vehicleId == null}
                initialVehicleId={route.params.selectVehicleId ?? null}
                onOfferChange={handleOfferChange}
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
                    departureWhen={formatTripDateTime(trip.departureAt, locale)}
                    arrivalWhen={formatTripDateTime(trip.arrivalAt, locale)}
                    departurePoint={trip.departurePoint}
                    arrivalPoint={trip.arrivalPoint}
                  />
                </View>

                <View style={[styles.page, { width: pageWidth }]}>
                  {trip.listingType === 'auction' ? (
                    <TripAuctionBidsPanel
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
  headerRemoveButton: {
    width: 34,
    height: 34,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
});
