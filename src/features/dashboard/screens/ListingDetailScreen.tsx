import React from 'react';
import { FontAwesome, FontAwesome5 } from '@expo/vector-icons';
import { Image } from 'expo-image';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { i18n as appI18n } from '@/i18n';
import { getErrorMessage } from '@/services/api/errorMessage';
import { tripApi } from '@/services/api/tripApi';
import { AppDialog } from '@/shared/components/AppDialog';
import { AppText } from '@/shared/components/AppText';
import { Button } from '@/shared/components/Button';
import { FocusAwareStatusBar } from '@/shared/components/FocusAwareStatusBar';
import { cityDisplayName } from '@/shared/utils/city-display-name';
import { colors, radius, spacing } from '@/theme';

import { VEHICLE_CLASS_OPTIONS } from '../constants/vehicleClasses';
import { useTrips } from '../context/TripContext';
import type { DashboardRootStackParamList } from '../navigation/dashboardRootTypes';
import type { Trip } from '../types/trip.types';
import { mapTripDtoToTrip } from '../utils/trip.mapper';

type DetailTab = 'overview' | 'responses' | 'activity' | 'manage';

function formatDateRange(departureAt: string, arrivalAt: string, locale: string): string {
  const from = new Date(departureAt);
  const to = new Date(arrivalAt);
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
    return '—';
  }
  const opts: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  };
  return `${from.toLocaleDateString(locale, opts)} – ${to.toLocaleDateString(locale, opts)}`;
}

function formatTimeLabel(iso: string, locale: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }
  return date.toLocaleTimeString(locale, { hour: 'numeric', minute: '2-digit' });
}

function formatExpiresIn(publishedAt: string, durationHours: number): string | null {
  const expiresAt = new Date(publishedAt).getTime() + durationHours * 60 * 60 * 1000;
  const remainingMs = expiresAt - Date.now();
  if (remainingMs <= 0) {
    return null;
  }
  const totalMinutes = Math.floor(remainingMs / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours <= 0) {
    return `${minutes}m`;
  }
  return `${hours}h ${minutes}m`;
}

type TripDetailRowProps = {
  icon: React.ComponentProps<typeof FontAwesome>['name'];
  label: string;
  value: string;
};

function TripDetailRow({ icon, label, value }: TripDetailRowProps): React.ReactElement {
  return (
    <View style={styles.detailRow}>
      <FontAwesome name={icon} size={14} color={colors.text.tertiary} style={styles.detailIcon} />
      <View style={styles.detailCopy}>
        <AppText style={styles.detailLabel}>{label}</AppText>
        <AppText weight="semibold" style={styles.detailValue}>
          {value}
        </AppText>
      </View>
    </View>
  );
}

