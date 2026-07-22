import React from 'react';
import { FontAwesome } from '@expo/vector-icons';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { i18n as appI18n } from '@/i18n';
import { getErrorMessage } from '@/services/api/errorMessage';
import { AppDialog } from '@/shared/components/AppDialog';
import { AppText } from '@/shared/components/AppText';
import { Button } from '@/shared/components/Button';
import { FocusAwareStatusBar } from '@/shared/components/FocusAwareStatusBar';
import { colors, radius, spacing } from '@/theme';

import { useDashboardSession } from '../context/DashboardSessionContext';
import { useTrips } from '../context/TripContext';
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
  onRemovePress: () => void;
};

function TripListItem({ trip, onRemovePress }: TripListItemProps): React.ReactElement {
  const { t } = useTranslation(undefined, { i18n: appI18n });

  const listingLabel =
    trip.listingType === 'auction'
      ? t('trips.create.listingAuction')
      : t('trips.create.listingRfq');
  const modeLabel =
    trip.vehicleMode === 'fullPrivate'
      ? t('trips.create.vehicleModeFullPrivate')
      : t('trips.create.vehicleModeShared');

  return (
    <View style={styles.item}>
      <View style={styles.itemBody}>
        <View style={styles.routeRow}>
          <AppText weight="semibold" style={styles.city} numberOfLines={1}>
            {trip.departureCity.label}
          </AppText>
          <FontAwesome name="long-arrow-right" size={12} color={colors.text.tertiary} />
          <AppText weight="semibold" style={styles.city} numberOfLines={1}>
            {trip.arrivalCity.label}
          </AppText>
        </View>
        <AppText style={styles.meta} numberOfLines={1}>
          {formatTripWhen(trip.departureAt)}
        </AppText>
        <AppText style={styles.meta} numberOfLines={1}>
          {[
            trip.vehicleTitle ?? t('trips.create.previewVehicle'),
            listingLabel,
            modeLabel,
          ].join(' · ')}
        </AppText>
        {trip.startingPrice ? (
          <AppText style={styles.price}>
            {t('dashboard.listings.startingPrice', { price: trip.startingPrice })}
          </AppText>
        ) : null}
      </View>
      <Pressable
        onPress={onRemovePress}
        style={styles.removeButton}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={t('dashboard.listings.remove.a11y')}
      >
        <FontAwesome name="trash-o" size={16} color={colors.primary} />
      </Pressable>
    </View>
  );
}

export function MyListingsScreen(): React.ReactElement {
  const { t } = useTranslation(undefined, { i18n: appI18n });
  const insets = useSafeAreaInsets();
  const { user } = useDashboardSession();
  const {
    trips,
    isLoading,
    loadError,
    refreshTrips,
    removeTrip,
  } = useTrips();

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
        <AppText style={styles.subtitle}>
          {t('dashboard.listings.passengerHint')}
        </AppText>
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
          <AppText style={styles.subtitle}>
            {t('dashboard.listings.emptySubtitle')}
          </AppText>
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
                from: tripToRemove.departureCity.label,
                to: tripToRemove.arrivalCity.label,
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
    padding: spacing.md,
  },
  itemBody: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  city: {
    flexShrink: 1,
    fontSize: 15,
    color: colors.text.primary,
  },
  meta: {
    fontSize: 12,
    color: colors.text.tertiary,
  },
  price: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: 2,
  },
  removeButton: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
  },
});
