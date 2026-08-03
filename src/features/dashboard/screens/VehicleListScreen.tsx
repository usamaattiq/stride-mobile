import React from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';

import { AuthScaffold } from '@/features/auth/components/AuthScaffold';
import { i18n as appI18n } from '@/i18n';
import { AppText } from '@/shared/components/AppText';
import { Button } from '@/shared/components/Button';
import { colors, radius, spacing } from '@/theme';

import { DashboardSearchBar } from '../components/DashboardSearchBar';
import { VehicleFilterSheet } from '../components/VehicleFilterSheet';
import {
  AddVehicleButton,
  VehicleListItem,
  VehiclesEmptyState,
} from '../components/VehicleListContent';
import { useVehicles } from '../context/VehicleContext';
import { resolveVehicleStackOrigin } from '../navigation/vehicleNavigation.utils';
import type { VehicleRouteParamList } from '../navigation/vehicleNavigation.types';
import {
  countActiveVehicleBrowseFilters,
  EMPTY_VEHICLE_BROWSE_FILTERS,
  matchesVehicleFilters,
  matchesVehicleSearch,
  type VehicleBrowseFilters,
} from '../types/vehicleBrowse.types';
import type { Vehicle } from '../types/vehicle.types';

export function VehicleListScreen(): React.ReactElement {
  const { t } = useTranslation(undefined, { i18n: appI18n });
  const navigation =
    useNavigation<NativeStackNavigationProp<VehicleRouteParamList, 'VehicleList'>>();
  const {
    vehicles,
    isLoading,
    loadError,
    beginAddVehicle,
    refreshVehicles,
  } = useVehicles();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [filters, setFilters] = React.useState<VehicleBrowseFilters>(EMPTY_VEHICLE_BROWSE_FILTERS);
  const [filterSheetVisible, setFilterSheetVisible] = React.useState(false);
  const stackOrigin = resolveVehicleStackOrigin(navigation);
  const filterCount = countActiveVehicleBrowseFilters(filters);

  useFocusEffect(
    React.useCallback(() => {
      void refreshVehicles().catch(() => undefined);
    }, [refreshVehicles]),
  );

  const filteredVehicles = React.useMemo(
    () =>
      vehicles.filter(
        (vehicle) =>
          matchesVehicleSearch(vehicle, searchQuery) && matchesVehicleFilters(vehicle, filters),
      ),
    [filters, searchQuery, vehicles],
  );

  const openAddFlow = React.useCallback(() => {
    beginAddVehicle();
    navigation.navigate('VehicleDetails', {
      mode: 'add',
      returnTo: 'VehicleList',
      stackOrigin,
    });
  }, [beginAddVehicle, navigation, stackOrigin]);

  const openVehicleView = React.useCallback(
    (vehicle: Vehicle) => {
      navigation.navigate('VehicleView', { vehicleId: vehicle.id });
    },
    [navigation],
  );

  const listHeader = (
    <View style={styles.toolbar}>
      <AddVehicleButton onPress={openAddFlow} />
      <View style={styles.searchRow}>
        <View style={styles.searchWrap}>
          <DashboardSearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder={t('vehicles.searchPlaceholder')}
            style={styles.searchBar}
          />
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('dashboard.home.filterA11y')}
          onPress={() => setFilterSheetVisible(true)}
          style={({ pressed }) => [styles.filterButton, pressed && styles.pressed]}
        >
          <FontAwesome name="sliders" size={15} color={colors.text.primary} />
          {filterCount > 0 ? (
            <View style={styles.filterBadge}>
              <AppText weight="bold" style={styles.filterBadgeText}>
                {String(filterCount)}
              </AppText>
            </View>
          ) : null}
        </Pressable>
      </View>
    </View>
  );

  const showInitialLoading = isLoading && vehicles.length === 0;
  const showInitialError = Boolean(loadError) && vehicles.length === 0;

  let listBody: React.ReactNode;
  if (showInitialLoading) {
    listBody = (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  } else if (showInitialError) {
    listBody = (
      <View style={styles.centered}>
        <AppText style={styles.errorText}>{loadError}</AppText>
        <Button
          label={t('vehicles.retry')}
          onPress={() => {
            void refreshVehicles().catch(() => undefined);
          }}
        />
      </View>
    );
  } else {
    listBody = (
      <FlatList
        data={filteredVehicles}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <VehicleListItem
            vehicle={item}
            onPress={() => openVehicleView(item)}
          />
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          <VehiclesEmptyState
            title={
              vehicles.length === 0
                ? t('vehicles.emptyTitle')
                : t('vehicles.filter.emptyTitle')
            }
            subtitle={
              vehicles.length === 0
                ? t('vehicles.emptySubtitle')
                : t('vehicles.filter.emptySubtitle')
            }
          />
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      />
    );
  }

  return (
    <AuthScaffold
      title={t('vehicles.listTitle')}
      subtitle={t('vehicles.listSubtitle')}
      showLegalFooter={false}
      showLanguageSwitcher={false}
      compactHeader
      scrollable={false}
      contentWrapStyle={styles.contentWrap}
    >
      {listHeader}
      {listBody}

      <VehicleFilterSheet
        visible={filterSheetVisible}
        filters={filters}
        onClose={() => setFilterSheetVisible(false)}
        onApply={setFilters}
      />
    </AuthScaffold>
  );
}

const styles = StyleSheet.create({
  contentWrap: {
    flex: 1,
    paddingTop: spacing.sm,
  },
  toolbar: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  searchWrap: {
    flex: 1,
  },
  searchBar: {
    minHeight: 44,
    paddingVertical: spacing.sm,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border.default,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 16,
    height: 16,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  filterBadgeText: {
    fontSize: 9,
    color: colors.white,
    lineHeight: 11,
  },
  listContent: {
    flexGrow: 1,
    paddingBottom: spacing.xl,
  },
  separator: {
    height: spacing.sm,
  },
  centered: {
    gap: spacing.md,
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  errorText: {
    fontSize: 13,
    color: colors.primary,
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.85,
  },
});
