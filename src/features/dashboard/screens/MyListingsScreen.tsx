import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';

import { AuthScaffold } from '@/features/auth/components/AuthScaffold';
import { i18n as appI18n } from '@/i18n';
import { getErrorMessage } from '@/services/api/errorMessage';
import { AppDialog } from '@/shared/components/AppDialog';
import { AppText } from '@/shared/components/AppText';
import { Button } from '@/shared/components/Button';
import { cityDisplayName } from '@/shared/utils/city-display-name';
import { colors, spacing } from '@/theme';

import { ListingCard } from '../components/ListingCard';
import { useDashboardSession } from '../context/DashboardSessionContext';
import { useTrips } from '../context/TripContext';
import type { DashboardRootStackParamList } from '../navigation/dashboardRootTypes';
import type { Trip } from '../types/trip.types';

export function MyListingsScreen(): React.ReactElement {
  const { t } = useTranslation(undefined, { i18n: appI18n });
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
      <AuthScaffold
        title={t('dashboard.listings.title')}
        subtitle={t('dashboard.listings.passengerHint')}
        showLegalFooter={false}
        showLanguageSwitcher={false}
        compactHeader
      >
        <View style={styles.centered}>
          <AppText style={styles.hintBody}>{t('dashboard.listings.passengerHint')}</AppText>
        </View>
      </AuthScaffold>
    );
  }

  return (
    <AuthScaffold
      title={t('dashboard.listings.title')}
      subtitle={t('dashboard.listings.subtitle')}
      showLegalFooter={false}
      showLanguageSwitcher={false}
      compactHeader
    >
      {isLoading && trips.length === 0 ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : loadError && trips.length === 0 ? (
        <View style={styles.centered}>
          <AppText style={styles.errorText}>{loadError}</AppText>
          <Button
            label={t('dashboard.listings.retry')}
            onPress={() => {
              void refreshTrips().catch(() => undefined);
            }}
          />
        </View>
      ) : trips.length === 0 ? (
        <View style={styles.centered}>
          <AppText weight="semibold" style={styles.emptyTitle}>
            {t('dashboard.listings.emptyTitle')}
          </AppText>
          <AppText style={styles.emptySubtitle}>
            {t('dashboard.listings.emptySubtitle')}
          </AppText>
        </View>
      ) : (
        <View style={styles.list}>
          {trips.map((trip) => (
            <ListingCard
              key={trip.id}
              trip={trip}
              showPhotoCount={false}
              onPress={() => {
                navigation.navigate('ListingDetail', { tripId: trip.id });
              }}
              onRemovePress={() => {
                setRemoveError(null);
                setTripToRemove(trip);
              }}
            />
          ))}
        </View>
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
    </AuthScaffold>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: spacing.sm,
  },
  centered: {
    gap: spacing.md,
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  emptyTitle: {
    fontSize: 16,
    color: colors.text.primary,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  hintBody: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 13,
    color: colors.primary,
    textAlign: 'center',
  },
});
