import React from 'react';
import { FontAwesome } from '@expo/vector-icons';
import {
  ActivityIndicator,
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

import { AuthScaffold } from '@/features/auth/components/AuthScaffold';
import { i18n as appI18n } from '@/i18n';
import { getErrorMessage } from '@/services/api/errorMessage';
import { tripApi } from '@/services/api/tripApi';
import { AppDialog } from '@/shared/components/AppDialog';
import { AppText } from '@/shared/components/AppText';
import { Button } from '@/shared/components/Button';
import { cityDisplayName } from '@/shared/utils/city-display-name';
import { openInGoogleMaps } from '@/shared/utils/open-in-google-maps';
import { colors, radius, spacing } from '@/theme';

import { ListingCard } from '../components/ListingCard';
import { formatDateRangeLabel } from '../components/trip/dateRangeUtils';
import { SegmentControl } from '../components/SegmentControl';
import { VEHICLE_CLASS_OPTIONS } from '../constants/vehicleClasses';
import { useTrips } from '../context/TripContext';
import type { DashboardRootStackParamList } from '../navigation/dashboardRootTypes';
import type { Trip, TripLocationPoint } from '../types/trip.types';
import { mapTripDtoToTrip } from '../utils/trip.mapper';

type DetailTab = 'overview' | 'responses';

const INITIAL_PAGE_WIDTH = Dimensions.get('window').width - spacing.md * 2;

function formatDateTime(iso: string, locale: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }
  const day = date.toLocaleDateString(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  const time = date.toLocaleTimeString(locale, {
    hour: 'numeric',
    minute: '2-digit',
  });
  return `${day} at ${time}`;
}

type SectionIconProps = {
  name: React.ComponentProps<typeof FontAwesome>['name'];
};

function SectionIcon({ name }: SectionIconProps): React.ReactElement {
  return (
    <View style={styles.sectionIcon}>
      <FontAwesome name={name} size={14} color={colors.primary} />
    </View>
  );
}

type SectionHeaderProps = {
  icon: React.ComponentProps<typeof FontAwesome>['name'];
  title: string;
  subtitle?: string;
};

function SectionHeader({ icon, title, subtitle }: SectionHeaderProps): React.ReactElement {
  return (
    <View style={styles.cardHeader}>
      <SectionIcon name={icon} />
      <View style={styles.cardHeaderCopy}>
        {subtitle ? <AppText style={styles.eyebrow}>{subtitle}</AppText> : null}
        <AppText weight="bold" style={styles.sectionTitle}>
          {title}
        </AppText>
      </View>
    </View>
  );
}

type LocationPointRowProps = {
  eyebrow: string;
  point: TripLocationPoint | null | undefined;
  accessibilityLabel: string;
};

function LocationPointRow({
  eyebrow,
  point,
  accessibilityLabel,
}: LocationPointRowProps): React.ReactElement {
  const label = point?.label?.trim() || '—';
  const canOpen =
    point != null &&
    Number.isFinite(point.latitude) &&
    Number.isFinite(point.longitude);

  return (
    <Pressable
      style={({ pressed }) => [styles.pointRow, pressed && canOpen && styles.pointRowPressed]}
      disabled={!canOpen}
      onPress={() => {
        if (!point || !canOpen) {
          return;
        }
        void openInGoogleMaps(point);
      }}
      accessibilityRole={canOpen ? 'link' : 'text'}
      accessibilityLabel={accessibilityLabel}
    >
      <FontAwesome name="map-marker" size={12} color={colors.primary} />
      <View style={styles.pointCopy}>
        <AppText style={styles.eyebrow}>{eyebrow}</AppText>
        <AppText
          weight="medium"
          style={[styles.pointValue, canOpen && styles.pointValueLink]}
        >
          {label}
        </AppText>
      </View>
      {canOpen ? (
        <FontAwesome name="external-link" size={11} color={colors.primary} />
      ) : null}
    </Pressable>
  );
}

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
  const [descriptionExpanded, setDescriptionExpanded] = React.useState(false);
  const [descriptionTruncatable, setDescriptionTruncatable] = React.useState(false);
  const [confirmRemove, setConfirmRemove] = React.useState(false);
  const [removing, setRemoving] = React.useState(false);
  const [removeError, setRemoveError] = React.useState<string | null>(null);

  const selectTab = React.useCallback(
    (next: DetailTab, animated = true) => {
      setTab(next);
      if (pageWidth <= 0) {
        return;
      }
      const index = next === 'overview' ? 0 : 1;
      pagerRef.current?.scrollTo({ x: index * pageWidth, animated });
    },
    [pageWidth],
  );

  const onPagerLayout = React.useCallback(
    (event: LayoutChangeEvent) => {
      const width = event.nativeEvent.layout.width;
      if (width <= 0 || width === pageWidth) {
        return;
      }
      setPageWidth(width);
      const index = tab === 'overview' ? 0 : 1;
      requestAnimationFrame(() => {
        pagerRef.current?.scrollTo({ x: index * width, animated: false });
      });
    },
    [pageWidth, tab],
  );

  const onPagerScrollEnd = React.useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (pageWidth <= 0) {
        return;
      }
      const index = Math.round(event.nativeEvent.contentOffset.x / pageWidth);
      setTab(index === 0 ? 'overview' : 'responses');
    },
    [pageWidth],
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
    { id: 'responses', label: t('dashboard.listings.detail.tabs.responses', { count: 0 }) },
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
      headerRight={
        <Pressable
          onPress={openRemove}
          style={styles.headerRemoveButton}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel={t('dashboard.listings.remove.a11y')}
        >
          <FontAwesome name="trash-o" size={16} color={colors.white} />
        </Pressable>
      }
    >
      <View style={styles.content}>
        <ListingCard trip={trip} showPhotoCount />

        <SegmentControl options={tabs} value={tab} onChange={selectTab} />

        <View style={styles.pager} onLayout={onPagerLayout}>
          <ScrollView
            ref={pagerRef}
            horizontal
            pagingEnabled
            bounces={false}
            decelerationRate="fast"
            showsHorizontalScrollIndicator={false}
            nestedScrollEnabled
            keyboardShouldPersistTaps="handled"
            onMomentumScrollEnd={onPagerScrollEnd}
            scrollEventThrottle={16}
          >
            <View style={[styles.page, { width: pageWidth }]}>
              <View style={styles.card}>
                <SectionHeader
                  icon="align-left"
                  title={t('dashboard.listings.detail.description')}
                />
                <View style={styles.descriptionWrap}>
                  <AppText
                    style={[styles.descriptionText, styles.descriptionMeasure]}
                    pointerEvents="none"
                    onTextLayout={(event) => {
                      if (event.nativeEvent.lines.length > 2) {
                        setDescriptionTruncatable(true);
                      }
                    }}
                  >
                    {description}
                  </AppText>
                  <AppText
                    style={styles.descriptionText}
                    numberOfLines={descriptionExpanded ? undefined : 2}
                  >
                    {description}
                    {descriptionTruncatable ? (
                      <AppText
                        weight="semibold"
                        style={styles.showMoreText}
                        onPress={() => setDescriptionExpanded((current) => !current)}
                        suppressHighlighting
                      >
                        {'  '}
                        {descriptionExpanded
                          ? t('dashboard.listings.detail.showLess')
                          : t('dashboard.listings.detail.showMore')}
                      </AppText>
                    ) : null}
                  </AppText>
                </View>
              </View>

              <View style={styles.card}>
                <SectionHeader
                  icon="map-marker"
                  title={t('trips.create.detailsTitle')}
                />

                <View style={styles.timeline}>
                  <View style={styles.timelineRail}>
                    <View style={[styles.timelineDot, styles.timelineDotStart]} />
                    <View style={styles.timelineLine} />
                    <View style={[styles.timelineDot, styles.timelineDotEnd]} />
                  </View>

                  <View style={styles.timelineBody}>
                    <View style={styles.endpointBlock}>
                      <View style={styles.endpointTop}>
                        <View style={styles.endpointCopy}>
                          <AppText style={styles.eyebrow}>{t('trips.create.departure')}</AppText>
                          <AppText weight="bold" style={styles.endpointCity}>
                            {fromCity}
                          </AppText>
                        </View>
                        <View style={styles.endpointWhen}>
                          <FontAwesome name="calendar" size={11} color={colors.text.tertiary} />
                          <View style={styles.endpointWhenCopy}>
                            <AppText style={styles.whenLabel}>
                              {t('trips.create.departureDateWindow')}
                            </AppText>
                            <AppText weight="semibold" style={styles.whenValue}>
                              {formatDateRangeLabel(
                                trip.departureAt,
                                trip.departureUntil,
                                locale,
                                '—',
                              )}
                            </AppText>
                          </View>
                        </View>
                      </View>
                      <LocationPointRow
                        eyebrow={t('trips.create.pickupPoint')}
                        point={trip.departurePoint}
                        accessibilityLabel={t('dashboard.listings.detail.openPickupInMaps', {
                          place: trip.departurePoint?.label ?? '—',
                        })}
                      />
                    </View>

                    <View style={styles.endpointBlock}>
                      <View style={styles.endpointTop}>
                        <View style={styles.endpointCopy}>
                          <AppText style={styles.eyebrow}>{t('trips.create.arrival')}</AppText>
                          <AppText weight="bold" style={styles.endpointCity}>
                            {toCity}
                          </AppText>
                        </View>
                        <View style={styles.endpointWhen}>
                          <FontAwesome name="calendar" size={11} color={colors.text.tertiary} />
                          <View style={styles.endpointWhenCopy}>
                            <AppText style={styles.whenLabel}>
                              {t('trips.create.arrivalDateTime')}
                            </AppText>
                            <AppText weight="semibold" style={styles.whenValue}>
                              {formatDateTime(trip.arrivalAt, locale)}
                            </AppText>
                          </View>
                        </View>
                      </View>
                      <LocationPointRow
                        eyebrow={t('trips.create.dropoffPoint')}
                        point={trip.arrivalPoint}
                        accessibilityLabel={t('dashboard.listings.detail.openDropoffInMaps', {
                          place: trip.arrivalPoint?.label ?? '—',
                        })}
                      />
                    </View>
                  </View>
                </View>
              </View>
            </View>

            <View style={[styles.page, { width: pageWidth }]}>
              <View style={styles.emptyTabCard}>
                <AppText weight="semibold" style={styles.emptyTabTitle}>
                  {t('dashboard.listings.detail.comingSoonTitle')}
                </AppText>
                <AppText style={styles.emptyTabBody}>
                  {t('dashboard.listings.detail.comingSoonBody')}
                </AppText>
              </View>
            </View>
          </ScrollView>
        </View>
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
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border.default,
    borderRadius: radius.lg,
    backgroundColor: colors.white,
    padding: spacing.sm,
    gap: spacing.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  cardHeaderCopy: {
    flex: 1,
    minWidth: 0,
    gap: 1,
  },
  sectionIcon: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyebrow: {
    fontSize: 11,
    color: colors.text.tertiary,
  },
  sectionTitle: {
    fontSize: 15,
    color: colors.text.primary,
  },
  timeline: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  timelineRail: {
    width: 14,
    alignItems: 'center',
    paddingTop: 4,
    paddingBottom: 4,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2.5,
    backgroundColor: colors.white,
  },
  timelineDotStart: {
    borderColor: colors.accent.green.text,
  },
  timelineDotEnd: {
    borderColor: colors.primary,
  },
  timelineLine: {
    flex: 1,
    width: 2,
    backgroundColor: colors.primary,
    marginVertical: 4,
  },
  timelineBody: {
    flex: 1,
    minWidth: 0,
    gap: spacing.sm,
  },
  endpointBlock: {
    gap: spacing.xs,
  },
  endpointTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  endpointCopy: {
    flexShrink: 1,
    gap: 1,
  },
  endpointCity: {
    fontSize: 16,
    color: colors.text.primary,
  },
  endpointWhen: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    maxWidth: '58%',
  },
  endpointWhenCopy: {
    flex: 1,
    minWidth: 0,
    gap: 1,
  },
  whenLabel: {
    fontSize: 10,
    color: colors.text.tertiary,
  },
  whenValue: {
    fontSize: 12,
    color: colors.text.primary,
    lineHeight: 16,
  },
  pointRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    paddingLeft: 2,
    paddingVertical: 2,
  },
  pointRowPressed: {
    opacity: 0.75,
  },
  pointCopy: {
    flex: 1,
    minWidth: 0,
    gap: 1,
  },
  pointValue: {
    fontSize: 12,
    color: colors.text.primary,
    lineHeight: 16,
  },
  pointValueLink: {
    color: colors.primary,
    textDecorationLine: 'underline',
  },
  descriptionWrap: {
    position: 'relative',
  },
  descriptionText: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.text.secondary,
  },
  descriptionMeasure: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    opacity: 0,
  },
  showMoreText: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.primary,
  },
  headerRemoveButton: {
    width: 34,
    height: 34,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  emptyTabCard: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border.default,
    borderRadius: radius.md,
    backgroundColor: colors.white,
    padding: spacing.md,
    gap: spacing.xxs,
    alignItems: 'center',
  },
  emptyTabTitle: {
    fontSize: 14,
    color: colors.text.primary,
  },
  emptyTabBody: {
    fontSize: 13,
    color: colors.text.secondary,
    textAlign: 'center',
  },
});
