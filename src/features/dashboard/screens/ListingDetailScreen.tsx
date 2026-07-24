import React from 'react';
import { FontAwesome } from '@expo/vector-icons';
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
import { useTranslation } from 'react-i18next';

import { AuthScaffold } from '@/features/auth/components/AuthScaffold';
import { i18n as appI18n } from '@/i18n';
import { getErrorMessage } from '@/services/api/errorMessage';
import { tripApi } from '@/services/api/tripApi';
import { AppDialog } from '@/shared/components/AppDialog';
import { AppText } from '@/shared/components/AppText';
import { Button } from '@/shared/components/Button';
import { cityDisplayName } from '@/shared/utils/city-display-name';
import { colors, radius, spacing } from '@/theme';

import { VEHICLE_CLASS_OPTIONS } from '../constants/vehicleClasses';
import { useTrips } from '../context/TripContext';
import type { DashboardRootStackParamList } from '../navigation/dashboardRootTypes';
import type { Trip } from '../types/trip.types';
import { mapTripDtoToTrip } from '../utils/trip.mapper';

type DetailTab = 'overview' | 'responses' | 'activity' | 'manage';

function formatDateTime(iso: string, locale: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return 'â€”';
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

function formatDurationLabel(
  hours: number,
  t: (key: string, options?: Record<string, unknown>) => string,
): string {
  const wholeHours = Math.floor(hours);
  const minutes = Math.round((hours - wholeHours) * 60);

  if (minutes === 0) {
    return t('trips.create.durationValue', { count: wholeHours });
  }
  if (wholeHours === 0) {
    return t('trips.create.durationMinutesOnly', { count: minutes });
  }
  return t('trips.create.durationHoursMinutes', {
    hours: wholeHours,
    minutes,
  });
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
  onEdit?: () => void;
  editA11yLabel: string;
};

function SectionHeader({
  icon,
  title,
  subtitle,
  onEdit,
  editA11yLabel,
}: SectionHeaderProps): React.ReactElement {
  return (
    <View style={styles.cardHeader}>
      <SectionIcon name={icon} />
      <View style={styles.cardHeaderCopy}>
        {subtitle ? <AppText style={styles.eyebrow}>{subtitle}</AppText> : null}
        <AppText weight="bold" style={styles.sectionTitle}>
          {title}
        </AppText>
      </View>
      {onEdit ? (
        <Pressable
          onPress={onEdit}
          style={styles.editIconButton}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={editA11yLabel}
        >
          <FontAwesome name="pencil" size={14} color={colors.primary} />
        </Pressable>
      ) : null}
    </View>
  );
}

type FeatureChipProps = {
  icon: React.ReactNode;
  label: string;
  showDivider?: boolean;
};

function FeatureChip({ icon, label, showDivider = false }: FeatureChipProps): React.ReactElement {
  return (
    <View style={styles.featureChip}>
      {showDivider ? <View style={styles.featureDivider} /> : null}
      <View style={styles.featureInner}>
        {icon}
        <AppText weight="semibold" style={styles.featureLabel} numberOfLines={1}>
          {label}
        </AppText>
      </View>
    </View>
  );
}

type ListingCellProps = {
  icon: React.ReactNode;
  label: string;
  value: string;
};

function ListingCell({ icon, label, value }: ListingCellProps): React.ReactElement {
  return (
    <View style={styles.listingCell}>
      <View style={styles.listingIconWrap}>{icon}</View>
      <View style={styles.listingCopy}>
        <AppText style={styles.listingLabel}>{label}</AppText>
        <AppText weight="bold" style={styles.listingValue}>
          {value}
        </AppText>
      </View>
    </View>
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
    : 'â€”';
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
  const expiresIn = formatExpiresIn(trip.publishedAt, trip.durationHours);
  const isLive = Boolean(expiresIn);
  const paymentLabel =
    trip.paymentMethod === 'online'
      ? t('trips.create.paymentOnline')
      : t('trips.create.paymentCash');
  const startLabel =
    trip.startMode === 'instant'
      ? t('trips.create.startInstant')
      : formatDateTime(trip.scheduledStartAt ?? trip.publishedAt, i18n.language);
  const priceLabel = trip.startingPrice ?? t('trips.create.notSpecified');
  const locale = i18n.language;
  const vehicleTitle = trip.vehicleTitle ?? classLabel;
  const editA11y = t('dashboard.listings.detail.edit');
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
    { id: 'activity', label: t('dashboard.listings.detail.tabs.activity') },
    { id: 'manage', label: t('dashboard.listings.detail.tabs.manage') },
  ];

  const openEdit = () => setInfoMessage(t('dashboard.listings.detail.editComingSoon'));
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
        <View style={styles.summaryCard}>
          <View style={styles.badgeRow}>
            <View style={styles.rfqBadge}>
              <AppText weight="semibold" style={styles.rfqBadgeText}>
                {listingLabel}
              </AppText>
            </View>
            <View style={[styles.liveBadge, !isLive && styles.endedBadge]}>
              <AppText
                weight="semibold"
                style={[styles.liveBadgeText, !isLive && styles.endedBadgeText]}
              >
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
                {`${fromCity} â†’ ${toCity}`}
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
                <FontAwesome name="car" size={12} color={colors.text.tertiary} />
                <AppText style={styles.summaryMeta} numberOfLines={1}>
                  {[classLabel, seatsLabel].filter(Boolean).join(' Â· ')}
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
            <AppText style={styles.statLabel}>
              {t('dashboard.listings.detail.stats.responses')}
            </AppText>
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
            <AppText style={styles.statLabel}>
              {t('dashboard.listings.detail.stats.expiresIn')}
            </AppText>
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
            <View style={styles.card}>
              <SectionHeader
                icon="car"
                subtitle={t('trips.create.vehicleTitle')}
                title={vehicleTitle}
                onEdit={openEdit}
                editA11yLabel={editA11y}
              />
              <View style={styles.vehicleBody}>
                <View style={styles.vehicleCopy}>
                  <View style={styles.featuresRow}>
                    <FeatureChip
                      icon={
                        <FontAwesome name="user" size={11} color={colors.text.secondary} />
                      }
                      label={seatsLabel ?? 'â€”'}
                    />
                    {classLabel ? (
                      <FeatureChip
                        showDivider
                        icon={
                          <FontAwesome name="car" size={11} color={colors.text.secondary} />
                        }
                        label={classLabel}
                      />
                    ) : null}
                  </View>
                </View>
                <View style={styles.vehicleThumb}>
                  {trip.vehiclePhotoUrl ? (
                    <Image
                      source={{ uri: trip.vehiclePhotoUrl }}
                      style={styles.vehicleThumbImage}
                      contentFit="cover"
                    />
                  ) : (
                    <View style={styles.vehicleThumbFallback}>
                      <FontAwesome name="car" size={22} color={colors.text.tertiary} />
                    </View>
                  )}
                </View>
              </View>
            </View>

            <View style={styles.card}>
              <SectionHeader
                icon="exchange"
                subtitle={t('trips.create.vehicleModeTitle')}
                title={modeLabel}
                onEdit={openEdit}
                editA11yLabel={editA11y}
              />
            </View>

            <View style={styles.card}>
              <SectionHeader
                icon="map-marker"
                title={t('trips.create.detailsTitle')}
                onEdit={openEdit}
                editA11yLabel={editA11y}
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
                            {t('trips.create.departureDateTime')}
                          </AppText>
                          <AppText weight="semibold" style={styles.whenValue}>
                            {formatDateTime(trip.departureAt, locale)}
                          </AppText>
                        </View>
                      </View>
                    </View>
                    <View style={styles.pointRow}>
                      <FontAwesome name="map-marker" size={12} color={colors.primary} />
                      <View style={styles.pointCopy}>
                        <AppText style={styles.eyebrow}>{t('trips.create.pickupPoint')}</AppText>
                        <AppText weight="medium" style={styles.pointValue}>
                          {trip.departurePoint?.label ?? 'â€”'}
                        </AppText>
                      </View>
                    </View>
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
                    <View style={styles.pointRow}>
                      <FontAwesome name="map-marker" size={12} color={colors.primary} />
                      <View style={styles.pointCopy}>
                        <AppText style={styles.eyebrow}>{t('trips.create.dropoffPoint')}</AppText>
                        <AppText weight="medium" style={styles.pointValue}>
                          {trip.arrivalPoint?.label ?? 'â€”'}
                        </AppText>
                      </View>
                    </View>
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.card}>
              <SectionHeader
                icon="tag"
                title={t('trips.create.listingTitle')}
                onEdit={openEdit}
                editA11yLabel={editA11y}
              />

              <View style={styles.listingGrid}>
                <View style={styles.listingRow}>
                  <ListingCell
                    icon={<FontAwesome name="list-ul" size={13} color={colors.primary} />}
                    label={t('trips.create.listingTypeLabel')}
                    value={listingLabel}
                  />
                  <ListingCell
                    icon={<FontAwesome name="dollar" size={13} color={colors.primary} />}
                    label={t('trips.create.startingPrice')}
                    value={priceLabel}
                  />
                </View>
                <View style={styles.listingDivider} />
                <View style={styles.listingRow}>
                  <ListingCell
                    icon={<FontAwesome name="credit-card" size={13} color={colors.primary} />}
                    label={t('trips.create.paymentMethodLabel')}
                    value={paymentLabel}
                  />
                  <ListingCell
                    icon={<FontAwesome name="clock-o" size={13} color={colors.primary} />}
                    label={t('trips.create.durationLabel')}
                    value={formatDurationLabel(trip.durationHours, t)}
                  />
                </View>
              </View>
            </View>

            <View style={styles.card}>
              <SectionHeader
                icon="play-circle"
                subtitle={t('trips.create.scheduleTitle')}
                title={startLabel}
                onEdit={openEdit}
                editA11yLabel={editA11y}
              />
            </View>

            <View style={styles.card}>
              <SectionHeader
                icon="align-left"
                title={t('dashboard.listings.detail.description')}
                onEdit={openEdit}
                editA11yLabel={editA11y}
              />
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
          </>
        ) : tab === 'manage' ? (
          <View style={styles.card}>
            <AppText weight="bold" style={styles.sectionTitle}>
              {t('dashboard.listings.detail.tabs.manage')}
            </AppText>
            <AppText style={styles.descriptionText}>
              {t('dashboard.listings.detail.manageHint')}
            </AppText>
            <Button
              label={t('dashboard.listings.remove.confirmAction')}
              variant="secondary"
              onPress={openRemove}
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
  editIconButton: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vehicleBody: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  vehicleCopy: {
    flex: 1,
    minWidth: 0,
  },
  featuresRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  featureChip: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureDivider: {
    width: StyleSheet.hairlineWidth,
    height: 14,
    backgroundColor: colors.border.default,
    marginRight: spacing.xs,
  },
  featureInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  featureLabel: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  vehicleThumb: {
    width: 72,
    height: 56,
    borderRadius: radius.sm,
    overflow: 'hidden',
    backgroundColor: colors.background.subtle,
  },
  vehicleThumbImage: {
    width: '100%',
    height: '100%',
  },
  vehicleThumbFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
  },
  pointCopy: {
    flex: 1,
    minWidth: 0,
    gap: 1,
  },
  pointValue: {
    fontSize: 13,
    color: colors.text.primary,
    lineHeight: 18,
  },
  listingGrid: {
    gap: 0,
  },
  listingRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  listingDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border.default,
    marginVertical: spacing.sm,
  },
  listingCell: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
    minWidth: 0,
  },
  listingIconWrap: {
    width: 18,
    alignItems: 'center',
    marginTop: 2,
  },
  listingCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  listingLabel: {
    fontSize: 11,
    color: colors.text.tertiary,
  },
  listingValue: {
    fontSize: 14,
    color: colors.text.primary,
    lineHeight: 18,
  },
  descriptionText: {
    fontSize: 13,
    lineHeight: 18,
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
