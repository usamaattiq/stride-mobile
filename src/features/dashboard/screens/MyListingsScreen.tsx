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
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { i18n as appI18n } from '@/i18n';
import { getErrorMessage } from '@/services/api/errorMessage';
import { AppDialog } from '@/shared/components/AppDialog';
import { AppText } from '@/shared/components/AppText';
import { Button } from '@/shared/components/Button';
import { FocusAwareStatusBar } from '@/shared/components/FocusAwareStatusBar';
import { cityDisplayName } from '@/shared/utils/city-display-name';
import { colors, radius, spacing } from '@/theme';

import { VEHICLE_CLASS_OPTIONS } from '../constants/vehicleClasses';
import { useDashboardSession } from '../context/DashboardSessionContext';
import { useTrips } from '../context/TripContext';
import type { DashboardRootStackParamList } from '../navigation/dashboardRootTypes';
import type { Trip } from '../types/trip.types';

function formatTripWhen(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

type TripListItemProps = {
  trip: Trip;
  onPress: () => void;
  onRemovePress: () => void;
};

function TripListItem({ trip, onPress, onRemovePress }: TripListItemProps): React.ReactElement {
  const { t } = useTranslation(undefined, { i18n: appI18n });

  const fromCity = cityDisplayName(trip.departureCity.label);
  const toCity = cityDisplayName(trip.arrivalCity.label);

  const classLabel = trip.vehicleClass
    ? t(
        VEHICLE_CLASS_OPTIONS.find((item) => item.id === trip.vehicleClass)?.labelKey ??
          'vehicles.classPlaceholder',
      )
    : null;
  const seatsLabel =
    trip.vehicleTotalSeats != null
      ? t('vehicles.seatsCount', { count: trip.vehicleTotalSeats })
      : null;
  const vehicleMeta = [classLabel, seatsLabel].filter(Boolean).join(' · ');

  return (
    <Pressable
      onPress={onPress}
      style={styles.item}
      accessibilityRole="button"
      accessibilityLabel={`${fromCity} to ${toCity}`}
    >
      <View style={styles.thumbnail}>
        {trip.vehiclePhotoUrl ? (
          <Image
            source={{ uri: trip.vehiclePhotoUrl }}
            style={styles.thumbnailImage}
            contentFit="cover"
          />
        ) : (
          <View style={styles.thumbnailFallback}>
            <FontAwesome name="car" size={16} color={colors.text.tertiary} />
          </View>
        )}
      </View>

      <View style={styles.itemBody}>
        <View style={styles.itemTopRow}>
          <AppText weight="bold" style={styles.route} numberOfLines={1}>
            {`${fromCity} → ${toCity}`}
          </AppText>
          <Pressable
            onPress={onRemovePress}
            style={styles.removeButton}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={t('dashboard.listings.remove.a11y')}
          >
            <FontAwesome name="trash-o" size={14} color={colors.primary} />
          </Pressable>
        </View>

        <AppText style={styles.meta} numberOfLines={1}>
          {formatTripWhen(trip.departureAt)}
        </AppText>

        <View style={styles.bottomRow}>
          {vehicleMeta ? (
            <View style={styles.vehicleMetaRow}>
              <FontAwesome name="calendar" size={11} color={colors.text.tertiary} />
              <AppText style={styles.meta} numberOfLines={1}>
                {vehicleMeta}
              </AppText>
            </View>
          ) : (
            <View style={styles.vehicleMetaRow} />
          )}
          {trip.startingPrice ? (
            <View style={styles.priceRow}>
              <AppText weight="bold" style={styles.priceAmount}>
                {trip.startingPrice}
              </AppText>
              <AppText style={styles.priceSuffix}>
                {t('dashboard.listings.pricePerSeatSuffix')}
              </AppText>
            </View>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

export function MyListingsScreen(): React.ReactElement {
  const { t } = useTranslation(undefined, { i18n: appI18n });
  const insets = useSafeAreaInsets();
  const navigation =
    useNavigation<NativeStackNavigationProp<DashboardRootStackParamList>>();
  const { user } = useDashboardSession();
  const { trips, isLoading, loadError, refreshTrips, removeTrip } = useTrips();

  const [tripToRemove, setTripToRemove] = React.useState<Trip | null>(null);
  const [removing, setRemoving] = React.useState(false);
  const [removeError, setRemoveError] = React.useState<string | null>(null);

  useFocusEffect(
    React.useCallback(() => {
      if (user.role !== 'driver') {
        return;
      }
      void refreshTrips().catch(() => undefined);
    }, [refreshTrips, user.role]),
  );

  const handleConfirmRemove = () => {
    if (!tripToRemove || removing) {
      return;
    }
    setRemoving(true);
    setRemoveError(null);
    void removeTrip(tripToRemove.id)
      .then(() => {
        setTripToRemove(null);
      })
      .catch((error) => {
        setRemoveError(getErrorMessage(error, t('dashboard.listings.remove.failed')));
      })
      .finally(() => {
        setRemoving(false);
      });
  };

  if (user.role !== 'driver') {
    return (
      <View
        style={[
          styles.root,
          styles.centered,
          {
            paddingTop: insets.top + spacing.xl,
            paddingBottom: insets.bottom + spacing.xl,
          },
        ]}
      >
        <FocusAwareStatusBar style="dark" />
        <AppText weight="bold" style={styles.title}>
          {t('dashboard.listings.title')}
        </AppText>
        <AppText style={styles.subtitle}>{t('dashboard.listings.passengerHint')}</AppText>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.root,
        {
          paddingTop: insets.top + spacing.md,
          paddingBottom: insets.bottom + spacing.md,
        },
      ]}
    >
      <FocusAwareStatusBar style="dark" />
      <View style={styles.header}>
        <AppText weight="bold" style={styles.title}>
          {t('dashboard.listings.title')}
        </AppText>
        <AppText style={styles.subtitle}>{t('dashboard.listings.subtitle')}</AppText>
      </View>

      {isLoading && trips.length === 0 ? (
        <View style={styles.centeredBody}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : loadError && trips.length === 0 ? (
        <View style={styles.centeredBody}>
          <AppText style={styles.errorText}>{loadError}</AppText>
          <Button
            label={t('dashboard.listings.retry')}
            onPress={() => {
              void refreshTrips().catch(() => undefined);
            }}
          />
        </View>
      ) : trips.length === 0 ? (
        <View style={styles.centeredBody}>
          <AppText weight="semibold" style={styles.emptyTitle}>
            {t('dashboard.listings.emptyTitle')}
          </AppText>
          <AppText style={styles.subtitle}>{t('dashboard.listings.emptySubtitle')}</AppText>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        >
          {trips.map((trip) => (
            <TripListItem
              key={trip.id}
              trip={trip}
              onPress={() => {
                navigation.navigate('ListingDetail', { tripId: trip.id });
              }}
              onRemovePress={() => {
                setRemoveError(null);
                setTripToRemove(trip);
              }}
            />
          ))}
        </ScrollView>
      )}

      <AppDialog
        visible={tripToRemove !== null}
        icon="trash"
        title={t('dashboard.listings.remove.title')}
        message={
          removeError ??
          (tripToRemove
            ? t('dashboard.listings.remove.confirm', {
                from: cityDisplayName(tripToRemove.departureCity.label),
                to: cityDisplayName(tripToRemove.arrivalCity.label),
              })
            : undefined)
        }
        cancelAction={{
          label: t('common.cancel'),
          onPress: () => {
            if (removing) {
              return;
            }
            setTripToRemove(null);
            setRemoveError(null);
          },
        }}
        confirmAction={{
          label: t('dashboard.listings.remove.confirmAction'),
          onPress: handleConfirmRemove,
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background.canvas,
    paddingHorizontal: spacing.md,
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  header: {
    gap: 4,
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 24,
    color: colors.text.primary,
  },
  subtitle: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  centeredBody: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  emptyTitle: {
    fontSize: 16,
    color: colors.text.primary,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 13,
    color: colors.primary,
    textAlign: 'center',
  },
  listContent: {
    gap: spacing.sm,
    paddingBottom: spacing.lg,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border.default,
    backgroundColor: colors.white,
    padding: spacing.sm,
  },
  thumbnail: {
    width: 64,
    height: 64,
    borderRadius: radius.sm,
    overflow: 'hidden',
    backgroundColor: colors.background.subtle,
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  thumbnailFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemBody: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  itemTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  route: {
    flex: 1,
    fontSize: 15,
    color: colors.text.primary,
  },
  meta: {
    flexShrink: 1,
    fontSize: 12,
    color: colors.text.tertiary,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginTop: 4,
  },
  vehicleMetaRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minWidth: 0,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 3,
    flexShrink: 0,
  },
  priceAmount: {
    fontSize: 15,
    color: colors.text.primary,
  },
  priceSuffix: {
    fontSize: 12,
    color: colors.text.tertiary,
  },
  removeButton: {
    width: 28,
    height: 28,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
  },
});
