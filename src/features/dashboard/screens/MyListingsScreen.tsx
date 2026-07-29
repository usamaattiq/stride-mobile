import React from 'react';
import {
  FlatList,
  InteractionManager,
  StyleSheet,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';

import { AuthScaffold } from '@/features/auth/components/AuthScaffold';
import { i18n as appI18n } from '@/i18n';
import { getErrorMessage } from '@/services/api/errorMessage';
import { AppDialog } from '@/shared/components/AppDialog';
import { AppText } from '@/shared/components/AppText';
import { Button } from '@/shared/components/Button';
import { FocusAwareStatusBar } from '@/shared/components/FocusAwareStatusBar';
import { cityDisplayName } from '@/shared/utils/city-display-name';
import { colors, spacing } from '@/theme';

import { HomeHeader } from '../components/HomeHeader';
import { ListingCard } from '../components/ListingCard';
import { ListingCardSkeleton } from '../components/ListingCardSkeleton';
import { PassengerSearchPanel } from '../components/PassengerSearchPanel';
import { useDashboardSession } from '../context/DashboardSessionContext';
import { useTrips } from '../context/TripContext';
import type { DashboardRootStackParamList } from '../navigation/dashboardRootTypes';
import type { DashboardTabParamList } from '../navigation/types';
import type { Trip } from '../types/trip.types';

const SKELETON_COUNT = 4;

export function MyListingsScreen(): React.ReactElement {
  const { t } = useTranslation(undefined, { i18n: appI18n });
  const navigation =
    useNavigation<NativeStackNavigationProp<DashboardRootStackParamList>>();
  const tabNavigation =
    useNavigation<BottomTabNavigationProp<DashboardTabParamList, 'MyListings'>>();
  const { user } = useDashboardSession();
  const { trips, loadError, refreshTrips, removeTrip } = useTrips();

  const [tripToRemove, setTripToRemove] = React.useState<Trip | null>(null);
  const [removing, setRemoving] = React.useState(false);
  const [removeError, setRemoveError] = React.useState<string | null>(null);
  /** True from tab focus until the deferred fetch finishes — keeps the screen light. */
  const [isScreenLoading, setIsScreenLoading] = React.useState(user.role === 'driver');

  const roleLabel =
    user.role === 'driver'
      ? t('profile.roles.driver')
      : t('profile.roles.passenger');

  const goToSettings = React.useCallback(() => {
    tabNavigation.navigate({ name: 'Settings', params: { screen: 'SettingsHome' } });
  }, [tabNavigation]);

  const goToHome = React.useCallback(() => {
    tabNavigation.navigate({ name: 'Home', params: { screen: 'HomeMain' } });
  }, [tabNavigation]);

  useFocusEffect(
    React.useCallback(() => {
      if (user.role !== 'driver') {
        setIsScreenLoading(false);
        return;
      }

      let cancelled = false;
      setIsScreenLoading(true);

      const task = InteractionManager.runAfterInteractions(() => {
        void refreshTrips()
          .catch(() => undefined)
          .finally(() => {
            if (!cancelled) {
              setIsScreenLoading(false);
            }
          });
      });

      return () => {
        cancelled = true;
        task.cancel();
      };
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

  const renderTrip = React.useCallback(
    ({ item }: { item: Trip }) => (
      <ListingCard
        trip={item}
        showPhotoCount={false}
        onPress={() => {
          navigation.navigate('ListingDetail', { tripId: item.id });
        }}
        onRemovePress={() => {
          setRemoveError(null);
          setTripToRemove(item);
        }}
      />
    ),
    [navigation],
  );

  if (user.role !== 'driver') {
    return (
      <View style={styles.searchRoot}>
        <FocusAwareStatusBar style="light" />
        <HomeHeader
          firstName={user.firstName}
          roleLabel={roleLabel}
          avatarUri={user.avatarUri}
          credits={user.credits}
          notificationCount={user.notificationCount}
          hasUnreadMessages={user.hasUnreadMessages}
          variant="onBrand"
          onChatPress={goToHome}
          onNotificationsPress={goToHome}
          onProfilePress={goToSettings}
        />
        <PassengerSearchPanel />
      </View>
    );
  }

  const listBody = isScreenLoading ? (
    <View style={styles.skeletonList}>
      {Array.from({ length: SKELETON_COUNT }, (_, index) => (
        <ListingCardSkeleton key={`listing-skeleton-${index}`} />
      ))}
    </View>
  ) : loadError && trips.length === 0 ? (
    <View style={styles.centered}>
      <AppText style={styles.errorText}>{loadError}</AppText>
      <Button
        label={t('dashboard.listings.retry')}
        onPress={() => {
          setIsScreenLoading(true);
          void refreshTrips()
            .catch(() => undefined)
            .finally(() => setIsScreenLoading(false));
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
    <FlatList
      data={trips}
      keyExtractor={(item) => item.id}
      renderItem={renderTrip}
      contentContainerStyle={styles.listContent}
      ItemSeparatorComponent={ListSeparator}
      showsVerticalScrollIndicator={false}
      initialNumToRender={4}
      maxToRenderPerBatch={4}
      windowSize={5}
      removeClippedSubviews
      updateCellsBatchingPeriod={50}
    />
  );

  return (
    <AuthScaffold
      title={t('dashboard.listings.title')}
      subtitle={t('dashboard.listings.subtitle')}
      showLegalFooter={false}
      showLanguageSwitcher={false}
      compactHeader
      scrollable={false}
      contentWrapStyle={styles.contentWrap}
    >
      {listBody}

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

function ListSeparator(): React.ReactElement {
  return <View style={styles.separator} />;
}

const styles = StyleSheet.create({
  searchRoot: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  contentWrap: {
    flex: 1,
    paddingTop: spacing.md,
    paddingHorizontal: spacing.md,
    paddingBottom: 0,
  },
  listContent: {
    flexGrow: 1,
    paddingBottom: spacing.huge + spacing.md,
  },
  skeletonList: {
    gap: spacing.sm,
    paddingBottom: spacing.md,
  },
  separator: {
    height: spacing.sm,
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
  errorText: {
    fontSize: 13,
    color: colors.primary,
    textAlign: 'center',
  },
});