export function ListingDetailScreen(): React.ReactElement {
  const { t, i18n } = useTranslation(undefined, { i18n: appI18n });
  const insets = useSafeAreaInsets();
  const navigation =
    useNavigation<NativeStackNavigationProp<DashboardRootStackParamList, 'ListingDetail'>>();
  const route = useRoute<RouteProp<DashboardRootStackParamList, 'ListingDetail'>>();
  const { getTripById, removeTrip, refreshTrips } = useTrips();

  const cached = getTripById(route.params.tripId);
  const [trip, setTrip] = React.useState<Trip | null>(cached ?? null);
  const [loading, setLoading] = React.useState(!cached);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [tab, setTab] = React.useState<DetailTab>('overview');
  const [descriptionExpanded, setDescriptionExpanded] = React.useState(false);
  const [confirmRemove, setConfirmRemove] = React.useState(false);
  const [removing, setRemoving] = React.useState(false);
  const [removeError, setRemoveError] = React.useState<string | null>(null);
  const [infoMessage, setInfoMessage] = React.useState<string | null>(null);

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

  if (loading) {
    return (
      <View style={[styles.root, styles.centered, { paddingTop: insets.top }]}>
        <FocusAwareStatusBar style="dark" />
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!trip || loadError) {
    return (
      <View
        style={[
          styles.root,
          styles.centered,
          { paddingTop: insets.top + spacing.lg, paddingBottom: insets.bottom + spacing.lg },
        ]}
      >
        <FocusAwareStatusBar style="dark" />
        <AppText style={styles.errorText}>
          {loadError ?? t('dashboard.listings.detail.notFound')}
        </AppText>
        <Button label={t('common.ok')} onPress={() => navigation.goBack()} />
      </View>
    );
  }

  const fromCity = cityDisplayName(trip.departureCity.label);
  const toCity = cityDisplayName(trip.arrivalCity.label);
  const listingLabel =
    trip.listingType === 'auction'
      ? t('trips.create.listingAuction')
      : t('trips.create.listingRfq');
  const classLabel = trip.vehicleClass
    ? t(
        VEHICLE_CLASS_OPTIONS.find((item) => item.id === trip.vehicleClass)?.labelKey ??
          'vehicles.classPlaceholder',
      )
    : t('trips.create.previewVehicle');
  const seatsLabel =
    trip.vehicleTotalSeats != null
      ? t('vehicles.seatsCount', { count: trip.vehicleTotalSeats })
      : null;
  const modeLabel =
    trip.vehicleMode === 'fullPrivate'
      ? t('trips.create.vehicleModeFullPrivate')
      : t('trips.create.vehicleModeShared');
  const dateRange = formatDateRange(trip.departureAt, trip.arrivalAt, i18n.language);
  const timeLabel = `${formatTimeLabel(trip.departureAt, i18n.language)} – ${formatTimeLabel(trip.arrivalAt, i18n.language)}`;
  const expiresIn = formatExpiresIn(trip.publishedAt, trip.durationHours);
  const isLive = Boolean(expiresIn);
  const paymentLabel =
    trip.paymentMethod === 'online'
      ? t('trips.create.paymentOnline')
      : trip.paymentMethod === 'cash'
        ? t('trips.create.paymentCash')
        : `${t('trips.create.paymentCash')}, ${t('trips.create.paymentOnline')}`;
  const description = t('dashboard.listings.detail.descriptionBody', {
    from: fromCity,
    to: toCity,
    vehicle: trip.vehicleTitle ?? classLabel,
    mode: modeLabel,
  });

  const tabs: Array<{ id: DetailTab; label: string }> = [
    { id: 'overview', label: t('dashboard.listings.detail.tabs.overview') },
    { id: 'responses', label: t('dashboard.listings.detail.tabs.responses', { count: 0 }) },
    { id: 'activity', label: t('dashboard.listings.detail.tabs.activity') },
    { id: 'manage', label: t('dashboard.listings.detail.tabs.manage') },
  ];

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <FocusAwareStatusBar style="dark" />

      <View style={styles.topBar}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          hitSlop={8}
          accessibilityRole="button"
        >
          <FontAwesome name="chevron-left" size={16} color={colors.text.primary} />
        </Pressable>
        <AppText weight="bold" style={styles.topTitle}>
          {t('dashboard.listings.detail.title')}
        </AppText>
        <View style={styles.backButton} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + spacing.md },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.summaryCard}>
          <View style={styles.badgeRow}>
            <View style={styles.rfqBadge}>
              <AppText weight="semibold" style={styles.rfqBadgeText}>
                {listingLabel}
              </AppText>
            </View>
            <View style={[styles.liveBadge, !isLive && styles.endedBadge]}>
              <AppText weight="semibold" style={[styles.liveBadgeText, !isLive && styles.endedBadgeText]}>
                {isLive
                  ? t('dashboard.listings.detail.statusLive')
                  : t('dashboard.listings.detail.statusEnded')}
              </AppText>
            </View>
          </View>

          <View style={styles.summaryBody}>
            <View style={styles.summaryThumb}>
              {trip.vehiclePhotoUrl ? (
                <Image
                  source={{ uri: trip.vehiclePhotoUrl }}
                  style={styles.summaryThumbImage}
                  contentFit="cover"
                />
              ) : (
                <View style={styles.summaryThumbFallback}>
                  <FontAwesome name="car" size={18} color={colors.text.tertiary} />
                </View>
              )}
            </View>

            <View style={styles.summaryCopy}>
              <AppText weight="bold" style={styles.summaryRoute} numberOfLines={2}>
                {`${fromCity} → ${toCity}`}
              </AppText>
              <AppText style={styles.summaryMeta} numberOfLines={1}>
                {dateRange}
              </AppText>
              <View style={styles.summaryVehicleRow}>
                <FontAwesome
                  name={trip.vehicleMode === 'fullPrivate' ? 'lock' : 'users'}
                  size={12}
                  color={colors.text.tertiary}
                />
                <AppText style={styles.summaryMeta} numberOfLines={1}>
                  {modeLabel}
                </AppText>
              </View>
              <View style={styles.summaryVehicleRow}>
                <FontAwesome5 name="shuttle-van" size={12} color={colors.text.tertiary} />
                <AppText style={styles.summaryMeta} numberOfLines={1}>
                  {[classLabel, seatsLabel].filter(Boolean).join(' · ')}
                </AppText>
              </View>
            </View>

            {trip.startingPrice ? (
              <View style={styles.summaryPrice}>
                <AppText weight="bold" style={styles.summaryPriceAmount} numberOfLines={1}>
                  {trip.startingPrice}
                </AppText>
                <AppText style={styles.summaryPriceSuffix}>
                  {t('dashboard.listings.pricePerSeatSuffix')}
                </AppText>
              </View>
            ) : null}
          </View>
        </View>

        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <FontAwesome name="user" size={12} color={colors.text.tertiary} />
            <AppText style={styles.statLabel}>{t('dashboard.listings.detail.stats.responses')}</AppText>
            <AppText weight="bold" style={styles.statValue}>
              0
            </AppText>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <FontAwesome name="eye" size={12} color={colors.text.tertiary} />
            <AppText style={styles.statLabel}>{t('dashboard.listings.detail.stats.views')}</AppText>
            <AppText weight="bold" style={styles.statValue}>
              0
            </AppText>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <FontAwesome name="clock-o" size={12} color={colors.text.tertiary} />
            <AppText style={styles.statLabel}>{t('dashboard.listings.detail.stats.expiresIn')}</AppText>
            <AppText weight="bold" style={[styles.statValue, isLive && styles.statValueAlert]}>
              {expiresIn ?? t('dashboard.listings.detail.statusEnded')}
            </AppText>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <FontAwesome name="cloud-upload" size={12} color={colors.text.tertiary} />
            <AppText style={styles.statLabel}>{t('dashboard.listings.detail.stats.status')}</AppText>
            <AppText weight="bold" style={[styles.statValue, isLive ? styles.statValueLive : null]}>
              {isLive
                ? t('dashboard.listings.detail.statusLive')
                : t('dashboard.listings.detail.statusEnded')}
            </AppText>
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsRow}
        >
          {tabs.map((item) => {
            const active = tab === item.id;
            return (
              <Pressable
                key={item.id}
                onPress={() => setTab(item.id)}
                style={[styles.tab, active && styles.tabActive]}
              >
                <AppText
                  weight={active ? 'bold' : 'medium'}
                  style={[styles.tabLabel, active && styles.tabLabelActive]}
                >
                  {item.label}
                </AppText>
              </Pressable>
            );
          })}
        </ScrollView>

        {tab === 'overview' ? (
          <>
            <View style={styles.sectionCard}>
              <TripDetailRow
                icon="map-marker"
                label={t('trips.create.departurePoint')}
                value={trip.departurePoint.label}
              />
              <View style={styles.rowDivider} />
              <TripDetailRow
                icon="flag"
                label={t('trips.create.arrivalPoint')}
                value={trip.arrivalPoint.label}
              />
              <View style={styles.rowDivider} />
              <TripDetailRow
                icon="calendar"
                label={t('trips.create.date')}
                value={dateRange}
              />
              <View style={styles.rowDivider} />
              <TripDetailRow
                icon="clock-o"
                label={t('trips.create.time')}
                value={timeLabel}
              />
              <View style={styles.rowDivider} />
              <TripDetailRow
                icon="car"
                label={t('vehicles.fields.class')}
                value={classLabel}
              />
              <View style={styles.rowDivider} />
              <TripDetailRow
                icon="exchange"
                label={t('trips.create.vehicleModeLabel')}
                value={modeLabel}
              />
              {seatsLabel ? (
                <>
                  <View style={styles.rowDivider} />
                  <TripDetailRow
                    icon="users"
                    label={t('vehicles.fields.totalSeats')}
                    value={seatsLabel}
                  />
                </>
              ) : null}
            </View>

            <View style={styles.sectionCard}>
              <AppText weight="bold" style={styles.sectionTitle}>
                {t('dashboard.listings.detail.description')}
              </AppText>
              <AppText
                style={styles.descriptionText}
                numberOfLines={descriptionExpanded ? undefined : 3}
              >
                {description}
              </AppText>
              <Pressable
                onPress={() => setDescriptionExpanded((current) => !current)}
                style={styles.showMore}
                hitSlop={8}
              >
                <AppText weight="semibold" style={styles.showMoreText}>
                  {descriptionExpanded
                    ? t('dashboard.listings.detail.showLess')
                    : t('dashboard.listings.detail.showMore')}
                </AppText>
                <FontAwesome
                  name={descriptionExpanded ? 'chevron-up' : 'chevron-down'}
                  size={10}
                  color={colors.primary}
                />
              </Pressable>
            </View>

            <View style={styles.sectionCard}>
              <AppText weight="bold" style={styles.sectionTitle}>
                {t('dashboard.listings.detail.paymentTerms')}
              </AppText>
              <AppText style={styles.descriptionText}>{paymentLabel}</AppText>
            </View>
          </>
        ) : tab === 'manage' ? (
          <View style={styles.sectionCard}>
            <AppText weight="bold" style={styles.sectionTitle}>
              {t('dashboard.listings.detail.tabs.manage')}
            </AppText>
            <AppText style={styles.descriptionText}>
              {t('dashboard.listings.detail.manageHint')}
            </AppText>
            <Button
              label={t('dashboard.listings.remove.confirmAction')}
              variant="secondary"
              onPress={() => {
                setRemoveError(null);
                setConfirmRemove(true);
              }}
            />
          </View>
        ) : (
          <View style={styles.emptyTabCard}>
            <AppText weight="semibold" style={styles.emptyTabTitle}>
              {t('dashboard.listings.detail.comingSoonTitle')}
            </AppText>
            <AppText style={styles.emptyTabBody}>
              {t('dashboard.listings.detail.comingSoonBody')}
            </AppText>
          </View>
        )}

        <View style={styles.actionsRow}>
          <Pressable
            onPress={() => {
              setRemoveError(null);
              setConfirmRemove(true);
            }}
            style={styles.removeButton}
          >
            <FontAwesome name="trash-o" size={14} color={colors.primary} />
            <AppText weight="bold" style={styles.removeButtonText}>
              {t('dashboard.listings.remove.confirmAction')}
            </AppText>
          </Pressable>
          <Pressable
            onPress={() => setInfoMessage(t('dashboard.listings.detail.editComingSoon'))}
            style={styles.editButton}
          >
            <AppText weight="bold" style={styles.editButtonText}>
              {t('dashboard.listings.detail.edit')}
            </AppText>
          </Pressable>
        </View>
      </ScrollView>

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

      <AppDialog
        visible={infoMessage !== null}
        icon="info"
        title={t('dashboard.listings.detail.edit')}
        message={infoMessage ?? undefined}
        confirmAction={{
          label: t('common.ok'),
          onPress: () => setInfoMessage(null),
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background.canvas,
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  errorText: {
    fontSize: 13,
    color: colors.primary,
    textAlign: 'center',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  backButton: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topTitle: {
    fontSize: 16,
    color: colors.text.primary,
  },
  content: {
    paddingHorizontal: spacing.md,
    gap: spacing.xs,
  },
  summaryCard: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border.default,
    borderRadius: radius.md,
    backgroundColor: colors.white,
    padding: spacing.sm,
    gap: spacing.xs,
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rfqBadge: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: radius.sm,
    backgroundColor: colors.accent.purple.soft,
  },
  rfqBadgeText: {
    fontSize: 10,
    color: colors.accent.purple.text,
    textTransform: 'uppercase',
  },
  liveBadge: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: radius.sm,
    backgroundColor: colors.accent.green.soft,
  },
  liveBadgeText: {
    fontSize: 10,
    color: colors.accent.green.text,
  },
  endedBadge: {
    backgroundColor: colors.background.subtle,
  },
  endedBadgeText: {
    color: colors.text.secondary,
  },
  summaryBody: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  summaryThumb: {
    width: 64,
    height: 64,
    borderRadius: radius.sm,
    overflow: 'hidden',
    backgroundColor: colors.background.subtle,
  },
  summaryThumbImage: {
    width: '100%',
    height: '100%',
  },
  summaryThumbFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  summaryRoute: {
    fontSize: 15,
    color: colors.text.primary,
  },
  summaryMeta: {
    fontSize: 12,
    color: colors.text.tertiary,
  },
  summaryVehicleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  summaryPrice: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 3,
    flexShrink: 0,
  },
  summaryPriceAmount: {
    fontSize: 15,
    color: colors.text.primary,
  },
  summaryPriceSuffix: {
    fontSize: 12,
    color: colors.text.tertiary,
  },
  statsCard: {
    flexDirection: 'row',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border.default,
    borderRadius: radius.md,
    backgroundColor: colors.white,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.xxs,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  statDivider: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: colors.border.default,
    marginVertical: 2,
  },
  statLabel: {
    fontSize: 10,
    color: colors.text.tertiary,
    textAlign: 'center',
  },
  statValue: {
    fontSize: 12,
    color: colors.text.primary,
    textAlign: 'center',
  },
  statValueAlert: {
    color: colors.primary,
  },
  statValueLive: {
    color: colors.accent.green.text,
  },
  tabsRow: {
    gap: spacing.md,
    paddingVertical: 2,
  },
  tab: {
    paddingBottom: 6,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: colors.primary,
  },
  tabLabel: {
    fontSize: 13,
    color: colors.text.tertiary,
  },
  tabLabelActive: {
    color: colors.primary,
  },
  sectionCard: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border.default,
    borderRadius: radius.md,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    gap: spacing.xs,
  },
  sectionTitle: {
    fontSize: 14,
    color: colors.text.primary,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    paddingVertical: 6,
  },
  detailIcon: {
    width: 16,
    marginTop: 1,
  },
  detailCopy: {
    flex: 1,
    minWidth: 0,
    gap: 1,
  },
  detailLabel: {
    fontSize: 11,
    color: colors.text.tertiary,
  },
  detailValue: {
    fontSize: 13,
    lineHeight: 16,
    color: colors.text.primary,
  },
  rowDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border.default,
  },
  descriptionText: {
    fontSize: 13,
    lineHeight: 16,
    color: colors.text.secondary,
  },
  showMore: {
    alignSelf: 'flex-end',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  showMoreText: {
    fontSize: 12,
    color: colors.primary,
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
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
  removeButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.primary,
    backgroundColor: colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xxs,
  },
  removeButtonText: {
    fontSize: 14,
    color: colors.primary,
  },
  editButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editButtonText: {
    fontSize: 14,
    color: colors.white,
  },
});
