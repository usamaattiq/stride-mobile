import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import {
  AddVehicleButton,
  VehicleListItem,
  VehiclesEmptyState,
} from '@/features/dashboard/components/VehicleListContent';
import { DashboardSearchBar } from '@/features/dashboard/components/DashboardSearchBar';
import type { Vehicle } from '@/features/dashboard/types/vehicle.types';
import { matchesVehicleSearch } from '@/features/dashboard/types/vehicleBrowse.types';
import { i18n as appI18n } from '@/i18n';
import { AppText } from '@/shared/components/AppText';
import { colors, radius, spacing } from '@/theme';

type TripVehicleSelectStepProps = {
  vehicles: Vehicle[];
  isLoading: boolean;
  selectedVehicleId: string | null;
  onSelectVehicle: (vehicleId: string) => void;
  onAddVehicle: () => void;
};

export function TripVehicleSelectStep({
  vehicles,
  isLoading,
  selectedVehicleId,
  onSelectVehicle,
  onAddVehicle,
}: TripVehicleSelectStepProps): React.ReactElement {
  const { t } = useTranslation(undefined, { i18n: appI18n });
  const [query, setQuery] = React.useState('');

  const filteredVehicles = React.useMemo(
    () => vehicles.filter((vehicle) => matchesVehicleSearch(vehicle, query)),
    [vehicles, query],
  );

  if (isLoading && vehicles.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (vehicles.length === 0) {
    return (
      <View style={styles.form}>
        <VehiclesEmptyState
          title={t('trips.create.noVehiclesTitle')}
          subtitle={t('trips.create.noVehiclesSubtitle')}
        />
        <AddVehicleButton onPress={onAddVehicle} />
      </View>
    );
  }

  return (
    <View style={styles.form}>
      <View style={styles.searchRow}>
        <View style={styles.searchWrap}>
          <DashboardSearchBar
            value={query}
            onChangeText={setQuery}
            placeholder={t('vehicles.searchPlaceholder')}
            style={styles.searchBar}
          />
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('vehicles.addVehicle')}
          onPress={onAddVehicle}
          style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}
        >
          <FontAwesome name="plus" size={12} color={colors.white} />
          <AppText weight="bold" style={styles.addButtonLabel}>
            {t('vehicles.addVehicle')}
          </AppText>
        </Pressable>
      </View>

      {filteredVehicles.length === 0 ? (
        <View style={styles.filterEmpty}>
          <AppText weight="semibold" style={styles.filterEmptyTitle}>
            {t('vehicles.filter.emptyTitle')}
          </AppText>
          <AppText style={styles.filterEmptySubtitle}>
            {t('vehicles.filter.emptySubtitle')}
          </AppText>
        </View>
      ) : (
        filteredVehicles.map((vehicle) => (
          <VehicleListItem
            key={vehicle.id}
            vehicle={vehicle}
            selected={vehicle.id === selectedVehicleId}
            onPress={() => onSelectVehicle(vehicle.id)}
          />
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: spacing.sm,
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
  addButton: {
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xxs,
    paddingHorizontal: spacing.sm,
  },
  addButtonLabel: {
    fontSize: 12,
    color: colors.white,
  },
  pressed: {
    opacity: 0.85,
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
  },
  filterEmpty: {
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xl,
  },
  filterEmptyTitle: {
    fontSize: 15,
    color: colors.text.primary,
    textAlign: 'center',
  },
  filterEmptySubtitle: {
    fontSize: 13,
    color: colors.text.secondary,
    textAlign: 'center',
  },
});
